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
    // Note: messages.user_id est TEXT (peut être email ou UUID en texte)
    // Note: messages.creator_id est TEXT (slug, pas UUID)
    const messagesResult = await sql`
      SELECT
        m.id,
        m.content,
        m.role,
        m.created_at,
        m.user_id,
        m.creator_id,
        u.name as user_name,
        u.email as user_email,
        c.name as creator_name,
        c.slug as creator_slug
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id::text OR m.user_id = u.email
      LEFT JOIN creators c ON m.creator_id = c.slug
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `

    const messages = messagesResult.rows.map(row => {
      // Générer un nom d'affichage pour l'utilisateur
      let displayName = row.user_name
      if (!displayName && row.user_email) {
        displayName = row.user_email.split('@')[0]
      }
      if (!displayName) {
        // Si c'est un UUID, afficher juste "Utilisateur" avec les 4 premiers caractères
        const userId = row.user_id || ''
        if (userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          displayName = `Utilisateur ${userId.substring(0, 8)}`
        } else if (userId.includes('@')) {
          displayName = userId.split('@')[0]
        } else {
          displayName = `Utilisateur ${userId.substring(0, 8)}`
        }
      }

      return {
        id: row.id,
        content: row.content,
        role: row.role,
        created_at: row.created_at,
        user: {
          name: displayName,
          email: row.user_email || (row.user_id?.includes('@') ? row.user_id : null)
        },
        creator: {
          name: row.creator_name || row.creator_id || 'Inconnu',
          slug: row.creator_slug || row.creator_id
        }
      }
    })

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
