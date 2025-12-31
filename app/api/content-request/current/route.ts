import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Récupérer la dernière demande de contenu pour une conversation user / créatrice
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const creatorSlug = searchParams.get("creatorSlug");

    if (!userId || !creatorSlug) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    const creatorResult = await sql`
      SELECT id FROM creators WHERE slug = ${creatorSlug} LIMIT 1
    `;

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    const creatorId = creatorResult.rows[0].id;

    const result = await sql`
      SELECT id, creator_id, user_id, message, status, price, paypal_authorization_id
      FROM content_requests
      WHERE user_id = ${userId}::uuid
        AND creator_id = ${creatorId}::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ success: true, request: null });
    }

    return NextResponse.json({
      success: true,
      request: result.rows[0],
    });
  } catch (error: any) {
    console.error("❌ ERROR FETCHING CURRENT CONTENT REQUEST:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


















