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

    // Pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Récupérer les utilisateurs avec leurs stats + données de rétention
    const usersResult = await sql`
      SELECT
        u.id,
        u.email,
        u.name,
        u.created_at,
        u.is_active,
        u.last_login,
        COUNT(DISTINCT s.id) as total_subscriptions,
        COUNT(DISTINCT m.id) as total_messages,
        COALESCE(SUM(p.amount), 0) as total_spent,
        COUNT(DISTINCT DATE(m.created_at)) as active_days,
        MAX(m.created_at) as last_message_at
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN messages m ON u.id = m.user_id
      LEFT JOIN payments p ON s.id = p.subscription_id AND p.status = 'succeeded'
      GROUP BY u.id, u.email, u.name, u.created_at, u.is_active, u.last_login
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Compter le nombre total d'utilisateurs
    const countResult = await sql`
      SELECT COUNT(*) as total FROM users
    `
    const totalUsers = Number(countResult.rows[0]?.total) || 0

    const users = usersResult.rows.map(row => {
      const lastLogin = row.last_login ? new Date(row.last_login) : null
      const lastMessageAt = row.last_message_at ? new Date(row.last_message_at) : null
      const createdAt = new Date(row.created_at)
      const now = new Date()

      // Calculer les jours depuis l'inscription
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

      // Calculer les jours depuis la dernière connexion/activité
      const lastActivity = lastLogin || lastMessageAt
      const daysSinceLastActivity = lastActivity
        ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : null

      return {
        id: row.id,
        email: row.email,
        name: row.name,
        created_at: row.created_at,
        is_active: row.is_active,
        last_login: row.last_login,
        last_message_at: row.last_message_at,
        total_subscriptions: Number(row.total_subscriptions) || 0,
        total_messages: Number(row.total_messages) || 0,
        total_spent: Number(row.total_spent) || 0,
        active_days: Number(row.active_days) || 0,
        days_since_signup: daysSinceSignup,
        days_since_last_activity: daysSinceLastActivity,
        retention_rate: daysSinceSignup > 0 ? ((Number(row.active_days) || 0) / daysSinceSignup * 100).toFixed(1) : '0.0'
      }
    })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    })

  } catch (error) {
    console.error('Erreur admin users:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
