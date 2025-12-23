import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { storyId, userId } = await req.json();

    if (!storyId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Enregistrer la vue (si pas déjà vue)
    await sql`
      INSERT INTO story_views (story_id, user_id)
      VALUES (${storyId}::uuid, ${userId})
      ON CONFLICT (story_id, user_id) DO NOTHING
    `;

    // Mettre à jour le compteur de vues
    await sql`
      UPDATE stories
      SET view_count = (
        SELECT COUNT(*) FROM story_views WHERE story_id = ${storyId}::uuid
      )
      WHERE id = ${storyId}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: "View recorded"
    });

  } catch (error: any) {
    console.error("❌ ERROR RECORDING VIEW:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
