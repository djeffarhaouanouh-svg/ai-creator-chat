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
    const retentionType = searchParams.get('type') || 'rolling' // 'classic' ou 'rolling'

    // 1. COHORT ANALYSIS - Grouper les utilisateurs par semaine d'inscription
    // Construire la requête selon le type de rétention
    let cohortsResult

    if (retentionType === 'rolling') {
      cohortsResult = await sql`
        WITH user_cohorts AS (
          SELECT
            id,
            DATE_TRUNC('week', created_at) as cohort_week,
            created_at
          FROM users
          WHERE created_at >= NOW() - INTERVAL '12 weeks'
        ),
        user_activity AS (
          SELECT
            m.user_id,
            DATE(m.created_at) as activity_date
          FROM messages m
          GROUP BY m.user_id, DATE(m.created_at)
        )
        SELECT
          uc.cohort_week,
          COUNT(DISTINCT uc.id) as cohort_size,
          COUNT(DISTINCT CASE WHEN ua.activity_date >= uc.created_at::date + 1 THEN uc.id END) as day_1,
          COUNT(DISTINCT CASE WHEN ua.activity_date >= uc.created_at::date + 7 THEN uc.id END) as day_7,
          COUNT(DISTINCT CASE WHEN ua.activity_date >= uc.created_at::date + 14 THEN uc.id END) as day_14,
          COUNT(DISTINCT CASE WHEN ua.activity_date >= uc.created_at::date + 30 THEN uc.id END) as day_30
        FROM user_cohorts uc
        LEFT JOIN user_activity ua ON uc.id = ua.user_id
        GROUP BY uc.cohort_week
        ORDER BY uc.cohort_week DESC
      `
    } else {
      cohortsResult = await sql`
        WITH user_cohorts AS (
          SELECT
            id,
            DATE_TRUNC('week', created_at) as cohort_week,
            created_at
          FROM users
          WHERE created_at >= NOW() - INTERVAL '12 weeks'
        ),
        user_activity AS (
          SELECT
            m.user_id,
            DATE(m.created_at) as activity_date
          FROM messages m
          GROUP BY m.user_id, DATE(m.created_at)
        )
        SELECT
          uc.cohort_week,
          COUNT(DISTINCT uc.id) as cohort_size,
          COUNT(DISTINCT CASE WHEN ua.activity_date = uc.created_at::date + 1 THEN uc.id END) as day_1,
          COUNT(DISTINCT CASE WHEN ua.activity_date = uc.created_at::date + 7 THEN uc.id END) as day_7,
          COUNT(DISTINCT CASE WHEN ua.activity_date = uc.created_at::date + 14 THEN uc.id END) as day_14,
          COUNT(DISTINCT CASE WHEN ua.activity_date = uc.created_at::date + 30 THEN uc.id END) as day_30
        FROM user_cohorts uc
        LEFT JOIN user_activity ua ON uc.id = ua.user_id
        GROUP BY uc.cohort_week
        ORDER BY uc.cohort_week DESC
      `
    }

    const cohorts = cohortsResult.rows.map(row => {
      const cohortSize = Number(row.cohort_size) || 0
      const d1 = Number(row.day_1) || 0
      const d7 = Number(row.day_7) || 0
      const d14 = Number(row.day_14) || 0
      const d30 = Number(row.day_30) || 0

      return {
        cohort_week: row.cohort_week,
        cohort_size: cohortSize,
        retention: {
          day_1: {
            count: d1,
            rate: cohortSize > 0 ? ((d1 / cohortSize) * 100).toFixed(1) : '0.0'
          },
          day_7: {
            count: d7,
            rate: cohortSize > 0 ? ((d7 / cohortSize) * 100).toFixed(1) : '0.0'
          },
          day_14: {
            count: d14,
            rate: cohortSize > 0 ? ((d14 / cohortSize) * 100).toFixed(1) : '0.0'
          },
          day_30: {
            count: d30,
            rate: cohortSize > 0 ? ((d30 / cohortSize) * 100).toFixed(1) : '0.0'
          }
        }
      }
    })

    // 2. ACTIVITY METRICS - Métriques d'activité (7 et 30 derniers jours)
    const activityMetricsResult = await sql`
      SELECT
        -- Utilisateurs actifs 7j
        COUNT(DISTINCT CASE
          WHEN m.created_at >= NOW() - INTERVAL '7 days'
          THEN m.user_id
        END) as active_users_7d,
        -- Utilisateurs actifs 30j
        COUNT(DISTINCT CASE
          WHEN m.created_at >= NOW() - INTERVAL '30 days'
          THEN m.user_id
        END) as active_users_30d,
        -- Sessions moyennes par utilisateur (compte les jours actifs)
        AVG(daily_sessions.sessions_count) as avg_sessions_per_user,
        -- Messages moyens par utilisateur actif
        AVG(daily_messages.messages_count) as avg_messages_per_user
      FROM users u
      LEFT JOIN messages m ON u.id = m.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(DISTINCT DATE(created_at)) as sessions_count
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY user_id
      ) daily_sessions ON u.id = daily_sessions.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as messages_count
        FROM messages
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY user_id
      ) daily_messages ON u.id = daily_messages.user_id
    `

    const activityMetrics = {
      active_users_7d: Number(activityMetricsResult.rows[0]?.active_users_7d) || 0,
      active_users_30d: Number(activityMetricsResult.rows[0]?.active_users_30d) || 0,
      avg_sessions_per_user: Number(activityMetricsResult.rows[0]?.avg_sessions_per_user || 0).toFixed(1),
      avg_messages_per_user: Number(activityMetricsResult.rows[0]?.avg_messages_per_user || 0).toFixed(1)
    }

    // 3. VALUE METRICS - Métriques de valeur (conversion, churn, réactivation)
    const valueMetricsResult = await sql`
      WITH subscription_data AS (
        SELECT
          u.id as user_id,
          u.created_at as signup_date,
          MIN(s.created_at) as first_subscription_date,
          COUNT(s.id) as total_subscriptions,
          MAX(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as has_active_subscription,
          MAX(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) as has_churned
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        GROUP BY u.id, u.created_at
      )
      SELECT
        -- Taux de conversion (% users qui prennent un abonnement)
        COUNT(CASE WHEN first_subscription_date IS NOT NULL THEN 1 END)::float /
        NULLIF(COUNT(*), 0) * 100 as conversion_rate,
        -- Taux de churn (% des abonnés qui ont annulé)
        COUNT(CASE WHEN has_churned = 1 THEN 1 END)::float /
        NULLIF(COUNT(CASE WHEN total_subscriptions > 0 THEN 1 END), 0) * 100 as churn_rate,
        -- Temps moyen avant premier abonnement (en jours)
        AVG(EXTRACT(EPOCH FROM (first_subscription_date - signup_date)) / 86400) as avg_days_to_subscribe,
        -- Utilisateurs réactivés (avaient churned puis repris un abonnement)
        COUNT(CASE
          WHEN has_active_subscription = 1 AND has_churned = 1
          THEN 1
        END) as reactivated_users
      FROM subscription_data
    `

    const valueMetrics = {
      conversion_rate: Number(valueMetricsResult.rows[0]?.conversion_rate || 0).toFixed(1),
      churn_rate: Number(valueMetricsResult.rows[0]?.churn_rate || 0).toFixed(1),
      avg_days_to_subscribe: Number(valueMetricsResult.rows[0]?.avg_days_to_subscribe || 0).toFixed(1),
      reactivated_users: Number(valueMetricsResult.rows[0]?.reactivated_users) || 0
    }

    // 4. RETENTION TREND - Évolution de la rétention au fil du temps (pour le graphique)
    const retentionTrendResult = await sql`
      WITH weekly_cohorts AS (
        SELECT
          DATE_TRUNC('week', created_at) as week,
          COUNT(*) as signups
        FROM users
        WHERE created_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
      ),
      weekly_retention AS (
        SELECT
          DATE_TRUNC('week', u.created_at) as week,
          COUNT(DISTINCT CASE
            WHEN m.created_at >= u.created_at + INTERVAL '7 days'
            THEN u.id
          END)::float / NULLIF(COUNT(DISTINCT u.id), 0) * 100 as retention_d7
        FROM users u
        LEFT JOIN messages m ON u.id = m.user_id
        WHERE u.created_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', u.created_at)
      )
      SELECT
        wc.week,
        wc.signups,
        COALESCE(wr.retention_d7, 0) as retention_d7
      FROM weekly_cohorts wc
      LEFT JOIN weekly_retention wr ON wc.week = wr.week
      ORDER BY wc.week ASC
    `

    const retentionTrend = retentionTrendResult.rows.map(row => ({
      week: row.week,
      signups: Number(row.signups) || 0,
      retention_d7: Number(row.retention_d7 || 0).toFixed(1)
    }))

    return NextResponse.json({
      retention_type: retentionType,
      cohorts,
      activity_metrics: activityMetrics,
      value_metrics: valueMetrics,
      retention_trend: retentionTrend
    })

  } catch (error) {
    console.error('Erreur admin cohorts:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
