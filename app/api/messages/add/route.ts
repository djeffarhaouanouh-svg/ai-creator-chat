import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { userId, creatorSlug, role, content } = await req.json();

    if (!userId || !creatorSlug || !role || !content) {
      console.error("Missing field:", { userId, creatorSlug, role, content });
      return NextResponse.json(
        { success: false, error: "Missing fields" },
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

    await sql`
      INSERT INTO messages (user_id, creator_id, role, content)
      VALUES (${userId}::uuid, ${creatorId}::uuid, ${role}, ${content})
    `;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ ERROR SAVING MESSAGE:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
