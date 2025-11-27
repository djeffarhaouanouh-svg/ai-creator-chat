import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'  // DB Neon

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creatorId')

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID required' },
        { status: 400 }
      )
    }

    // 🔥 SÉCURITÉ : Vercel exige cette vérification
    if (!pool) {
      console.error("Database not initialized")
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      )
    }

    // Count active subscribers
    const subscriberResult = await pool.query(
      `SELECT COUNT(*) AS count 
       FROM subscriptions 
       WHERE creator_id = $1 AND status = 'active'`,
      [creatorId]
    )
    const subscriberCount = parseInt(subscriberResult.rows[0].count)

    // Count messages
    const messageResult = await pool.query(
      `SELECT COUNT(*) AS count 
       FROM messages 
       WHERE creator_id = $1`,
      [creatorId]
    )
    const messageCount = parseInt(messageResult.rows[0].count)

    // Get subscription IDs
    const subscriptionsResult = await pool.query(
      `SELECT id FROM subscriptions WHERE creator_id = $1`,
      [creatorId]
    )
    const subscriptionIds = subscriptionsResult.rows.map(s => s.id)

    // Revenue
    let totalRevenue = 0
    let revenueThisMonth = 0

    if (subscriptionIds.length > 0) {
      const paymentsResult = await pool.query(
        `SELECT amount, created_at
         FROM payments
         WHERE subscription_id = ANY($1::uuid[])
           AND status = 'succeeded'`,
        [subscriptionIds]
      )

      const payments = paymentsResult.rows

      totalRevenue = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      )

      const now = new Date()
      const thisMonthPayments = payments.filter(p => {
        const date = new Date(p.created_at)
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        )
      })

      revenueThisMonth = thisMonthPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      )
    }

    // Subscribers with user infos
    const subscribersResult = await pool.query(
      `SELECT 
          s.*,
          u.id AS user_id,
          u.email AS user_email,
          u.name AS user_name,
          u.created_at AS user_created_at
        FROM subscriptions s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.creator_id = $1 AND s.status = 'active'`,
      [creatorId]
    )

    // Recent messages
    const messagesResult = await pool.query(
      `SELECT 
          m.*,
          u.email AS user_email,
          u.name AS user_name
        FROM messages m
        INNER JOIN users u ON m.user_id = u.id
        WHERE m.creator_id = $1
        ORDER BY m.timestamp DESC
        LIMIT 20`,
      [creatorId]
    )

    return NextResponse.json({
      stats: {
        subscribers: subscriberCount,
        messages: messageCount,
        total_revenue: totalRevenue,
        revenue_this_month: revenueThisMonth,
      },
      subscribers: subscribersResult.rows,
      recent_messages: messagesResult.rows
    })

  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}