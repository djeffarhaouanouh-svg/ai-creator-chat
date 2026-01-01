import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * API pour récupérer les informations d'un double IA
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doubleId = searchParams.get("id");

    if (!doubleId) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT id, user_id, name, status, voice_id, voice_name, system_prompt, share_slug, is_public, created_at
       FROM ai_doubles
       WHERE id = $1`,
      [doubleId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Double IA non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      double: result.rows[0],
    });
  } catch (error: any) {
    console.error("Erreur API get:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
