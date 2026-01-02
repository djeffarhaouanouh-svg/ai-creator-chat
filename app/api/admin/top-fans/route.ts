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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const creatorId = searchParams.get('creatorId') // Optionnel : filtrer par créatrice

    let result
    let creatorInfo = null

    if (creatorId) {
      // Récupérer les infos de la créatrice
      const creatorResult = await sql`
        SELECT id, name, slug, avatar_url
        FROM creators
        WHERE slug = ${creatorId} OR id::text = ${creatorId}
        LIMIT 1
      `

      if (creatorResult.rows.length > 0) {
        creatorInfo = {
          id: creatorResult.rows[0].id,
          name: creatorResult.rows[0].name,
          slug: creatorResult.rows[0].slug,
          avatar: creatorResult.rows[0].avatar_url,
        }
      }

      const creatorSlug = creatorInfo?.slug || creatorId

      // Classement pour une créatrice spécifique
      try {
        result = await sql`
          SELECT 
            m.user_id,
            u.name,
            u.email,
            u.avatar_url,
            COUNT(*) as message_count
          FROM messages m
          LEFT JOIN users u ON m.user_id = u.id::text OR m.user_id = u.email
          WHERE m.role = 'user'
            AND m.creator_id = ${creatorSlug}
          GROUP BY m.user_id, u.name, u.email, u.avatar_url
          ORDER BY message_count DESC
          LIMIT ${limit}
        `
      } catch (error: any) {
        if (error.message && error.message.includes('avatar_url')) {
          result = await sql`
            SELECT 
              m.user_id,
              u.name,
              u.email,
              COUNT(*) as message_count
            FROM messages m
            LEFT JOIN users u ON m.user_id = u.id::text OR m.user_id = u.email
            WHERE m.role = 'user'
              AND m.creator_id = ${creatorSlug}
            GROUP BY m.user_id, u.name, u.email
            ORDER BY message_count DESC
            LIMIT ${limit}
          `
        } else {
          throw error
        }
      }
    } else {
      // Classement global
      try {
        result = await sql`
          SELECT 
            m.user_id,
            u.name,
            u.email,
            u.avatar_url,
            COUNT(*) as message_count
          FROM messages m
          LEFT JOIN users u ON m.user_id = u.id::text OR m.user_id = u.email
          WHERE m.role = 'user'
          GROUP BY m.user_id, u.name, u.email, u.avatar_url
          ORDER BY message_count DESC
          LIMIT ${limit}
        `
      } catch (error: any) {
        if (error.message && error.message.includes('avatar_url')) {
          result = await sql`
            SELECT 
              m.user_id,
              u.name,
              u.email,
              COUNT(*) as message_count
            FROM messages m
            LEFT JOIN users u ON m.user_id = u.id::text OR m.user_id = u.email
            WHERE m.role = 'user'
            GROUP BY m.user_id, u.name, u.email
            ORDER BY message_count DESC
            LIMIT ${limit}
          `
        } else {
          throw error
        }
      }
    }

    const topFans = result.rows.map((row, index) => {
      let displayName = row.name
      if (!displayName && row.email) {
        displayName = row.email.split('@')[0]
      }
      if (!displayName) {
        const userId = row.user_id || ''
        if (userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          displayName = `Utilisateur ${userId.substring(0, 8)}`
        } else if (userId.includes('@')) {
          displayName = userId.split('@')[0]
        } else {
          displayName = `Utilisateur ${userId.substring(0, 8)}`
        }
      }

      let avatarUrl = null
      if (row.avatar_url !== undefined && row.avatar_url) {
        try {
          const url = new URL(row.avatar_url)
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            avatarUrl = row.avatar_url
          }
        } catch (e) {
          console.warn(`Invalid avatar URL for user ${row.user_id}: ${row.avatar_url}`)
        }
      }

      return {
        rank: index + 1,
        userId: row.user_id,
        name: displayName,
        email: row.email || null,
        avatar: avatarUrl,
        messageCount: Number(row.message_count) || 0,
      }
    })

    return NextResponse.json({
      success: true,
      topFans,
      total: topFans.length,
      creator: creatorInfo
    })

  } catch (error: any) {
    console.error('Erreur admin top-fans:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

