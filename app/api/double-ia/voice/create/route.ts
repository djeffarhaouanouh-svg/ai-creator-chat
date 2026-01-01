import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { ElevenLabsClient } from "elevenlabs";

/**
 * API de clonage vocal avec ElevenLabs
 *
 * Utilise l'API ElevenLabs pour créer une voix clonée à partir d'échantillons audio
 *
 * Documentation ElevenLabs:
 * https://elevenlabs.io/docs/api-reference/add-voice
 */

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFiles: { file: File; text: string; type: string }[] = [];

    // Extraire les fichiers audio et métadonnées
    const audioEntries = Array.from(formData.entries()).filter(([key]) =>
      key.startsWith("audio_")
    );

    for (const [key, file] of audioEntries) {
      if (!(file instanceof File)) continue;

      const phraseId = key.replace("audio_", "");
      const text = formData.get(`text_${phraseId}`) as string;
      const type = formData.get(`type_${phraseId}`) as string;

      audioFiles.push({ file, text, type });
    }

    if (audioFiles.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier audio fourni" },
        { status: 400 }
      );
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "Clé API ElevenLabs non configurée" },
        { status: 500 }
      );
    }

    // Upload des fichiers audio sur Vercel Blob (pour historique)
    const uploadedUrls: string[] = [];
    for (const { file } of audioFiles) {
      try {
        const blob = await put(
          `ai-doubles/voice-samples/${Date.now()}-${file.name}`,
          file,
          { access: "public" }
        );
        uploadedUrls.push(blob.url);
      } catch (err) {
        console.error("Erreur upload audio:", err);
      }
    }

    // Préparer les fichiers audio pour ElevenLabs
    const audioData: { file: File; label: string }[] = audioFiles.map(({ file, text }) => ({
      file,
      label: text,
    }));

    // Créer une voix custom avec ElevenLabs
    try {
      const voiceName = `DoubleIA_${Date.now()}`;

      // Préparer le FormData pour l'API ElevenLabs
      const elevenLabsFormData = new FormData();
      elevenLabsFormData.append("name", voiceName);
      elevenLabsFormData.append("description", "Voix clonée pour Double IA");

      // Ajouter les fichiers audio
      for (let i = 0; i < audioData.length; i++) {
        const { file, label } = audioData[i];
        // Convertir le File en Blob pour ElevenLabs
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type || "audio/mpeg" });
        elevenLabsFormData.append("files", blob, file.name || `sample_${i}.mp3`);
        elevenLabsFormData.append("labels", label);
      }

      // Appeler l'API ElevenLabs pour créer la voix
      const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        },
        body: elevenLabsFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error("Erreur ElevenLabs:", errorData);
        throw new Error(`ElevenLabs API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const voiceId = data.voice_id;

      return NextResponse.json({
        success: true,
        voiceId,
        voiceName,
        samplesCount: audioFiles.length,
        uploadedUrls,
        message: "Voix clonée avec succès",
      });
    } catch (elevenLabsError: any) {
      console.error("Erreur lors du clonage vocal:", elevenLabsError);

      // En cas d'erreur, retourner un mock pour ne pas bloquer l'onboarding
      const mockVoiceId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockVoiceName = `MockVoice_${new Date().getTime()}`;

      return NextResponse.json({
        success: true,
        voiceId: mockVoiceId,
        voiceName: mockVoiceName,
        samplesCount: audioFiles.length,
        uploadedUrls,
        message: "Voix créée (mode fallback)",
        warning: "Le clonage vocal a échoué, un ID mock a été généré",
      });
    }
  } catch (error: any) {
    console.error("Erreur API voice/create:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
