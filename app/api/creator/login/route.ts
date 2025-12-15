import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!slug || !password) {
      return NextResponse.json(
        { error: "Slug ou mot de passe manquant" },
        { status: 400 }
      );
    }

    const { rows } = await sql`
      SELECT slug, name, password, is_active
      FROM creators
      WHERE slug = ${slug}
      LIMIT 1
    `;

    const creator = rows[0];

    if (!creator || creator.is_active !== true) {
      return NextResponse.json(
        { error: "Créatrice introuvable ou inactive" },
        { status: 401 }
      );
    }

    if (creator.password !== password) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      creator: {
        slug: creator.slug,
        name: creator.name,
      },
    });
  } catch (error: any) {
    console.error("🔥 Erreur login créatrice:", error?.message, error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
