import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: Request) {
  try {
    const { userId, creatorSlug, paypalOrderId, amount } = await req.json();

    if (!userId || !creatorSlug) {
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

    // Vérifier si un abonnement actif existe déjà
    const existingSubscription = await sql`
      SELECT id FROM subscriptions
      WHERE user_id = ${userId}::uuid
      AND creator_id = ${creatorId}::uuid
      AND status = 'active'
      LIMIT 1
    `;

    if (existingSubscription.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Subscription already exists",
        subscriptionId: existingSubscription.rows[0].id
      });
    }

    // Créer un nouvel abonnement (durée : 30 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const subscriptionResult = await sql`
      INSERT INTO subscriptions (user_id, creator_id, plan, status, started_at, expires_at)
      VALUES (
        ${userId}::uuid,
        ${creatorId}::uuid,
        'monthly',
        'active',
        NOW(),
        ${expiresAt.toISOString()}
      )
      RETURNING id
    `;

    const subscriptionId = subscriptionResult.rows[0].id;

    // Enregistrer le paiement si paypalOrderId est fourni
    if (paypalOrderId && amount) {
      await sql`
        INSERT INTO payments (subscription_id, amount, currency, status, paypal_order_id)
        VALUES (
          ${subscriptionId}::uuid,
          ${amount},
          'EUR',
          'succeeded',
          ${paypalOrderId}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
      message: "Subscription created successfully"
    });

  } catch (error: any) {
    console.error("❌ ERROR CREATING SUBSCRIPTION:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
