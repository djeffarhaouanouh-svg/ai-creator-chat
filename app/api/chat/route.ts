import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sql } from '@vercel/postgres';
import { localCreators } from '@/data/creators';
import { detectImageIntent } from '@/lib/imageDetection';
import { imageToBase64 } from '@/lib/imageToBase64';

/**
 * Détecte si l'user demande quelque chose qui nécessite une photo
 */
function detectPhotoNeed(message: string): boolean {
  const lower = message.toLowerCase();

  // Mots-clés pour nourriture/boisson/activités
  const keywords = [
    'mangé', 'mange', 'manger', 'bouffe', 'repas', 'plat', 'déjeuner', 'dîner',
    'bu', 'boire', 'boisson',
    'fait', 'fais', 'faire',
    'photo', 'montre', 'voir'
  ];

  // Détection simple : message contient "quoi" ou "qu'" + un mot-clé
  const hasQuestion = lower.includes('quoi') || lower.includes('qu\'') || lower.includes('?');
  const hasKeyword = keywords.some(k => lower.includes(k));

  return hasQuestion && hasKeyword;
}

/**
 * Détermine la catégorie selon le message utilisateur
 */
function getCategoryFromUserMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('mange') || lower.includes('repas') || lower.includes('bouffe')) {
    return 'food';
  }
  if (lower.includes('bois') || lower.includes('boisson')) {
    return 'drinks';
  }
  if (lower.includes('dessert') || lower.includes('gâteau')) {
    return 'desserts';
  }
  if (lower.includes('fais') || lower.includes('activité')) {
    return 'activities';
  }
  if (lower.includes('es') || lower.includes('lieu') || lower.includes('où')) {
    return 'places';
  }

  return 'food';
}

/**
 * Détecte un plat spécifique dans la réponse de DeepSeek
 */
function detectSpecificFood(response: string): string | null {
  const lower = response.toLowerCase();

  // Liste des plats avec leurs variations
  const foods: { [key: string]: string[] } = {
    'tacos': ['tacos', 'taco'],
    'burger': ['burger', 'hamburger'],
    'pizza': ['pizza'],
    'pasta': ['pasta', 'pâtes', 'spaghetti'],
    'salad': ['salad', 'salade'],
    'sushi': ['sushi'],
    'ramen': ['ramen'],
    'sandwich': ['sandwich'],
  };

  // Chercher le premier plat mentionné
  for (const [food, variations] of Object.entries(foods)) {
    if (variations.some(v => lower.includes(v))) {
      return food;
    }
  }

  return null;
}

/**
 * Sélectionne une photo aléatoire du dossier
 */
async function selectRandomPhoto(category: string): Promise<string | null> {
  const { readdir } = await import('fs/promises');
  const { join } = await import('path');

  const photosDir = join(process.cwd(), 'public', 'photos', category);

  try {
    let photoFiles = await readdir(photosDir);
    photoFiles = photoFiles.filter(file =>
      file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
    );

    if (photoFiles.length === 0) {
      throw new Error(`Aucune photo dans ${category}`);
    }

    const randomIndex = Math.floor(Math.random() * photoFiles.length);
    const selectedPhoto = photoFiles[randomIndex];

    return `/photos/${category}/${selectedPhoto}`;
  } catch (error) {
    console.error(`Erreur lecture photos: ${error}`);
    return null;
  }
}

/**
 * Liste les plats disponibles dans le dossier food
 */
async function getAvailableFoods(): Promise<string[]> {
  const { readdir } = await import('fs/promises');
  const { join } = await import('path');

  const photosDir = join(process.cwd(), 'public', 'photos', 'food');

  try {
    let photoFiles = await readdir(photosDir);
    photoFiles = photoFiles.filter(file =>
      file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
    );

    // Extraire les noms des plats (enlever l'extension)
    return photoFiles.map(file => {
      const name = file.split('.')[0];
      return name.toLowerCase();
    });
  } catch (error) {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérification désactivée temporairement pour debug
    /*
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API non configurée. Ajoute DEEPSEEK_API_KEY dans .env.local' },
        { status: 500 }
      );
    }
    */

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

    // 🔒 SÉCURITÉ : Empêcher 2 photos consécutives de l'assistant
    const lastAssistantMsg = await sql`
      SELECT image_url
      FROM messages
      WHERE user_id = ${userId}
        AND creator_id = ${creatorUuid}
        AND role = 'assistant'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const canSendImage = !(lastAssistantMsg.rows.length > 0 && lastAssistantMsg.rows[0].image_url);

    console.log('🖼️ Vérification photo précédente:', {
      lastMsgHadImage: lastAssistantMsg.rows.length > 0 && !!lastAssistantMsg.rows[0].image_url,
      canSendImage
    });

    if (!canSendImage) {
      console.log('🚫 Envoi d\'image bloqué - le dernier message contenait déjà une image');
    }

    // Instances pour DeepSeek et GPT-4o
    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });

    const gpt = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Récupérer les plats disponibles pour que l'IA ne mente pas
    const availableFoods = await getAvailableFoods();
    const foodList = availableFoods.length > 0
      ? `\n\nIMPORTANT: Si on te demande ce que tu as mangé, tu DOIS répondre uniquement avec un de ces plats (tu as des photos pour eux): ${availableFoods.join(', ')}`
      : '';

    // Prompt système simple et efficace
    const systemPrompt = `Tu es ${creator.name}, une créatrice de contenu française chaleureuse et authentique.

Tu réponds de manière naturelle, courte et engageante, comme dans une vraie conversation par messages.
Tu utilises des émojis de temps en temps pour rendre la conversation vivante.
Tu es toujours positive, à l'écoute et tu créés une vraie connexion avec tes abonnés.

IMPORTANT - IMAGES :
- Quand tu reçois une image, REGARDE-LA et commente ce que tu vois de manière naturelle et engageante
- Décris ce que tu vois, pose des questions, réagis avec enthousiasme
- Tu peux envoyer des photos de plats, de lieux, ou de toi (selfies, tenues, activités)
- Sois DIRECTE et NATURELLE quand tu parles des images, pas besoin de t'excuser ou de te justifier

Mode actuel : ${mode === 'girlfriend' ? 'Petite copine 💕 - Tu es joueuse, complice et flirty' : mode === 'seductive' ? 'Séduisante 😏 - Tu es taquine, audacieuse et suggestive' : 'Amie 💛 - Tu es naturelle, chaleureuse et relax'}${foodList}

Réponds toujours en français, de manière courte (2-3 phrases max), et reste dans le personnage de ${creator.name}.`;


    // Filtrer les messages avec des URLs localhost invalides
    const validMessages = messages.map((m: any) => {
      if (m.image_url && !m.image_url.startsWith('http')) {
        // URL relative invalide → retirer l'image
        return { ...m, image_url: undefined };
      }
      if (m.image_url && m.image_url.includes('localhost')) {
        // URL localhost → retirer l'image
        return { ...m, image_url: undefined };
      }
      return m;
    });

    // SYSTÈME DE MÉMOIRE INTELLIGENT : Résumé + Messages récents + IMAGES CONSERVÉES
    const RECENT_MESSAGES_LIMIT = 20; // Garder les 20 derniers messages complets

    let contextMessages: any[] = [];

    if (validMessages.length > RECENT_MESSAGES_LIMIT) {
      // Séparer vieux messages et récents
      const allOldMessages = validMessages.slice(0, validMessages.length - RECENT_MESSAGES_LIMIT);
      const recentMessages = validMessages.slice(-RECENT_MESSAGES_LIMIT);

      // Parmi les vieux, séparer ceux avec images (à garder) et sans images (à résumer)
      const oldMessagesWithImages = allOldMessages.filter((m: any) => m.image_url);
      const oldMessagesToSummarize = allOldMessages.filter((m: any) => !m.image_url);

      // Créer un résumé des vieux messages SANS images
      const summary = oldMessagesToSummarize.map((m: any, i: number) =>
        `${i % 2 === 0 ? 'User' : creator.name}: ${m.content?.substring(0, 50)}...`
      ).join(' | ');

      const contextSummary = {
        role: 'system',
        content: `📋 Résumé de la conversation précédente (${oldMessagesToSummarize.length} messages) :\n${summary}\n\n---\nImages et conversation récente ci-dessous :`
      };

      // Fonction pour convertir un message - Format OpenAI pour GPT-4o Vision
      const toGptMessage = (m: any) => {
        if (m.image_url) {
          // Format OpenAI pour GPT-4o Vision
          return {
            role: m.role,
            content: [
              { type: 'text', text: m.content || 'Regarde cette image' },
              { type: 'image_url', image_url: { url: m.image_url } }
            ]
          };
        }
        return {
          role: m.role,
          content: m.content || 'Message'
        };
      };

      // Construire: vieilles images + messages récents (qui peuvent aussi contenir des images)
      const oldImagesGpt = oldMessagesWithImages.map(toGptMessage);
      const recentGptMessages = recentMessages.map(toGptMessage);

      contextMessages = [contextSummary, ...oldImagesGpt, ...recentGptMessages];
      console.log(`📨 Mémoire optimisée: ${oldMessagesToSummarize.length} résumés + ${oldMessagesWithImages.length} vieilles images + ${recentMessages.length} récents`);
    } else {
      // Si moins de 20 messages, envoyer tout avec support des images (GPT-4o Vision)
      contextMessages = validMessages.map((m: any) => {
        if (m.image_url) {
          // Format OpenAI pour GPT-4o Vision
          return {
            role: m.role,
            content: [
              { type: 'text', text: m.content || 'Regarde cette image' },
              { type: 'image_url', image_url: { url: m.image_url } }
            ]
          };
        }
        return {
          role: m.role,
          content: m.content || 'Message'
        };
      });
      console.log('📨 Messages complets:', contextMessages.length, 'messages');
    }

    // NOUVEAU FLUX: Sélection photo AVANT appel DeepSeek
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const shouldSelectPhoto = detectPhotoNeed(lastUserMessage);

    let selectedPhotoUrl: string | null = null;

    // Vérifier si on a déjà parlé de nourriture dans les 3 derniers messages de l'assistant
    const recentAssistantMessages = messages
      .filter((m: any) => m.role === 'assistant')
      .slice(-3);

    const alreadyTalkedAboutFood = recentAssistantMessages.some((m: any) => {
      const content = m.content?.toLowerCase() || '';
      return content.includes('mangé') || content.includes('burger') || content.includes('tacos') ||
             content.includes('pizza') || content.includes('plat') || content.includes('repas');
    });

    if (shouldSelectPhoto && canSendImage && !alreadyTalkedAboutFood) {
      console.log('📸 Photo demandée - envoi...');

      // Déterminer la catégorie
      const category = getCategoryFromUserMessage(lastUserMessage);

      // Sélectionner photo aléatoire
      selectedPhotoUrl = await selectRandomPhoto(category);

      if (selectedPhotoUrl) {
        console.log(`📸 Photo sélectionnée: ${selectedPhotoUrl} (catégorie: ${category})`);

        // DeepSeek ne supporte PAS le format image_url
        // Solution: Dire à DeepSeek ce qu'il a mangé selon le nom du fichier
        const fileName = selectedPhotoUrl.split('/').pop() || '';
        const foodName = fileName.split('.')[0]; // "Tacos.jpg" -> "Tacos"

        contextMessages.push({
          role: 'system',
          content: `IMPORTANT: Tu viens de manger ${foodName} (ignore ce que tu as dit avant). Réponds de manière naturelle et enthousiaste en parlant de ${foodName} !`
        });

        console.log(`🍽️ DeepSeek informé: ${foodName}`);
      }
    } else if (shouldSelectPhoto && !canSendImage) {
      console.log('🚫 Photo demandée mais bloquée (dernier message avait déjà une image)');
    } else if (shouldSelectPhoto && alreadyTalkedAboutFood) {
      console.log('🚫 Photo demandée mais bloquée (a déjà parlé de nourriture récemment)');
    }

    // Détecter s'il y a des images dans les messages
    const hasImages = validMessages.some((m: any) => m.image_url);

    console.log(`🤖 ${hasImages ? 'GPT-4o (images détectées)' : 'DeepSeek'} avec ${messages.length} messages`);

    // Utiliser GPT-4o si images, sinon DeepSeek
    const client = hasImages ? gpt : deepseek;
    const model = hasImages ? 'gpt-4o' : 'deepseek-chat';

    const response = await client.chat.completions.create({
      model: model,
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        ...contextMessages
      ],
      temperature: 0.9,
    });

    let text = response.choices[0]?.message?.content || '';

    console.log(`✅ Réponse de ${hasImages ? 'GPT-4o' : 'DeepSeek'} (brute):`, text.substring(0, 100) + '...');

    // POST-TRAITEMENT : Détecter et corriger les refus de GPT
    const lastUserMsg = validMessages[validMessages.length - 1];
    const userSentImage = lastUserMsg?.image_url;

    const refusalPhrases = [
      'je ne peux pas envoyer',
      'je ne peux pas partager',
      'je ne peux pas voir',
      'je ne vois pas',
      'impossible d\'envoyer',
      'pas possible d\'envoyer',
      'je n\'ai pas de photos',
      'je ne partage pas mes photos',
      'en tant qu\'intelligence artificielle',
      'en tant qu\'ia',
      'je suis une ia'
    ];

    const hasRefusal = refusalPhrases.some(phrase => text.toLowerCase().includes(phrase));

    if (hasRefusal) {
      // Si l'utilisateur nous a envoyé une image
      if (userSentImage) {
        const naturalResponses = [
          'Super photo ! 😊 J\'adore ce que je vois !',
          'Oh j\'aime bien ! 💕',
          'Sympa cette image ! ✨',
          'Cool ! 🌟',
          'Nice ! 💖'
        ];
        text = naturalResponses[Math.floor(Math.random() * naturalResponses.length)];
        console.log('🔄 Réponse corrigée (refus détecté - image reçue) →', text);
      }
    }

    // Détection de plats spécifiques dans la réponse de DeepSeek
    let finalImageUrl = selectedPhotoUrl;

    // Si DeepSeek mentionne un plat spécifique, envoyer la photo correspondante
    const specificFood = detectSpecificFood(text);

    if (specificFood && !selectedPhotoUrl && canSendImage) {
      try {
        console.log('🍽️ DeepSeek mentionne:', specificFood);
        const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/images/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            creatorId,
            scenario: specificFood,
            classification: 'generic',
            specificItem: specificFood
          })
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          finalImageUrl = imageData.imageUrl;
          console.log('✅ Photo envoyée:', finalImageUrl);
        }
      } catch (error: any) {
        console.error('❌ Erreur sélection photo:', error.message);
      }
    } else if (specificFood && !canSendImage) {
      console.log('🚫 DeepSeek mentionne un plat mais envoi bloqué (dernier message avait déjà une image)');
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
