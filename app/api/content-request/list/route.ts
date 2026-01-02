import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Récupérer toutes les demandes de contenu personnalisé pour une créatrice
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorSlug = searchParams.get("creatorSlug");

    if (!creatorSlug) {
      return NextResponse.json(
        { success: false, error: "Missing creatorSlug" },
        { status: 400 }
      );
    }

    // Récupérer l'UUID du créateur depuis son slug
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

    // Récupérer toutes les demandes avec les infos utilisateur
    const result = await sql`
      SELECT 
        cr.id,
        cr.creator_id,
        cr.user_id,
        cr.message,
        cr.status,
        cr.price,
        cr.paypal_authorization_id,
        cr.created_at,
        u.name as user_name,
        u.email as user_email
      FROM content_requests cr
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE cr.creator_id = ${creatorId}::uuid
      ORDER BY cr.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      requests: result.rows,
    });
  } catch (error: any) {
    console.error("❌ ERROR LISTING CONTENT REQUESTS:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
























