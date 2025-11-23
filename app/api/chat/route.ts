import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCreatorById } from '@/data/creators';

export async function POST(request: NextRequest) {
  try {
    // Vérifier que la clé API existe
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API non configurée. Ajoute ANTHROPIC_API_KEY dans .env.local' },
        { status: 500 }
      );
    }

    // Initialiser le client Anthropic avec la clé depuis .env.local
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const { creatorId, messages } = await request.json();

    // Récupérer les infos de la créatrice
    const creator = getCreatorById(creatorId);
    if (!creator) {
      return NextResponse.json(
        { error: 'Créatrice introuvable' },
        { status: 404 }
      );
    }

    // Préparer les messages pour Claude
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Appeler l'API Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: creator.aiPrompt,
      messages: formattedMessages,
    });

    // Extraire le texte de la réponse
    const messageContent = response.content[0];
    const text = messageContent.type === 'text' ? messageContent.text : '';

    return NextResponse.json({ message: text });
  } catch (error: any) {
    console.error('Erreur API Chat:', error);
    
    // Messages d'erreur plus clairs
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
