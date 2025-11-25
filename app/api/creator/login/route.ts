import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

interface Creator {
  id: string;
  name: string;
  slug: string;
}

export async function POST(request: Request) {
  try {
    const { slug, password } = await request.json()

    const result = await sql<Creator>`
      SELECT id, name, slug
      FROM creators
      WHERE slug = ${slug} AND password = ${password}
      LIMIT 1
    `

    const creator = result.rows[0]

    if (!creator) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      creator: { id: creator.id, name: creator.name, slug: creator.slug }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur de connexion' }, { status: 500 })
  }
}