import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

interface User {
  id: string
  email: string
  name: string | null
  password_hash: string
  is_active: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // 🔥 OBLIGATOIRE POUR VERCEL (sinon build error)
    if (!pool) {
      console.error("Database not initialized")
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      )
    }

    // RÉCUPÉRER L'UTILISATEUR
    const result = await pool.query<User>(
      `SELECT id, email, name, password_hash, is_active
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase()]
    )

    const user = result.rows[0]

    if (!user) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Compte désactivé' },
        { status: 403 }
      )
    }

    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    // METTRE À JOUR last_login
    await pool.query(
      `UPDATE users
       SET last_login = $1
       WHERE id = $2`,
      [new Date().toISOString(), user.id]
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error("Erreur login user :", error)
    return NextResponse.json(
      { error: 'Erreur de connexion' },
      { status: 500 }
    )
  }
}