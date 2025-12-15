import { sql } from '@vercel/postgres'

async function testCreatorStats() {
  console.log('🧪 Test de l\'API de statistiques créatrice\n')

  const creatorSlug = 'lauryncrl' // Slug de Lauryn visible dans la capture d'écran

  try {
    console.log(`📊 Récupération des stats pour: ${creatorSlug}\n`)

    // 1. Récupérer l'ID de la créatrice
    console.log('1️⃣ Recherche de la créatrice...')
    const creatorResult = await sql`
      SELECT id, name, slug
      FROM creators
      WHERE slug = ${creatorSlug}
      LIMIT 1
    `

    if (creatorResult.rows.length === 0) {
      console.error('❌ Créatrice introuvable!')
      return
    }

    const creator = creatorResult.rows[0]
    console.log(`✅ Créatrice trouvée: ${creator.name} (${creator.slug})`)
    console.log(`   ID: ${creator.id}\n`)

    const creatorId = creator.id

    // 2. Compter les messages
    console.log('2️⃣ Comptage des messages...')
    const messagesResult = await sql`
      SELECT COUNT(*) as total
      FROM messages
      WHERE creator_id = ${creatorId}
    `
    const totalMessages = Number(messagesResult.rows[0]?.total) || 0
    console.log(`✅ Total messages: ${totalMessages}\n`)

    // 3. Compter les abonnés
    console.log('3️⃣ Comptage des abonnés...')
    const subscribersResult = await sql`
      SELECT COUNT(DISTINCT user_id) as total
      FROM subscriptions
      WHERE creator_id = ${creatorId}
      AND status = 'active'
    `
    const totalSubscribers = Number(subscribersResult.rows[0]?.total) || 0
    console.log(`✅ Total abonnés: ${totalSubscribers}\n`)

    // 4. Calculer les revenus
    console.log('4️⃣ Calcul des revenus...')
    const revenueResult = await sql`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.creator_id = ${creatorId}
      AND p.status = 'succeeded'
    `
    const totalRevenue = Number(revenueResult.rows[0]?.total) || 0
    console.log(`✅ Total revenus: ${totalRevenue}€\n`)

    console.log('🎉 Tous les tests sont passés avec succès!\n')
    console.log('📊 Résumé des statistiques:')
    console.log(`   Messages: ${totalMessages}`)
    console.log(`   Abonnés: ${totalSubscribers}`)
    console.log(`   Revenus: ${totalRevenue}€`)

  } catch (error: any) {
    console.error('\n❌ ERREUR DÉTECTÉE:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Détails:', error.detail || 'Aucun détail')
    console.error('\nStack trace:', error.stack)
  }
}

testCreatorStats()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })
