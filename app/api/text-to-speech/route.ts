import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

// Initialiser le client ElevenLabs
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

// Voix françaises NATIVES pour chaque créatrice
// IMPORTANT : Ces IDs sont des exemples. Allez sur https://elevenlabs.io/voice-library
// Filtrez par langue "French" et copiez les IDs des voix qui vous plaisent
const VOICE_IDS: { [key: string]: string } = {
  // Voix française de qualité - À REMPLACER par vos choix
  'sophia': 'XB0fDUnXU5powFXDhCwa', // Charlotte - Voix féminine française douce
  'emma': 'piTKgcLEGmPE4e6mEKli', // Nicole - Voix féminine française expressive  
  'luna': 'g5CIjZEefAph4nQFvHAz', // Matilda - Voix féminine française énergique
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

    // Sélectionner la voix en fonction de la créatrice
    const voiceId = VOICE_IDS[creatorId] || VOICE_IDS['sophia'];

    // Générer l'audio avec ElevenLabs
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    });

    // Convertir le stream en buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Retourner l'audio en base64
    return NextResponse.json({
      audio: audioBuffer.toString('base64'),
      contentType: 'audio/mpeg',
    });
  } catch (error) {
    console.error('Erreur lors de la génération audio:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération audio' },
      { status: 500 }
    );
  }
}
