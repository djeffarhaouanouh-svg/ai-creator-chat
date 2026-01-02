import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

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
    const userId = searchParams.get('userId') // Optionnel : filtrer par utilisateur
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    let result

    if (userId) {
      // Doubles IA pour un utilisateur spécifique
      result = await pool.query(
        `SELECT 
          ad.id, 
          ad.user_id,
          u.name as user_name,
          u.email as user_email,
          ad.name, 
          ad.status, 
          ad.voice_id, 
          ad.voice_name, 
          ad.share_slug, 
          ad.is_public, 
          ad.created_at, 
          ad.completed_at
        FROM ai_doubles ad
        LEFT JOIN users u ON ad.user_id = u.id
        WHERE ad.user_id = $1::uuid
        ORDER BY ad.created_at DESC
        LIMIT $2`,
        [userId, limit]
      )
    } else {
      // Tous les doubles IA
      result = await pool.query(
        `SELECT 
          ad.id, 
          ad.user_id,
          u.name as user_name,
          u.email as user_email,
          ad.name, 
          ad.status, 
          ad.voice_id, 
          ad.voice_name, 
          ad.share_slug, 
          ad.is_public, 
          ad.created_at, 
          ad.completed_at
        FROM ai_doubles ad
        LEFT JOIN users u ON ad.user_id = u.id
        ORDER BY ad.created_at DESC
        LIMIT $1`,
        [limit]
      )
    }

    const doubles = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      name: row.name,
      status: row.status,
      voice_id: row.voice_id,
      voice_name: row.voice_name,
      share_slug: row.share_slug,
      is_public: row.is_public,
      created_at: row.created_at,
      completed_at: row.completed_at
    }))

    // Statistiques globales
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN is_public = true THEN 1 END) as public_count
      FROM ai_doubles`
    )

    const stats = {
      total: Number(statsResult.rows[0]?.total) || 0,
      completed: Number(statsResult.rows[0]?.completed) || 0,
      processing: Number(statsResult.rows[0]?.processing) || 0,
      failed: Number(statsResult.rows[0]?.failed) || 0,
      public_count: Number(statsResult.rows[0]?.public_count) || 0
    }

    return NextResponse.json({
      success: true,
      doubles,
      stats,
      total: doubles.length
    })

  } catch (error: any) {
    console.error('Erreur admin doubles-ia:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

