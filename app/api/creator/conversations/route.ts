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

    // Récupérer toutes les conversations avec le dernier message et les infos utilisateur
    // messages.creator_id est TEXT (slug), donc on cherche avec le slug
    // messages.user_id est TEXT (UUID stocké comme texte)
    // On essaie d'abord avec avatar_url, sinon on fait sans
    let conversationsResult;
    try {
      conversationsResult = await sql`
      WITH last_messages AS (
        SELECT DISTINCT ON (m.user_id)
          m.user_id,
          m.content as last_message,
          m.role as last_message_role,
          m.created_at as last_message_at
        FROM messages m
        WHERE m.creator_id = ${creatorSlug}
        ORDER BY m.user_id, m.created_at DESC
      ),
      message_counts AS (
        SELECT 
          m.user_id,
          COUNT(*) as total_messages
        FROM messages m
        WHERE m.creator_id = ${creatorSlug}
        GROUP BY m.user_id
      )
      SELECT 
        lm.user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar_url,
        lm.last_message,
        lm.last_message_role,
        lm.last_message_at,
        COALESCE(mc.total_messages, 0) as total_messages
      FROM last_messages lm
      LEFT JOIN users u ON lm.user_id::uuid = u.id
      LEFT JOIN message_counts mc ON lm.user_id = mc.user_id
      ORDER BY lm.last_message_at DESC
      `
    } catch (error: any) {
      // Si la colonne avatar_url n'existe pas encore, on fait sans
      if (error.message && error.message.includes('avatar_url')) {
        conversationsResult = await sql`
          WITH last_messages AS (
            SELECT DISTINCT ON (m.user_id)
              m.user_id,
              m.content as last_message,
              m.role as last_message_role,
              m.created_at as last_message_at
            FROM messages m
            WHERE m.creator_id = ${creatorSlug}
            ORDER BY m.user_id, m.created_at DESC
          ),
          message_counts AS (
            SELECT 
              m.user_id,
              COUNT(*) as total_messages
            FROM messages m
            WHERE m.creator_id = ${creatorSlug}
            GROUP BY m.user_id
          )
          SELECT 
            lm.user_id,
            u.name as user_name,
            u.email as user_email,
            lm.last_message,
            lm.last_message_role,
            lm.last_message_at,
            COALESCE(mc.total_messages, 0) as total_messages
          FROM last_messages lm
          LEFT JOIN users u ON lm.user_id::uuid = u.id
          LEFT JOIN message_counts mc ON lm.user_id = mc.user_id
          ORDER BY lm.last_message_at DESC
        `
      } else {
        throw error;
      }
    }

    // Récupérer les settings IA pour chaque conversation
    // On crée une table conversation_settings si elle n'existe pas déjà
    const conversations = await Promise.all(
      conversationsResult.rows.map(async (conv: any) => {
        // Vérifier si l'IA est activée pour cette conversation (par défaut activée)
        let aiEnabled = true
        try {
          const settingsResult = await sql`
            SELECT ai_enabled
            FROM conversation_settings
            WHERE user_id = ${conv.user_id}::uuid
              AND creator_id = ${creatorId}::uuid
            LIMIT 1
          `
          if (settingsResult.rows.length > 0) {
            aiEnabled = settingsResult.rows[0].ai_enabled
          }
        } catch (err: any) {
          // Table n'existe pas encore, on utilisera la valeur par défaut (true)
          console.log('Table conversation_settings non disponible, utilisation valeur par défaut')
        }

        return {
          user_id: conv.user_id,
          user_name: conv.user_name || 'Utilisateur',
          user_email: conv.user_email,
          user_avatar_url: (conv.user_avatar_url !== undefined) ? (conv.user_avatar_url || null) : null,
          last_message: conv.last_message,
          last_message_role: (conv.last_message_role === 'user' || conv.last_message_role === 'assistant') 
            ? conv.last_message_role 
            : 'user' as 'user' | 'assistant',
          last_message_at: conv.last_message_at,
          total_messages: Number(conv.total_messages) || 0,
          ai_enabled: aiEnabled
        }
      })
    )

    return NextResponse.json({
      conversations,
      total: conversations.length
    })

  } catch (error: any) {
    console.error('❌ ERREUR CONVERSATIONS:', {
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

