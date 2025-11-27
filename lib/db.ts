import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

// NE PAS jeter d'erreur au build → juste pas de pool si non défini
export const pool =
  connectionString
    ? new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
      })
    : null;

export async function query(queryText: string, params?: any[]) {
  if (!pool) {
    throw new Error("Database connection not initialized");
  }

  const client = await pool.connect();
  try {
    return await client.query(queryText, params);
  } finally {
    client.release();
  }
}

export const sql = {
  query,
};