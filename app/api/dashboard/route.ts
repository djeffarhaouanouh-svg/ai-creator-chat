import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  const userId = "demo"; // à remplacer par auth plus tard

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
}

