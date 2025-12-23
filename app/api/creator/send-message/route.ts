import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST - Envoyer un message manuel depuis le dashboard créatrice
export async function POST(request: NextRequest) {
  try {
    const { creatorSlug, userId, content } = await request.json()

    if (!creatorSlug || !userId || !content) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Récupérer l'ID de la créatrice
    const creatorResult = await sql`
      SELECT id FROM creators WHERE slug = ${creatorSlug} LIMIT 1
    `

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Créatrice introuvable' },
        { status: 404 }
      )
    }

    const creatorId = creatorResult.rows[0].id

    // Insérer le message avec role 'assistant' (réponse de la créatrice)
    // messages.creator_id est TEXT (slug), messages.user_id est TEXT
    const result = await sql`
      INSERT INTO messages (user_id, creator_id, role, content, created_at)
      VALUES (${userId}, ${creatorSlug}, 'assistant', ${content}, NOW())
      RETURNING id, role, content, created_at as timestamp
    `

    return NextResponse.json({
      success: true,
      message: result.rows[0]
    })

  } catch (error: any) {
    console.error('❌ ERREUR ENVOI MESSAGE:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message', details: error.message },
      { status: 500 }
    )
  }
}








