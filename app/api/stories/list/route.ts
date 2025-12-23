import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get("creatorId");

    if (!creatorId) {
      return NextResponse.json(
        { success: false, error: "Creator ID is required" },
        { status: 400 }
      );
    }

    // Récupérer les stories actives et non expirées
    const result = await sql`
      SELECT
        id,
        creator_id,
        title,
        media_url,
        media_type,
        caption,
        is_locked,
        created_at,
        expires_at,
        view_count
      FROM stories
      WHERE creator_id = ${creatorId}
        AND is_active = true
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      stories: result.rows
    });

  } catch (error: any) {
    console.error("❌ ERROR FETCHING STORIES:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
