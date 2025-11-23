export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer Lolo2003/') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer les stats globales
    const { data: statsData, error: statsError } = await supabase.rpc('get_global_stats')
    
    if (statsError) {
      console.error('Stats error:', statsError)
      throw statsError
    }

    // Stats par créatrice
    const { data: creators } = await supabase
      .from('creators')
      .select('id, name')

    const byCreator = creators?.map(c => ({
      creator_id: c.id,
      creators: { name: c.name },
      count: 0
    })) || []

    // Revenus (vide pour l'instant)
    const revenueChart: any[] = []

    return NextResponse.json({
      global: statsData,
      byCreator,
      revenueChart
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}