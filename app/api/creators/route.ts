import { NextResponse } from "next/server";
import { getCreators } from "@/data/creators-merged";
import { sql } from '@vercel/postgres'

// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const creators = await getCreators();

    // Pour chaque créatrice, ajouter les stats
    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        let totalSubscribers = 0
        let totalMessages = 0

        if (creator.id) {
          try {
            // Compter les abonnés actifs
            const subscribersResult = await sql`
              SELECT COUNT(DISTINCT user_id) as total
              FROM subscriptions
              WHERE creator_id = ${creator.id}
              AND status = 'active'
            `
            totalSubscribers = Number(subscribersResult.rows[0]?.total) || 0

            // Compter les messages
            const messagesResult = await sql`
              SELECT COUNT(*) as total
              FROM messages
              WHERE creator_id = ${creator.id}
            `
            totalMessages = Number(messagesResult.rows[0]?.total) || 0
          } catch (err) {
            console.error(`Erreur stats pour ${creator.slug}:`, err)
          }
        }

        return {
          ...creator,
          subscribers: totalSubscribers,
          messagesCount: totalMessages
        }
      })
    )

    return NextResponse.json(creatorsWithStats);
  } catch (error) {
    console.error("Erreur API /creators :", error);
    return NextResponse.json(
      { error: "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
