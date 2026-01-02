import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const creatorSlug = searchParams.get('slug') // Optionnel : stats pour une créatrice spécifique

    if (creatorSlug) {
      // Stats pour une créatrice spécifique
      // Essayer d'abord avec last_login, sinon sans
      let creatorResult
      try {
        creatorResult = await sql`
          SELECT id, name, slug, last_login, created_at
          FROM creators
          WHERE slug = ${creatorSlug}
          LIMIT 1
        `
      } catch (error: any) {
        // Si la colonne last_login n'existe pas encore
        if (error.message && error.message.includes('last_login')) {
          creatorResult = await sql`
            SELECT id, name, slug, created_at
            FROM creators
            WHERE slug = ${creatorSlug}
            LIMIT 1
          `
          // Ajouter last_login comme null
          if (creatorResult.rows.length > 0) {
            creatorResult.rows[0].last_login = null
          }
        } else {
          throw error
        }
      }

      if (creatorResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Créatrice introuvable' },
          { status: 404 }
        )
      }

      const creator = creatorResult.rows[0]
      const creatorId = creator.id
      const creatorSlugForMessages = creatorSlug

      // Messages totaux
      const messagesResult = await sql`
        SELECT COUNT(*) as total
        FROM messages
        WHERE creator_id = ${creatorSlugForMessages}
      `
      const totalMessages = Number(messagesResult.rows[0]?.total) || 0

      // Abonnés actifs
      const subscribersResult = await sql`
        SELECT COUNT(DISTINCT user_id) as total
        FROM subscriptions
        WHERE creator_id = ${creatorId}
        AND status = 'active'
      `
      const totalSubscribers = Number(subscribersResult.rows[0]?.total) || 0

      // Revenus abonnements
      const revenueResult = await sql`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        JOIN subscriptions s ON p.subscription_id = s.id
        WHERE s.creator_id = ${creatorId}
        AND p.status = 'succeeded'
      `
      const totalRevenueFromSubscriptions = Number(revenueResult.rows[0]?.total) || 0

      // Revenus du mois
      const monthlyRevenueResult = await sql`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        JOIN subscriptions s ON p.subscription_id = s.id
        WHERE s.creator_id = ${creatorId}
        AND p.status = 'succeeded'
        AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
      `
      const monthlyRevenueFromSubscriptions = Number(monthlyRevenueResult.rows[0]?.total) || 0

      // Messages du mois
      const monthlyMessagesResult = await sql`
        SELECT COUNT(*) as total
        FROM messages
        WHERE creator_id = ${creatorSlugForMessages}
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      `
      const monthlyMessages = Number(monthlyMessagesResult.rows[0]?.total) || 0

      // Nouveaux abonnés ce mois
      const newSubscribersResult = await sql`
        SELECT COUNT(*) as total
        FROM subscriptions
        WHERE creator_id = ${creatorId}
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      `
      const newSubscribers = Number(newSubscribersResult.rows[0]?.total) || 0

      // Conversations actives (7 derniers jours)
      const activeConversationsResult = await sql`
        SELECT COUNT(DISTINCT user_id) as total
        FROM messages
        WHERE creator_id = ${creatorSlugForMessages}
        AND created_at >= NOW() - INTERVAL '7 days'
      `
      const activeConversations = Number(activeConversationsResult.rows[0]?.total) || 0

      // Stats contenus personnalisés
      const deliveredContentResult = await sql`
        SELECT COUNT(*) as total
        FROM content_requests
        WHERE creator_id = ${creatorId}::uuid
        AND status = 'delivered'
      `
      const deliveredContent = Number(deliveredContentResult.rows[0]?.total) || 0

      const contentRevenueResult = await sql`
        SELECT COALESCE(SUM(price), 0) as total
        FROM content_requests
        WHERE creator_id = ${creatorId}::uuid
        AND status IN ('paid', 'delivered')
      `
      const contentRevenue = Number(contentRevenueResult.rows[0]?.total) || 0

      const contentRevenueThisMonthResult = await sql`
        SELECT COALESCE(SUM(price), 0) as total
        FROM content_requests
        WHERE creator_id = ${creatorId}::uuid
        AND status IN ('paid', 'delivered')
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      `
      const contentRevenueThisMonth = Number(contentRevenueThisMonthResult.rows[0]?.total) || 0

      const pendingRequestsResult = await sql`
        SELECT COUNT(*) as total
        FROM content_requests
        WHERE creator_id = ${creatorId}::uuid
        AND status = 'pending'
      `
      const pendingRequests = Number(pendingRequestsResult.rows[0]?.total) || 0

      const totalRevenue = totalRevenueFromSubscriptions + contentRevenue
      const monthlyRevenue = monthlyRevenueFromSubscriptions + contentRevenueThisMonth

      // Calculer les jours depuis la dernière connexion
      const lastLogin = creator.last_login ? new Date(creator.last_login) : null
      const createdAt = new Date(creator.created_at)
      const now = new Date()
      
      const daysSinceLastLogin = lastLogin
        ? Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      // Compter les jours avec messages
      const messageDaysResult = await sql`
        SELECT COUNT(DISTINCT DATE(created_at)) as total
        FROM messages
        WHERE creator_id = ${creatorSlugForMessages}
      `
      const messageDays = Number(messageDaysResult.rows[0]?.total) || 0
      
      // Calculer les jours depuis l'inscription
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      
      // Estimer les jours actifs en fonction de la dernière connexion ou des messages récents
      let estimatedActiveDays = messageDays
      
      // Si on a une dernière connexion récente, on l'utilise pour estimer
      if (lastLogin && daysSinceLastLogin !== null && daysSinceLastLogin <= 7) {
        // Si dernière connexion il y a moins de 7 jours, on estime qu'elle s'est connectée régulièrement
        if (daysSinceLastLogin <= 1) {
          // Si connectée aujourd'hui ou hier, on estime qu'elle s'est connectée la plupart des jours récents
          estimatedActiveDays = Math.max(messageDays, Math.min(daysSinceSignup, Math.floor(daysSinceSignup * 0.8)))
        } else if (daysSinceLastLogin <= 3) {
          // Si connectée il y a 2-3 jours, on estime une activité régulière
          estimatedActiveDays = Math.max(messageDays, Math.min(daysSinceSignup, Math.floor(daysSinceSignup * 0.6)))
        } else {
          // Si connectée il y a 4-7 jours, on estime une activité modérée
          estimatedActiveDays = Math.max(messageDays, Math.min(daysSinceSignup, Math.floor(daysSinceSignup * 0.4)))
        }
      } else if (totalMessages > 0) {
        // Si pas de last_login mais qu'il y a des messages, on estime basé sur l'activité récente
        // Vérifier les messages des 7 derniers jours
        const recentMessagesResult = await sql`
          SELECT COUNT(DISTINCT DATE(created_at)) as total
          FROM messages
          WHERE creator_id = ${creatorSlugForMessages}
          AND created_at >= NOW() - INTERVAL '7 days'
        `
        const recentMessageDays = Number(recentMessagesResult.rows[0]?.total) || 0
        
        if (recentMessageDays > 0) {
          // Si activité récente, on estime qu'elle est active régulièrement
          estimatedActiveDays = Math.max(messageDays, Math.min(daysSinceSignup, Math.floor(daysSinceSignup * 0.7)))
        }
      }
      
      const activeDays = estimatedActiveDays

      return NextResponse.json({
        creator: {
          id: creator.id,
          name: creator.name,
          slug: creator.slug,
          last_login: creator.last_login,
          created_at: creator.created_at
        },
        stats: {
          totalMessages,
          totalSubscribers,
          totalRevenue,
          monthlyRevenue,
          monthlyMessages,
          newSubscribers,
          activeConversations,
          deliveredContent,
          contentRevenue,
          contentRevenueThisMonth,
          pendingRequests,
          daysSinceLastLogin,
          activeDays
        }
      })
    } else {
      // Stats pour toutes les créatrices
      // Essayer d'abord avec last_login, sinon sans
      let creatorsResult
      try {
        creatorsResult = await sql`
          SELECT id, name, slug, last_login, created_at
          FROM creators
          ORDER BY name
        `
      } catch (error: any) {
        // Si la colonne last_login n'existe pas encore
        if (error.message && error.message.includes('last_login')) {
          creatorsResult = await sql`
            SELECT id, name, slug, created_at
            FROM creators
            ORDER BY name
          `
          // Ajouter last_login comme null pour chaque créatrice
          creatorsResult.rows = creatorsResult.rows.map((row: any) => ({
            ...row,
            last_login: null
          }))
        } else {
          throw error
        }
      }

      const creatorsStats = await Promise.all(
        creatorsResult.rows.map(async (creator) => {
          const creatorId = creator.id
          const creatorSlugForMessages = creator.slug

          // Messages totaux
          const messagesResult = await sql`
            SELECT COUNT(*) as total
            FROM messages
            WHERE creator_id = ${creatorSlugForMessages}
          `
          const totalMessages = Number(messagesResult.rows[0]?.total) || 0

          // Abonnés actifs
          const subscribersResult = await sql`
            SELECT COUNT(DISTINCT user_id) as total
            FROM subscriptions
            WHERE creator_id = ${creatorId}
            AND status = 'active'
          `
          const totalSubscribers = Number(subscribersResult.rows[0]?.total) || 0

          // Revenus abonnements
          const revenueResult = await sql`
            SELECT COALESCE(SUM(p.amount), 0) as total
            FROM payments p
            JOIN subscriptions s ON p.subscription_id = s.id
            WHERE s.creator_id = ${creatorId}
            AND p.status = 'succeeded'
          `
          const totalRevenueFromSubscriptions = Number(revenueResult.rows[0]?.total) || 0

          // Revenus contenus personnalisés
          const contentRevenueResult = await sql`
            SELECT COALESCE(SUM(price), 0) as total
            FROM content_requests
            WHERE creator_id = ${creatorId}::uuid
            AND status IN ('paid', 'delivered')
          `
          const contentRevenue = Number(contentRevenueResult.rows[0]?.total) || 0

          const totalRevenue = totalRevenueFromSubscriptions + contentRevenue

          // Calculer les jours depuis la dernière connexion
          const lastLogin = creator.last_login ? new Date(creator.last_login) : null
          const createdAt = new Date(creator.created_at)
          const now = new Date()
          const daysSinceLastLogin = lastLogin
            ? Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
            : null

          // Compter les jours avec messages
          const messageDaysResult = await sql`
            SELECT COUNT(DISTINCT DATE(created_at)) as total
            FROM messages
            WHERE creator_id = ${creator.slug}
          `
          const messageDays = Number(messageDaysResult.rows[0]?.total) || 0
          
          // Calculer les jours depuis l'inscription
          const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
          
          // Estimer les jours actifs en fonction de la dernière connexion ou des messages récents
          let estimatedActiveDays = messageDays
          
          // Si on a une dernière connexion récente, on l'utilise pour estimer
          if (lastLogin && daysSinceLastLogin !== null && daysSinceLastLogin <= 7) {
            // Si dernière connexion il y a moins de 7 jours, on estime qu'elle s'est connectée régulièrement
            if (daysSinceLastLogin <= 1) {
              // Si connectée aujourd'hui ou hier, on estime qu'elle s'est connectée la plupart des jours récents
              estimatedActiveDays = Math.max(messageDays, Math.min(daysSinceSignup, Math.floor(daysSinceSignup * 0.8)))
            } else if (daysSinceLastLogin <= 3) {
              // Si connectée il y a 2-3 jours, on estime une activité régulière
              estimatedActiveDays = Math.max(messageDays, Math.min(daysSinceSignup, Math.floor(daysSinceSignup * 0.6)))
            } else {
              // Si connectée il y a 4-7 jours, on estime une activité modérée
              estimatedActiveDays = Math.max(messageDays, Math.min(daysSinceSignup, Math.floor(daysSinceSignup * 0.4)))
            }
          } else if (totalMessages > 0) {
            // Si pas de last_login mais qu'il y a des messages, on estime basé sur l'activité récente
            // Vérifier les messages des 7 derniers jours
            const recentMessagesResult = await sql`
              SELECT COUNT(DISTINCT DATE(created_at)) as total
              FROM messages
              WHERE creator_id = ${creator.slug}
              AND created_at >= NOW() - INTERVAL '7 days'
            `
            const recentMessageDays = Number(recentMessagesResult.rows[0]?.total) || 0
            
            if (recentMessageDays > 0) {
              // Si activité récente, on estime qu'elle est active régulièrement
              estimatedActiveDays = Math.max(messageDays, Math.min(daysSinceSignup, Math.floor(daysSinceSignup * 0.7)))
            }
          }
          
          const activeDays = estimatedActiveDays

          return {
            creator_id: creator.id,
            creator_name: creator.name,
            creator_slug: creator.slug,
            totalMessages,
            totalSubscribers,
            totalRevenue,
            last_login: creator.last_login,
            daysSinceLastLogin,
            activeDays
          }
        })
      )

      return NextResponse.json({
        creators: creatorsStats
      })
    }

  } catch (error: any) {
    console.error('Erreur admin creators-stats:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

