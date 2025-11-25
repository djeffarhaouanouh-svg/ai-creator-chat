import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

interface User {
  id: string;
  email: string;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation des données
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    // Validation mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingResult = await sql`
      SELECT id FROM users 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const result = await sql<User>`
      INSERT INTO users (email, name, password_hash, is_active, created_at)
      VALUES (
        ${email.toLowerCase()},
        ${name.trim()},
        ${hashedPassword},
        true,
        ${new Date().toISOString()}
      )
      RETURNING id, email, name
    `

    const newUser = result.rows[0]

    // Retourner le succès (sans le mot de passe)
    return NextResponse.json(
      {
        success: true,
        message: 'Compte créé avec succès',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erreur signup:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'inscription' },
      { status: 500 }
    )
  }
}