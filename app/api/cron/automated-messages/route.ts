import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 100; // Traiter 100 utilisateurs à la fois

// GET - Cron job pour traiter les messages automatiques planifiés
export async function GET(request: Request) {
  try {
    // Vérifier l'autorisation Vercel Cron (en production)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production') {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error('❌ Unauthorized cron access attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🕐 Starting automated messages cron job...');

    // Trouver tous les messages planifiés prêts à être envoyés
    // Fenêtre de sécurité : entre maintenant et il y a 1 heure (pour rattraper les envois manqués)
    const messagesResult = await sql`
      SELECT
        id,
        creator_id,
        content,
        image_url,
        image_type,
        scheduled_at
      FROM automated_messages
      WHERE trigger_type = 'scheduled'
        AND is_active = true
        AND scheduled_at <= NOW()
        AND scheduled_at > NOW() - INTERVAL '1 hour'
      ORDER BY scheduled_at ASC
    `;

    const scheduledMessages = messagesResult.rows;
    console.log(`📬 Found ${scheduledMessages.length} scheduled messages ready to send`);

    if (scheduledMessages.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
        message: 'No scheduled messages to process'
      });
    }

    let totalSent = 0;
    const errors: any[] = [];

    // Traiter chaque message planifié
    for (const message of scheduledMessages) {
      try {
        console.log(`📤 Processing message ${message.id}...`);

        // Récupérer le slug de la créatrice depuis l'UUID
        const creatorResult = await sql`
          SELECT slug FROM creators WHERE id = ${message.creator_id}::uuid LIMIT 1
        `;

        if (creatorResult.rows.length === 0) {
          console.error(`⚠️ Creator not found for message ${message.id}`);
          errors.push({ messageId: message.id, error: 'Creator not found' });
          continue;
        }

        const creatorSlug = creatorResult.rows[0].slug;

        // Récupérer tous les abonnés actifs de la créatrice
        const subscribersResult = await sql`
          SELECT DISTINCT user_id
          FROM subscriptions
          WHERE creator_id = ${message.creator_id}::uuid
            AND status = 'active'
        `;

        console.log(`👥 Found ${subscribersResult.rows.length} active subscribers`);

        // Filtrer les utilisateurs qui n'ont pas encore reçu ce message
        const alreadySentResult = await sql`
          SELECT user_id
          FROM automated_message_sends
          WHERE automated_message_id = ${message.id}::uuid
        `;

        const alreadySentUserIds = new Set(
          alreadySentResult.rows.map(row => row.user_id)
        );

        const usersToSend = subscribersResult.rows.filter(
          sub => !alreadySentUserIds.has(sub.user_id)
        );

        console.log(`📨 Sending to ${usersToSend.length} users (${alreadySentUserIds.size} already received)`);

        // Envoyer le message par lots
        let sentCount = 0;
        for (let i = 0; i < usersToSend.length; i += BATCH_SIZE) {
          const batch = usersToSend.slice(i, i + BATCH_SIZE);

          await Promise.all(
            batch.map(async (subscriber) => {
              try {
                // Vérifier que l'utilisateur est toujours abonné (double-check)
                const isStillSubscribed = await sql`
                  SELECT 1
                  FROM subscriptions
                  WHERE user_id = ${subscriber.user_id}::uuid
                    AND creator_id = ${message.creator_id}::uuid
                    AND status = 'active'
                  LIMIT 1
                `;

                if (isStillSubscribed.rows.length === 0) {
                  console.log(`⚠️ User ${subscriber.user_id} no longer subscribed, skipping`);
                  return;
                }

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
                    ${subscriber.user_id},
                    ${creatorSlug},
                    'assistant',
                    ${message.content},
                    ${message.image_url || null},
                    ${message.image_type || null},
                    NOW()
                  )
                `;

                // Enregistrer l'envoi
                await sql`
                  INSERT INTO automated_message_sends (
                    automated_message_id,
                    user_id,
                    sent_at
                  )
                  VALUES (
                    ${message.id}::uuid,
                    ${subscriber.user_id},
                    NOW()
                  )
                `;

                sentCount++;
              } catch (error: any) {
                // Si contrainte unique violée, l'utilisateur a déjà reçu le message
                if (error.code !== '23505') {
                  console.error(`❌ Error sending to user ${subscriber.user_id}:`, error.message);
                  errors.push({
                    messageId: message.id,
                    userId: subscriber.user_id,
                    error: error.message
                  });
                }
              }
            })
          );
        }

        console.log(`✅ Sent message ${message.id} to ${sentCount} users`);
        totalSent += sentCount;

        // Désactiver le message après envoi (one-time send)
        await sql`
          UPDATE automated_messages
          SET is_active = false, updated_at = NOW()
          WHERE id = ${message.id}::uuid
        `;
        console.log(`🔒 Deactivated message ${message.id} (one-time send completed)`);

      } catch (error: any) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        errors.push({
          messageId: message.id,
          error: error.message
        });
      }
    }

    console.log(`✅ Cron job completed. Sent ${totalSent} messages total.`);

    return NextResponse.json({
      success: true,
      processed: scheduledMessages.length,
      sent: totalSent,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json({
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
