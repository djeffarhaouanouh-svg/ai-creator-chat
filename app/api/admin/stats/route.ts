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

    // 1. Statistiques globales
    const totalUsersResult = await sql`
      SELECT COUNT(*) as total FROM users WHERE is_active = true
    `
    const totalUsers = Number(totalUsersResult.rows[0]?.total) || 0

    const totalSubscriptionsResult = await sql`
      SELECT COUNT(*) as total FROM subscriptions WHERE status = 'active'
    `
    const totalSubscriptions = Number(totalSubscriptionsResult.rows[0]?.total) || 0

    const totalMessagesResult = await sql`
      SELECT COUNT(*) as total FROM messages
    `
    const totalMessages = Number(totalMessagesResult.rows[0]?.total) || 0

    const totalRevenueResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'succeeded'
    `
    const totalRevenue = Number(totalRevenueResult.rows[0]?.total) || 0

    const revenueThisMonthResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE status = 'succeeded'
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `
    const revenueThisMonth = Number(revenueThisMonthResult.rows[0]?.total) || 0

    // 2. Abonnés par créatrice
    const byCreatorResult = await sql`
      SELECT
        c.id as creator_id,
        c.name,
        COUNT(DISTINCT s.user_id) as count
      FROM creators c
      LEFT JOIN subscriptions s ON c.id = s.creator_id AND s.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `

    const byCreator = byCreatorResult.rows.map(row => ({
      creator_id: row.creator_id,
      creators: { name: row.name },
      count: Number(row.count) || 0
    }))

    // 3. Graphique de revenus (30 derniers jours)
    const revenueChartResult = await sql`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(amount), 0) as amount
      FROM payments
      WHERE status = 'succeeded'
      AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    const revenueChart = revenueChartResult.rows.map(row => ({
      date: row.date,
      amount: Number(row.amount) || 0
    }))

    return NextResponse.json({
      global: {
        total_users: totalUsers,
        total_subscriptions: totalSubscriptions,
        total_messages: totalMessages,
        total_revenue: totalRevenue,
        revenue_this_month: revenueThisMonth
      },
      byCreator,
      revenueChart
    })

  } catch (error) {
    console.error('Erreur admin stats:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
