/**
 * Utilitaire pour télécharger les images générées par DALL-E
 * et les sauvegarder dans Vercel Blob Storage
 */

import { put } from '@vercel/blob';

/**
 * Télécharge une image depuis une URL et la sauvegarde dans Vercel Blob
 * @param url URL de l'image (généralement depuis DALL-E)
 * @returns URL publique de l'image sur Vercel Blob
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
    const fileName = `uploads/ai-${timestamp}-${randomString}.png`;

    // Upload vers Vercel Blob Storage
    const blob = await put(fileName, response.body as ReadableStream, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/png',
    });

    console.log('✅ Image DALL-E uploadée vers Blob:', blob.url);

    // Retourner l'URL publique Vercel Blob
    return blob.url;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}
