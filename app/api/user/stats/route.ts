import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    // Récupérer l'ID utilisateur depuis les paramètres de requête
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    // 1. Récupérer l'utilisateur
    const userResult = await sql`
      SELECT id, name, email
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // 2. Compter abonnements actifs
    const subscriptionsResult = await sql`
      SELECT COUNT(*) as total
      FROM subscriptions
      WHERE user_id = ${userId}
      AND status = 'active'
    `
    const totalSubscriptions = Number(subscriptionsResult.rows[0]?.total) || 0

    // 3. Compter messages envoyés
    const messagesResult = await sql`
      SELECT COUNT(*) as total
      FROM messages
      WHERE user_id = ${userId}
    `
    const totalMessages = Number(messagesResult.rows[0]?.total) || 0

    // 4. Calculer dépenses totales
    const totalSpentResult = await sql`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.user_id = ${userId}
      AND p.status = 'succeeded'
    `
    const totalSpent = Number(totalSpentResult.rows[0]?.total) || 0

    // 5. Dépenses mensuelles
    const monthlySpentResult = await sql`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.user_id = ${userId}
      AND p.status = 'succeeded'
      AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
    `
    const monthlySpent = Number(monthlySpentResult.rows[0]?.total) || 0

    // 6. Nouveaux abonnements ce mois
    const newSubscriptionsResult = await sql`
      SELECT COUNT(*) as total
      FROM subscriptions
      WHERE user_id = ${userId}
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `
    const newSubscriptionsThisMonth = Number(newSubscriptionsResult.rows[0]?.total) || 0

    // 7. Messages ce mois
    const monthlyMessagesResult = await sql`
      SELECT COUNT(*) as total
      FROM messages
      WHERE user_id = ${userId}
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `
    const messagesThisMonth = Number(monthlyMessagesResult.rows[0]?.total) || 0

    // 8. Calculer moyenne messages par créatrice
    const avgMessagesPerCreator = totalSubscriptions > 0
      ? totalMessages / totalSubscriptions
      : 0

    // 9. Liste des abonnements avec info créatrices
    const subscriptionsListResult = await sql`
      SELECT
        s.id,
        s.user_id,
        s.creator_id,
        s.plan,
        s.status,
        s.started_at,
        s.expires_at,
        c.name as creator_name,
        c.slug as creator_slug,
        c.avatar_url as creator_avatar,
        c.bio as creator_bio
      FROM subscriptions s
      JOIN creators c ON s.creator_id = c.id
      WHERE s.user_id = ${userId}
      AND s.status = 'active'
      ORDER BY s.started_at DESC
    `

    // Retourner toutes les statistiques
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      stats: {
        totalSubscriptions,
        totalMessages,
        totalSpent,
        monthlySpent,
        newSubscriptionsThisMonth,
        messagesThisMonth,
        avgMessagesPerCreator
      },
      subscriptions: subscriptionsListResult.rows
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des stats utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
