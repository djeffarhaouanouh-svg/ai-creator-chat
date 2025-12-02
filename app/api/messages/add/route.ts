import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { userId, creatorId, role, content } = await req.json();

    if (!userId || !creatorId || !role || !content) {
      console.error("Missing field:", { userId, creatorId, role, content });
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

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
