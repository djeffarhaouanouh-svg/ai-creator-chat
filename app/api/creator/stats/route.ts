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
    const creatorSlugForMessages = creatorSlug // messages.creator_id est TEXT (slug)

    // 2. Compter le nombre total de messages
    // NOTE: messages.creator_id est TEXT (slug), pas UUID
    const messagesResult = await sql`
      SELECT COUNT(*) as total
      FROM messages
      WHERE creator_id = ${creatorSlugForMessages}
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

    // 4. Calculer les revenus totaux (abonnements uniquement)
    const revenueResult = await sql`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.creator_id = ${creatorId}
      AND p.status = 'succeeded'
    `
    const totalRevenueFromSubscriptions = Number(revenueResult.rows[0]?.total) || 0

    // 5. Revenus du mois en cours (abonnements uniquement)
    const monthlyRevenueResult = await sql`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.creator_id = ${creatorId}
      AND p.status = 'succeeded'
      AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
    `
    const monthlyRevenueFromSubscriptions = Number(monthlyRevenueResult.rows[0]?.total) || 0

    // 6. Messages du mois en cours
    // NOTE: messages.creator_id est TEXT (slug), pas UUID
    const monthlyMessagesResult = await sql`
      SELECT COUNT(*) as total
      FROM messages
      WHERE creator_id = ${creatorSlugForMessages}
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
    // NOTE: messages.creator_id est TEXT (slug), pas UUID
    const activeConversationsResult = await sql`
      SELECT COUNT(DISTINCT user_id) as total
      FROM messages
      WHERE creator_id = ${creatorSlugForMessages}
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
          // NOTE: messages.creator_id est TEXT (slug), pas UUID
          // messages.user_id est TEXT (UUID stocké comme texte)
          const msgCount = await sql`
            SELECT
              COUNT(*) as total,
              COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent
            FROM messages
            WHERE user_id = ${sub.user_id}::text
            AND creator_id = ${creatorSlugForMessages}
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

    // 8. Statistiques des contenus personnalisés
    // Contenus vendus (livrés)
    const deliveredContentResult = await sql`
      SELECT COUNT(*) as total
      FROM content_requests
      WHERE creator_id = ${creatorId}::uuid
      AND status = 'delivered'
    `
    const deliveredContent = Number(deliveredContentResult.rows[0]?.total) || 0

    // Revenus des contenus personnalisés (totaux)
    const contentRevenueResult = await sql`
      SELECT COALESCE(SUM(price), 0) as total
      FROM content_requests
      WHERE creator_id = ${creatorId}::uuid
      AND status IN ('paid', 'delivered')
    `
    const contentRevenue = Number(contentRevenueResult.rows[0]?.total) || 0

    // Revenus des contenus ce mois
    const contentRevenueThisMonthResult = await sql`
      SELECT COALESCE(SUM(price), 0) as total
      FROM content_requests
      WHERE creator_id = ${creatorId}::uuid
      AND status IN ('paid', 'delivered')
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `
    const contentRevenueThisMonth = Number(contentRevenueThisMonthResult.rows[0]?.total) || 0

    // Demandes en attente
    const pendingRequestsResult = await sql`
      SELECT COUNT(*) as total
      FROM content_requests
      WHERE creator_id = ${creatorId}::uuid
      AND status = 'pending'
    `
    const pendingRequests = Number(pendingRequestsResult.rows[0]?.total) || 0

    // Calculer les revenus totaux (abonnements + contenus personnalisés)
    const totalRevenue = totalRevenueFromSubscriptions + contentRevenue

    // Calculer le revenu mensuel total (abonnements + contenus personnalisés)
    const monthlyRevenue = monthlyRevenueFromSubscriptions + contentRevenueThisMonth

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
        activeConversations,
        // Stats contenus personnalisés
        deliveredContent,
        contentRevenue,
        contentRevenueThisMonth,
        pendingRequests
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
