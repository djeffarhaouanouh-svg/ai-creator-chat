import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      )
    }

    // Récupérer les infos utilisateur
    const userResult = await sql`
      SELECT id, name, email
      FROM users
      WHERE id = ${userId}::uuid
      LIMIT 1
    `

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: userResult.rows[0]
    })

  } catch (error: any) {
    console.error('❌ ERREUR INFO UTILISATEUR:', {
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




