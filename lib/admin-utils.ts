// lib/admin-utils.ts
// Fonctions utilitaires pour gérer les données admin

import { supabase } from './supabase'
import type { User, Creator, Subscription, Message, Payment } from './supabase'

// ============================================
// UTILISATEURS
// ============================================

export async function createUser(email: string, name?: string) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, name }])
    .select()
    .single()
  
  if (error) throw error
  return data as User
}

export async function getUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data as User
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error) return null
  return data as User
}

export async function updateUserLastLogin(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId)
  
  if (error) throw error
  return data
}

// ============================================
// CRÉATRICES
// ============================================

export async function createCreator(creator: {
  name: string
  slug: string
  bio?: string
  avatar_url?: string
  personality?: string
}) {
  const { data, error } = await supabase
    .from('creators')
    .insert([creator])
    .select()
    .single()
  
  if (error) throw error
  return data as Creator
}

export async function getCreatorBySlug(slug: string) {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (error) return null
  return data as Creator
}

export async function getAllCreators() {
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data as Creator[]
}

// ============================================
// ABONNEMENTS
// ============================================

export async function createSubscription(subscription: {
  user_id: string
  creator_id: string
  plan: 'weekly' | 'monthly' | 'yearly'
  stripe_subscription_id?: string
  expires_at?: string
}) {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([{
      ...subscription,
      status: 'active',
      started_at: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (error) throw error
  return data as Subscription
}

export async function getUserSubscriptions(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      creators (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
  
  if (error) throw error
  return data
}

export async function checkUserHasAccess(userId: string, creatorId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('creator_id', creatorId)
    .eq('status', 'active')
    .single()
  
  return !error && data !== null
}

export async function cancelSubscription(subscriptionId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscriptionId)
  
  if (error) throw error
  return data
}

// ============================================
// MESSAGES
// ============================================

export async function saveMessage(message: {
  user_id: string
  creator_id: string
  content: string
  role: 'user' | 'assistant'
  tokens_used?: number
}) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      ...message,
      timestamp: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (error) throw error
  return data as Message
}

export async function getConversationHistory(
  userId: string,
  creatorId: string,
  limit: number = 50
) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .eq('creator_id', creatorId)
    .order('timestamp', { ascending: true })
    .limit(limit)
  
  if (error) throw error
  return data as Message[]
}

export async function deleteConversation(userId: string, creatorId: string) {
  const { data, error } = await supabase
    .from('messages')
    .delete()
    .eq('user_id', userId)
    .eq('creator_id', creatorId)
  
  if (error) throw error
  return data
}

// ============================================
// PAIEMENTS
// ============================================

export async function createPayment(payment: {
  user_id: string
  subscription_id?: string
  amount: number
  currency?: string
  stripe_payment_id?: string
}) {
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      ...payment,
      status: 'pending',
      currency: payment.currency || 'EUR'
    }])
    .select()
    .single()
  
  if (error) throw error
  return data as Payment
}

export async function updatePaymentStatus(
  paymentId: string,
  status: 'succeeded' | 'failed'
) {
  const { data, error } = await supabase
    .from('payments')
    .update({ status })
    .eq('id', paymentId)
  
  if (error) throw error
  return data
}

export async function getUserPayments(userId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Payment[]
}

// ============================================
// STATISTIQUES
// ============================================

export async function getGlobalStats() {
  const { data, error } = await supabase.rpc('get_global_stats')
  
  if (error) throw error
  return data
}

export async function getCreatorStats(creatorId: string) {
  // Nombre d'abonnés
  const { count: subscriberCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
    .eq('status', 'active')
  
  // Nombre de messages
  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
  
  // Revenus générés
  // 1) On récupère d’abord les IDs des subscriptions du créateur
const { data: subscriptions, error: subError } = await supabase
  .from('subscriptions')
  .select('id')
  .eq('creator_id', creatorId);

if (subError) {
  throw subError;
}

// On transforme en tableau d’ids
const subscriptionIds = (subscriptions ?? []).map((s) => s.id);

// Si pas d’abos → pas de paiements
if (subscriptionIds.length === 0) {
  return []; // ou ce que ta fonction doit renvoyer dans ce cas
}

// 2) On récupère les payments liés à ces subscriptions
const { data: payments, error: payError } = await supabase
  .from('payments')
  .select('*')
  .eq('status', 'succeeded')
  .in('subscription_id', subscriptionIds);

if (payError) {
  throw payError;
}

return payments;

  
  const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
  
  return {
    subscribers: subscriberCount || 0,
    messages: messageCount || 0,
    revenue: totalRevenue
  }
}

// ============================================
// EXPORT DE DONNÉES
// ============================================

export async function exportUsersToCSV() {
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (!users) return ''
  
  const headers = ['Email', 'Name', 'Created At', 'Last Login', 'Active']
  const rows = users.map(u => [
    u.email,
    u.name || '',
    new Date(u.created_at).toLocaleDateString('fr-FR'),
    u.last_login ? new Date(u.last_login).toLocaleDateString('fr-FR') : 'Jamais',
    u.is_active ? 'Oui' : 'Non'
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export async function exportPaymentsToCSV(startDate?: Date, endDate?: Date) {
  let query = supabase
    .from('payments')
    .select(`
      *,
      users (email)
    `)
    .order('created_at', { ascending: false })
  
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString())
  }
  
  const { data: payments } = await query
  
  if (!payments) return ''
  
  const headers = ['Date', 'User Email', 'Amount', 'Currency', 'Status', 'Stripe ID']
  const rows = payments.map(p => [
    new Date(p.created_at).toLocaleDateString('fr-FR'),
    (p.users as any)?.email || 'N/A',
    p.amount.toString(),
    p.currency,
    p.status,
    p.stripe_payment_id || 'N/A'
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}
