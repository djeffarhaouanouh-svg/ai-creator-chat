/**
 * API de sélection d'images depuis photos réelles pré-enregistrées
 * Sélectionne aléatoirement une photo du dossier correspondant
 * - Photos réelles authentiques (pas d'IA)
 * - Organisées par catégories
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Détermine la catégorie de photo selon le scenario
 */
function getCategoryFromScenario(scenario: string): string {
  const lower = scenario.toLowerCase();

  // REPAS & NOURRITURE
  if (lower.includes('meal') || lower.includes('food') || lower.includes('dish') ||
      lower.includes('pasta') || lower.includes('pizza') || lower.includes('burger') ||
      lower.includes('steak') || lower.includes('meat') || lower.includes('fries') ||
      lower.includes('taco') || lower.includes('curry') || lower.includes('ramen') ||
      lower.includes('sandwich') || lower.includes('delicious')) {
    return 'food';
  }

  // SALADES
  if (lower.includes('salad') || lower.includes('vegetables') || lower.includes('healthy')) {
    return 'food';
  }

  // DESSERTS
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('pastry') ||
      lower.includes('ice cream') || lower.includes('chocolate') || lower.includes('cookie') ||
      lower.includes('pancake') || lower.includes('crepe') || lower.includes('croissant')) {
    return 'desserts';
  }

  // BOISSONS
  if (lower.includes('coffee') || lower.includes('tea') || lower.includes('drink') ||
      lower.includes('beer') || lower.includes('wine') || lower.includes('cocktail') ||
      lower.includes('juice') || lower.includes('beverage') || lower.includes('cup')) {
    return 'drinks';
  }

  // ACTIVITÉS
  if (lower.includes('gaming') || lower.includes('game') || lower.includes('reading') ||
      lower.includes('book') || lower.includes('workout') || lower.includes('yoga') ||
      lower.includes('music') || lower.includes('art')) {
    return 'activities';
  }

  // LIEUX
  if (lower.includes('park') || lower.includes('beach') || lower.includes('restaurant') ||
      lower.includes('cafe') || lower.includes('mountain') || lower.includes('city') ||
      lower.includes('museum') || lower.includes('pool')) {
    return 'places';
  }

  // NATURE
  if (lower.includes('sunset') || lower.includes('sky') || lower.includes('flower') ||
      lower.includes('tree') || lower.includes('forest') || lower.includes('nature')) {
    return 'nature';
  }

  // Par défaut: food (catégorie la plus commune)
  return 'food';
}

export async function POST(request: NextRequest) {
  try {
    const { userId, creatorId, scenario, classification, specificItem } = await request.json();

    console.log('🎨 Demande de génération d\'image:', {
      userId: userId ? `${userId.substring(0, 8)}...` : 'MANQUANT',
      creatorId,
      classification,
      specificItem: specificItem || 'random'
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

    console.log('✅ Sélection photo autorisée (photos réelles)');

    // 3. Déterminer la catégorie de photo selon le scenario
    const category = getCategoryFromScenario(scenario);
    console.log('📁 Catégorie détectée:', category);

    // 4. Chemin du dossier de photos
    const photosDir = join(process.cwd(), 'public', 'photos', category);

    // 5. Lire les fichiers du dossier
    let photoFiles: string[];
    try {
      photoFiles = await readdir(photosDir);
      photoFiles = photoFiles.filter(file =>
        file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
      );
    } catch (error) {
      console.error(`❌ Dossier non trouvé: ${photosDir}`);
      return NextResponse.json(
        { error: `Aucune photo disponible pour la catégorie: ${category}` },
        { status: 404 }
      );
    }

    if (photoFiles.length === 0) {
      console.error(`❌ Aucune photo dans: ${photosDir}`);
      return NextResponse.json(
        { error: `Aucune photo dans le dossier: ${category}` },
        { status: 404 }
      );
    }

    // 6. Chercher une photo spécifique si demandée
    let selectedPhoto: string;

    if (specificItem) {
      // Chercher un fichier qui commence par le nom du plat (ex: "Tacos.jpg", "tacos-2.png")
      const specificFile = photoFiles.find(file =>
        file.toLowerCase().startsWith(specificItem.toLowerCase())
      );

      if (specificFile) {
        selectedPhoto = specificFile;
        console.log(`🎯 Photo spécifique trouvée: ${selectedPhoto}`);
      } else {
        // Fallback: photo aléatoire
        selectedPhoto = photoFiles[Math.floor(Math.random() * photoFiles.length)];
        console.log(`⚠️ Pas de photo pour "${specificItem}", photo random: ${selectedPhoto}`);
      }
    } else {
      // Photo aléatoire
      selectedPhoto = photoFiles[Math.floor(Math.random() * photoFiles.length)];
      console.log(`🎲 Photo aléatoire: ${selectedPhoto}`);
    }

    const localPath = `/photos/${category}/${selectedPhoto}`;

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
          ${scenario},
          0.00
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
    console.error('❌ Erreur génération image DÉTAILLÉE:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      stack: error.stack?.substring(0, 500)
    });

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
      { error: `Erreur lors de la génération: ${error.message}` },
      { status: 500 }
    );
  }
}

// Fonction de vérification des limites supprimée - génération illimitée activée
