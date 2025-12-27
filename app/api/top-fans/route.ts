import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET - Récupérer le classement des utilisateurs par nombre de messages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const creatorId = searchParams.get('creatorId'); // Optionnel : filtrer par créatrice

    let result;

    let creatorInfo = null;
    
    if (creatorId) {
      // Récupérer les infos de la créatrice
      const creatorResult = await sql`
        SELECT id, name, slug, avatar_url
        FROM creators
        WHERE slug = ${creatorId} OR id::text = ${creatorId}
        LIMIT 1
      `;
      
      if (creatorResult.rows.length > 0) {
        creatorInfo = {
          id: creatorResult.rows[0].id,
          name: creatorResult.rows[0].name,
          slug: creatorResult.rows[0].slug,
          avatar: creatorResult.rows[0].avatar_url,
        };
      }
      
      // Utiliser le slug pour filtrer (car messages.creator_id est TEXT et contient le slug)
      const creatorSlug = creatorInfo?.slug || creatorId;
      
      // Classement pour une créatrice spécifique
      // Essayer avec avatar_url, sinon sans
      try {
        result = await sql`
          SELECT 
            m.user_id,
            u.name,
            u.email,
            u.avatar_url,
            COUNT(*) as message_count
          FROM messages m
          LEFT JOIN users u ON m.user_id = u.id::text OR m.user_id = u.email
          WHERE m.role = 'user'
            AND m.creator_id = ${creatorSlug}
          GROUP BY m.user_id, u.name, u.email, u.avatar_url
          ORDER BY message_count DESC
          LIMIT ${limit}
        `;
      } catch (error: any) {
        // Si la colonne avatar_url n'existe pas encore, on fait sans
        if (error.message && error.message.includes('avatar_url')) {
          result = await sql`
            SELECT 
              m.user_id,
              u.name,
              u.email,
              COUNT(*) as message_count
            FROM messages m
            LEFT JOIN users u ON m.user_id = u.id::text OR m.user_id = u.email
            WHERE m.role = 'user'
              AND m.creator_id = ${creatorSlug}
            GROUP BY m.user_id, u.name, u.email
            ORDER BY message_count DESC
            LIMIT ${limit}
          `;
        } else {
          throw error;
        }
      }
    } else {
      // Classement global (toutes créatrices confondues)
      // Essayer avec avatar_url, sinon sans
      try {
        result = await sql`
          SELECT 
            m.user_id,
            u.name,
            u.email,
            u.avatar_url,
            COUNT(*) as message_count
          FROM messages m
          LEFT JOIN users u ON m.user_id = u.id::text OR m.user_id = u.email
          WHERE m.role = 'user'
          GROUP BY m.user_id, u.name, u.email, u.avatar_url
          ORDER BY message_count DESC
          LIMIT ${limit}
        `;
      } catch (error: any) {
        // Si la colonne avatar_url n'existe pas encore, on fait sans
        if (error.message && error.message.includes('avatar_url')) {
          result = await sql`
            SELECT 
              m.user_id,
              u.name,
              u.email,
              COUNT(*) as message_count
            FROM messages m
            LEFT JOIN users u ON m.user_id = u.id::text OR m.user_id = u.email
            WHERE m.role = 'user'
            GROUP BY m.user_id, u.name, u.email
            ORDER BY message_count DESC
            LIMIT ${limit}
          `;
        } else {
          throw error;
        }
      }
    }

    const topFans = result.rows.map((row, index) => {
      // Générer un nom d'affichage
      let displayName = row.name;
      if (!displayName && row.email) {
        displayName = row.email.split('@')[0];
      }
      if (!displayName) {
        // Si c'est un UUID, afficher juste "Utilisateur" avec les 4 premiers caractères
        const userId = row.user_id || '';
        if (userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          displayName = `Utilisateur ${userId.substring(0, 8)}`;
        } else if (userId.includes('@')) {
          displayName = userId.split('@')[0];
        } else {
          displayName = `Utilisateur ${userId.substring(0, 8)}`;
        }
      }

      // Valider l'URL de l'avatar avant de la retourner
      let avatarUrl = null;
      if (row.avatar_url !== undefined && row.avatar_url) {
        try {
          // Vérifier que c'est une URL valide
          const url = new URL(row.avatar_url);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            avatarUrl = row.avatar_url;
          }
        } catch (e) {
          // URL invalide, on laisse avatarUrl à null
          console.warn(`Invalid avatar URL for user ${row.user_id}: ${row.avatar_url}`);
        }
      }

      return {
        rank: index + 1,
        userId: row.user_id,
        name: displayName,
        email: row.email || null,
        avatar: avatarUrl,
        messageCount: Number(row.message_count) || 0,
      };
    });

    return NextResponse.json({ 
      success: true,
      topFans,
      total: topFans.length,
      creator: creatorInfo
    });
  } catch (error) {
    console.error('Error fetching top fans:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch top fans',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

