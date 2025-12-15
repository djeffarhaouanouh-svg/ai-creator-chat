import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    // Récupérer le slug de la créatrice depuis les paramètres de requête
    const { searchParams } = new URL(request.url)
    const creatorSlug = searchParams.get('slug')

    if (!creatorSlug) {
      return NextResponse.json(
        { error: 'Slug de créatrice requis' },
        { status: 400 }
      )
    }

    // 1. Récupérer l'ID de la créatrice
    const creatorResult = await sql`
      SELECT id, name, slug
      FROM creators
      WHERE slug = ${creatorSlug}
      LIMIT 1
    `

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Créatrice introuvable' },
        { status: 404 }
      )
    }

    const creator = creatorResult.rows[0]
    const creatorId = creator.id

    // 2. Compter le nombre total de messages
    const messagesResult = await sql`
      SELECT COUNT(*) as total
      FROM messages
      WHERE creator_id = ${creatorId}
    `
    const totalMessages = Number(messagesResult.rows[0]?.total) || 0

    // 3. Compter le nombre d'abonnés actifs
    const subscribersResult = await sql`
      SELECT COUNT(DISTINCT user_id) as total
      FROM subscriptions
      WHERE creator_id = ${creatorId}
      AND status = 'active'
    `
    const totalSubscribers = Number(subscribersResult.rows[0]?.total) || 0

    // 4. Calculer les revenus totaux
    const revenueResult = await sql`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.creator_id = ${creatorId}
      AND p.status = 'succeeded'
    `
    const totalRevenue = Number(revenueResult.rows[0]?.total) || 0

    // 5. Revenus du mois en cours
    const monthlyRevenueResult = await sql`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.creator_id = ${creatorId}
      AND p.status = 'succeeded'
      AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
    `
    const monthlyRevenue = Number(monthlyRevenueResult.rows[0]?.total) || 0

    // 6. Messages du mois en cours
    const monthlyMessagesResult = await sql`
      SELECT COUNT(*) as total
      FROM messages
      WHERE creator_id = ${creatorId}
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `
    const monthlyMessages = Number(monthlyMessagesResult.rows[0]?.total) || 0

    // 7. Nouveaux abonnés ce mois
    const newSubscribersResult = await sql`
      SELECT COUNT(*) as total
      FROM subscriptions
      WHERE creator_id = ${creatorId}
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `
    const newSubscribers = Number(newSubscribersResult.rows[0]?.total) || 0

    // 8. Conversations actives (utilisateurs ayant envoyé un message dans les 7 derniers jours)
    const activeConversationsResult = await sql`
      SELECT COUNT(DISTINCT user_id) as total
      FROM messages
      WHERE creator_id = ${creatorId}
      AND created_at >= NOW() - INTERVAL '7 days'
    `
    const activeConversations = Number(activeConversationsResult.rows[0]?.total) || 0

    // 9. Liste des abonnés avec leurs informations (requête simplifiée)
    const subscribersListResult = await sql`
      SELECT
        s.id as subscription_id,
        s.user_id,
        s.plan,
        s.status,
        s.started_at,
        s.expires_at,
        u.name as user_name,
        u.email as user_email
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.creator_id = ${creatorId}
      AND s.status = 'active'
      ORDER BY s.started_at DESC
    `

    // Ajouter les compteurs de messages pour chaque abonné
    const subscribersWithMessages = await Promise.all(
      subscribersListResult.rows.map(async (sub: any) => {
        try {
          const msgCount = await sql`
            SELECT
              COUNT(*) as total,
              COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent
            FROM messages
            WHERE user_id = ${sub.user_id}
            AND creator_id = ${creatorId}
          `
          return {
            ...sub,
            total_messages: Number(msgCount.rows[0]?.total) || 0,
            recent_messages: Number(msgCount.rows[0]?.recent) || 0
          }
        } catch (err) {
          console.error('Erreur comptage messages pour abonné:', err)
          return {
            ...sub,
            total_messages: 0,
            recent_messages: 0
          }
        }
      })
    )

    // Retourner toutes les statistiques
    return NextResponse.json({
      creator: {
        id: creator.id,
        name: creator.name,
        slug: creator.slug
      },
      stats: {
        totalMessages,
        totalSubscribers,
        totalRevenue,
        monthlyRevenue,
        monthlyMessages,
        newSubscribers,
        activeConversations
      },
      subscribers: subscribersWithMessages
    })

  } catch (error: any) {
    console.error('❌ ERREUR STATS CRÉATRICE:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      slug: request.nextUrl.searchParams.get('slug')
    })
    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code
        } : undefined
      },
      { status: 500 }
    )
  }
}
