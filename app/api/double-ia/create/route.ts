import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * API de création du double IA
 *
 * Cette API:
 * 1. Assemble les règles de style et de personnalité
 * 2. Génère le prompt système
 * 3. Crée les entrées dans la DB
 * 4. Retourne l'ID du double créé
 */

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const { userId, styleRules, personality, voiceId, voiceName } = await request.json();

    if (!userId || !styleRules || !personality) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // 0. Vérifier que l'utilisateur existe
    const userResult = await client.query(
      `SELECT id FROM users WHERE id = $1::uuid`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const userUuid = userResult.rows[0].id;

    // 0.1. Désactiver tous les anciens doubles actifs de cet utilisateur
    await client.query(
      `UPDATE ai_doubles SET status = 'paused' WHERE user_id = $1 AND status = 'active'`,
      [userUuid]
    );

    // 1. Créer le double IA
    const doubleResult = await client.query(
      `INSERT INTO ai_doubles (user_id, name, status, voice_id, voice_name, completed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [userUuid, "Mon Double IA", "active", voiceId, voiceName]
    );

    const doubleId = doubleResult.rows[0].id;

    // 2. Sauvegarder les règles de style
    await client.query(
      `INSERT INTO ai_double_writing_styles (ai_double_id, screenshots_count, total_messages_analyzed, style_rules)
       VALUES ($1, $2, $3, $4)`,
      [
        doubleId,
        styleRules.screenshots_count || 0,
        styleRules.total_messages || 0,
        JSON.stringify(styleRules),
      ]
    );

    // 3. Sauvegarder la personnalité
    await client.query(
      `INSERT INTO ai_double_personalities (ai_double_id, personality_rules)
       VALUES ($1, $2)`,
      [doubleId, JSON.stringify(personality)]
    );

    // 4. Générer le prompt système
    const systemPrompt = generateSystemPrompt(styleRules, personality);

    // 5. Mettre à jour le double avec le prompt
    await client.query(
      `UPDATE ai_doubles SET system_prompt = $1 WHERE id = $2`,
      [systemPrompt, doubleId]
    );

    // 6. Générer un slug de partage
    const shareSlug = `double-${doubleId}`;
    await client.query(
      `UPDATE ai_doubles SET share_slug = $1 WHERE id = $2`,
      [shareSlug, doubleId]
    );

    // 7. Créer l'entrée de partage
    await client.query(
      `INSERT INTO ai_double_shares (ai_double_id)
       VALUES ($1)`,
      [doubleId]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      doubleId,
      shareSlug,
      systemPrompt,
      message: "Double IA créé avec succès",
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Erreur API create:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * Génère le prompt système en assemblant toutes les règles
 *
 * IMPORTANT: Ce prompt NE contient JAMAIS de conversations brutes
 * Seulement des règles comportementales structurées
 */
function generateSystemPrompt(styleRules: any, personality: any): string {
  const sections: string[] = [];

  // Section 1: Identité
  sections.push(`Tu es le double IA de ton utilisateur. Tu ne dis JAMAIS que tu es une IA ou un assistant. Tu réponds toujours à la première personne comme si tu étais la vraie personne.`);

  // Section 2: Style d'écriture
  const styleInstructions: string[] = [];

  if (styleRules.message_length === "short") {
    styleInstructions.push("Écris des messages courts (2-6 mots en moyenne)");
  } else if (styleRules.message_length === "long") {
    styleInstructions.push("Écris des messages longs et développés");
  } else {
    styleInstructions.push("Écris des messages de longueur moyenne");
  }

  if (styleRules.sentence_structure === "fragments") {
    styleInstructions.push("Utilise souvent des fragments de phrases plutôt que des phrases complètes");
  }

  if (styleRules.punctuation === "minimal") {
    styleInstructions.push("Utilise peu de ponctuation");
  } else if (styleRules.punctuation === "expressive") {
    styleInstructions.push("Utilise une ponctuation expressive (!!!, ???, etc.)");
  }

  if (styleRules.emoji_frequency !== "none") {
    styleInstructions.push(`Utilise des emojis ${styleRules.emoji_frequency === "high" ? "fréquemment" : "parfois"}`);
    if (styleRules.emoji_types && styleRules.emoji_types.length > 0) {
      styleInstructions.push(`Emojis favoris: ${styleRules.emoji_types.join(" ")}`);
    }
  }

  if (styleRules.uses_abbreviations) {
    styleInstructions.push("Utilise des abréviations courantes (mdr, jsp, oklm, etc.)");
  }

  if (styleRules.common_expressions && styleRules.common_expressions.length > 0) {
    styleInstructions.push(`Expressions récurrentes: ${styleRules.common_expressions.join(", ")}`);
  }

  if (styleRules.language_level) {
    const levelDescriptions: Record<string, string> = {
      formal: "un langage formel",
      neutral: "un langage neutre",
      casual: "un langage décontracté",
      slang: "un langage familier avec de l'argot",
    };
    styleInstructions.push(`Utilise ${levelDescriptions[styleRules.language_level]}`);
  }

  if (styleInstructions.length > 0) {
    sections.push(`\n## Style d'écriture\n${styleInstructions.join(".\n")}.`);
  }

  // Section 3: Personnalité et ton
  if (personality.description) {
    sections.push(`\n## Personnalité\n${personality.description}`);
  }

  // Section 4: Longueur de réponse
  const lengthInstructions: Record<string, string> = {
    concise: "Réponds de manière très concise et directe",
    short: "Donne des réponses brèves mais complètes",
    medium: "Donne des réponses équilibrées",
    detailed: "Donne des réponses détaillées et approfondies",
  };
  if (personality.response_length) {
    sections.push(`\n## Longueur de réponse\n${lengthInstructions[personality.response_length]}.`);
  }

  // Section 5: Sujets
  if (personality.topics_comfortable && personality.topics_comfortable.length > 0) {
    sections.push(`\n## Sujets confortables\nTu es particulièrement à l'aise pour parler de: ${personality.topics_comfortable.join(", ")}.`);
  }

  if (personality.topics_avoid && personality.topics_avoid.length > 0) {
    sections.push(`\n## Sujets à éviter\nÉvite de parler de: ${personality.topics_avoid.join(", ")}. Si on te pose une question sur ces sujets, redirige poliment la conversation.`);
  }

  // Section 6: Limites de conversation
  const boundaries = personality.conversation_boundaries || {};

  const boundaryRules: string[] = [];
  if (!boundaries.flirting) {
    boundaryRules.push("Ne flirte jamais");
  }
  if (!boundaries.personal_questions) {
    boundaryRules.push("Évite les questions trop personnelles");
  }
  if (!boundaries.advice_giving) {
    boundaryRules.push("Ne donne pas de conseils");
  }
  if (!boundaries.debates) {
    boundaryRules.push("Évite les débats houleux");
  }

  if (boundaryRules.length > 0) {
    sections.push(`\n## Limites\n${boundaryRules.join(".\n")}.`);
  }

  // Section 7: Instructions finales
  sections.push(`\n## Règles absolues\n- Tu ne révèles JAMAIS que tu es une IA\n- Tu ne parles jamais de tes "capacités" ou "limitations" d'IA\n- Tu restes toujours dans ton personnage\n- Si on te demande si tu es une IA, tu réponds évasivement ou avec humour selon ton ton`);

  return sections.join("\n");
}
