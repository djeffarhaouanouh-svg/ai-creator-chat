import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// POST - Vérifier et déclencher les messages automatiques basés sur le compteur
export async function POST(request: Request) {
  try {
    const { userId, creatorSlug } = await request.json();

    if (!userId || !creatorSlug) {
      return NextResponse.json({
        error: 'Missing required parameters: userId, creatorSlug'
      }, { status: 400 });
    }

    console.log('🔍 Checking automated message triggers for:', { userId, creatorSlug });

    // Récupérer le creator_id depuis le slug
    const creatorResult = await sql`
      SELECT id FROM creators WHERE slug = ${creatorSlug} LIMIT 1
    `;

    if (creatorResult.rows.length === 0) {
      console.log('⚠️ Creator not found:', creatorSlug);
      return NextResponse.json({ triggered: false, messagesSent: 0 });
    }

    const creatorId = creatorResult.rows[0].id;

    // Compter les messages de l'utilisateur (role = 'user')
    const countResult = await sql`
      SELECT COUNT(*) as count
      FROM messages
      WHERE user_id = ${userId}
        AND creator_id = ${creatorSlug}
        AND role = 'user'
    `;

    const userMessageCount = parseInt(countResult.rows[0].count);
    console.log(`📊 User has sent ${userMessageCount} messages to ${creatorSlug}`);

    // Trouver les triggers de type message_count qui correspondent au seuil
    const triggersResult = await sql`
      SELECT
        am.id,
        am.content,
        am.image_url,
        am.image_type,
        am.message_count_threshold
      FROM automated_messages am
      WHERE am.creator_id = ${creatorId}::uuid
        AND am.trigger_type = 'message_count'
        AND am.is_active = true
        AND am.message_count_threshold = ${userMessageCount}
        AND NOT EXISTS (
          SELECT 1
          FROM automated_message_sends ams
          WHERE ams.automated_message_id = am.id
            AND ams.user_id = ${userId}
        )
    `;

    const matchingTriggers = triggersResult.rows;
    console.log(`🎯 Found ${matchingTriggers.length} matching triggers`);

    if (matchingTriggers.length === 0) {
      return NextResponse.json({ triggered: false, messagesSent: 0 });
    }

    let messagesSent = 0;

    // Envoyer chaque message automatique trouvé
    for (const trigger of matchingTriggers) {
      try {
        // Insérer le message dans la table messages
        await sql`
          INSERT INTO messages (
            user_id,
            creator_id,
            role,
            content,
            image_url,
            image_type,
            created_at
          )
          VALUES (
            ${userId},
            ${creatorSlug},
            'assistant',
            ${trigger.content},
            ${trigger.image_url || null},
            ${trigger.image_type || null},
            NOW()
          )
        `;

        // Enregistrer l'envoi dans automated_message_sends
        // Le UNIQUE constraint empêche les doublons
        await sql`
          INSERT INTO automated_message_sends (
            automated_message_id,
            user_id,
            sent_at
          )
          VALUES (
            ${trigger.id}::uuid,
            ${userId},
            NOW()
          )
        `;

        messagesSent++;
        console.log(`✅ Sent automated message ${trigger.id} to user ${userId}`);
      } catch (error: any) {
        // Si erreur de contrainte unique (23505), ignorer silencieusement
        if (error.code === '23505') {
          console.log(`ℹ️ Message ${trigger.id} already sent to user ${userId} (race condition)`);
        } else {
          console.error(`❌ Error sending automated message ${trigger.id}:`, error);
        }
      }
    }

    console.log(`📤 Sent ${messagesSent} automated messages to user ${userId}`);

    return NextResponse.json({
      triggered: messagesSent > 0,
      messagesSent,
      threshold: userMessageCount
    });
  } catch (error) {
    console.error('❌ Error checking triggers:', error);
    return NextResponse.json({
      error: 'Failed to check triggers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
