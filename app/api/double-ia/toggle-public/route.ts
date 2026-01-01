import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * API pour activer/désactiver le partage public d'un double IA
 */
export async function POST(request: NextRequest) {
  try {
    const { doubleId, userId, isPublic } = await request.json();

    if (!doubleId || !userId || isPublic === undefined) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Vérifier que le double appartient bien à l'utilisateur
    const ownershipCheck = await pool.query(
      `SELECT id FROM ai_doubles WHERE id = $1 AND user_id = $2::uuid`,
      [doubleId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Double IA non trouvé ou non autorisé" },
        { status: 404 }
      );
    }

    // Mettre à jour le statut public
    await pool.query(
      `UPDATE ai_doubles SET is_public = $1, updated_at = NOW() WHERE id = $2`,
      [isPublic, doubleId]
    );

    return NextResponse.json({
      success: true,
      isPublic,
      message: isPublic
        ? "Double IA rendu public"
        : "Double IA rendu privé",
    });
  } catch (error: any) {
    console.error("Erreur API toggle-public:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
