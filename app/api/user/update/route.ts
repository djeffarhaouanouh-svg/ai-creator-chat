import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// POST - Mettre à jour le nom et l'email de l'utilisateur
export async function POST(request: NextRequest) {
  try {
    const { userId, name, email } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'L\'email est requis' },
        { status: 400 }
      );
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existingUserResult = await sql`
      SELECT id FROM users 
      WHERE email = ${email.toLowerCase()} 
      AND id != ${userId}::uuid
      LIMIT 1
    `;

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé par un autre compte' },
        { status: 409 }
      );
    }

    // Mettre à jour le nom et l'email dans la base de données
    const result = await sql`
      UPDATE users
      SET name = ${name.trim()}, email = ${email.toLowerCase()}
      WHERE id = ${userId}::uuid
      RETURNING id, name, email, avatar_url
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}



