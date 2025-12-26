import { NextResponse } from 'next/server';
import { checkAndTriggerAutomatedMessages } from '@/lib/automated-messages';

export const dynamic = 'force-dynamic';

// POST - Vérifier et déclencher les messages automatiques basés sur le compteur
export async function POST(request: Request) {
  try {
    console.log('🎯 check-trigger endpoint called via HTTP');
    const { userId, creatorId } = await request.json();

    console.log('📦 Received parameters:', { userId, creatorId });

    if (!userId || !creatorId) {
      console.error('❌ Missing parameters!');
      return NextResponse.json({
        error: 'Missing required parameters: userId, creatorId'
      }, { status: 400 });
    }

    // Utiliser la fonction partagée
    const result = await checkAndTriggerAutomatedMessages(userId, creatorId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error checking triggers:', error);
    return NextResponse.json({
      error: 'Failed to check triggers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
