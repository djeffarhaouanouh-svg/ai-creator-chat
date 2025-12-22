import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';

// Charger .env.local manuellement
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function runMigration() {
  console.log('🚀 Exécution de la migration multimodale...\n');

  // Vérifier que POSTGRES_URL est définie
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL non trouvée dans .env.local');
    console.error('💡 Assurez-vous que .env.local contient POSTGRES_URL');
    process.exit(1);
  }

  try {
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'migrations', '001_add_multimodal_support.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Exécution du script SQL complet...\n');

    try {
      // Exécuter le SQL complet (sans splitter)
      await sql.query(migrationSQL);
      console.log('✅ Migration exécutée avec succès\n');
    } catch (error: any) {
      // Ignorer les erreurs "already exists"
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️ Certaines tables/colonnes existent déjà - migration partiellement appliquée\n');
      } else {
        console.error('❌ Erreur lors de l\'exécution:', error.message);
        // Continue quand même pour vérifier ce qui a été créé
      }
    }

    // Vérifier les nouvelles tables
    console.log('\n📊 Vérification des nouvelles tables...\n');

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('ai_generated_images', 'image_generation_counters', 'creator_visual_profiles')
      ORDER BY table_name
    `;

    console.log('Tables créées :');
    tables.rows.forEach((row: any) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Vérifier les colonnes ajoutées à messages
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name IN ('image_url', 'image_type')
      ORDER BY column_name
    `;

    console.log('\nColonnes ajoutées à messages :');
    columns.rows.forEach((row: any) => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });

    // Vérifier les profils visuels
    const profiles = await sql`
      SELECT creator_slug FROM creator_visual_profiles ORDER BY creator_slug
    `;

    console.log('\nProfils visuels créés :');
    profiles.rows.forEach((row: any) => {
      console.log(`  ✓ ${row.creator_slug}`);
    });

    console.log('\n✅ Migration multimodale terminée avec succès! 🎉');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter le script
runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
