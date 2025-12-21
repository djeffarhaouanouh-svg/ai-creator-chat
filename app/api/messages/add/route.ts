import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { userId, creatorSlug, role, content } = await req.json();

    if (!userId || !creatorSlug || !role || !content) {
      console.error("Missing field:", { userId, creatorSlug, role, content });
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // Récupérer l'UUID du créateur depuis son slug
    const creatorResult = await sql`
      SELECT id FROM creators WHERE slug = ${creatorSlug} LIMIT 1
    `;

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    const creatorId = creatorResult.rows[0].id;

    // ⛔ BLOQUER la sauvegarde de messages assistant si l'IA est désactivée
    if (role === 'assistant') {
      // Vérifier si l'IA est désactivée
      let settingsResult;
      try {
        settingsResult = await sql`
          SELECT ai_enabled
          FROM conversation_settings
          WHERE user_id = ${userId}::uuid
            AND creator_id = ${creatorId}::uuid
          LIMIT 1
        `
      } catch (error: any) {
        console.log('⚠️ Erreur lors de la vérification IA:', error.message);
        settingsResult = { rows: [] };
      }
      
      // Log pour débogage
      console.log('🔍 Vérification IA dans /api/messages/add:', {
        userId: userId ? `${userId.substring(0, 8)}...` : 'MANQUANT',
        creatorId: creatorId ? `${creatorId.substring(0, 8)}...` : 'MANQUANT',
        creatorSlug,
        settingsFound: settingsResult.rows.length > 0,
        aiEnabled: settingsResult.rows.length > 0 ? settingsResult.rows[0].ai_enabled : 'N/A (par défaut activé)'
      });
      
      // Si le setting existe et est false → BLOQUER la sauvegarde
      if (settingsResult.rows.length > 0 && settingsResult.rows[0].ai_enabled === false) {
        console.log('🚫 BLOQUAGE sauvegarde message assistant - IA désactivée')
        return NextResponse.json(
          { success: false, error: 'L\'IA est désactivée pour cette conversation.' },
          { status: 403 }
        )
      }
    }

    // NOTE: messages.creator_id est TEXT (slug), pas UUID
    await sql`
      INSERT INTO messages (user_id, creator_id, role, content)
      VALUES (${userId}::uuid, ${creatorSlug}, ${role}, ${content})
    `;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ ERROR SAVING MESSAGE:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
