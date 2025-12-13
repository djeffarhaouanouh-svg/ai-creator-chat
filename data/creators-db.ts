// ❌ Empêche l'exécution côté client (important pour éviter l'erreur NEON)
if (typeof window !== "undefined") {
  throw new Error("creators-db.ts ne doit jamais être exécuté côté client.");
}

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function getCreatorDBBySlug(slug: string) {
  const rows = await sql`
    SELECT * FROM creators WHERE slug = ${slug} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getAllCreatorsDB() {
  const rows = await sql`SELECT * FROM creators`;
  return rows;
}

