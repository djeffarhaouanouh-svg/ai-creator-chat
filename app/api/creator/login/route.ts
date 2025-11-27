import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'   // on utilise maintenant ta vraie DB Neon

interface Creator {
  id: string;
  name: string;
  slug: string;
}

export async function POST(request: Request) {
  try {
    const { slug, password } = await request.json()

    const query = `
      SELECT id, name, slug
      FROM creators
      WHERE slug = $1 AND password = $2
      LIMIT 1
    `

    const result = await pool.query(query, [slug, password])
    const creator = result.rows[0]

    if (!creator) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      creator: { id: creator.id, name: creator.name, slug: creator.slug }
    })

  } catch (error) {
    console.error("Erreur login créatrice :", error)
    return NextResponse.json(
      { error: 'Erreur de connexion' },
      { status: 500 }
    )
  }
}
