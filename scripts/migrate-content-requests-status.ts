import { sql } from '@vercel/postgres'

async function migrateContentRequestsStatus() {
  console.log('🚀 Migration des statuts content_requests...\n')

  try {
    // 1. Mettre à jour les données existantes
    console.log('📝 Mise à jour des données existantes...')
    await sql`
      UPDATE content_requests 
      SET status = 'price_proposed' 
      WHERE status = 'priced'
    `
    console.log('✅ Statuts "priced" → "price_proposed" mis à jour')

    await sql`
      UPDATE content_requests 
      SET status = 'paid' 
      WHERE status = 'authorized'
    `
    console.log('✅ Statuts "authorized" → "paid" mis à jour')

    // 2. Supprimer l'ancienne contrainte
    console.log('\n📝 Suppression de l\'ancienne contrainte...')
    await sql`
      ALTER TABLE content_requests 
      DROP CONSTRAINT IF EXISTS content_requests_status_check
    `
    console.log('✅ Ancienne contrainte supprimée')

    // 3. Ajouter la nouvelle contrainte
    console.log('\n📝 Ajout de la nouvelle contrainte...')
    await sql`
      ALTER TABLE content_requests 
      ADD CONSTRAINT content_requests_status_check 
      CHECK (status IN ('pending', 'price_proposed', 'paid', 'delivered', 'cancelled'))
    `
    console.log('✅ Nouvelle contrainte ajoutée')

    // 4. Ajouter la colonne media_url si elle n'existe pas
    console.log('\n📝 Vérification de la colonne media_url...')
    try {
      await sql`
        ALTER TABLE content_requests 
        ADD COLUMN IF NOT EXISTS media_url TEXT
      `
      console.log('✅ Colonne media_url vérifiée/ajoutée')
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Colonne media_url existe déjà')
      } else {
        throw error
      }
    }

    // 5. Mettre à jour le commentaire
    console.log('\n📝 Mise à jour du commentaire...')
    await sql`
      COMMENT ON COLUMN content_requests.status IS 'Request status: pending, price_proposed, paid, delivered, cancelled'
    `
    console.log('✅ Commentaire mis à jour')

    console.log('\n✅ Migration terminée avec succès! 🎉')
    console.log('\nLes nouveaux statuts sont maintenant:')
    console.log('  - pending')
    console.log('  - price_proposed')
    console.log('  - paid')
    console.log('  - delivered')
    console.log('  - cancelled')

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la migration:', error.message)
    console.error('\nDétails:', error)
    process.exit(1)
  }
}

// Exécuter la migration
migrateContentRequestsStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })

