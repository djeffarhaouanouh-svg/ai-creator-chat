import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import vision from "@google-cloud/vision";

/**
 * API d'analyse du style d'écriture à partir de captures d'écran
 *
 * Utilise Google Cloud Vision API pour l'OCR
 */

// Initialiser le client Vision avec les credentials
const client = new vision.ImageAnnotatorClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const screenshots: File[] = [];

    // Récupérer tous les fichiers
    for (const [key, value] of formData.entries()) {
      if (key === "screenshots" && value instanceof File) {
        screenshots.push(value);
      }
    }

    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: "Aucune capture d'écran fournie" },
        { status: 400 }
      );
    }

    // Upload des captures sur Vercel Blob (pour historique)
    const uploadedUrls: string[] = [];
    for (const screenshot of screenshots) {
      try {
        const blob = await put(
          `ai-doubles/screenshots/${Date.now()}-${screenshot.name}`,
          screenshot,
          { access: "public" }
        );
        uploadedUrls.push(blob.url);
      } catch (err) {
        console.error("Erreur upload screenshot:", err);
      }
    }

    // Extraire le texte de toutes les images avec Google Vision API
    const allExtractedTexts: string[] = [];

    for (const screenshot of screenshots) {
      try {
        const text = await extractTextFromImage(screenshot);
        if (text) {
          allExtractedTexts.push(text);
        }
      } catch (error) {
        console.error("Erreur OCR pour une image:", error);
      }
    }

    if (allExtractedTexts.length === 0) {
      return NextResponse.json(
        { error: "Impossible d'extraire du texte des images" },
        { status: 400 }
      );
    }

    // Parser les messages individuels depuis le texte extrait
    const messages = parseMessagesFromText(allExtractedTexts.join("\n"));

    // Analyser le style
    const styleRules = analyzeWritingStyle(messages);

    return NextResponse.json({
      success: true,
      screenshotsCount: screenshots.length,
      uploadedUrls,
      messagesExtracted: messages.length,
      styleRules,
      message: "Analyse terminée avec succès",
    });
  } catch (error: any) {
    console.error("Erreur API analyze-style:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * Extrait le texte d'une image avec Google Cloud Vision API
 */
async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    // Convertir le fichier en Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Appeler Google Vision API avec le client authentifié
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;

    if (detections && detections.length > 0) {
      // Le premier résultat contient tout le texte détecté
      return detections[0].description || '';
    }

    return '';
  } catch (error) {
    console.error('Erreur Google Vision API:', error);
    throw new Error(`Erreur lors de l'extraction du texte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Parse les messages individuels depuis le texte OCR brut
 * Cette fonction essaie d'identifier les messages individuels dans une capture de conversation
 */
function parseMessagesFromText(rawText: string): string[] {
  // Diviser par lignes
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const messages: string[] = [];

  for (const line of lines) {
    // Ignorer les lignes qui ressemblent à des timestamps, noms, etc.
    if (line.match(/^\d{1,2}:\d{2}$/)) continue; // Timestamps "14:32"
    if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) continue; // Dates
    if (line.length < 2) continue; // Lignes trop courtes

    // Garder les messages qui ont du sens
    if (line.length >= 2 && line.length < 500) {
      messages.push(line);
    }
  }

  return messages;
}

/**
 * Analyse le style d'écriture à partir d'un tableau de messages
 */
function analyzeWritingStyle(messages: string[]) {
  // Calculer la longueur moyenne des messages
  const avgLength =
    messages.reduce((sum, msg) => sum + msg.split(" ").length, 0) /
    messages.length;

  // Détecter les emojis
  const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u{FE0F}]/gu;
  const totalEmojis = messages.reduce(
    (count, msg) => count + (msg.match(emojiRegex) || []).length,
    0
  );
  const emojiFrequency = totalEmojis / messages.length;

  // Détecter les abréviations communes
  const abbreviations = ["mdr", "lol", "jsp", "jpp", "mdrr", "oklm", "bg", "frr", "ptdr", "slt", "stp"];
  const usesAbbreviations = messages.some((msg) =>
    abbreviations.some((abbr) => msg.toLowerCase().includes(abbr))
  );

  // Détecter la ponctuation
  const hasLotOfPunctuation = messages.some(
    (msg) => (msg.match(/[!?]{2,}/g) || []).length > 0
  );

  // Détecter les caps
  const usesCaps = messages.some((msg) => msg === msg.toUpperCase() && msg.length > 3);

  // Déterminer les catégories
  let messageLength: "short" | "medium" | "long" = "medium";
  if (avgLength < 5) messageLength = "short";
  else if (avgLength > 12) messageLength = "long";

  let emojiLevel: "none" | "low" | "medium" | "high" = "none";
  if (emojiFrequency > 0.5) emojiLevel = "high";
  else if (emojiFrequency > 0.2) emojiLevel = "medium";
  else if (emojiFrequency > 0) emojiLevel = "low";

  let languageLevel: "formal" | "neutral" | "casual" | "slang" = "neutral";
  if (usesAbbreviations) languageLevel = "slang";
  else if (avgLength < 6) languageLevel = "casual";

  // Générer les règles structurées
  const styleRules = {
    message_length: messageLength,
    sentence_structure: avgLength < 6 ? "fragments" : "mixed",
    punctuation: hasLotOfPunctuation ? "expressive" : "minimal",
    emoji_frequency: emojiLevel,
    emoji_types: extractCommonEmojis(messages),
    common_expressions: extractCommonExpressions(messages),
    language_level: languageLevel,
    avg_words_per_message: Math.round(avgLength),
    uses_abbreviations: usesAbbreviations,
    uses_caps: usesCaps ? "sometimes" : "rarely",
    total_messages: messages.length,
    screenshots_count: 0, // Sera rempli par l'API
  };

  return styleRules;
}

/**
 * Extrait les emojis les plus fréquents
 */
function extractCommonEmojis(messages: string[]): string[] {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u{FE0F}]/gu;
  const emojiCounts: Record<string, number> = {};

  messages.forEach((msg) => {
    const emojis = msg.match(emojiRegex) || [];
    emojis.forEach((emoji) => {
      emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
    });
  });

  return Object.entries(emojiCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([emoji]) => emoji);
}

/**
 * Extrait les expressions récurrentes
 */
function extractCommonExpressions(messages: string[]): string[] {
  const expressions = ["mdr", "lol", "genre", "trop", "grave", "ouais", "oklm", "jsp", "ptdr", "frr"];
  const found: string[] = [];

  expressions.forEach((expr) => {
    const count = messages.filter((msg) =>
      msg.toLowerCase().includes(expr)
    ).length;
    if (count >= 2) {
      // Au moins 2 occurrences
      found.push(expr);
    }
  });

  return found.slice(0, 5);
}
