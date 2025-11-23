export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer Lolo2003/') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({
      users: users || [],
      pagination: {
        page: 1,
        limit: 20,
        total: users?.length || 0,
        totalPages: 1
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}