import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { requestId, price } = await req.json();

    if (!requestId || typeof price !== "number") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    // Récupérer la demande avec les infos créatrice pour le message
    const requestResult = await sql`
      SELECT 
        cr.id,
        cr.creator_id,
        cr.user_id,
        cr.message,
        c.slug as creator_slug,
        c.name as creator_name
      FROM content_requests cr
      LEFT JOIN creators c ON cr.creator_id = c.id
      WHERE cr.id = ${requestId}::uuid
      LIMIT 1
    `;

    if (requestResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content request not found" },
        { status: 404 }
      );
    }

    const request = requestResult.rows[0];

    // Mettre à jour le prix et le statut
    const result = await sql`
      UPDATE content_requests
      SET price = ${price}, status = 'price_proposed'
      WHERE id = ${requestId}::uuid
      RETURNING id, creator_id, user_id, message, status, price, paypal_authorization_id
    `;

    // Envoyer un message automatique dans le chat
    const creatorName = request.creator_name || 'La créatrice';
    const messageContent = `${creatorName} te propose ce contenu pour ${price.toFixed(2)} €`;

    if (request.creator_slug) {
      try {
        await sql`
          INSERT INTO messages (user_id, creator_id, content, role, created_at)
          VALUES (
            ${request.user_id}::text,
            ${request.creator_slug},
            ${messageContent},
            'assistant',
            NOW()
          )
        `;
      } catch (msgError: any) {
        console.error("❌ ERROR INSERTING PRICE MESSAGE (non bloquant):", msgError);
      }
    }

    return NextResponse.json({
      success: true,
      request: result.rows[0],
    });
  } catch (error: any) {
    console.error("❌ ERROR PRICING CONTENT REQUEST:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



