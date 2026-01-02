import { sql } from '@vercel/postgres'
import * as fs from 'fs'
import * as path from 'path'

async function addPaypalOrderIdColumn() {
  try {
    console.log('🚀 Ajout de la colonne paypal_order_id à la table payments...\n')

    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'migrations', 'add_paypal_order_id_to_payments.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Exécuter la migration
    await sql.query(migrationSQL)

    console.log('✅ Colonne paypal_order_id ajoutée avec succès !')
    console.log('✅ Index créé avec succès !')
    console.log('\n🎉 Migration terminée ! Vous pouvez maintenant créer des abonnements PayPal.')

  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('ℹ️  La colonne paypal_order_id existe déjà. Aucune action nécessaire.')
    } else {
      console.error('❌ Erreur lors de la migration:', error)
      process.exit(1)
    }
  }
}

// Exécuter le script
addPaypalOrderIdColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })

