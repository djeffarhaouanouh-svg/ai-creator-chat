import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@vercel/postgres';
import { localCreators } from '@/data/creators';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API non configurée. Ajoute ANTHROPIC_API_KEY dans .env.local' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, creatorId, userId, mode } = body;

    console.log('📩 Requête reçue:', { 
      creatorId, 
      userId: userId ? `${userId.substring(0, 8)}...` : 'MANQUANT', 
      userIdType: typeof userId,
      messagesCount: messages?.length, 
      mode 
    });

    if (!messages || !creatorId) {
      return NextResponse.json(
        { error: 'messages ou creatorId manquant' },
        { status: 400 }
      );
    }

    // Trouver la créatrice par slug ou id
    const creator = localCreators.find(c => c.slug === creatorId || c.id === creatorId);

    if (!creator) {
      console.error('❌ Créatrice introuvable:', creatorId);
      return NextResponse.json(
        { error: 'Créatrice introuvable' },
        { status: 404 }
      );
    }

    console.log('✅ Créatrice trouvée:', creator.name);

    // Vérifier si l'IA est activée pour cette conversation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID manquant' },
        { status: 400 }
      )
    }

    // Récupérer l'ID UUID de la créatrice depuis la base
    const creatorResult = await sql`
      SELECT id FROM creators WHERE slug = ${creatorId} LIMIT 1
    `

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Créatrice introuvable en base' },
        { status: 404 }
      )
    }

    const creatorUuid = creatorResult.rows[0].id

    // ⛔ CHECK CRITIQUE - BLOQUER SI IA DÉSACTIVÉE
    // Vérifier AVANT TOUT appel à Claude - AUCUNE EXCEPTION

    console.log('🔍 DÉBUT vérification IA - Paramètres:', {
      userId: userId || 'MANQUANT',
      creatorSlug: creatorId,
      creatorUuid: creatorUuid || 'MANQUANT'
    });

    // Requête pour vérifier le statut IA
    let settingsResult;
    let queryError = null;

    try {
      settingsResult = await sql`
        SELECT ai_enabled
        FROM conversation_settings
        WHERE user_id = ${userId}::uuid
          AND creator_id = ${creatorUuid}::uuid
        LIMIT 1
      `

      console.log('✅ Requête settings réussie:', {
        rowsFound: settingsResult.rows.length,
        firstRow: settingsResult.rows[0]
      });
    } catch (error: any) {
      queryError = error;
      console.error('❌ ERREUR requête settings:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      settingsResult = { rows: [] };
    }

    // Log détaillé pour débogage
    console.log('🔍 Résultat vérification IA:', {
      userId: userId ? `${userId.substring(0, 8)}...` : 'MANQUANT',
      creatorUuid: creatorUuid ? `${creatorUuid.substring(0, 8)}...` : 'MANQUANT',
      settingsFound: settingsResult.rows.length > 0,
      aiEnabledValue: settingsResult.rows.length > 0 ? settingsResult.rows[0].ai_enabled : 'N/A',
      aiEnabledType: settingsResult.rows.length > 0 ? typeof settingsResult.rows[0].ai_enabled : 'N/A',
      willBlock: settingsResult.rows.length > 0 && settingsResult.rows[0].ai_enabled === false,
      queryError: queryError ? queryError.message : null
    });

    // Si le setting existe et que ai_enabled est explicitement false → BLOQUER
    if (settingsResult.rows.length > 0) {
      const aiEnabled = settingsResult.rows[0].ai_enabled;

      // Vérifier explicitement si c'est false (pas undefined, pas null)
      if (aiEnabled === false) {
        console.log('🚫🚫🚫 BLOQUAGE CONFIRMÉ - IA explicitement désactivée');
        return NextResponse.json(
          { error: 'L\'IA est désactivée pour cette conversation.' },
          { status: 403 }
        )
      }

      console.log('✅ IA activée (valeur:', aiEnabled, ')');
    } else {
      console.log('⚠️ Aucun setting trouvé - Par défaut activé');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Prompt système simple et efficace
    const systemPrompt = `Tu es ${creator.name}, une créatrice de contenu française chaleureuse et authentique.

Tu réponds de manière naturelle, courte et engageante, comme dans une vraie conversation par messages.
Tu utilises des émojis de temps en temps pour rendre la conversation vivante.
Tu es toujours positive, à l'écoute et tu créés une vraie connexion avec tes abonnés.

Mode actuel : ${mode === 'girlfriend' ? 'Petite copine 💕 - Tu es joueuse, complice et flirty' : mode === 'seductive' ? 'Séduisante 😏 - Tu es taquine, audacieuse et suggestive' : 'Amie 💛 - Tu es naturelle, chaleureuse et relax'}

Réponds toujours en français, de manière courte (2-3 phrases max), et reste dans le personnage de ${creator.name}.`;

    console.log('🤖 Envoi à Claude avec', messages.length, 'messages');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: messages,
    });

    const messageContent = response.content[0];
    const text = messageContent.type === 'text' ? messageContent.text : '';

    console.log('✅ Réponse de Claude:', text.substring(0, 100) + '...');

    return NextResponse.json({
      message: text,
    });

  } catch (error: any) {
    console.error('❌ Erreur API Chat:', error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Clé API invalide. Vérifie ta clé Anthropic.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors du traitement de la requête: ' + error.message },
      { status: 500 }
    );
  }
}
