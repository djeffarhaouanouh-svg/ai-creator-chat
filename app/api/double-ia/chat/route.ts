import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import OpenAI from "openai";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * API de chat avec le double IA
 *
 * Utilise le prompt système généré lors de la création du double
 * pour répondre en imitant le style et la personnalité de l'utilisateur
 *
 * Sauvegarde automatiquement les conversations en base de données
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const { doubleId, message, history = [], userId, conversationId } = await request.json();

    if (!doubleId || !message) {
      client.release();
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Récupérer le prompt système du double
    const doubleResult = await client.query(
      `SELECT system_prompt, user_id FROM ai_doubles WHERE id = $1`,
      [doubleId]
    );

    if (doubleResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: "Double IA non trouvé" },
        { status: 404 }
      );
    }

    const systemPrompt = doubleResult.rows[0].system_prompt;
    const doubleOwnerId = doubleResult.rows[0].user_id;

    // Préparer les messages pour OpenAI
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Ajouter l'historique (limité aux 10 derniers messages pour économiser les tokens)
    const recentHistory = history.slice(-10);
    messages.push(...recentHistory);

    // Ajouter le nouveau message
    messages.push({ role: "user", content: message });

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modèle rapide et économique
      messages: messages as any,
      temperature: 0.9, // Plus créatif pour mieux imiter la personnalité
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content || "Hmm... 🤔";
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Sauvegarder la conversation en DB
    let finalConversationId = conversationId;

    try {
      await client.query('BEGIN');

      // Si pas de conversationId fourni, créer ou récupérer la conversation active
      if (!finalConversationId) {
        // Chercher une conversation active existante pour ce double + user
        let conversationResult;

        if (userId) {
          conversationResult = await client.query(
            `SELECT id FROM ai_double_conversations
             WHERE ai_double_id = $1 AND visitor_id = $2::uuid AND is_active = true
             ORDER BY created_at DESC LIMIT 1`,
            [doubleId, userId]
          );
        } else {
          // Conversation du propriétaire avec son propre double
          conversationResult = await client.query(
            `SELECT id FROM ai_double_conversations
             WHERE ai_double_id = $1 AND visitor_id IS NULL AND is_active = true
             ORDER BY created_at DESC LIMIT 1`,
            [doubleId]
          );
        }

        if (conversationResult.rows.length > 0) {
          finalConversationId = conversationResult.rows[0].id;
        } else {
          // Créer une nouvelle conversation
          const newConvResult = await client.query(
            `INSERT INTO ai_double_conversations (ai_double_id, visitor_id, is_active, last_message_at)
             VALUES ($1, $2, true, NOW())
             RETURNING id`,
            [doubleId, userId || null]
          );
          finalConversationId = newConvResult.rows[0].id;
        }
      }

      // Sauvegarder le message de l'utilisateur
      await client.query(
        `INSERT INTO ai_double_messages (conversation_id, role, content, created_at)
         VALUES ($1, 'user', $2, NOW())`,
        [finalConversationId, message]
      );

      // Sauvegarder la réponse de l'assistant
      await client.query(
        `INSERT INTO ai_double_messages (conversation_id, role, content, tokens_used, model_used, created_at)
         VALUES ($1, 'assistant', $2, $3, $4, NOW())`,
        [finalConversationId, response, tokensUsed, 'gpt-4o-mini']
      );

      // Mettre à jour le compteur de messages de la conversation
      await client.query(
        `UPDATE ai_double_conversations
         SET message_count = message_count + 2,
             last_message_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [finalConversationId]
      );

      // Mettre à jour les stats du double
      await client.query(
        `UPDATE ai_doubles
         SET total_messages = total_messages + 2
         WHERE id = $1`,
        [doubleId]
      );

      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Erreur sauvegarde conversation:', dbError);
      // On ne bloque pas la réponse même si la sauvegarde échoue
    }

    client.release();

    return NextResponse.json({
      success: true,
      response,
      tokensUsed,
      conversationId: finalConversationId,
    });
  } catch (error: any) {
    client.release();
    console.error("Erreur API chat:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
