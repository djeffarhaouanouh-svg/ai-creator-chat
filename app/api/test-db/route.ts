import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  }

  try {
    // 1. Vérifier les variables d'environnement
    diagnostics.checks.envVars = {
      POSTGRES_URL: process.env.POSTGRES_URL ? '✅ Définie' : '❌ Manquante',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Définie' : '❌ Manquante',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅ Définie' : '❌ Manquante',
    }

    // 2. Tester la connexion à la base de données
    try {
      const result = await sql`SELECT NOW() as current_time, version() as pg_version`
      diagnostics.checks.database = {
        status: '✅ Connectée',
        currentTime: result.rows[0].current_time,
        version: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]
      }
    } catch (dbError: any) {
      diagnostics.checks.database = {
        status: '❌ Erreur de connexion',
        error: dbError.message,
        code: dbError.code,
        detail: dbError.detail
      }
    }

    // 3. Vérifier les tables
    try {
      const tablesResult = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
      diagnostics.checks.tables = {
        status: '✅ Accessibles',
        count: tablesResult.rows.length,
        list: tablesResult.rows.map((r: any) => r.table_name)
      }
    } catch (tablesError: any) {
      diagnostics.checks.tables = {
        status: '❌ Erreur',
        error: tablesError.message
      }
    }

    // 4. Tester la requête de stats créatrice
    try {
      const creatorsResult = await sql`
        SELECT id, name, slug
        FROM creators
        WHERE slug = 'lauryncrl'
        LIMIT 1
      `

      if (creatorsResult.rows.length > 0) {
        const creator = creatorsResult.rows[0]
        const creatorId = creator.id

        // Tester la requête de comptage
        const statsResult = await sql`
          SELECT
            (SELECT COUNT(*) FROM messages WHERE creator_id = ${creatorId}) as total_messages,
            (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE creator_id = ${creatorId} AND status = 'active') as total_subscribers,
            (SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN subscriptions s ON p.subscription_id = s.id WHERE s.creator_id = ${creatorId} AND p.status = 'succeeded') as total_revenue
        `

        diagnostics.checks.creatorStats = {
          status: '✅ Requête OK',
          creator: creator.name,
          stats: statsResult.rows[0]
        }
      } else {
        diagnostics.checks.creatorStats = {
          status: '⚠️ Créatrice non trouvée',
          message: 'lauryncrl n\'existe pas en base'
        }
      }
    } catch (statsError: any) {
      diagnostics.checks.creatorStats = {
        status: '❌ Erreur',
        error: statsError.message,
        code: statsError.code
      }
    }

    diagnostics.overallStatus = '✅ Diagnostic terminé'

  } catch (error: any) {
    diagnostics.overallStatus = '❌ Erreur fatale'
    diagnostics.fatalError = {
      message: error.message,
      stack: error.stack
    }
  }

  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}
