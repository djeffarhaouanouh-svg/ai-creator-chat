import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// POST - Mettre à jour l'avatar de l'utilisateur (uniquement pour utilisateurs payants)
export async function POST(request: NextRequest) {
  try {
    const { userId, avatarUrl } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }

    // avatarUrl peut être null pour supprimer l'avatar
    if (avatarUrl !== null && !avatarUrl) {
      return NextResponse.json(
        { error: 'avatarUrl est requis (ou null pour supprimer)' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a au moins un abonnement actif (utilisateur payant)
    const subscriptionsResult = await sql`
      SELECT COUNT(*) as total
      FROM subscriptions
      WHERE user_id = ${userId}::uuid
      AND status = 'active'
    `;

    const totalSubscriptions = Number(subscriptionsResult.rows[0]?.total) || 0;

    if (totalSubscriptions === 0) {
      return NextResponse.json(
        { error: 'Seuls les utilisateurs payants peuvent mettre à jour leur avatar' },
        { status: 403 }
      );
    }

    // Mettre à jour l'avatar dans la base de données
    // D'abord, vérifier si la colonne existe, sinon la créer
    try {
      // Essayer de mettre à jour avec avatar_url (peut être null pour supprimer)
      const result = await sql`
        UPDATE users
        SET avatar_url = ${avatarUrl === null ? null : avatarUrl}
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
    } catch (error: any) {
      // Si la colonne avatar_url n'existe pas, la créer d'abord
      if (error.message && error.message.includes('avatar_url')) {
        try {
          // Créer la colonne si elle n'existe pas
          await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS avatar_url TEXT
          `;
          
          // Réessayer la mise à jour (peut être null pour supprimer)
          const result = await sql`
            UPDATE users
            SET avatar_url = ${avatarUrl === null ? null : avatarUrl}
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
        } catch (createError: any) {
          console.error('Error creating avatar_url column or updating:', createError);
          return NextResponse.json(
            { error: 'Erreur lors de la création de la colonne avatar_url. Veuillez exécuter la migration SQL manuellement.' },
            { status: 500 }
          );
        }
      } else {
        // Autre erreur
        throw error;
      }
    }
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'avatar' },
      { status: 500 }
    );
  }
}

