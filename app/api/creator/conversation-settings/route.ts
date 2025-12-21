import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - Récupérer le setting IA pour une conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorSlug = searchParams.get('slug')
    const userId = searchParams.get('userId')

    if (!creatorSlug || !userId) {
      return NextResponse.json(
        { error: 'Slug et userId requis' },
        { status: 400 }
      )
    }

    // Récupérer l'ID de la créatrice
    const creatorResult = await sql`
      SELECT id FROM creators WHERE slug = ${creatorSlug} LIMIT 1
    `

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Créatrice introuvable' },
        { status: 404 }
      )
    }

    const creatorId = creatorResult.rows[0].id

    // Récupérer le setting (par défaut activé si pas de setting)
    try {
      const settingsResult = await sql`
        SELECT ai_enabled
        FROM conversation_settings
        WHERE user_id = ${userId}::uuid
          AND creator_id = ${creatorId}::uuid
        LIMIT 1
      `

      const aiEnabled = settingsResult.rows.length > 0
        ? settingsResult.rows[0].ai_enabled
        : true // Par défaut activé

      return NextResponse.json({
        ai_enabled: aiEnabled
      })
    } catch (err: any) {
      // Table n'existe pas encore, retourner valeur par défaut
      return NextResponse.json({
        ai_enabled: true
      })
    }

  } catch (error: any) {
    console.error('❌ ERREUR RÉCUPÉRATION SETTING:', error.message)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Activer/désactiver l'IA pour une conversation
export async function POST(request: NextRequest) {
  try {
    const { creatorSlug, userId, aiEnabled } = await request.json()

    if (!creatorSlug || !userId || typeof aiEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    // Récupérer l'ID de la créatrice
    const creatorResult = await sql`
      SELECT id FROM creators WHERE slug = ${creatorSlug} LIMIT 1
    `

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Créatrice introuvable' },
        { status: 404 }
      )
    }

    const creatorId = creatorResult.rows[0].id

    // Créer la table si elle n'existe pas et insérer/mettre à jour le setting
    try {
      // Créer la table si elle n'existe pas
      await sql`
        CREATE TABLE IF NOT EXISTS conversation_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          creator_id UUID NOT NULL,
          ai_enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, creator_id)
        )
      `

      // Insérer ou mettre à jour le setting
      const result = await sql`
        INSERT INTO conversation_settings (user_id, creator_id, ai_enabled, updated_at)
        VALUES (${userId}::uuid, ${creatorId}::uuid, ${aiEnabled}, NOW())
        ON CONFLICT (user_id, creator_id)
        DO UPDATE SET ai_enabled = ${aiEnabled}, updated_at = NOW()
        RETURNING id, user_id, creator_id, ai_enabled
      `

      console.log('✅ Setting IA mis à jour:', {
        userId,
        creatorId: creatorId,
        creatorSlug,
        aiEnabled,
        result: result.rows[0]
      })

      return NextResponse.json({
        success: true,
        ai_enabled: aiEnabled
      })
    } catch (err: any) {
      console.error('❌ ERREUR MISE À JOUR SETTING:', err.message)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour', details: err.message },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ ERREUR SETTING:', error.message)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}






