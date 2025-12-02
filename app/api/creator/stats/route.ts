import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic"; 

export async function GET() {
  try {
    const userId = "demo";

    const messages = await sql`
      SELECT COUNT(*) AS total
      FROM messages
      WHERE user_id = ${userId}
    `;

    return NextResponse.json({
      messagesSent: Number(messages.rows[0].total) || 0,
      avgMessages: 0,
      monthlySpent: 0,
      activeSubscriptions: 0
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "stats_error" }, { status: 500 });
  }
}
