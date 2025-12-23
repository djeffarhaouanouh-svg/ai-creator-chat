import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { creatorSlug, name, avatarUrl, coverUrl } = body

    if (!creatorSlug) {
      return NextResponse.json(
        { success: false, error: 'Creator slug requis' },
        { status: 400 }
      )
    }

    // Vérifier si le créateur existe
    const existingCreator = await sql`
      SELECT * FROM creators WHERE slug = ${creatorSlug}
    `

    if (existingCreator.length === 0) {
      // Créer le créateur s'il n'existe pas
      await sql`
        INSERT INTO creators (slug, name, avatar_url, cover_image)
        VALUES (${creatorSlug}, ${name || null}, ${avatarUrl || null}, ${coverUrl || null})
      `
    } else {
      // Mettre à jour le créateur existant
      await sql`
        UPDATE creators
        SET
          name = ${name || null},
          avatar_url = ${avatarUrl || null},
          cover_image = ${coverUrl || null},
          updated_at = NOW()
        WHERE slug = ${creatorSlug}
      `
    }

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
