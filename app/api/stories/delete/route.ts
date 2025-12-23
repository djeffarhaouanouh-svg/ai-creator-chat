import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get("storyId");
    const creatorId = searchParams.get("creatorId");

    if (!storyId || !creatorId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Vérifier que la story appartient au créateur
    const storyCheck = await sql`
      SELECT id FROM stories
      WHERE id = ${storyId}::uuid AND creator_id = ${creatorId}
      LIMIT 1
    `;

    if (storyCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Story not found or unauthorized" },
        { status: 404 }
      );
    }

    // Supprimer définitivement la story (hard delete)
    // Les vues seront automatiquement supprimées grâce au ON DELETE CASCADE
    await sql`
      DELETE FROM stories
      WHERE id = ${storyId}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: "Story deleted successfully"
    });

  } catch (error: any) {
    console.error("❌ ERROR DELETING STORY:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
