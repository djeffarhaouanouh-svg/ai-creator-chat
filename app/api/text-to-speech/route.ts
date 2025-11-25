export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';

// Initialiser le client ElevenLabs
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY ?? '',
});

// Voix pour chaque créatrice
const VOICE_IDS: Record<string, string> = {
  sophia: 'XB0fDUnXU5powFXDhCwa', // exemple
  emma: 'piTKgcLEGmPE4e6mEKli', // exemple
  luna: 'g5CIjZEefAph4nQFvHAz', // exemple
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string | undefined = body?.text;
    const model: string | undefined = body?.model;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing text' },
        { status: 400 },
      );
    }

    const voiceId =
      (model && VOICE_IDS[model as keyof typeof VOICE_IDS]) ||
      VOICE_IDS.sophia;

    // Appel ElevenLabs
    const audio: AsyncIterable<Uint8Array> | any =
      await elevenlabs.textToSpeech.convert(voiceId, {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      } as any);

    // On lit le stream et on crée un buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // On renvoie du base64 au front
    return NextResponse.json(
      {
        audio: audioBuffer.toString('base64'),
        contentType: 'audio/mpeg',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Erreur lors de la génération audio:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération audio' },
      { status: 500 },
    );
  }
}
