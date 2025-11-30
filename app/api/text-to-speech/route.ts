import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

const VOICE_IDS: { [key: string]: string } = {
  'sophia': 'MUhH6JrtlP5anyo6lI56',
  'emma': 'EXAVITQu4vr4xnSDxMaL',
  'luna': 'ThT5KcBeYPX3keUQqHPh',
};

export async function POST(request: NextRequest) {
  try {
    const { text, creatorId } = await request.json();

    if (!text || !creatorId) {
      return NextResponse.json(
        { error: 'Le texte et l\'ID de la créatrice sont requis' },
        { status: 400 }
      );
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'Clé API ElevenLabs non configurée' },
        { status: 500 }
      );
    }

    const voiceId = VOICE_IDS[creatorId] || VOICE_IDS['sophia'];

    // Générer l'audio avec les options les plus rapides
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      model_id: 'eleven_turbo_v2_5', // Modèle le plus rapide d'ElevenLabs
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0, // Réduit à 0 pour plus de vitesse
        use_speaker_boost: true,
      },
      output_format: 'mp3_22050_32', // Qualité réduite = plus rapide
    });

    // Créer un ReadableStream pour le streaming
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of audioStream) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Retourner le stream directement
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération audio:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération audio' },
      { status: 500 }
    );
  }
}