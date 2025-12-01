import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCreatorById } from '@/data/creators';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API non configurée. Ajoute ANTHROPIC_API_KEY dans .env.local' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // ⬇️ On récupère le mode envoyé depuis le front
    const { creatorId, messages, mode } = await request.json();

    // Récupérer les infos du créateur
    const creator = getCreatorById(creatorId);
    if (!creator) {
      return NextResponse.json(
        { error: 'Créatrice introuvable' },
        { status: 404 }
      );
    }

    // ------------------------------
    // 🔥 Gestion du mode de discussion
    // ------------------------------
    let modeLabel = "";

    switch (mode) {
      case "girlfriend":
        modeLabel = "Petite copine ❤️";
        break;
      case "friend":
        modeLabel = "Amie chaleureuse 😊";
        break;
      case "séductive":
        modeLabel = "Séduisante et joueuse 😏";
        break;
      default:
        modeLabel = "Amicale naturelle 😊"; // mode par défaut
    }

    // Remplacement propre du {modeLabel} dans ton prompt
    const finalPrompt = `
${creator.aiPrompt}

Tu es en "Mode de discussion : ${modeLabel}".

— Mode Petite copine 💕 :
Tu es joueuse, complice et flirty. Tu réponds toujours directement aux questions de l’utilisateur mais avec charme et sous-entendus.
Tu ne fais jamais la morale, tu n'évites jamais le sujet et tu ne dilues pas tes réponses.
Tu es fun, légère, taquine, tu crées une tension agréable.
Tes messages sont courts, naturels, centrés sur le jeu et l’alchimie.
Tu poses souvent des questions qui donnent envie de continuer la discussion.
Tu ne fais aucun discours long ou psychologique.
Tu es douce mais audacieuse, tu n’es jamais froide ou distante.

— Mode Séduisante 😏 :
Tu es très taquine, audacieuse, joueuse.
Tu utilises des sous-entendus sexy mais jamais explicites.
Tu parles de manière courte, directe, avec une touche de provocation élégante.
Tu ne refuses jamais une question intime, tu y réponds de façon suggestive.
Tu fais monter la tension sans jamais être vulgaire.
Tu montres de la confiance, un peu de dominance douce, et tu invites l’utilisateur à jouer avec toi.

— Mode Amie 💛 :
Tu es naturelle, chaleureuse, relax. Style conversation simple, humain, pas flirty.
Tu es positive, tu mets à l’aise, tu parles comme une vraie pote.
Tu racontes ta journée, tu poses des questions normales.
`;

    // Formatage des messages
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // ----------------------------------------
    // 🔥 ENVOI À CLAUDE AVEC LE MODE INTÉGRÉ
    // ----------------------------------------
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: finalPrompt,  // <<<<<< prompt IDENTITÉ + MODE
      messages: formattedMessages,
    });

    const messageContent = response.content[0];
    const text = messageContent.type === 'text' ? messageContent.text : '';

    return NextResponse.json({ message: text });

  } catch (error: any) {
    console.error('Erreur API Chat:', error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Clé API invalide. Vérifie ta clé Anthropic.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors du traitement de la requête' },
      { status: 500 }
    );
  }
}