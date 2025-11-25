// lib/db.ts
import { sql } from '@vercel/postgres';

export { sql };

// Types (identiques à votre supabase.ts)
export interface User {
  id: string;
  email: string;
  name?: string;
  password_hash?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface Creator {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar_url?: string;
  personality?: string;
  password?: string;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  creator_id: string;
  plan: string;
  status: string;
  stripe_subscription_id?: string;
  started_at: string;
  expires_at?: string;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  creator_id: string;
  content: string;
  role: string;
  tokens_used: number;
  timestamp: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  stripe_payment_id?: string;
  status: string;
  created_at: string;
}

// Helper functions pour remplacer les appels Supabase

// SELECT * FROM table WHERE ...
export async function queryAll<T>(
  tableName: string,
  filters?: Record<string, any>
): Promise<T[]> {
  try {
    if (!filters || Object.keys(filters).length === 0) {
      const result = await sql.query(`SELECT * FROM ${tableName}`);
      return result.rows as T[];
    }

    const conditions = Object.entries(filters)
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const values = Object.values(filters);
    const result = await sql.query(
      `SELECT * FROM ${tableName} WHERE ${conditions}`,
      values
    );
    
    return result.rows as T[];
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }
}

// SELECT * FROM table WHERE ... LIMIT 1
export async function queryOne<T>(
  tableName: string,
  filters: Record<string, any>
): Promise<T | null> {
  try {
    const conditions = Object.entries(filters)
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const values = Object.values(filters);
    const result = await sql.query(
      `SELECT * FROM ${tableName} WHERE ${conditions} LIMIT 1`,
      values
    );
    
    return result.rows[0] as T || null;
  } catch (error) {
    console.error(`Error querying one from ${tableName}:`, error);
    throw error;
  }
}

// INSERT INTO table
export async function insertOne<T>(
  tableName: string,
  data: Record<string, any>
): Promise<T> {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const result = await sql.query(
      `INSERT INTO ${tableName} (${keys.join(', ')}) 
       VALUES (${placeholders}) 
       RETURNING *`,
      values
    );
    
    return result.rows[0] as T;
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }
}

// UPDATE table SET ... WHERE ...
export async function updateOne<T>(
  tableName: string,
  filters: Record<string, any>,
  data: Record<string, any>
): Promise<T | null> {
  try {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const whereClause = Object.keys(filters)
      .map((key, index) => `${key} = $${Object.keys(data).length + index + 1}`)
      .join(' AND ');
    
    const values = [...Object.values(data), ...Object.values(filters)];
    
    const result = await sql.query(
      `UPDATE ${tableName} 
       SET ${setClause} 
       WHERE ${whereClause} 
       RETURNING *`,
      values
    );
    
    return result.rows[0] as T || null;
  } catch (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }
}

// DELETE FROM table WHERE ...
export async function deleteOne(
  tableName: string,
  filters: Record<string, any>
): Promise<boolean> {
  try {
    const whereClause = Object.keys(filters)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const values = Object.values(filters);
    
    const result = await sql.query(
      `DELETE FROM ${tableName} WHERE ${whereClause}`,
      values
    );
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
}