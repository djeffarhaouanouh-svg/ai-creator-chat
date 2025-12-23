import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { storyId, creatorId, isLocked } = await req.json();

    if (!storyId || !creatorId || isLocked === undefined) {
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

    // Mettre à jour is_locked
    await sql`
      UPDATE stories
      SET is_locked = ${isLocked}
      WHERE id = ${storyId}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: "Story lock status updated"
    });

  } catch (error: any) {
    console.error("❌ ERROR TOGGLING STORY LOCK:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
