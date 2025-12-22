import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contentType = formData.get('contentType') as string || 'image';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Fichier trop volumineux (max 50MB)' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `uploads/${timestamp}-${randomString}.${fileExtension}`;

    // Upload vers Vercel Blob Storage
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('✅ Fichier uploadé vers Blob:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url, // URL publique Vercel Blob
      relativeUrl: blob.url, // Même URL (Blob est déjà absolu)
      fileName: fileName,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error('❌ ERROR UPLOADING FILE:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}







