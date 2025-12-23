import { sql } from '@vercel/postgres';

async function deleteImagesFromMessages() {
  try {
    const result = await sql`DELETE FROM messages WHERE image_url IS NOT NULL`;
    console.log('✅ Messages avec images supprimés:', result.rowCount);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
  process.exit(0);
}

deleteImagesFromMessages();
