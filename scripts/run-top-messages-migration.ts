import { sql } from '@vercel/postgres'
import * as fs from 'fs'
import * as path from 'path'

async function runTopMessagesMigration() {
  console.log('🚀 Démarrage de la migration top_messages...\n')

  try {
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'migrations', 'create_top_messages_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📝 Exécution de la migration...\n')

    // Diviser le SQL en commandes individuelles (séparées par ;)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'))

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      try {
        await sql.query(command)
        console.log(`✅ Commande ${i + 1}/${commands.length} exécutée avec succès`)
      } catch (error: any) {
        // Ignorer les erreurs "already exists"
        if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
          console.log(`⚠️  Commande ${i + 1}/${commands.length} ignorée (déjà existante)`)
        } else {
          throw error
        }
      }
    }

    console.log('✅ Migration exécutée avec succès! 🎉\n')

    // Vérifier que la table existe
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'top_messages'
    `

    if (tablesResult.rows.length > 0) {
      console.log('✅ Table top_messages créée avec succès!')
      
      // Afficher la structure de la table
      const columnsResult = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'top_messages'
        ORDER BY ordinal_position
      `

      console.log('\n📊 Structure de la table:')
      columnsResult.rows.forEach((row: any) => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`)
      })
    } else {
      console.log('⚠️  Table top_messages introuvable après la migration')
    }

  } catch (error: any) {
    // Ignorer les erreurs "already exists"
    if (error.message && error.message.includes('already exists')) {
      console.log('⚠️  La table existe déjà, migration ignorée')
    } else {
      console.error('\n❌ Erreur lors de la migration:', error.message)
      console.error('Détails:', error)
      process.exit(1)
    }
  }
}

// Exécuter le script
runTopMessagesMigration()
  .then(() => {
    console.log('\n✅ Migration terminée!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })

