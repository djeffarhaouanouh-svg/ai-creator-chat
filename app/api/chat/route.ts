import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sql } from '@vercel/postgres';
import { localCreators } from '@/data/creators';
import { detectImageIntent } from '@/lib/imageDetection';
import { imageToBase64 } from '@/lib/imageToBase64';

/**
 * Détecte si l'utilisateur DEMANDE une photo et détermine le type
 */
function detectUserPhotoRequest(text: string): { wantsPhoto: boolean; scenario: string; classification: 'generic' | 'personal' } | null {
  const lowerText = text.toLowerCase();

  // Photos de CHOSES (nourriture, lieux, objets) - PRIORITÉ
  if (lowerText.includes('plat') || lowerText.includes('nourriture') || lowerText.includes('bouffe') || lowerText.includes('repas')) {
    return {
      wantsPhoto: true,
      scenario: 'a delicious healthy meal on a plate, food photography, restaurant quality, overhead shot, natural lighting',
      classification: 'generic'
    };
  }

  if (lowerText.includes('lieu') || lowerText.includes('endroit') || lowerText.includes('où tu es')) {
    return {
      wantsPhoto: true,
      scenario: 'beautiful place, scenic view, lifestyle photography',
      classification: 'generic'
    };
  }

  // Photos PERSONNELLES (selfie, tenue, etc.)
  const personalPhrases = [
    'photo de toi',
    'selfie',
    'ta tenue',
    'ton look',
    'ta robe',
    'ton outfit',
    'comment tu es',
    'à quoi tu ressembles'
  ];

  if (personalPhrases.some(phrase => lowerText.includes(phrase))) {
    return {
      wantsPhoto: true,
      scenario: 'taking a mirror selfie with phone, wearing casual stylish outfit, indoor natural lighting, smiling at camera',
      classification: 'personal'
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API non configurée. Ajoute OPENAI_API_KEY dans .env.local' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, creatorId, userId, mode, userImage } = body;

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prompt système simple et efficace
    const systemPrompt = `Tu es ${creator.name}, une créatrice de contenu française chaleureuse et authentique.

Tu réponds de manière naturelle, courte et engageante, comme dans une vraie conversation par messages.
Tu utilises des émojis de temps en temps pour rendre la conversation vivante.
Tu es toujours positive, à l'écoute et tu créés une vraie connexion avec tes abonnés.

Mode actuel : ${mode === 'girlfriend' ? 'Petite copine 💕 - Tu es joueuse, complice et flirty' : mode === 'seductive' ? 'Séduisante 😏 - Tu es taquine, audacieuse et suggestive' : 'Amie 💛 - Tu es naturelle, chaleureuse et relax'}

Réponds toujours en français, de manière courte (2-3 phrases max), et reste dans le personnage de ${creator.name}.`;

    console.log('🤖 Envoi à GPT avec', messages.length, 'messages');

    // NOUVELLE APPROCHE : Détecter si l'utilisateur DEMANDE une photo
    const lastUserMessage = messages[messages.length - 1];
    const photoRequest = lastUserMessage?.role === 'user' ? detectUserPhotoRequest(lastUserMessage.content) : null;

    let preGeneratedImageUrl = null;

    if (photoRequest?.wantsPhoto) {
      console.log('📸 Utilisateur demande une photo -', photoRequest.classification, '- Génération AVANT Claude...');
      try {
        const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            creatorId,
            scenario: photoRequest.scenario,
            classification: photoRequest.classification
          })
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          preGeneratedImageUrl = imageData.imageUrl;
          console.log('✅ Image pré-générée:', preGeneratedImageUrl);
        }
      } catch (error: any) {
        console.error('❌ Erreur pré-génération image:', error.message);
      }
    }

    // SYSTÈME DE MÉMOIRE INTELLIGENT : Résumé + Messages récents
    const RECENT_MESSAGES_LIMIT = 20; // Garder les 20 derniers messages complets

    let contextMessages: any[] = [];

    if (messages.length > RECENT_MESSAGES_LIMIT) {
      // Séparer vieux messages (à résumer) et récents (à garder complets)
      const oldMessages = messages.slice(0, messages.length - RECENT_MESSAGES_LIMIT);
      const recentMessages = messages.slice(-RECENT_MESSAGES_LIMIT);

      // Créer un résumé des vieux messages
      const summary = oldMessages.map((m: any, i: number) =>
        `${i % 2 === 0 ? 'User' : creator.name}: ${m.content?.substring(0, 50)}...`
      ).join(' | ');

      const contextSummary = {
        role: 'system',
        content: `📋 Résumé de la conversation précédente (${oldMessages.length} messages) :\n${summary}\n\n---\nConversation récente ci-dessous :`
      };

      // Construire les messages récents complets avec support multimodal
      const recentGptMessages = recentMessages.map((m: any) => {
        if (m.image_url) {
          // Message avec image - Format multimodal GPT-4o
          const imageUrl = m.image_url.startsWith('http')
            ? m.image_url
            : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}${m.image_url}`;

          return {
            role: m.role,
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              },
              {
                type: 'text',
                text: m.content || 'Regarde cette image'
              }
            ]
          };
        }

        // Message texte simple
        return {
          role: m.role,
          content: m.content
        };
      });

      contextMessages = [contextSummary, ...recentGptMessages];
      console.log(`📨 Mémoire optimisée: ${oldMessages.length} messages résumés + ${recentMessages.length} récents`);
    } else {
      // Si moins de 20 messages, envoyer tout avec support multimodal
      contextMessages = messages.map((m: any) => {
        if (m.image_url) {
          // Message avec image - Format multimodal GPT-4o
          const imageUrl = m.image_url.startsWith('http')
            ? m.image_url
            : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}${m.image_url}`;

          return {
            role: m.role,
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              },
              {
                type: 'text',
                text: m.content || 'Regarde cette image'
              }
            ]
          };
        }

        // Message texte simple
        return {
          role: m.role,
          content: m.content
        };
      });
      console.log('📨 Messages complets:', contextMessages.length, 'messages');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        ...contextMessages
      ],
      temperature: 0.9,
    });

    let text = response.choices[0]?.message?.content || '';

    console.log('✅ Réponse de GPT (brute):', text.substring(0, 100) + '...');

    // POST-TRAITEMENT : Si on a généré une image mais GPT refuse, corriger sa réponse
    if (preGeneratedImageUrl) {
      const refusalPhrases = [
        'je ne peux pas envoyer',
        'je ne peux pas partager',
        'je ne peux pas',
        'impossible d\'envoyer',
        'pas possible d\'envoyer',
        'je n\'ai pas de photos',
        'je ne partage pas mes photos'
      ];

      const hasRefusal = refusalPhrases.some(phrase => text.toLowerCase().includes(phrase));

      if (hasRefusal) {
        const positiveResponses = [
          'Voici une photo de moi ! 💕',
          'Tiens, regarde cette photo ! ✨',
          'Je t\'envoie une photo ! 😊',
          'Voilà pour toi ! 💖',
          'Check ça ! 🌟'
        ];
        text = positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
        console.log('🔄 Réponse corrigée (refus détecté avec image) →', text);
      }
    }

    let finalImageUrl = preGeneratedImageUrl; // Image déjà générée si user a demandé

    // Si pas d'image pré-générée, vérifier si GPT parle de quelque chose de visuel
    if (!finalImageUrl) {
      const imageIntent = detectImageIntent(text, messages.slice(-5));

      if (imageIntent.shouldGenerateImage && imageIntent.confidence > 0.7) {
        try {
          console.log('🎨 GPT mentionne quelque chose de visuel, génération...');
          const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              creatorId,
              scenario: imageIntent.scenario,
              classification: imageIntent.classification
            })
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            finalImageUrl = imageData.imageUrl;
            console.log('✅ Image générée:', finalImageUrl);
          } else {
            const errorData = await imageResponse.json();
            console.warn('⚠️ Génération refusée:', errorData.error);
          }
        } catch (error: any) {
          console.error('❌ Erreur génération image:', error.message);
        }
      }
    }

    return NextResponse.json({
      message: text,
      imageUrl: finalImageUrl
    });

  } catch (error: any) {
    console.error('❌ Erreur API Chat:', error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Clé API invalide. Vérifie ta clé OpenAI.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors du traitement de la requête: ' + error.message },
      { status: 500 }
    );
  }
}
