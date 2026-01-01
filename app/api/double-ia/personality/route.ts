import { NextRequest, NextResponse } from "next/server";

/**
 * API pour transformer les réponses du questionnaire en règles de personnalité
 *
 * Cette API prend les réponses brutes et les convertit en règles structurées
 * utilisables dans le prompt système de l'IA.
 */

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json();

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Réponses invalides" },
        { status: 400 }
      );
    }

    // Transformer les réponses en règles de personnalité
    const personalityRules = {
      tone: answers.tone || "friendly",
      energy_level: answers.energy_level || "medium",
      response_length: answers.response_length || "medium",
      empathy: answers.empathy || "medium",
      humor_style: answers.humor_style || "light",

      // Topics
      topics_comfortable: answers.topics_comfort || [],
      topics_avoid: ["politics", "religion"], // Par défaut, éviter ces sujets

      // Boundaries
      conversation_boundaries: {
        flirting: answers.conversation_boundaries?.includes("flirting") || false,
        personal_questions:
          answers.conversation_boundaries?.includes("personal_questions") || true,
        advice_giving:
          answers.conversation_boundaries?.includes("advice_giving") || true,
        debates: answers.conversation_boundaries?.includes("debates") || false,
      },

      // Générer une description textuelle pour le prompt
      description: generatePersonalityDescription(answers),
    };

    return NextResponse.json({
      success: true,
      personalityRules,
    });
  } catch (error: any) {
    console.error("Erreur API personality:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * Génère une description textuelle de la personnalité
 * pour l'injecter dans le prompt système
 */
function generatePersonalityDescription(answers: Record<string, any>): string {
  const parts: string[] = [];

  // Ton
  const toneDescriptions: Record<string, string> = {
    professional: "Tu adoptes un ton professionnel et sérieux",
    friendly: "Tu es chaleureux(se) et bienveillant(e)",
    casual: "Tu es décontracté(e) et naturel(le)",
    humorous: "Tu es drôle et léger(ère)",
  };
  if (answers.tone) {
    parts.push(toneDescriptions[answers.tone] || "Tu es amical(e)");
  }

  // Énergie
  const energyDescriptions: Record<string, string> = {
    low: "avec un rythme posé et réfléchi",
    medium: "avec un rythme équilibré",
    high: "avec beaucoup d'enthousiasme et d'énergie",
  };
  if (answers.energy_level) {
    parts.push(energyDescriptions[answers.energy_level]);
  }

  // Longueur de réponse
  const lengthDescriptions: Record<string, string> = {
    concise: "Tes réponses sont très courtes et directes",
    short: "Tu donnes des réponses brèves mais complètes",
    medium: "Tes réponses sont équilibrées, ni trop courtes ni trop longues",
    detailed: "Tu donnes des réponses approfondies et détaillées",
  };
  if (answers.response_length) {
    parts.push(lengthDescriptions[answers.response_length]);
  }

  // Empathie
  const empathyDescriptions: Record<string, string> = {
    low: "Tu es factuel(le) et rationnel(le)",
    medium: "Tu es à l'écoute de manière équilibrée",
    high: "Tu es très empathique et à l'écoute",
  };
  if (answers.empathy) {
    parts.push(empathyDescriptions[answers.empathy]);
  }

  // Humour
  const humorDescriptions: Record<string, string> = {
    none: "Tu restes sérieux(se)",
    light: "Tu utilises un humour subtil et léger",
    sarcastic: "Tu utilises un humour sarcastique et piquant",
    witty: "Tu as un esprit vif et intelligent",
  };
  if (answers.humor_style) {
    parts.push(humorDescriptions[answers.humor_style]);
  }

  // Topics confortables
  if (answers.topics_comfort && answers.topics_comfort.length > 0) {
    parts.push(`Tu es particulièrement à l'aise pour parler de: ${answers.topics_comfort.join(", ")}`);
  }

  return parts.join(". ") + ".";
}
