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
    const status = searchParams.get('status') // Optionnel : filtrer par statut
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    let result

    if (creatorId) {
      // Récupérer l'UUID du créateur depuis son slug
      const creatorResult = await sql`
        SELECT id FROM creators WHERE slug = ${creatorId} OR id::text = ${creatorId} LIMIT 1
      `

      if (creatorResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Creator not found' },
          { status: 404 }
        )
      }

      const creatorUuid = creatorResult.rows[0].id

      if (status) {
        result = await sql`
          SELECT 
            cr.id,
            cr.creator_id,
            c.name as creator_name,
            c.slug as creator_slug,
            cr.user_id,
            u.name as user_name,
            u.email as user_email,
            cr.message,
            cr.status,
            cr.price,
            cr.media_url,
            cr.paypal_authorization_id,
            cr.created_at,
            cr.updated_at
          FROM content_requests cr
          LEFT JOIN creators c ON cr.creator_id = c.id
          LEFT JOIN users u ON cr.user_id = u.id
          WHERE cr.creator_id = ${creatorUuid}::uuid
            AND cr.status = ${status}
          ORDER BY cr.created_at DESC
          LIMIT ${limit}
        `
      } else {
        result = await sql`
          SELECT 
            cr.id,
            cr.creator_id,
            c.name as creator_name,
            c.slug as creator_slug,
            cr.user_id,
            u.name as user_name,
            u.email as user_email,
            cr.message,
            cr.status,
            cr.price,
            cr.media_url,
            cr.paypal_authorization_id,
            cr.created_at,
            cr.updated_at
          FROM content_requests cr
          LEFT JOIN creators c ON cr.creator_id = c.id
          LEFT JOIN users u ON cr.user_id = u.id
          WHERE cr.creator_id = ${creatorUuid}::uuid
          ORDER BY cr.created_at DESC
          LIMIT ${limit}
        `
      }
    } else {
      // Toutes les demandes de contenu
      if (status) {
        result = await sql`
          SELECT 
            cr.id,
            cr.creator_id,
            c.name as creator_name,
            c.slug as creator_slug,
            cr.user_id,
            u.name as user_name,
            u.email as user_email,
            cr.message,
            cr.status,
            cr.price,
            cr.media_url,
            cr.paypal_authorization_id,
            cr.created_at,
            cr.updated_at
          FROM content_requests cr
          LEFT JOIN creators c ON cr.creator_id = c.id
          LEFT JOIN users u ON cr.user_id = u.id
          WHERE cr.status = ${status}
          ORDER BY cr.created_at DESC
          LIMIT ${limit}
        `
      } else {
        result = await sql`
          SELECT 
            cr.id,
            cr.creator_id,
            c.name as creator_name,
            c.slug as creator_slug,
            cr.user_id,
            u.name as user_name,
            u.email as user_email,
            cr.message,
            cr.status,
            cr.price,
            cr.media_url,
            cr.paypal_authorization_id,
            cr.created_at,
            cr.updated_at
          FROM content_requests cr
          LEFT JOIN creators c ON cr.creator_id = c.id
          LEFT JOIN users u ON cr.user_id = u.id
          ORDER BY cr.created_at DESC
          LIMIT ${limit}
        `
      }
    }

    const requests = result.rows.map(row => ({
      id: row.id,
      creator_id: row.creator_id,
      creator_name: row.creator_name,
      creator_slug: row.creator_slug,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      message: row.message,
      status: row.status,
      price: row.price ? Number(row.price) : null,
      media_url: row.media_url,
      paypal_authorization_id: row.paypal_authorization_id,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))

    // Statistiques globales
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'delivered') THEN price ELSE 0 END), 0) as total_revenue
      FROM content_requests
    `

    const stats = {
      total: Number(statsResult.rows[0]?.total) || 0,
      pending: Number(statsResult.rows[0]?.pending) || 0,
      paid: Number(statsResult.rows[0]?.paid) || 0,
      delivered: Number(statsResult.rows[0]?.delivered) || 0,
      cancelled: Number(statsResult.rows[0]?.cancelled) || 0,
      total_revenue: Number(statsResult.rows[0]?.total_revenue) || 0
    }

    return NextResponse.json({
      success: true,
      requests,
      stats,
      total: requests.length
    })

  } catch (error: any) {
    console.error('Erreur admin content-requests:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error.message },
      { status: 500 }
    )
  }
}

