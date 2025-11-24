export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer lolo2003J') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select(
        `
        *,
        users (email, name),
        creators (name)
      `
      )
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({
      messages: messages || [],
      pagination: {
        page: 1,
        limit: 50,
        total: messages?.length || 0,
        totalPages: 1
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}