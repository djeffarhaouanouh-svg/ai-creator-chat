import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(req: Request) {
  try {
    const { userId, creatorId, role, content } = await req.json();

    await sql`
      INSERT INTO messages (user_id, creator_id, role, content)
      VALUES (${userId}, ${creatorId}, ${role}, ${content})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}