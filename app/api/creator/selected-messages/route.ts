import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorSlug = searchParams.get('slug')

    if (!creatorSlug) {
      return NextResponse.json(
        { error: 'Slug de créatrice requis' },
        { status: 400 }
      )
    }

    const creatorResult = await sql`
      SELECT id, name, slug
      FROM creators
      WHERE slug = ${creatorSlug}
      LIMIT 1
    `

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Créatrice introuvable' },
        { status: 404 }
      )
    }

    const creator = creatorResult.rows[0]

    // Pour l'instant, utiliser uniquement des messages de démo
    const messages = [
        {
          id: 'demo-1',
          fan_nickname: 'SuperFan42',
          content: 'Ton dernier post était incroyable ! Tu m\'inspires vraiment à être la meilleure version de moi-même. Merci pour tout ce que tu partages 💕',
          emotion_badge: 'touching' as const,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-2',
          fan_nickname: 'CoolAdmirateur7',
          content: 'Haha j\'ai trop ri avec ta story d\'hier 😂 C\'était exactement ce dont j\'avais besoin après ma journée. Tu es trop drôle !',
          emotion_badge: 'funny' as const,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-3',
          fan_nickname: 'TopSupporter99',
          content: 'Je voulais juste te dire que tu as changé ma vie. Grâce à tes conseils, j\'ai enfin trouvé le courage de poursuivre mes rêves. Tu es une vraie source d\'inspiration ! ✨',
          emotion_badge: 'touching' as const,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-4',
          fan_nickname: 'GénialFollower23',
          content: 'Waouh, ton nouveau projet a l\'air fou ! J\'ai hâte de voir la suite. Tu oses toujours tout et c\'est tellement inspirant 🔥',
          emotion_badge: 'bold' as const,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'demo-5',
          fan_nickname: 'IncroyableAbonné15',
          content: 'Ta perspective sur la vie est vraiment unique. J\'adore comment tu arrives à voir les choses différemment. Ça me fait réfléchir à plein de trucs 💭',
          emotion_badge: 'interesting' as const,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

    return NextResponse.json({
      messages,
      total: messages.length
    })

  } catch (error: any) {
    console.error('❌ ERREUR MESSAGES SÉLECTIONNÉS:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

function generateNickname(email: string): string {
  const adjectives = ['Cool', 'Super', 'Génial', 'Top', 'Incroyable', 'Fantastique', 'Adorable']
  const nouns = ['Fan', 'Supporter', 'Admirateur', 'Abonné', 'Follower']

  const seed = email.split('@')[0].substring(0, 3).toLowerCase()
  const adjIndex = seed.charCodeAt(0) % adjectives.length
  const nounIndex = seed.charCodeAt(1 % seed.length) % nouns.length
  const number = (seed.charCodeAt(2 % seed.length) % 99) + 1

  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`
}
