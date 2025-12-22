/**
 * Convertit une image (URL ou fichier local) en base64 pour Claude Vision
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Convertit une image locale en base64
 * @param imageUrl URL relative (ex: /uploads/image.jpg) ou absolue
 * @returns Objet avec data (base64) et media_type
 */
export async function imageToBase64(imageUrl: string): Promise<{
  data: string;
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}> {
  try {
    // Si c'est une URL relative (/uploads/...)
    if (imageUrl.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', imageUrl);
      const buffer = await readFile(filePath);
      const base64 = buffer.toString('base64');

      // Détecter le type MIME
      const extension = imageUrl.split('.').pop()?.toLowerCase();
      let media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';

      if (extension === 'png') media_type = 'image/png';
      else if (extension === 'gif') media_type = 'image/gif';
      else if (extension === 'webp') media_type = 'image/webp';

      return { data: base64, media_type };
    }

    // Si c'est une URL absolue (http://...)
    if (imageUrl.startsWith('http')) {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      // Détecter le type MIME depuis Content-Type
      const contentType = response.headers.get('content-type');
      let media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';

      if (contentType?.includes('png')) media_type = 'image/png';
      else if (contentType?.includes('gif')) media_type = 'image/gif';
      else if (contentType?.includes('webp')) media_type = 'image/webp';

      return { data: base64, media_type };
    }

    throw new Error('Format d\'URL non supporté');
  } catch (error) {
    console.error('Erreur conversion image en base64:', error);
    throw error;
  }
}
