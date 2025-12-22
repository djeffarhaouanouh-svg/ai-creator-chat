import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';

// Charger .env.local
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

async function checkProfiles() {
  try {
    console.log('🔍 Vérification des profils visuels...\n');

    const result = await sql`
      SELECT creator_slug, base_description, style_modifiers
      FROM creator_visual_profiles
    `;

    if (result.rows.length === 0) {
      console.log('❌ AUCUN profil visuel trouvé en base !');
      console.log('💡 Les profils doivent être insérés via la migration.\n');
    } else {
      console.log(`✅ ${result.rows.length} profil(s) trouvé(s):\n`);
      result.rows.forEach(row => {
        console.log(`📌 ${row.creator_slug}:`);
        console.log(`   Description: ${row.base_description}`);
        console.log(`   Style: ${row.style_modifiers}\n`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkProfiles();
