import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
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
    const { messages, creatorId, mode } = body;

    console.log('📩 Requête reçue:', { creatorId, messagesCount: messages?.length, mode });

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
