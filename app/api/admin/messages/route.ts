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

    // Limite
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Récupérer les messages récents avec détails
    const messagesResult = await sql`
      SELECT
        m.id,
        m.content,
        m.role,
        m.created_at,
        u.name as user_name,
        u.email as user_email,
        c.name as creator_name,
        c.slug as creator_slug
      FROM messages m
      JOIN users u ON m.user_id = u.id
      JOIN creators c ON m.creator_id = c.id
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `

    const messages = messagesResult.rows.map(row => ({
      id: row.id,
      content: row.content,
      role: row.role,
      created_at: row.created_at,
      user: {
        name: row.user_name,
        email: row.user_email
      },
      creator: {
        name: row.creator_name,
        slug: row.creator_slug
      }
    }))

    return NextResponse.json({
      messages
    })

  } catch (error) {
    console.error('Erreur admin messages:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
