import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// MVP : on ne fait qu'enregistrer une autorisation "logique" côté base,
// l'intégration PayPal REST réelle pourra remplacer cette partie.
export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    const fakeAuthorizationId = `AUTH_${Date.now()}`;

    const result = await sql`
      UPDATE content_requests
      SET paypal_authorization_id = ${fakeAuthorizationId},
          status = 'authorized'
      WHERE id = ${requestId}::uuid
      RETURNING id, status, price, paypal_authorization_id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizationId: fakeAuthorizationId,
      request: result.rows[0],
    });
  } catch (error: any) {
    console.error("❌ ERROR AUTHORIZING PAYPAL PAYMENT:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}




















