/**
 * Utilitaire pour télécharger les images générées par DALL-E
 * et les sauvegarder localement dans public/uploads/
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Télécharge une image depuis une URL et la sauvegarde localement
 * @param url URL de l'image (généralement depuis DALL-E)
 * @returns Chemin relatif de l'image sauvegardée (ex: /uploads/ai-123456-abc.png)
 */
export async function downloadImage(url: string): Promise<string> {
  try {
    // Télécharger l'image
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `ai-${timestamp}-${randomString}.png`;

    // Sauvegarder dans public/uploads/
    const filePath = join(process.cwd(), 'public', 'uploads', fileName);
    await writeFile(filePath, Buffer.from(buffer));

    // Retourner le chemin relatif
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}
