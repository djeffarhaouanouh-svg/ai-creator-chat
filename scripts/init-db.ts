import { sql } from '@vercel/postgres'
import * as fs from 'fs'
import * as path from 'path'

async function initializeDatabase() {
  console.log('🚀 Initialisation de la base de données...\n')

  try {
    // Lire le fichier de schéma
    const schemaPath = path.join(process.cwd(), 'supabase-schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8')

    // Diviser le SQL en commandes individuelles
    const commands = schemaSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📝 Exécution de ${commands.length} commandes SQL...\n`)

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      try {
        // Ignorer les commandes RLS (Row Level Security) car elles sont spécifiques à Supabase
        if (
          command.includes('ENABLE ROW LEVEL SECURITY') ||
          command.includes('CREATE POLICY') ||
          command.includes('auth.uid()')
        ) {
          console.log(`⏭️  Commande ${i + 1}/${commands.length} ignorée (RLS - spécifique à Supabase)`)
          continue
        }

        await sql.query(command)
        console.log(`✅ Commande ${i + 1}/${commands.length} exécutée avec succès`)
      } catch (error: any) {
        // Ignorer les erreurs "already exists"
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Commande ${i + 1}/${commands.length} ignorée (déjà existante)`)
        } else {
          console.error(`❌ Erreur commande ${i + 1}:`, error.message)
        }
      }
    }

    // Lire le fichier de mise à jour
    const updatePath = path.join(process.cwd(), '4-update-database.sql')
    const updateSQL = fs.readFileSync(updatePath, 'utf-8')

    const updateCommands = updateSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'))

    console.log(`\n📝 Exécution de ${updateCommands.length} commandes de mise à jour...\n`)

    for (let i = 0; i < updateCommands.length; i++) {
      const command = updateCommands[i]
      try {
        await sql.query(command)
        console.log(`✅ Mise à jour ${i + 1}/${updateCommands.length} exécutée avec succès`)
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Mise à jour ${i + 1}/${updateCommands.length} ignorée (déjà existante)`)
        } else {
          console.error(`❌ Erreur mise à jour ${i + 1}:`, error.message)
        }
      }
    }

    // Vérifier les tables créées
    console.log('\n📊 Vérification des tables créées...\n')
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `

    console.log('Tables présentes dans la base de données:')
    tablesResult.rows.forEach((row: any) => {
      console.log(`  ✓ ${row.table_name}`)
    })

    console.log('\n✅ Initialisation terminée avec succès! 🎉')

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'initialisation:', error)
    process.exit(1)
  }
}

// Exécuter le script
initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })
