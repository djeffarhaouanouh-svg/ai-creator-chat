import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query(queryText: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(queryText, params);
    return res;
  } finally {
    client.release();
  }
}

export const sql = {
  query: query
};
