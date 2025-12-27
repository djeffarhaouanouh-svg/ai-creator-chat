import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/**
 * Calcule un score pour un message basé sur plusieurs critères
 */
function calculateMessageScore(message: {
  content: string
  created_at: string
  length: number
}): number {
  const content = message.content.toLowerCase()
  let score = 0

  // 1. Longueur du message (messages plus longs = plus engagés)
  // Messages entre 50-500 caractères sont idéaux
  if (message.length >= 50 && message.length <= 500) {
    score += 30
  } else if (message.length > 500) {
    score += 20 // Très long mais peut être moins engageant
  } else if (message.length >= 30) {
    score += 15
  }

  // 2. Mots-clés positifs/émotions
  const positiveKeywords = [
    'merci', 'thank', 'génial', 'super', 'incroyable', 'fantastique',
    'adorable', 'magnifique', 'parfait', 'excellent', 'merveilleux',
    'inspire', 'inspirant', 'motivant', 'courage', 'rêve', 'rêves',
    'change', 'changé', 'amélioré', 'améliore', 'aide', 'aidé',
    'amour', '❤️', '💕', '💖', '🔥', '✨', '😍', '🥰',
    'continue', 'continues', 'félicitation', 'bravo', 'chapeau'
  ]

  const keywordMatches = positiveKeywords.filter(keyword => 
    content.includes(keyword)
  ).length
  score += keywordMatches * 5 // +5 points par mot-clé positif

  // 3. Emojis (montrent de l'engagement)
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  const emojiCount = (message.content.match(emojiRegex) || []).length
  score += Math.min(emojiCount * 3, 15) // Max 15 points pour les emojis

  // 4. Questions (montrent de l'engagement)
  const questionCount = (message.content.match(/\?/g) || []).length
  score += questionCount * 2

  // 5. Phrases complètes (message bien rédigé)
  const sentenceCount = (message.content.match(/[.!?]+\s/g) || []).length
  if (sentenceCount >= 2) {
    score += 10
  }

  // 6. Mots uniques (vocabulaire riche)
  const words = content.split(/\s+/).filter(w => w.length > 3)
  const uniqueWords = new Set(words)
  if (uniqueWords.size > 10) {
    score += 10
  }

  // 7. Récent (messages récents sont plus pertinents)
  const messageDate = new Date(message.created_at)
  const daysAgo = (Date.now() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
  if (daysAgo <= 7) {
    score += 15 // Messages de la dernière semaine
  } else if (daysAgo <= 30) {
    score += 10 // Messages du dernier mois
  } else if (daysAgo <= 90) {
    score += 5 // Messages des 3 derniers mois
  }

  // 8. Pénalité pour messages trop courts ou spam
  if (message.length < 10) {
    score = 0 // Messages trop courts
  }

  // 9. Pénalité pour répétitions
  const repeatedChars = message.content.match(/(.)\1{4,}/g)
  if (repeatedChars && repeatedChars.length > 0) {
    score -= 20 // Spam de caractères
  }

  return Math.max(0, score) // Score minimum 0
}

/**
 * POST - Analyser et ajouter automatiquement les meilleurs messages
 */
export async function POST(request: NextRequest) {
  try {
    const { creatorSlug, limit = 10 } = await request.json()

    if (!creatorSlug) {
      return NextResponse.json(
        { error: 'Slug de créatrice requis' },
        { status: 400 }
      )
    }

    // Vérifier que la créatrice existe
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

    // Récupérer tous les messages utilisateurs de cette créatrice
    // Exclure ceux qui sont déjà dans top_messages
    const messagesResult = await sql`
      SELECT 
        m.id,
        m.content,
        m.created_at,
        m.user_id,
        LENGTH(m.content) as content_length
      FROM messages m
      WHERE m.creator_id = ${creatorSlug}
        AND m.role = 'user'
        AND NOT EXISTS (
          SELECT 1 FROM top_messages tm
          WHERE CAST(tm.message_id AS text) = CAST(m.id AS text)
          AND tm.creator_id = ${creatorSlug}
        )
      ORDER BY m.created_at DESC
      LIMIT 200
    `

    if (messagesResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun nouveau message à analyser',
        added: 0
      })
    }

    // Calculer le score pour chaque message
    const scoredMessages = messagesResult.rows.map((msg: any) => ({
      ...msg,
      score: calculateMessageScore({
        content: msg.content,
        created_at: msg.created_at,
        length: parseInt(msg.content_length) || 0
      })
    }))

    // Trier par score décroissant
    scoredMessages.sort((a, b) => b.score - a.score)

    // Filtrer les messages avec score minimum de 40
    const eligibleMessages = scoredMessages.filter(msg => msg.score >= 40)

    if (eligibleMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun message n\'a atteint le score minimum (40)',
        added: 0,
        analyzed: messagesResult.rows.length
      })
    }

    // Récupérer le nombre de messages déjà présents par utilisateur
    const existingCountsResult = await sql`
      SELECT user_id, COUNT(*) as count
      FROM top_messages
      WHERE creator_id = ${creatorSlug}
      GROUP BY user_id
    `
    
    const userMessageCounts = new Map<string, number>()
    existingCountsResult.rows.forEach((row: any) => {
      userMessageCounts.set(row.user_id, parseInt(row.count) || 0)
    })

    // Filtrer les messages pour respecter la limite de 3 messages par utilisateur
    const maxMessagesPerUser = 3
    const topMessages: any[] = []
    const userCounts = new Map<string, number>()

    for (const msg of eligibleMessages) {
      const userId = msg.user_id
      const currentCount = userMessageCounts.get(userId) || 0
      const addedCount = userCounts.get(userId) || 0
      
      // Ne pas ajouter si l'utilisateur a déjà 3 messages (existants + nouveaux)
      if (currentCount + addedCount < maxMessagesPerUser) {
        topMessages.push(msg)
        userCounts.set(userId, addedCount + 1)
        
        // Limite globale
        if (topMessages.length >= parseInt(limit)) {
          break
        }
      }
    }

    if (topMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tous les utilisateurs ont déjà atteint la limite de 3 messages',
        added: 0,
        analyzed: messagesResult.rows.length
      })
    }

    // Ajouter les messages automatiquement dans top_messages
    let addedCount = 0
    for (const msg of topMessages) {
      try {
        // Convertir l'ID en string (peut être UUID ou TEXT selon la structure)
        const messageIdString = typeof msg.id === 'string' ? msg.id : msg.id.toString()
        await sql`
          INSERT INTO top_messages (message_id, creator_id, user_id, created_at)
          VALUES (${messageIdString}, ${creatorSlug}, ${msg.user_id}, NOW())
          ON CONFLICT (message_id, creator_id) DO NOTHING
        `
        addedCount++
      } catch (error: any) {
        // Ignorer les erreurs de conflit (déjà présent)
        if (error.code !== '23505') {
          console.error('Erreur ajout message:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${addedCount} message(s) ajouté(s) automatiquement`,
      added: addedCount,
      analyzed: messagesResult.rows.length,
      topScores: topMessages.slice(0, 5).map((msg: any) => ({
        id: msg.id,
        score: msg.score,
        preview: msg.content.substring(0, 50) + '...'
      }))
    })

  } catch (error: any) {
    console.error('❌ ERREUR ANALYSE AUTOMATIQUE:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse automatique', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET - Obtenir les statistiques d'analyse (pour info)
 */
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

    // Compter les messages automatiques vs manuels (on ne peut pas vraiment distinguer, 
    // mais on peut donner des stats générales)
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_top_messages,
        COUNT(DISTINCT user_id) as unique_users
      FROM top_messages
      WHERE creator_id = ${creatorSlug}
    `

    const totalMessagesResult = await sql`
      SELECT COUNT(*) as total
      FROM messages
      WHERE creator_id = ${creatorSlug}
      AND role = 'user'
    `

    return NextResponse.json({
      total_top_messages: parseInt(statsResult.rows[0]?.total_top_messages || '0'),
      unique_users: parseInt(statsResult.rows[0]?.unique_users || '0'),
      total_user_messages: parseInt(totalMessagesResult.rows[0]?.total || '0')
    })

  } catch (error: any) {
    console.error('❌ ERREUR STATS:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des stats', details: error.message },
      { status: 500 }
    )
  }
}

