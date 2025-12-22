/**
 * Détection d'intention de génération d'image dans les réponses de l'IA
 * Utilisé pour déclencher automatiquement DALL-E quand l'IA mentionne des éléments visuels
 */

export interface ImageIntent {
  shouldGenerateImage: boolean;
  confidence: number;
  scenario: string;
  classification: 'generic' | 'personal' | 'intimate';
}

/**
 * Détecte si l'IA veut envoyer une image basé sur sa réponse
 */
export function detectImageIntent(text: string, contextMessages: any[]): ImageIntent {
  const lowerText = text.toLowerCase();

  // Mots-clés déclencheurs qui indiquent que l'IA veut envoyer une image
  const triggerPhrases = [
    'voici une photo',
    'voici une image',
    'regarde cette photo',
    'regarde cette image',
    'je t\'envoie une image',
    'je t\'envoie une photo',
    'je t\'envoie un',
    'photo de moi',
    'image de moi',
    'selfie',
    'je porte',
    'ma tenue',
    'mon look',
    'ma robe',
    'mon outfit',
    'look du jour',
    'voici comment',
    'voici à quoi',
    'check ça',
    'mate ça',
    'regarde',
    'tiens'
  ];

  const hasTrigger = triggerPhrases.some(phrase => lowerText.includes(phrase));

  if (!hasTrigger) {
    return {
      shouldGenerateImage: false,
      confidence: 0,
      scenario: '',
      classification: 'generic'
    };
  }

  // Classifier le niveau d'intimité du scénario
  const classification = classifyScenario(lowerText, contextMessages);

  return {
    shouldGenerateImage: true,
    confidence: 0.8,
    scenario: text,
    classification
  };
}

/**
 * Classifie le niveau d'intimité d'un scénario
 * - generic: nourriture, lieux, objets (pas de profil créatrice)
 * - personal: créatrice habillée, sport, maillot de bain (utilise profil créatrice)
 * - intimate: lingerie, contenu suggestif (BLOQUÉ - niveau modéré)
 */
function classifyScenario(
  text: string,
  contextMessages: any[]
): 'generic' | 'personal' | 'intimate' {
  const lowerText = text.toLowerCase();
  const context = contextMessages
    .slice(-5)
    .map((m: any) => m.content)
    .join(' ')
    .toLowerCase();

  const fullContext = `${lowerText} ${context}`;

  // Mots-clés intimes (BLOQUÉ selon configuration utilisateur)
  const intimateKeywords = [
    'lingerie',
    'underwear',
    'naked',
    'nude',
    'déshabillée',
    'sous-vêtements',
    'soutien-gorge',
    'culotte',
    'bedroom',
    'lit',
    'bath',
    'douche',
    'sensual',
    'sexy photo'
  ];

  // Mots-clés personnels (créatrice visible - utilise profil)
  const personalKeywords = [
    'selfie',
    'mirror',
    'miroir',
    'outfit',
    'tenue',
    'dress',
    'robe',
    'jupe',
    'bikini',
    'maillot',
    'maillot de bain',
    'gym',
    'sport',
    'workout',
    'entraînement',
    'makeup',
    'maquillage',
    'close-up',
    'gros plan',
    'portrait',
    'visage',
    'je porte',
    'ma robe',
    'mon look'
  ];

  // Mots-clés génériques (objets/lieux - pas de profil)
  const genericKeywords = [
    'salade',
    'plat',
    'nourriture',
    'food',
    'meal',
    'restaurant',
    'café',
    'coffee',
    'plage',
    'beach',
    'paysage',
    'landscape',
    'coucher de soleil',
    'sunset',
    'livre',
    'book',
    'voiture',
    'car',
    'ville',
    'city'
  ];

  // Vérifier niveau d'intimité (ordre important!)
  if (intimateKeywords.some(kw => fullContext.includes(kw))) {
    return 'intimate';
  }

  if (personalKeywords.some(kw => fullContext.includes(kw))) {
    return 'personal';
  }

  if (genericKeywords.some(kw => fullContext.includes(kw))) {
    return 'generic';
  }

  // Par défaut: si l'IA parle d'elle-même → personal
  const speaksAboutSelf = /\b(je|moi|ma|mon|mes)\b/.test(lowerText);
  return speaksAboutSelf ? 'personal' : 'generic';
}
