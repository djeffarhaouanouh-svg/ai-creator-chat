import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

// Interface pour typer la réponse
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

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur avec son password_hash
    const result = await sql<User>`
      SELECT id, email, name, password_hash, is_active
      FROM users
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

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

    // Vérifier le mot de passe avec bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    // Mettre à jour last_login
    await sql`
      UPDATE users
      SET last_login = ${new Date().toISOString()}
      WHERE id = ${user.id}
    `

    // Retourner le succès (sans le password_hash)
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