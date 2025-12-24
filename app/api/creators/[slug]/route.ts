import { getCreatorDBBySlug } from "@/data/creators-db";
import { localCreators } from "@/data/creators";
import { NextResponse } from "next/server";
import { sql } from '@vercel/postgres'

// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const db = await getCreatorDBBySlug(params.slug);
    const local = localCreators.find(c => c.slug === params.slug) || {};

    // Récupérer les statistiques publiques
    let totalSubscribers = 0
    let totalMessages = 0

    // Récupérer les photos de galerie
    let galleryPhotos: any[] = []

    if (db?.id) {
      const creatorId = db.id

      // Compter les abonnés actifs
      const subscribersResult = await sql`
        SELECT COUNT(DISTINCT user_id) as total
        FROM subscriptions
        WHERE creator_id = ${creatorId}
        AND status = 'active'
      `
      totalSubscribers = Number(subscribersResult.rows[0]?.total) || 0

      // Compter les messages
      const messagesResult = await sql`
        SELECT COUNT(*) as total
        FROM messages
        WHERE creator_id = ${creatorId}
      `
      totalMessages = Number(messagesResult.rows[0]?.total) || 0

      // Récupérer les photos de galerie
      const galleryResult = await sql`
        SELECT id, url, is_locked, "order"
        FROM gallery_photos
        WHERE creator_id = ${creatorId}
        ORDER BY "order" ASC
      `
      galleryPhotos = galleryResult.rows.map(row => ({
        id: row.id,
        url: row.url,
        isLocked: row.is_locked,
        order: row.order
      }))
    }

    return NextResponse.json({
      ...local,
      ...(db || {}),
      totalSubscribers,
      totalMessages,
      galleryPhotos
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}