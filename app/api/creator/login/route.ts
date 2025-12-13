import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { slug, password } = await request.json();

    if (!slug || !password) {
      return NextResponse.json(
        { error: "Slug et mot de passe requis" },
        { status: 400 }
      );
    }

    // Vérifie que la DB est bien initialisée
    if (!pool) {
      console.error("❌ Database non initialisée !");
      return NextResponse.json(
        { error: "Erreur interne : base de données non initialisée" },
        { status: 500 }
      );
    }

    // Requête SQL
    const query = `
      SELECT id, name, slug, password_hash
      FROM creators
      WHERE slug = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [slug]);
    const creator = result.rows[0];

    // Vérifie si la créatrice existe
    if (!creator) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Vérifie le mot de passe
    const valid = await bcrypt.compare(password, creator.password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Succès : on renvoie les infos publiques
    return NextResponse.json({
      success: true,
      creator: {
        id: creator.id,
        name: creator.name,
        slug: creator.slug,
      },
    });

  } catch (error) {
    console.error("🔥 Erreur login créatrice :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
