import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creatorId')
    if (!creatorId) return NextResponse.json({ error: 'Creator ID required' }, { status: 400 })

    // Compter les abonnés actifs
    const subscriberResult = await sql`
      SELECT COUNT(*) as count
      FROM subscriptions
      WHERE creator_id = ${creatorId} AND status = 'active'
    `
    const subscriberCount = parseInt(subscriberResult.rows[0].count)

    // Compter les messages
    const messageResult = await sql`
      SELECT COUNT(*) as count
      FROM messages
      WHERE creator_id = ${creatorId}
    `
    const messageCount = parseInt(messageResult.rows[0].count)

    // Récupérer les IDs des subscriptions
    const subscriptionsResult = await sql`
      SELECT id FROM subscriptions WHERE creator_id = ${creatorId}
    `
    const subscriptionIds = subscriptionsResult.rows.map(s => s.id)

    // Calculer les revenus
    let totalRevenue = 0
    let revenueThisMonth = 0
    
    if (subscriptionIds.length > 0) {
      const paymentsResult = await sql`
        SELECT amount, created_at
        FROM payments
        WHERE subscription_id = ANY(ARRAY[${subscriptionIds.join(',')}]::uuid[]) AND status = 'succeeded'
      `
      
      const payments = paymentsResult.rows
      totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      
      const now = new Date()
      const thisMonthPayments = payments.filter(p => {
        const date = new Date(p.created_at)
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      })
      revenueThisMonth = thisMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    }

    // Récupérer les abonnés avec leurs infos
    const subscribersResult = await sql`
      SELECT 
        s.*,
        u.id as user_id,
        u.email as user_email,
        u.name as user_name,
        u.created_at as user_created_at
      FROM subscriptions s
      INNER JOIN users u ON s.user_id = u.id
      WHERE s.creator_id = ${creatorId} AND s.status = 'active'
    `

    // Récupérer les messages récents
    const messagesResult = await sql`
      SELECT 
        m.*,
        u.email as user_email,
        u.name as user_name
      FROM messages m
      INNER JOIN users u ON m.user_id = u.id
      WHERE m.creator_id = ${creatorId}
      ORDER BY m.timestamp DESC
      LIMIT 20
    `

    return NextResponse.json({
      stats: { 
        subscribers: subscriberCount, 
        messages: messageCount, 
        total_revenue: totalRevenue, 
        revenue_this_month: revenueThisMonth 
      },
      subscribers: subscribersResult.rows,
      recent_messages: messagesResult.rows
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}