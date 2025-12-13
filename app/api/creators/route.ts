import { NextResponse } from "next/server";
import { getCreators } from "@/data/creators-merged";

export async function GET() {
  try {
    const creators = await getCreators();
    return NextResponse.json(creators);
  } catch (error) {
    console.error("Erreur API /creators :", error);
    return NextResponse.json(
      { error: "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
