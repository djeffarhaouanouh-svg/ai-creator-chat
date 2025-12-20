import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Livrer le contenu personnalisé : capture PayPal + envoi du message dans le chat
export async function POST(req: Request) {
  try {
    const { requestId, contentUrl, contentType } = await req.json();

    if (!requestId || !contentUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Récupérer la demande avec les infos nécessaires
    const requestResult = await sql`
      SELECT 
        cr.id,
        cr.creator_id,
        cr.user_id,
        cr.status,
        cr.price,
        cr.paypal_authorization_id,
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

    // Vérifier que le statut est 'authorized' (paiement sécurisé)
    if (request.status !== "authorized") {
      return NextResponse.json(
        {
          success: false,
          error: "Le paiement doit être autorisé avant de livrer le contenu",
        },
        { status: 400 }
      );
    }

    // 1. Capturer le paiement PayPal (MVP : on met juste à jour le statut)
    // TODO: Brancher ici l'appel PayPal REST réel pour capturer l'authorization
    // Mettre à jour le statut à 'delivered' et updated_at pour compter les revenus au bon moment
    const captureResult = await sql`
      UPDATE content_requests
      SET status = 'delivered', updated_at = NOW()
      WHERE id = ${requestId}::uuid
      RETURNING id, status
    `;

    if (captureResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update request status" },
        { status: 500 }
      );
    }

    // 2. Créer le message système dans le chat pour le fan
    const messageContent = `🎁 Contenu personnalisé reçu\n\n${
      contentType === "image"
        ? `![Contenu personnalisé](${contentUrl})`
        : contentType === "video"
        ? `📹 [Vidéo personnalisée](${contentUrl})`
        : contentType === "audio"
        ? `🎵 [Audio personnalisé](${contentUrl})`
        : `[Contenu personnalisé](${contentUrl})`
    }`;

    // Insérer le message : la table messages utilise TEXT pour user_id et creator_id (slug)
    // et n'a pas de colonne timestamp, seulement created_at
    const creatorSlug = request.creator_slug;
    if (creatorSlug) {
      try {
        await sql`
          INSERT INTO messages (user_id, creator_id, content, role, created_at)
          VALUES (
            ${request.user_id}::text,
            ${creatorSlug},
            ${messageContent},
            'assistant',
            NOW()
          )
        `;
      } catch (msgError: any) {
        console.error("❌ ERROR INSERTING MESSAGE (non bloquant):", msgError);
        // Ne pas bloquer la livraison si le message ne peut pas être inséré
      }
    }

    return NextResponse.json({
      success: true,
      request: captureResult.rows[0],
      message: "Contenu livré avec succès",
    });
  } catch (error: any) {
    console.error("❌ ERROR DELIVERING CONTENT:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

