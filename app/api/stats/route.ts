import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// 🔥 Obligatoire sur Vercel pour empêcher les erreurs de rendu statique
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const userId = "demo"; // ➜ À remplacer par le user connecté

    // Récupérer total messages
    const messages = await sql`
      SELECT COUNT(*) AS total
      FROM messages
      WHERE user_id = ${userId}
    `;

    // Moyenne de messages par créatrice
    const avg = await sql`
      SELECT AVG(count) AS avg
      FROM (
        SELECT COUNT(*) AS count
        FROM messages
        WHERE user_id = ${userId}
        GROUP BY creator_id
      ) t;
    `;

    return NextResponse.json({
      messagesSent: Number(messages.rows[0]?.total) || 0,
      avgMessages: Number(avg.rows[0]?.avg) || 0,
      monthlySpent: 0,
      activeSubscriptions: 0
    });

  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "stats_error" },
      { status: 500 }
    );
  }
}
