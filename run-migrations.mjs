import { Pool } from 'pg';
import { readFileSync } from 'fs';

// Charger les variables d'environnement manuellement
const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const pool = new Pool({
  connectionString: envVars.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('📦 Lecture du fichier de migration...');
    const sql = readFileSync('migrations/create_ai_doubles_tables.sql', 'utf-8');

    console.log('🚀 Exécution des migrations...');
    await client.query(sql);

    console.log('✅ Migrations exécutées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
