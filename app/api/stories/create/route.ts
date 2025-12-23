import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { creatorId, title, mediaUrl, mediaType, caption, durationHours, isLocked } = await req.json();

    if (!creatorId || !mediaUrl || !mediaType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (durationHours || 24));

    // Créer la story
    const result = await sql`
      INSERT INTO stories (
        creator_id,
        title,
        media_url,
        media_type,
        caption,
        duration_hours,
        is_locked,
        expires_at
      )
      VALUES (
        ${creatorId},
        ${title || null},
        ${mediaUrl},
        ${mediaType},
        ${caption || null},
        ${durationHours || 24},
        ${isLocked !== undefined ? isLocked : true},
        ${expiresAt.toISOString()}
      )
      RETURNING id, created_at, expires_at
    `;

    return NextResponse.json({
      success: true,
      story: result.rows[0],
      message: "Story created successfully"
    });

  } catch (error: any) {
    console.error("❌ ERROR CREATING STORY:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
