import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * API pour récupérer les messages d'une conversation avec un double IA
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doubleId = searchParams.get("doubleId");
    const userId = searchParams.get("userId");
    const conversationId = searchParams.get("conversationId");

    if (!doubleId) {
      return NextResponse.json(
        { error: "doubleId manquant" },
        { status: 400 }
      );
    }

    let messages = [];

    if (conversationId) {
      // Récupérer les messages d'une conversation spécifique
      const result = await pool.query(
        `SELECT id, role, content, audio_url, tokens_used, model_used, created_at
         FROM ai_double_messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`,
        [conversationId]
      );
      messages = result.rows;
    } else {
      // Récupérer la conversation active du user avec ce double
      let conversationResult;

      if (userId) {
        conversationResult = await pool.query(
          `SELECT id FROM ai_double_conversations
           WHERE ai_double_id = $1 AND visitor_id = $2::uuid AND is_active = true
           ORDER BY created_at DESC LIMIT 1`,
          [doubleId, userId]
        );
      } else {
        // Conversation du propriétaire avec son propre double
        conversationResult = await pool.query(
          `SELECT id FROM ai_double_conversations
           WHERE ai_double_id = $1 AND visitor_id IS NULL AND is_active = true
           ORDER BY created_at DESC LIMIT 1`,
          [doubleId]
        );
      }

      if (conversationResult.rows.length > 0) {
        const convId = conversationResult.rows[0].id;
        const result = await pool.query(
          `SELECT id, role, content, audio_url, tokens_used, model_used, created_at
           FROM ai_double_messages
           WHERE conversation_id = $1
           ORDER BY created_at ASC`,
          [convId]
        );
        messages = result.rows;
      }
    }

    return NextResponse.json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        audioUrl: msg.audio_url,
        tokensUsed: msg.tokens_used,
        modelUsed: msg.model_used,
        timestamp: msg.created_at,
      })),
    });
  } catch (error: any) {
    console.error("Erreur API messages:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
