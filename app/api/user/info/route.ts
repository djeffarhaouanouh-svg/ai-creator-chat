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
    // On essaie d'abord avec avatar_url, sinon on fait sans
    let userResult;
    let avatarUrl = null;
    
    try {
      userResult = await sql`
        SELECT id, name, email, avatar_url
        FROM users
        WHERE id = ${userId}::uuid
        LIMIT 1
      `
      if (userResult.rows.length > 0) {
        avatarUrl = userResult.rows[0].avatar_url || null;
      }
    } catch (error: any) {
      // Si la colonne avatar_url n'existe pas encore, on fait sans
      if (error.message && error.message.includes('avatar_url')) {
        userResult = await sql`
          SELECT id, name, email
          FROM users
          WHERE id = ${userId}::uuid
          LIMIT 1
        `
      } else {
        throw error;
      }
    }

    if (!userResult || userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: avatarUrl !== undefined ? avatarUrl : (user.avatar_url || null)
      }
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










