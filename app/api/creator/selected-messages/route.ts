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

    // 1. Récupérer l'ID de la créatrice
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
    const creatorId = creator.id

    // 2. Récupérer les messages marqués comme "sélectionnés"
    // Pour l'instant, on sélectionne les 10 derniers messages
    // TODO: Ajouter un champ "is_selected" dans la table messages
    const messagesResult = await sql`
      SELECT
        m.id,
        m.content,
        m.created_at,
        u.name as fan_name,
        u.email as fan_email
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.creator_id = ${creatorId}
      AND m.role = 'user'
      ORDER BY m.created_at DESC
      LIMIT 10
    `

    // 3. Formater les messages avec badges émotionnels (assignation aléatoire pour démo)
    const emotions: Array<'touching' | 'funny' | 'bold' | 'interesting'> = [
      'touching',
      'funny',
      'bold',
      'interesting'
    ]

    const messages = messagesResult.rows.map((msg: any) => {
      // Générer un surnom anonyme basé sur l'email
      const nickname = generateNickname(msg.fan_email)

      // Assigner un badge émotionnel (pour démo, aléatoire)
      const emotion = emotions[Math.floor(Math.random() * emotions.length)]

      return {
        id: msg.id,
        fan_nickname: nickname,
        content: msg.content,
        emotion_badge: emotion,
        created_at: msg.created_at
      }
    })

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

// Générer un surnom anonyme à partir de l'email
function generateNickname(email: string): string {
  const adjectives = ['Cool', 'Super', 'Génial', 'Top', 'Incroyable', 'Fantastique', 'Adorable']
  const nouns = ['Fan', 'Supporter', 'Admirateur', 'Abonné', 'Follower']

  // Utiliser les 3 premiers caractères de l'email comme seed
  const seed = email.split('@')[0].substring(0, 3).toLowerCase()
  const adjIndex = seed.charCodeAt(0) % adjectives.length
  const nounIndex = seed.charCodeAt(1 % seed.length) % nouns.length
  const number = (seed.charCodeAt(2 % seed.length) % 99) + 1

  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`
}
