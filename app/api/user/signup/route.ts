import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'

interface User {
  id: string;
  email: string;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // 🔥 Obligatoire pour éviter l’erreur TypeScript / Vercel
    if (!pool) {
      console.error("Database pool is null")
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      )
    }

    // --- VALIDATIONS ---
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // --- Vérifier si l'utilisateur existe déjà ---
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      )
    }

    // --- Hash du mot de passe ---
    const hashedPassword = await bcrypt.hash(password, 10)

    // --- Création utilisateur ---
    const result = await pool.query<User>(
      `INSERT INTO users (email, name, password_hash, is_active, created_at)
       VALUES ($1, $2, $3, true, $4)
       RETURNING id, email, name`,
      [
        email.toLowerCase(),
        name.trim(),
        hashedPassword,
        new Date().toISOString(),
      ]
    )

    const newUser = result.rows[0]

    return NextResponse.json(
      {
        success: true,
        message: 'Compte créé avec succès',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erreur signup:', error)
    return NextResponse.json(
      { error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    )
  }
}