/**
 * API de génération d'images avec DALL-E 3
 * GÉNÉRATION ILLIMITÉE - Pas de limite de fréquence
 * - Niveau intimité modéré (bloque lingerie/intime uniquement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';
import { downloadImage } from '@/lib/downloadImage';

export async function POST(request: NextRequest) {
  try {
    const { userId, creatorId, scenario, classification } = await request.json();

    console.log('🎨 Demande de génération d\'image:', {
      userId: userId ? `${userId.substring(0, 8)}...` : 'MANQUANT',
      creatorId,
      classification
    });

    // Validation des paramètres
    if (!userId || !creatorId || !scenario || !classification) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // 1. SÉCURITÉ : Bloquer niveau intimité (configuration modérée)
    if (classification === 'intimate') {
      console.log('🚫 Image bloquée - niveau intimité trop élevé');
      return NextResponse.json(
        { error: 'Ce type d\'image n\'est pas autorisé' },
        { status: 403 }
      );
    }

    // SÉCURITÉ DÉSACTIVÉE - Génération illimitée d'images
    console.log('✅ Génération d\'image autorisée (pas de limite)');

    // 3. Vérifier la clé API OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY manquante');
      return NextResponse.json(
        { error: 'Configuration OpenAI manquante' },
        { status: 500 }
      );
    }

    // 4. Charger le profil visuel de la créatrice (si image personnelle)
    let prompt = scenario;

    if (classification === 'personal') {
      try {
        const profile = await sql`
          SELECT base_description, style_modifiers
          FROM creator_visual_profiles
          WHERE creator_slug = ${creatorId}
          LIMIT 1
        `;

        if (profile.rows.length > 0) {
          const { base_description, style_modifiers } = profile.rows[0];
          // Combiner profil + scénario + modifiers de style
          prompt = `${base_description}, ${scenario}. ${style_modifiers}`;
          console.log('✓ Profil visuel chargé pour', creatorId);
        } else {
          console.warn(`⚠️ Profil visuel introuvable pour ${creatorId}, utilisation du scénario brut`);
        }
      } catch (error: any) {
        console.error('❌ Erreur chargement profil visuel:', error.message);
        // Continue avec le scénario brut
      }
    }

    // 5. Générer l'image avec DALL-E 3
    console.log('🎨 Génération DALL-E 3...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard' // Standard pour réduire les coûts (vs 'hd')
    });

    if (!response.data || response.data.length === 0 || !response.data[0].url) {
      throw new Error('DALL-E n\'a pas retourné d\'URL d\'image');
    }

    const imageUrl = response.data[0].url;

    console.log('✅ Image générée par DALL-E');

    // 6. Télécharger et sauvegarder l'image localement
    const localPath = await downloadImage(imageUrl);
    console.log('✅ Image sauvegardée:', localPath);

    // 7. Tracker dans la base de données
    try {
      await sql`
        INSERT INTO ai_generated_images
        (user_id, creator_id, image_url, classification, prompt_used, generation_cost)
        VALUES (
          ${userId},
          ${creatorId},
          ${localPath},
          ${classification},
          ${prompt},
          0.04
        )
      `;
      console.log('✅ Image trackée en BDD');
    } catch (error: any) {
      console.error('❌ Erreur tracking:', error.message);
      // Continue quand même
    }

    // Compteur désactivé - génération illimitée
    console.log('✅ Image générée sans limitation');

    return NextResponse.json({
      imageUrl: localPath,
      classification
    });

  } catch (error: any) {
    console.error('❌ Erreur génération image:', error);

    // Erreurs OpenAI spécifiques
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Clé API OpenAI invalide' },
        { status: 401 }
      );
    }

    if (error.message?.includes('content_policy_violation')) {
      return NextResponse.json(
        { error: 'Contenu bloqué par la politique OpenAI' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'image' },
      { status: 500 }
    );
  }
}

// Fonction de vérification des limites supprimée - génération illimitée activée
