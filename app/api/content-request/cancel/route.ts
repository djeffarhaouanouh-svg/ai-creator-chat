import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Annuler une demande de contenu personnalisé
export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe
    const requestResult = await sql`
      SELECT 
        cr.id,
        cr.status,
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
        { success: false, error: "Demande de contenu non trouvée" },
        { status: 404 }
      );
    }

    const request = requestResult.rows[0];

    // Vérifier que la demande peut être annulée (pas déjà livrée ou payée)
    if (request.status === 'delivered') {
      return NextResponse.json(
        { success: false, error: "Impossible d'annuler une demande déjà livrée" },
        { status: 400 }
      );
    }

    if (request.status === 'paid') {
      return NextResponse.json(
        { success: false, error: "Impossible d'annuler une demande déjà payée" },
        { status: 400 }
      );
    }

    // Mettre à jour le statut à 'cancelled'
    await sql`
      UPDATE content_requests
      SET status = 'cancelled'
      WHERE id = ${requestId}::uuid
    `;

    // Pas de message dans le chat - annulation silencieuse

    return NextResponse.json({
      success: true,
      message: "Demande annulée avec succès",
    });
  } catch (error: any) {
    console.error("❌ ERROR CANCELLING CONTENT REQUEST:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

