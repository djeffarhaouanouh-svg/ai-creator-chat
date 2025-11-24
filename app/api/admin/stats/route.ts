export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

// ✅ AJOUTEZ CETTE EXPORT POUR LA COMPATIBILITÉ
export const supabase = getSupabaseClient()

// Types
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