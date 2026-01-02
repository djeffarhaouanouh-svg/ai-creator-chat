import { sql } from '@vercel/postgres'
import * as readline from 'readline'

/**
 * Script pour récupérer un paiement PayPal non enregistré
 * Permet de créer un abonnement rétroactivement avec un PayPal order ID
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function recoverPayment() {
  try {
    console.log('🔍 Récupération d\'un paiement PayPal non enregistré\n')
    console.log('Vous aurez besoin du PayPal Order ID que vous pouvez trouver dans :')
    console.log('  - Votre email de confirmation PayPal')
    console.log('  - Votre compte PayPal > Activité\n')

    const paypalOrderId = await question('PayPal Order ID: ')
    
    if (!paypalOrderId || paypalOrderId.trim() === '') {
      console.error('❌ PayPal Order ID requis')
      process.exit(1)
    }

    // Vérifier si un paiement avec cet order ID existe déjà
    const existingPayment = await sql`
      SELECT 
        p.id,
        p.user_id,
        p.subscription_id,
        p.amount,
        p.status,
        s.creator_id,
        s.status as subscription_status,
        c.slug as creator_slug,
        u.email as user_email
      FROM payments p
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      LEFT JOIN creators c ON s.creator_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.paypal_order_id = ${paypalOrderId.trim()}
      LIMIT 1
    `

    if (existingPayment.rows.length > 0) {
      const payment = existingPayment.rows[0]
      console.log('\n✅ Paiement trouvé dans la base de données:')
      console.log(`   Payment ID: ${payment.id}`)
      console.log(`   Montant: ${payment.amount}€`)
      console.log(`   Statut: ${payment.status}`)
      console.log(`   Utilisateur: ${payment.user_email || payment.user_id}`)
      
      if (payment.subscription_id) {
        console.log(`   Abonnement ID: ${payment.subscription_id}`)
        console.log(`   Statut abonnement: ${payment.subscription_status}`)
        console.log(`   Créateur: ${payment.creator_slug || payment.creator_id}`)
        
        if (payment.subscription_status === 'active') {
          console.log('\n✅ L\'abonnement est actif. Tout est en ordre !')
        } else {
          console.log('\n⚠️  L\'abonnement existe mais n\'est pas actif.')
        }
      } else {
        console.log('\n⚠️  Le paiement existe mais n\'a pas d\'abonnement associé.')
      }
      
      rl.close()
      process.exit(0)
    }

    console.log('\n⚠️  Aucun paiement trouvé avec cet Order ID.')
    console.log('Cela signifie que le paiement n\'a pas été enregistré en base de données.\n')

    const userId = await question('User ID (UUID de l\'utilisateur): ')
    const creatorSlug = await question('Creator Slug (ex: lauryncrl): ')
    const amountStr = await question('Montant payé (en EUR, optionnel): ')

    if (!userId || !creatorSlug) {
      console.error('❌ userId et creatorSlug sont requis')
      rl.close()
      process.exit(1)
    }

    const amount = amountStr ? parseFloat(amountStr) : null

    console.log('\n🚀 Création de l\'abonnement...\n')

    // Récupérer l'UUID du créateur depuis son slug
    const creatorResult = await sql`
      SELECT id, name FROM creators WHERE slug = ${creatorSlug.trim()} LIMIT 1
    `

    if (creatorResult.rows.length === 0) {
      console.error(`❌ Créateur "${creatorSlug}" non trouvé`)
      rl.close()
      process.exit(1)
    }

    const creatorId = creatorResult.rows[0].id
    const creatorName = creatorResult.rows[0].name

    // Vérifier si un abonnement actif existe déjà
    const existingSubscription = await sql`
      SELECT id FROM subscriptions
      WHERE user_id = ${userId.trim()}::uuid
      AND creator_id = ${creatorId}::uuid
      AND status = 'active'
      LIMIT 1
    `

    let subscriptionId: string

    if (existingSubscription.rows.length > 0) {
      subscriptionId = existingSubscription.rows[0].id
      console.log(`ℹ️  Un abonnement actif existe déjà pour cet utilisateur et créateur`)
      console.log(`   Abonnement ID: ${subscriptionId}\n`)
    } else {
      // Créer un nouvel abonnement (durée : 30 jours)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const subscriptionResult = await sql`
        INSERT INTO subscriptions (user_id, creator_id, plan, status, started_at, expires_at)
        VALUES (
          ${userId.trim()}::uuid,
          ${creatorId}::uuid,
          'monthly',
          'active',
          NOW(),
          ${expiresAt.toISOString()}
        )
        RETURNING id
      `

      subscriptionId = subscriptionResult.rows[0].id
      console.log(`✅ Abonnement créé: ${subscriptionId}`)
      console.log(`   Créateur: ${creatorName} (${creatorSlug})`)
      console.log(`   Expire le: ${expiresAt.toLocaleDateString('fr-FR')}\n`)
    }

    // Créer ou mettre à jour le paiement
    const paymentCheck = await sql`
      SELECT id FROM payments 
      WHERE subscription_id = ${subscriptionId}::uuid 
      AND paypal_order_id IS NULL
      LIMIT 1
    `

    let paymentId: string

    if (paymentCheck.rows.length > 0) {
      // Mettre à jour le paiement existant
      await sql`
        UPDATE payments
        SET paypal_order_id = ${paypalOrderId.trim()},
            amount = ${amount || 0},
            status = 'succeeded'
        WHERE id = ${paymentCheck.rows[0].id}::uuid
      `
      paymentId = paymentCheck.rows[0].id
      console.log(`✅ Paiement mis à jour: ${paymentId}`)
    } else {
      // Créer un nouveau paiement
      const paymentResult = await sql`
        INSERT INTO payments (user_id, subscription_id, amount, currency, status, paypal_order_id)
        VALUES (
          ${userId.trim()}::uuid,
          ${subscriptionId}::uuid,
          ${amount || 0},
          'EUR',
          'succeeded',
          ${paypalOrderId.trim()}
        )
        RETURNING id
      `
      paymentId = paymentResult.rows[0].id
      console.log(`✅ Paiement créé: ${paymentId}`)
    }

    console.log(`   PayPal Order ID: ${paypalOrderId.trim()}`)
    if (amount) {
      console.log(`   Montant: ${amount}€`)
    }

    console.log('\n🎉 Paiement récupéré avec succès !')
    console.log('   L\'utilisateur peut maintenant accéder à son abonnement.\n')

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la récupération:', error.message)
    if (error.message?.includes('does not exist')) {
      console.error('\n⚠️  Il semble que la colonne paypal_order_id n\'existe pas encore.')
      console.error('   Exécutez d\'abord la migration: npx tsx scripts/add-paypal-order-id.ts\n')
    }
  } finally {
    rl.close()
  }
}

// Exécuter le script
recoverPayment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })

