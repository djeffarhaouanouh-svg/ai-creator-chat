import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { userId, creatorSlug, message } = await req.json();

    if (!userId || !creatorSlug || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
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

    const insertResult = await sql`
      INSERT INTO content_requests (creator_id, user_id, message, status, created_at)
      VALUES (${creatorId}::uuid, ${userId}::uuid, ${message}, 'pending', NOW())
      RETURNING id, creator_id, user_id, message, status, price, paypal_authorization_id
    `;

    const request = insertResult.rows[0];

    // Récupérer le slug de la créatrice pour le message (on utilise déjà creatorSlug du paramètre)
    // Pas besoin de le récupérer à nouveau, on l'a déjà en paramètre

    // Envoyer la demande dans le chat comme message utilisateur
    if (creatorSlug) {
      try {
        await sql`
          INSERT INTO messages (user_id, creator_id, content, role, created_at)
          VALUES (
            ${userId}::text,
            ${creatorSlug},
            ${message},
            'user',
            NOW()
          )
        `;
      } catch (msgError: any) {
        console.error("❌ ERROR INSERTING REQUEST MESSAGE (non bloquant):", msgError);
      }
    }

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (error: any) {
    console.error("❌ ERROR CREATING CONTENT REQUEST:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



