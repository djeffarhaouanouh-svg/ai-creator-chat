import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { slug, password } = await request.json()

    const query = `
      SELECT id, name, slug, password_hash
      FROM creators
      WHERE slug = $1
      LIMIT 1
    `

    if (!pool) {
  console.error("Database not initialized");
  return NextResponse.json(
    { error: "Erreur interne : database non initialisée" },
    { status: 500 }
  );
}

const result = await pool.query(query, [slug]);

    const creator = result.rows[0]

    if (!creator) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

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
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}