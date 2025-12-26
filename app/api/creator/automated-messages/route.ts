import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - Liste tous les messages automatiques d'une créatrice
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorSlug = searchParams.get('creatorSlug');

    if (!creatorSlug) {
      return NextResponse.json({ error: 'Missing creatorSlug parameter' }, { status: 400 });
    }

    // Récupérer le creator_id depuis le slug
    const creatorResult = await sql`
      SELECT id FROM creators WHERE slug = ${creatorSlug} LIMIT 1
    `;

    if (creatorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const creatorId = creatorResult.rows[0].id;

    // Récupérer tous les messages automatiques avec le nombre d'envois
    const result = await sql`
      SELECT
        am.id,
        am.content,
        am.image_url,
        am.image_type,
        am.trigger_type,
        am.scheduled_at,
        am.message_count_threshold,
        am.is_active,
        am.created_at,
        am.updated_at,
        COUNT(ams.id) as send_count
      FROM automated_messages am
      LEFT JOIN automated_message_sends ams ON am.id = ams.automated_message_id
      WHERE am.creator_id = ${creatorId}::uuid
      GROUP BY am.id
      ORDER BY am.created_at DESC
    `;

    return NextResponse.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching automated messages:', error);
    return NextResponse.json({
      error: 'Failed to fetch automated messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Créer un nouveau message automatique
export async function POST(request: Request) {
  try {
    const {
      creatorSlug,
      content,
      imageUrl,
      imageType,
      triggerType,
      scheduledAt,
      messageCountThreshold
    } = await request.json();

    // Validation des paramètres requis
    if (!creatorSlug || !content || !triggerType) {
      return NextResponse.json({
        error: 'Missing required parameters: creatorSlug, content, triggerType'
      }, { status: 400 });
    }

    // Validation du type de trigger
    if (!['scheduled', 'message_count'].includes(triggerType)) {
      return NextResponse.json({
        error: 'Invalid trigger type. Must be "scheduled" or "message_count"'
      }, { status: 400 });
    }

    // Validation des paramètres spécifiques au trigger
    if (triggerType === 'scheduled') {
      if (!scheduledAt) {
        return NextResponse.json({
          error: 'scheduledAt is required for scheduled trigger type'
        }, { status: 400 });
      }

      // Vérifier que la date est dans le futur
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return NextResponse.json({
          error: 'Scheduled time must be in the future'
        }, { status: 400 });
      }
    }

    if (triggerType === 'message_count') {
      if (!messageCountThreshold || messageCountThreshold <= 0) {
        return NextResponse.json({
          error: 'messageCountThreshold must be greater than 0 for message_count trigger type'
        }, { status: 400 });
      }
    }

    // Récupérer le creator_id depuis le slug
    const creatorResult = await sql`
      SELECT id FROM creators WHERE slug = ${creatorSlug} LIMIT 1
    `;

    if (creatorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const creatorId = creatorResult.rows[0].id;

    // Insérer le message automatique
    const result = await sql`
      INSERT INTO automated_messages (
        creator_id,
        content,
        image_url,
        image_type,
        trigger_type,
        scheduled_at,
        message_count_threshold
      )
      VALUES (
        ${creatorId}::uuid,
        ${content},
        ${imageUrl || null},
        ${imageType || null},
        ${triggerType},
        ${scheduledAt || null},
        ${messageCountThreshold || null}
      )
      RETURNING
        id,
        content,
        image_url,
        image_type,
        trigger_type,
        scheduled_at,
        message_count_threshold,
        is_active,
        created_at,
        updated_at
    `;

    console.log('✅ Automated message created:', result.rows[0].id);

    return NextResponse.json({
      success: true,
      message: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating automated message:', error);
    return NextResponse.json({
      error: 'Failed to create automated message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
