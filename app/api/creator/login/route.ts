 import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

interface Creator {
  id: string;
  name: string;
  slug: string;
  password_hash: string;
}

export async function POST(request: Request) {
  try {
    const { slug, password } = await request.json()

    const query = `
      SELECT id, name, slug, password_hash
      FROM creators
      WHERE slug = $1
      LIMIT 1
    `

    const result = await pool.query<Creator>(query, [slug])
    const creator = result.rows[0]

    if (!creator) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    // Vérification du mot de passe
    const valid = await bcrypt.compare(password, creator.password_hash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      creator: {
        id: creator.id,
        name: creator.name,
        slug: creator.slug
      }
    })

  } catch (error) {
    console.error("Erreur login créatrice :", error)
    return NextResponse.json(
      { error: 'Erreur de connexion' },
      { status: 500 }
    )
  }
}