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

    const result = await sql`
      UPDATE content_requests
      SET price = ${price}, status = 'priced'
      WHERE id = ${requestId}::uuid
      RETURNING id, creator_id, user_id, message, status, price, paypal_authorization_id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content request not found" },
        { status: 404 }
      );
    }

    const request = result.rows[0];

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (error: any) {
    console.error("❌ ERROR PRICING CONTENT REQUEST:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



