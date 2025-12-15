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
    const { userId, creatorId, role, content } = await request.json();

    console.log('📥 POST /api/messages received:', { userId, creatorId, role, contentLength: content?.length });

    if (!userId || !creatorId || !role || !content) {
      console.error('❌ Missing parameters:', { userId: !!userId, creatorId: !!creatorId, role: !!role, content: !!content });
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    console.log('💾 Attempting to insert into database...');

    // Insérer le message dans la base de données
    const result = await sql`
      INSERT INTO messages (user_id, creator_id, role, content, created_at)
      VALUES (${userId}, ${creatorId}, ${role}, ${content}, NOW())
      RETURNING id, role, content, created_at as timestamp
    `;

    console.log('✅ Message inserted successfully:', result.rows[0].id);

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
