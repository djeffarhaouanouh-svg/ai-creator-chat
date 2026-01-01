import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * API pour récupérer un double IA par son slug de partage
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug manquant" },
        { status: 400 }
      );
    }

    // Récupérer le double IA par share_slug et vérifier qu'il est public
    const result = await pool.query(
      `SELECT
        id,
        user_id,
        name,
        status,
        system_prompt,
        voice_id,
        voice_name,
        total_conversations,
        total_messages,
        is_public,
        share_slug,
        created_at,
        updated_at,
        completed_at
       FROM ai_doubles
       WHERE share_slug = $1 AND is_public = true AND status = 'active'
       LIMIT 1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Double IA non trouvé ou non public" },
        { status: 404 }
      );
    }

    const double = result.rows[0];

    return NextResponse.json({
      success: true,
      double: {
        id: double.id,
        userId: double.user_id,
        name: double.name,
        status: double.status,
        systemPrompt: double.system_prompt,
        voiceId: double.voice_id,
        voiceName: double.voice_name,
        totalConversations: double.total_conversations,
        totalMessages: double.total_messages,
        isPublic: double.is_public,
        shareSlug: double.share_slug,
        createdAt: double.created_at,
        updatedAt: double.updated_at,
        completedAt: double.completed_at,
      },
    });
  } catch (error: any) {
    console.error("Erreur API get-by-slug:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
