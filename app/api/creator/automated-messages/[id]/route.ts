import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - Récupérer un message automatique avec son historique d'envois
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Récupérer le message automatique
    const messageResult = await sql`
      SELECT
        id,
        creator_id,
        content,
        image_url,
        image_type,
        trigger_type,
        scheduled_at,
        message_count_threshold,
        is_active,
        created_at,
        updated_at
      FROM automated_messages
      WHERE id = ${id}::uuid
    `;

    if (messageResult.rows.length === 0) {
      return NextResponse.json({ error: 'Automated message not found' }, { status: 404 });
    }

    const message = messageResult.rows[0];

    // Récupérer l'historique des envois
    const sendsResult = await sql`
      SELECT
        ams.user_id,
        ams.sent_at,
        u.email as user_email
      FROM automated_message_sends ams
      LEFT JOIN users u ON ams.user_id::uuid = u.id
      WHERE ams.automated_message_id = ${id}::uuid
      ORDER BY ams.sent_at DESC
    `;

    return NextResponse.json({
      message,
      sends: sendsResult.rows,
      send_count: sendsResult.rows.length
    });
  } catch (error) {
    console.error('Error fetching automated message:', error);
    return NextResponse.json({
      error: 'Failed to fetch automated message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Modifier un message automatique
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const {
      content,
      imageUrl,
      imageType,
      triggerType,
      scheduledAt,
      messageCountThreshold
    } = await request.json();

    // Validation des paramètres requis
    if (!content || !triggerType) {
      return NextResponse.json({
        error: 'Missing required parameters: content, triggerType'
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

    // Mettre à jour le message automatique
    const result = await sql`
      UPDATE automated_messages
      SET
        content = ${content},
        image_url = ${imageUrl || null},
        image_type = ${imageType || null},
        trigger_type = ${triggerType},
        scheduled_at = ${scheduledAt || null},
        message_count_threshold = ${messageCountThreshold || null},
        updated_at = NOW()
      WHERE id = ${id}::uuid
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

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Automated message not found' }, { status: 404 });
    }

    console.log('✅ Automated message updated:', id);

    return NextResponse.json({
      success: true,
      message: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating automated message:', error);
    return NextResponse.json({
      error: 'Failed to update automated message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Supprimer (soft delete) un message automatique
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Soft delete - désactiver le message
    const result = await sql`
      UPDATE automated_messages
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Automated message not found' }, { status: 404 });
    }

    console.log('✅ Automated message deleted (soft delete):', id);

    return NextResponse.json({
      success: true,
      message: 'Automated message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting automated message:', error);
    return NextResponse.json({
      error: 'Failed to delete automated message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
