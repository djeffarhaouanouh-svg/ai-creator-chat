/**
 * Utilitaire pour télécharger les images générées par DALL-E
 * et les sauvegarder localement dans /public/generated-images
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Télécharge une image depuis une URL et la sauvegarde localement
 * @param url URL de l'image (généralement depuis DALL-E)
 * @returns URL publique de l'image
 */
export async function downloadImage(url: string): Promise<string> {
  try {
    // Télécharger l'image
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `ai-${timestamp}-${randomString}.png`;

    // Créer le dossier si nécessaire
    const publicDir = join(process.cwd(), 'public', 'generated-images');
    await mkdir(publicDir, { recursive: true });

    // Sauvegarder l'image localement
    const filePath = join(publicDir, fileName);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(filePath, buffer);

    // URL publique (relative depuis /public)
    const publicUrl = `/generated-images/${fileName}`;

    console.log('✅ Image DALL-E sauvegardée localement:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}
