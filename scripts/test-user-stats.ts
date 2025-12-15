import { sql } from '@vercel/postgres'

async function testUserStats() {
  console.log('🧪 Test de l\'API de statistiques utilisateur\n')

  try {
    // 1. Vérifier s'il y a des utilisateurs
    console.log('1️⃣ Recherche d\'utilisateurs...')
    const usersResult = await sql`
      SELECT id, name, email, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `

    if (usersResult.rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données!')
      console.log('💡 Il faut créer un utilisateur via l\'inscription\n')

      // Créer un utilisateur de test
      console.log('2️⃣ Création d\'un utilisateur de test...')
      const newUserResult = await sql`
        INSERT INTO users (name, email, is_active)
        VALUES ('Utilisateur Test', 'test@example.com', true)
        ON CONFLICT (email) DO UPDATE SET name = 'Utilisateur Test'
        RETURNING id, name, email
      `
      const testUser = newUserResult.rows[0]
      console.log(`✅ Utilisateur créé: ${testUser.name} (${testUser.email})`)
      console.log(`   ID: ${testUser.id}\n`)

      // Créer un abonnement de test
      console.log('3️⃣ Création d\'un abonnement de test...')
      const creatorResult = await sql`
        SELECT id, name, slug FROM creators LIMIT 1
      `
      if (creatorResult.rows.length > 0) {
        const creator = creatorResult.rows[0]
        await sql`
          INSERT INTO subscriptions (user_id, creator_id, plan, status)
          VALUES (${testUser.id}, ${creator.id}, 'monthly', 'active')
          ON CONFLICT (user_id, creator_id) DO NOTHING
        `
        console.log(`✅ Abonnement créé pour ${creator.name}\n`)
      }

      await testStatsForUser(testUser.id)
    } else {
      console.log(`✅ ${usersResult.rows.length} utilisateur(s) trouvé(s):`)
      usersResult.rows.forEach((user: any, index: number) => {
        console.log(`   ${index + 1}. ${user.name || 'Sans nom'} (${user.email})`)
        console.log(`      ID: ${user.id}`)
      })
      console.log('')

      // Tester avec le premier utilisateur
      await testStatsForUser(usersResult.rows[0].id)
    }

  } catch (error: any) {
    console.error('\n❌ ERREUR DÉTECTÉE:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Détails:', error.detail || 'Aucun détail')
  }
}

async function testStatsForUser(userId: string) {
  console.log(`📊 Test des statistiques pour userId: ${userId}\n`)

  try {
    // Tester chaque requête individuellement
    console.log('Test 1: Récupération utilisateur...')
    const userResult = await sql`
      SELECT id, name, email
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `
    if (userResult.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé!')
      return
    }
    console.log(`✅ Utilisateur: ${userResult.rows[0].name}\n`)

    console.log('Test 2: Comptage des abonnements...')
    const subscriptionsResult = await sql`
      SELECT COUNT(*) as total
      FROM subscriptions
      WHERE user_id = ${userId}
      AND status = 'active'
    `
    const totalSubscriptions = Number(subscriptionsResult.rows[0]?.total) || 0
    console.log(`✅ Abonnements actifs: ${totalSubscriptions}\n`)

    console.log('Test 3: Comptage des messages...')
    const messagesResult = await sql`
      SELECT COUNT(*) as total
      FROM messages
      WHERE user_id = ${userId}
    `
    const totalMessages = Number(messagesResult.rows[0]?.total) || 0
    console.log(`✅ Messages envoyés: ${totalMessages}\n`)

    console.log('Test 4: Calcul des dépenses...')
    const totalSpentResult = await sql`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.user_id = ${userId}
      AND p.status = 'succeeded'
    `
    const totalSpent = Number(totalSpentResult.rows[0]?.total) || 0
    console.log(`✅ Dépenses totales: ${totalSpent}€\n`)

    console.log('Test 5: Liste des abonnements...')
    const subscriptionsListResult = await sql`
      SELECT
        s.id,
        s.user_id,
        s.creator_id,
        s.plan,
        s.status,
        c.name as creator_name,
        c.slug as creator_slug
      FROM subscriptions s
      JOIN creators c ON s.creator_id = c.id
      WHERE s.user_id = ${userId}
      AND s.status = 'active'
      ORDER BY s.started_at DESC
    `
    console.log(`✅ ${subscriptionsListResult.rows.length} abonnement(s) trouvé(s)`)
    subscriptionsListResult.rows.forEach((sub: any, index: number) => {
      console.log(`   ${index + 1}. ${sub.creator_name} (@${sub.creator_slug}) - ${sub.plan}`)
    })

    console.log('\n🎉 Tous les tests sont passés avec succès!')
    console.log('\n📊 Résumé:')
    console.log(`   Abonnements: ${totalSubscriptions}`)
    console.log(`   Messages: ${totalMessages}`)
    console.log(`   Dépenses: ${totalSpent}€`)

  } catch (error: any) {
    console.error('\n❌ ERREUR lors du test:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Stack:', error.stack)
  }
}

testUserStats()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })
