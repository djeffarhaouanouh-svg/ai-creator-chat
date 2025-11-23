// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  creator_id: string
  plan: 'weekly' | 'monthly' | 'yearly'
  status: 'active' | 'cancelled' | 'expired'
  stripe_subscription_id?: string
  started_at: string
  expires_at?: string
  created_at: string
}

export interface Message {
  id: string
  user_id: string
  creator_id: string
  content: string
  role: 'user' | 'assistant'
  tokens_used: number
  timestamp: string
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  subscription_id?: string
  amount: number
  currency: string
  stripe_payment_id?: string
  status: 'pending' | 'succeeded' | 'failed'
  created_at: string
}

export interface GlobalStats {
  total_users: number
  total_subscriptions: number
  total_messages: number
  total_revenue: number
  revenue_this_month: number
}
