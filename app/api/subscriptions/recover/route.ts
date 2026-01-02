import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * API pour récupérer un paiement PayPal non enregistré
 * Permet de créer un abonnement rétroactivement avec un PayPal order ID
 */
export async function POST(req: Request) {
  try {
    const { paypalOrderId, userId, creatorSlug, amount } = await req.json();

    if (!paypalOrderId) {
      return NextResponse.json(
        { success: false, error: "paypalOrderId est requis" },
        { status: 400 }
      );
    }

    // Vérifier si un paiement avec cet order ID existe déjà
    const existingPayment = await sql`
      SELECT 
        p.id,
        p.user_id,
        p.subscription_id,
        p.amount,
        s.creator_id,
        s.status as subscription_status
      FROM payments p
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      WHERE p.paypal_order_id = ${paypalOrderId}
      LIMIT 1
    `;

    if (existingPayment.rows.length > 0) {
      const payment = existingPayment.rows[0];
      
      // Si l'abonnement existe et est actif, tout est bon
      if (payment.subscription_id && payment.subscription_status === 'active') {
        return NextResponse.json({
          success: true,
          message: "Ce paiement est déjà associé à un abonnement actif",
          paymentId: payment.id,
          subscriptionId: payment.subscription_id
        });
      }

      // Si le paiement existe mais l'abonnement n'existe pas ou est inactif
      return NextResponse.json({
        success: false,
        error: "Un paiement avec cet order ID existe déjà mais l'abonnement n'est pas actif",
        paymentId: payment.id,
        subscriptionId: payment.subscription_id
      }, { status: 400 });
    }

    // Si userId et creatorSlug sont fournis, créer l'abonnement directement
    if (userId && creatorSlug) {
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

      // Vérifier si un abonnement actif existe déjà pour cet utilisateur et créateur
      const existingSubscription = await sql`
        SELECT id FROM subscriptions
        WHERE user_id = ${userId}::uuid
        AND creator_id = ${creatorId}::uuid
        AND status = 'active'
        LIMIT 1
      `;

      if (existingSubscription.rows.length > 0) {
        // Mettre à jour le paiement existant ou créer un nouveau paiement
        const subscriptionId = existingSubscription.rows[0].id;
        
        // Vérifier si un paiement existe déjà pour cet abonnement
        const paymentForSub = await sql`
          SELECT id FROM payments 
          WHERE subscription_id = ${subscriptionId}::uuid 
          AND paypal_order_id IS NULL
          LIMIT 1
        `;

        if (paymentForSub.rows.length > 0) {
          // Mettre à jour le paiement existant avec le PayPal order ID
          await sql`
            UPDATE payments
            SET paypal_order_id = ${paypalOrderId},
                amount = ${amount || paymentForSub.rows[0].amount},
                status = 'succeeded'
            WHERE id = ${paymentForSub.rows[0].id}::uuid
          `;

          return NextResponse.json({
            success: true,
            message: "Paiement récupéré et associé à l'abonnement existant",
            paymentId: paymentForSub.rows[0].id,
            subscriptionId
          });
        } else {
          // Créer un nouveau paiement pour cet abonnement
          const paymentResult = await sql`
            INSERT INTO payments (user_id, subscription_id, amount, currency, status, paypal_order_id)
            VALUES (
              ${userId}::uuid,
              ${subscriptionId}::uuid,
              ${amount || 0},
              'EUR',
              'succeeded',
              ${paypalOrderId}
            )
            RETURNING id
          `;

          return NextResponse.json({
            success: true,
            message: "Paiement récupéré et associé à l'abonnement existant",
            paymentId: paymentResult.rows[0].id,
            subscriptionId
          });
        }
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

      // Créer le paiement
      const paymentResult = await sql`
        INSERT INTO payments (user_id, subscription_id, amount, currency, status, paypal_order_id)
        VALUES (
          ${userId}::uuid,
          ${subscriptionId}::uuid,
          ${amount || 0},
          'EUR',
          'succeeded',
          ${paypalOrderId}
        )
        RETURNING id
      `;

      return NextResponse.json({
        success: true,
        message: "Abonnement créé avec succès pour ce paiement PayPal",
        paymentId: paymentResult.rows[0].id,
        subscriptionId
      });
    }

    // Si seulement paypalOrderId est fourni, retourner les informations disponibles
    return NextResponse.json({
      success: false,
      error: "userId et creatorSlug sont requis pour créer l'abonnement",
      message: "Veuillez fournir userId et creatorSlug pour créer l'abonnement manquant"
    }, { status: 400 });

  } catch (error: any) {
    console.error("❌ ERROR RECOVERING PAYMENT:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

