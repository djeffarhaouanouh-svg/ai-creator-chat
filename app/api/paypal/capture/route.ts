import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// MVP : on considère la capture comme réussie et on met à jour le statut.
// L'appel PayPal REST réel pourra être branché ici.
export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE content_requests
      SET status = 'delivered'
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
      request: result.rows[0],
    });
  } catch (error: any) {
    console.error("❌ ERROR CAPTURING PAYPAL PAYMENT:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}









