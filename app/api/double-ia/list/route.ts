import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * API pour récupérer la liste des doubles IA d'un utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId manquant" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT id, name, status, voice_id, voice_name, share_slug, is_public, created_at, completed_at
       FROM ai_doubles
       WHERE user_id = $1::uuid
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      doubles: result.rows,
    });
  } catch (error: any) {
    console.error("Erreur API list:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
