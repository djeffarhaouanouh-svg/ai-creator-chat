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
    const creatorId = searchParams.get('creatorId') // Optionnel : filtrer par créatrice
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    let result

    if (creatorId) {
      // Stories pour une créatrice spécifique
      result = await sql`
        SELECT
          s.id,
          s.creator_id,
          c.name as creator_name,
          c.slug as creator_slug,
          s.title,
          s.media_url,
          s.media_type,
          s.caption,
          s.is_locked,
          s.is_active,
          s.created_at,
          s.expires_at,
          s.view_count
        FROM stories s
        LEFT JOIN creators c ON s.creator_id = c.id::text OR s.creator_id = c.slug
        WHERE s.creator_id = ${creatorId} OR c.slug = ${creatorId}
        ORDER BY s.created_at DESC
        LIMIT ${limit}
      `
    } else {
      // Toutes les stories
      result = await sql`
        SELECT
          s.id,
          s.creator_id,
          c.name as creator_name,
          c.slug as creator_slug,
          s.title,
          s.media_url,
          s.media_type,
          s.caption,
          s.is_locked,
          s.is_active,
          s.created_at,
          s.expires_at,
          s.view_count
        FROM stories s
        LEFT JOIN creators c ON s.creator_id = c.id::text OR s.creator_id = c.slug
        ORDER BY s.created_at DESC
        LIMIT ${limit}
      `
    }

    const stories = result.rows.map(row => ({
      id: row.id,
      creator_id: row.creator_id,
      creator_name: row.creator_name,
      creator_slug: row.creator_slug,
      title: row.title,
      media_url: row.media_url,
      media_type: row.media_type,
      caption: row.caption,
      is_locked: row.is_locked,
      is_active: row.is_active,
      created_at: row.created_at,
      expires_at: row.expires_at,
      view_count: Number(row.view_count) || 0,
      is_expired: row.expires_at ? new Date(row.expires_at) < new Date() : false
    }))

    return NextResponse.json({
      success: true,
      stories,
      total: stories.length
    })

  } catch (error: any) {
    console.error('Erreur admin stories:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

