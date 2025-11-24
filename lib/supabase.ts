// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export const getSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// ✅ AJOUTEZ CETTE LIGNE
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

export interface Message {
  id: string
  user_id: string
  creator_id: string
  content: string
  role: string
  timestamp: string
}

export interface Payment {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
}