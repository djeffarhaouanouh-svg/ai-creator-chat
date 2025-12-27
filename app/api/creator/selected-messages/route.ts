import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorSlug = searchParams.get('slug')

    if (!creatorSlug) {
      return NextResponse.json(
        { error: 'Slug de créatrice requis' },
        { status: 400 }
      )
    }

    const creatorResult = await sql`
      SELECT id, name, slug
      FROM creators
      WHERE slug = ${creatorSlug}
      LIMIT 1
    `

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Créatrice introuvable' },
        { status: 404 }
      )
    }

    const creator = creatorResult.rows[0]

    // Récupérer les messages favoris depuis la base de données
    // Jointure avec messages pour récupérer le contenu, et users pour récupérer le nom
    let messagesResult
    try {
      // Récupérer les messages favoris avec une jointure simple
      // On compare les IDs en les convertissant tous les deux en texte
      messagesResult = await sql`
        SELECT 
          m.id,
          m.content,
          m.created_at,
          m.user_id,
          COALESCE(u.name, 
            CASE 
              WHEN u.email IS NOT NULL THEN 
                SUBSTRING(u.email FROM 1 FOR POSITION('@' IN u.email) - 1)
              ELSE 'Utilisateur'
            END,
            'Utilisateur'
          ) as fan_nickname,
          u.email as user_email,
          tm.created_at as favorited_at
        FROM top_messages tm
        INNER JOIN messages m ON tm.message_id = m.id::text
        LEFT JOIN users u ON m.user_id::text = u.id::text
        WHERE tm.creator_id = ${creatorSlug}
          AND m.creator_id = ${creatorSlug}
          AND m.role = 'user'
        ORDER BY tm.created_at DESC
      `
      
      console.log(`✅ Found ${messagesResult.rows.length} top messages for creator ${creatorSlug}`)
    } catch (error: any) {
      console.error('❌ ERREUR REQUÊTE SELECTED-MESSAGES:', error.message)
      // Si la table top_messages n'existe pas encore, retourner une liste vide
      if (error.message && error.message.includes('does not exist')) {
        console.log('⚠️ Table top_messages does not exist yet')
        return NextResponse.json({
          messages: [],
          total: 0
        })
      }
      throw error
    }

    const messages = messagesResult.rows.map((row: any) => ({
      id: row.id,
      fan_nickname: row.fan_nickname || 'Utilisateur',
      content: row.content,
      created_at: row.created_at,
      user_id: row.user_id,
      user_email: row.user_email
    }))

    return NextResponse.json({
      messages,
      total: messages.length
    })

  } catch (error: any) {
    console.error('❌ ERREUR MESSAGES SÉLECTIONNÉS:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}
