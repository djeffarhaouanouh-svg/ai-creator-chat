import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creatorId')
    if (!creatorId) return NextResponse.json({ error: 'Creator ID required' }, { status: 400 })

    const { count: subscriberCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', creatorId).eq('status', 'active')
    const { count: messageCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('creator_id', creatorId)
    
    const { data: subscriptions } = await supabase.from('subscriptions').select('id').eq('creator_id', creatorId)
    const subscriptionIds = subscriptions?.map(s => s.id) || []

    let totalRevenue = 0
    let revenueThisMonth = 0
    if (subscriptionIds.length > 0) {
      const { data: payments } = await supabase.from('payments').select('amount, created_at').in('subscription_id', subscriptionIds).eq('status', 'succeeded')
      totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
      const thisMonth = payments?.filter(p => {
        const date = new Date(p.created_at)
        const now = new Date()
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }) || []
      revenueThisMonth = thisMonth.reduce((sum, p) => sum + p.amount, 0)
    }

    const { data: subscribers } = await supabase.from('subscriptions').select('*, users (id, email, name, created_at)').eq('creator_id', creatorId).eq('status', 'active')
    const { data: messages } = await supabase.from('messages').select('*, users (email, name)').eq('creator_id', creatorId).order('timestamp', { ascending: false }).limit(20)

    return NextResponse.json({
      stats: { subscribers: subscriberCount || 0, messages: messageCount || 0, total_revenue: totalRevenue, revenue_this_month: revenueThisMonth },
      subscribers: subscribers || [],
      recent_messages: messages || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
