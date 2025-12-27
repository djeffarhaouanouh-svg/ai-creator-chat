import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST - Ajouter un message aux favoris
export async function POST(request: NextRequest) {
  try {
    const { messageId, creatorSlug, userId } = await request.json()

    if (!messageId || !creatorSlug || !userId) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Vérifier que le message existe
    const messageResult = await sql`
      SELECT id, user_id, creator_id, content, created_at
      FROM messages
      WHERE id = ${messageId}
        AND creator_id = ${creatorSlug}
        AND role = 'user'
      LIMIT 1
    `

    if (messageResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Message introuvable' },
        { status: 404 }
      )
    }

    // Ajouter aux favoris (ignore si déjà présent grâce à UNIQUE constraint)
    try {
      await sql`
        INSERT INTO top_messages (message_id, creator_id, user_id, created_at)
        VALUES (${messageId}, ${creatorSlug}, ${userId}, NOW())
        ON CONFLICT (message_id, creator_id) DO NOTHING
      `
    } catch (error: any) {
      // Si déjà présent, c'est OK
      if (error.code === '23505') {
        // Duplicate key, already exists
      } else {
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message ajouté aux favoris'
    })

  } catch (error: any) {
    console.error('❌ ERREUR AJOUT FAVORI:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout aux favoris', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Retirer un message des favoris
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    const creatorSlug = searchParams.get('creatorSlug')

    if (!messageId || !creatorSlug) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    await sql`
      DELETE FROM top_messages
      WHERE message_id = ${messageId}
        AND creator_id = ${creatorSlug}
    `

    return NextResponse.json({
      success: true,
      message: 'Message retiré des favoris'
    })

  } catch (error: any) {
    console.error('❌ ERREUR SUPPRESSION FAVORI:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des favoris', details: error.message },
      { status: 500 }
    )
  }
}

