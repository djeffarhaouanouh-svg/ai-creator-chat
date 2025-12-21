import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Autoriser le paiement PayPal pour un contenu personnalisé
export async function POST(req: Request) {
  try {
    const { requestId, paypalOrderId, paypalPayerId, amount } = await req.json();

    if (!requestId || !paypalOrderId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe et a le bon statut
    const requestResult = await sql`
      SELECT 
        cr.id,
        cr.status,
        cr.price,
        cr.user_id,
        cr.creator_id,
        c.slug as creator_slug
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

    // Vérifier que le statut est 'price_proposed'
    if (request.status !== "price_proposed") {
      return NextResponse.json(
        {
          success: false,
          error: "La demande doit avoir un prix proposé avant de pouvoir être payée",
        },
        { status: 400 }
      );
    }

    // Vérifier que le montant correspond
    const expectedPrice = parseFloat(request.price || "0");
    const paidAmount = parseFloat(amount || "0");
    if (Math.abs(expectedPrice - paidAmount) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Le montant payé (${paidAmount}€) ne correspond pas au prix proposé (${expectedPrice}€)`,
        },
        { status: 400 }
      );
    }

    // Mettre à jour le statut à 'paid' avec l'ID PayPal
    const authorizationId = `AUTH_${paypalOrderId}`;
    const result = await sql`
      UPDATE content_requests
      SET paypal_authorization_id = ${authorizationId},
          status = 'paid'
      WHERE id = ${requestId}::uuid
      RETURNING id, status, price, paypal_authorization_id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update request status" },
        { status: 500 }
      );
    }

    // Envoyer un message système dans le chat
    const systemMessage = `💳 Paiement sécurisé effectué`;
    const creatorSlug = request.creator_slug;
    if (creatorSlug) {
      try {
        await sql`
          INSERT INTO messages (user_id, creator_id, content, role, created_at)
          VALUES (
            ${request.user_id}::text,
            ${creatorSlug},
            ${systemMessage},
            'assistant',
            NOW()
          )
        `;
      } catch (msgError: any) {
        console.error("❌ ERROR INSERTING MESSAGE (non bloquant):", msgError);
      }
    }

    return NextResponse.json({
      success: true,
      authorizationId,
      request: result.rows[0],
    });
  } catch (error: any) {
    console.error("❌ ERROR AUTHORIZING PAYPAL CONTENT PAYMENT:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}







