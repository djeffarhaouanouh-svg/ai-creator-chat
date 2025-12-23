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

    // Récupérer toutes les stories du créateur (actives et expirées)
    const result = await sql`
      SELECT
        id,
        creator_id,
        title,
        media_url,
        media_type,
        caption,
        duration_hours,
        is_locked,
        created_at,
        expires_at,
        is_active,
        view_count,
        CASE
          WHEN expires_at <= NOW() THEN 'expired'
          WHEN is_active = false THEN 'deleted'
          ELSE 'active'
        END as status
      FROM stories
      WHERE creator_id = ${creatorId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      stories: result.rows
    });

  } catch (error: any) {
    console.error("❌ ERROR FETCHING MY STORIES:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
