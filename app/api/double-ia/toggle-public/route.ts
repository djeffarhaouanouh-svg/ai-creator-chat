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
      `SELECT id, name, share_slug FROM ai_doubles WHERE id = $1 AND user_id = $2::uuid`,
      [doubleId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Double IA non trouvé ou non autorisé" },
        { status: 404 }
      );
    }

    const double = ownershipCheck.rows[0];
    let shareSlug = double.share_slug;

    // Si on active le partage public et qu'il n'y a pas de share_slug, en générer un
    if (isPublic && !shareSlug) {
      // Générer un slug unique basé sur le nom de l'utilisateur et l'ID
      const userName = double.name || 'double';
      const baseSlug = userName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, ''); // Enlever les tirets en début/fin
      
      // Ajouter un suffixe unique basé sur l'ID pour garantir l'unicité
      const uniqueSuffix = doubleId.toString().slice(-6);
      shareSlug = `${baseSlug}-${uniqueSuffix}`;

      // Vérifier l'unicité et générer un nouveau slug si nécessaire
      let attempts = 0;
      while (attempts < 10) {
        const checkSlug = await pool.query(
          `SELECT id FROM ai_doubles WHERE share_slug = $1 AND id != $2`,
          [shareSlug, doubleId]
        );
        
        if (checkSlug.rows.length === 0) {
          break; // Slug unique trouvé
        }
        
        // Générer un nouveau slug avec un suffixe aléatoire
        shareSlug = `${baseSlug}-${uniqueSuffix}-${Math.random().toString(36).substring(2, 6)}`;
        attempts++;
      }

      // Mettre à jour avec le share_slug généré
      await pool.query(
        `UPDATE ai_doubles SET is_public = $1, share_slug = $2, updated_at = NOW() WHERE id = $3`,
        [isPublic, shareSlug, doubleId]
      );
    } else {
      // Mettre à jour seulement le statut public
      await pool.query(
        `UPDATE ai_doubles SET is_public = $1, updated_at = NOW() WHERE id = $2`,
        [isPublic, doubleId]
      );
    }

    return NextResponse.json({
      success: true,
      isPublic,
      shareSlug: isPublic ? shareSlug : null,
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
