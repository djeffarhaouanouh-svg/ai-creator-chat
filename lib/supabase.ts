 // lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Fonction pour créer un client
export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Types pour TypeScript
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  last_login?: string
  is_active: boolean
}

export interface Creator {
  id: string
  name: string
  slug: string
  bio?: string
  avatar_url?: string
  personality?: string
  is_active: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
}