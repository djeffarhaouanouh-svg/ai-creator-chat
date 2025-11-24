export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const { email, password } = await request.json()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}