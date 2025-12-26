import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - Récupérer l'historique des messages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const creatorId = searchParams.get('creatorId');

    if (!userId || !creatorId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Récupérer tous les messages de la conversation
    const result = await sql`
      SELECT
        id,
        role,
        content,
        image_url,
        image_type,
        created_at as timestamp
      FROM messages
      WHERE user_id = ${userId}
        AND creator_id = ${creatorId}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Sauvegarder un nouveau message
export async function POST(request: Request) {
  try {
    const { userId, creatorId, role, content, image_url, image_type } = await request.json();

    console.log('📥 POST /api/messages received:', { userId, creatorId, role, contentLength: content?.length });

    if (!userId || !creatorId || !role || !content) {
      console.error('❌ Missing parameters:', { userId: !!userId, creatorId: !!creatorId, role: !!role, content: !!content });
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // ⛔ BLOQUER la sauvegarde de messages assistant si l'IA est désactivée
    if (role === 'assistant') {
      // Récupérer le creator UUID depuis le slug
      let creatorResult;
      try {
        creatorResult = await sql`
          SELECT id FROM creators WHERE slug = ${creatorId} LIMIT 1
        `
      } catch (error: any) {
        console.error('❌ Erreur récupération créatrice:', error.message);
        creatorResult = { rows: [] };
      }
      
      if (creatorResult.rows.length > 0) {
        const creatorUuid = creatorResult.rows[0].id
        
        // Vérifier si l'IA est désactivée
        let settingsResult;
        try {
          settingsResult = await sql`
            SELECT ai_enabled
            FROM conversation_settings
            WHERE user_id = ${userId}::uuid
              AND creator_id = ${creatorUuid}::uuid
            LIMIT 1
          `
        } catch (error: any) {
          console.log('⚠️ Erreur lors de la vérification IA:', error.message);
          settingsResult = { rows: [] };
        }
        
        // Log pour débogage
        console.log('🔍 Vérification IA dans /api/messages:', {
          userId: userId ? `${userId.substring(0, 8)}...` : 'MANQUANT',
          creatorId,
          creatorUuid: creatorUuid ? `${creatorUuid.substring(0, 8)}...` : 'MANQUANT',
          settingsFound: settingsResult.rows.length > 0,
          aiEnabled: settingsResult.rows.length > 0 ? settingsResult.rows[0].ai_enabled : 'N/A (par défaut activé)'
        });
        
        // Si le setting existe et est false → BLOQUER la sauvegarde
        if (settingsResult.rows.length > 0 && settingsResult.rows[0].ai_enabled === false) {
          console.log('🚫 BLOQUAGE sauvegarde message assistant - IA désactivée')
          return NextResponse.json(
            { error: 'L\'IA est désactivée pour cette conversation.' },
            { status: 403 }
          )
        }
      } else {
        console.warn('⚠️ Créatrice introuvable pour le slug:', creatorId);
      }
    }

    console.log('💾 Attempting to insert into database...');

    // Compteur désactivé - génération illimitée d'images

    // Insérer le message dans la base de données
    const result = await sql`
      INSERT INTO messages (user_id, creator_id, role, content, image_url, image_type, created_at)
      VALUES (${userId}, ${creatorId}, ${role}, ${content}, ${image_url || null}, ${image_type || null}, NOW())
      RETURNING id, role, content, image_url, image_type, created_at as timestamp
    `;

    console.log('✅ Message inserted successfully:', result.rows[0].id);

    // Vérifier les triggers de messages automatiques (si message de l'utilisateur)
    if (role === 'user') {
      // Fire-and-forget - ne pas bloquer le flux principal
      const baseUrl = process.env.NEXT_PUBLIC_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

      fetch(`${baseUrl}/api/automated-messages/check-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, creatorId })
      }).catch(err => console.error('Trigger check failed:', err));
    }

    return NextResponse.json({ message: result.rows[0] });
  } catch (error) {
    console.error('❌ Error saving message:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({
      error: 'Failed to save message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
