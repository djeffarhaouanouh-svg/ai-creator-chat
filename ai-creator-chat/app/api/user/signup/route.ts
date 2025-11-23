import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

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
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur dans Supabase
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email: email.toLowerCase(),
          name: name.trim(),
          password_hash: hashedPassword,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('Erreur création utilisateur:', createError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

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
