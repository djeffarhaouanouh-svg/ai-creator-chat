import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'  // ❗ maintenant on utilise ta vraie DB Neon
import bcrypt from 'bcryptjs'

interface User {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  is_active: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validation simple
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
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

    // Vérifier si le compte est actif
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Compte désactivé' },
        { status: 403 }
      )
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    // Mettre à jour last_login
    await pool.query(
      `UPDATE users
       SET last_login = $1
       WHERE id = $2`,
      [new Date().toISOString(), user.id]
    )

    // Réponse OK
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Erreur login:', error)
    return NextResponse.json(
      { error: 'Erreur de connexion' },
      { status: 500 }
    )
  }
}
