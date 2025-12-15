import { sql } from '@vercel/postgres'

async function checkSchema() {
  console.log('🔍 Vérification du schéma de la table creators\n')

  try {
    // Lister toutes les colonnes de la table creators
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'creators'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    console.log('📊 Colonnes de la table creators:')
    console.log('━'.repeat(60))
    columnsResult.rows.forEach((col: any) => {
      console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${col.is_nullable}`)
    })
    console.log('━'.repeat(60))

    // Vérifier si la colonne password existe
    const hasPassword = columnsResult.rows.some((col: any) => col.column_name === 'password')

    if (hasPassword) {
      console.log('\n✅ La colonne "password" existe')
    } else {
      console.log('\n❌ La colonne "password" n\'existe PAS!')
      console.log('   → C\'est probablement la cause de l\'erreur!')
    }

    // Afficher les créatrices existantes
    console.log('\n📝 Créatrices dans la base de données:')
    const creatorsResult = await sql`
      SELECT *
      FROM creators
      ORDER BY created_at DESC
    `

    console.log('━'.repeat(60))
    creatorsResult.rows.forEach((creator: any, index: number) => {
      console.log(`\n${index + 1}. ${creator.name} (@${creator.slug})`)
      console.log(`   ID: ${creator.id}`)
      console.log(`   Active: ${creator.is_active}`)
    })
    console.log('━'.repeat(60))

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message)
    console.error('Stack:', error.stack)
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })
