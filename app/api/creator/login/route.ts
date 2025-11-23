import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const { slug, password } = await request.json()

    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('slug', slug)
      .eq('password', password)
      .single()

    if (error || !creator) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      creator: { id: creator.id, name: creator.name, slug: creator.slug }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur de connexion' }, { status: 500 })
  }
}
