/**
 * Détection d'intention de génération d'image dans les réponses de l'IA
 * Détecte les activités quotidiennes et génère des images correspondantes
 */

export interface ImageIntent {
  shouldGenerateImage: boolean;
  confidence: number;
  scenario: string;
  classification: 'generic';
}

// Patterns d'activités quotidiennes avec leurs prompts DALL-E
const dailyActivityPatterns = [
  // NOURRITURE - PLATS CHAUDS
  { keywords: ['pâtes', 'pasta', 'spaghetti', 'tagliatelle', 'carbonara', 'bolognaise'], context: [], prompt: 'delicious pasta dish on a plate, italian food, restaurant quality, overhead shot, natural lighting' },
  { keywords: ['pizza', 'pizzas'], context: [], prompt: 'fresh pizza with toppings, food photography, restaurant quality, close-up shot' },
  { keywords: ['burger', 'hamburger', 'cheeseburger'], context: [], prompt: 'gourmet burger with fries, food photography, restaurant presentation' },
  { keywords: ['steak', 'viande', 'boeuf', 'poulet', 'grillé'], context: [], prompt: 'grilled meat dish, juicy steak, restaurant plating, food photography' },
  { keywords: ['frites', 'patates', 'pommes de terre'], context: [], prompt: 'crispy french fries, golden and delicious, food photography' },
  { keywords: ['tacos', 'burrito', 'mexicain'], context: [], prompt: 'mexican food, tacos with fresh ingredients, colorful presentation' },
  { keywords: ['curry', 'indien', 'riz'], context: [], prompt: 'indian curry dish with rice, aromatic spices, restaurant quality' },
  { keywords: ['ramen', 'nouilles', 'soupe'], context: [], prompt: 'steaming ramen bowl, asian noodle soup, restaurant presentation' },

  // NOURRITURE - PLATS FROIDS & ENTRÉES
  { keywords: ['salade', 'salad', 'crudités'], context: [], prompt: 'fresh healthy salad bowl, colorful vegetables, food photography, natural lighting' },
  { keywords: ['sushi', 'sashimi', 'maki', 'japonais'], context: [], prompt: 'beautiful sushi platter, japanese cuisine, elegant presentation' },
  { keywords: ['sandwich', 'wrap', 'panini'], context: [], prompt: 'delicious sandwich, fresh ingredients, casual food photography' },

  // NOURRITURE - DESSERTS & SUCRÉ
  { keywords: ['dessert', 'gâteau', 'cake', 'pâtisserie', 'tarte'], context: [], prompt: 'delicious dessert, pastry, elegant plating, bakery quality' },
  { keywords: ['glace', 'ice cream', 'sorbet'], context: [], prompt: 'ice cream cone or bowl, colorful scoops, sweet treat photography' },
  { keywords: ['chocolat', 'brownie', 'cookie'], context: [], prompt: 'chocolate dessert, rich and indulgent, bakery presentation' },
  { keywords: ['crêpe', 'pancake', 'gaufre'], context: [], prompt: 'pancakes or crepes with toppings, breakfast photography' },
  { keywords: ['croissant', 'pain au chocolat', 'viennoiserie'], context: [], prompt: 'french pastries, croissants, bakery display, morning light' },

  // BOISSONS CHAUDES
  { keywords: ['café', 'coffee', 'cappuccino', 'expresso', 'latte'], context: [], prompt: 'cup of coffee on a table, cafe aesthetic, cozy atmosphere, latte art' },
  { keywords: ['thé', 'tea', 'infusion'], context: [], prompt: 'cup of tea, relaxing moment, aesthetic presentation' },
  { keywords: ['chocolat chaud', 'hot chocolate'], context: [], prompt: 'hot chocolate with whipped cream, cozy drink, winter beverage' },

  // BOISSONS FROIDES
  { keywords: ['vin', 'wine', 'rouge', 'blanc', 'rosé'], context: [], prompt: 'glass of wine, elegant setting, restaurant ambiance' },
  { keywords: ['bière', 'beer', 'pinte'], context: [], prompt: 'cold beer glass, pub atmosphere, refreshing beverage' },
  { keywords: ['cocktail', 'mojito', 'margarita'], context: [], prompt: 'colorful cocktail drink, bar setting, beautiful presentation' },
  { keywords: ['jus', 'smoothie', 'milkshake'], context: [], prompt: 'fresh juice or smoothie, healthy drink, vibrant colors' },
  { keywords: ['eau', 'water', 'boisson'], context: [], prompt: 'refreshing drink, glass of beverage, clean presentation' },

  // VERBES DE NOURRITURE
  { keywords: ['mange', 'mangé', 'mangeais', 'mangeait', 'manges', 'mangeons', 'mangent'], context: [], prompt: 'delicious meal on a plate, food photography, restaurant quality' },
  { keywords: ['bois', 'bu', 'buvais', 'buvait', 'boit', 'buvons', 'boivent'], context: [], prompt: 'refreshing drink, beautiful presentation, cafe setting' },
  { keywords: ['déguste', 'dégusté', 'dégustais', 'savoure', 'savouré'], context: [], prompt: 'gourmet food tasting, fine dining, elegant plating' },
  { keywords: ['grignote', 'grignoté', 'snack'], context: [], prompt: 'snacks and nibbles, casual food, appetizing presentation' },
  { keywords: ['cuisine', 'cuisiné', 'cuisinais', 'prépare', 'préparé', 'fais à manger', 'fait à manger', 'mijote'], context: [], prompt: 'cooking in kitchen, food preparation, ingredients on counter, home cooking' },
  { keywords: ['commande', 'commandé', 'commandais', 'livre', 'livré', 'livraison'], context: ['repas', 'plat', 'nourriture', 'pizza', 'sushi'], prompt: 'food delivery, takeout meal, delivery box presentation' },

  // ACTIVITÉS & LOISIRS
  { keywords: ['lis', 'lu', 'lisais', 'lisait', 'lit', 'lisons', 'lecture'], context: [], prompt: 'book on a table, reading moment, cozy atmosphere, coffee nearby' },
  { keywords: ['regarde', 'regardé', 'regardais', 'mate', 'maté', 'visionne'], context: ['film', 'movie', 'série', 'tv', 'netflix'], prompt: 'cozy movie watching setup, tv screen, comfortable viewing atmosphere' },
  { keywords: ['joue', 'joué', 'jouais', 'jouait', 'game', 'gaming'], context: [], prompt: 'gaming setup, video game screen, controller, atmospheric lighting' },
  { keywords: ['écoute', 'écouté', 'écoutais', 'écoutait', 'musique', 'playlist'], context: [], prompt: 'headphones and music player, relaxing music moment, aesthetic setup' },
  { keywords: ['dessine', 'dessiné', 'dessinais', 'peins', 'peint', 'peignais', 'art'], context: [], prompt: 'art supplies, drawing or painting setup, creative workspace' },
  { keywords: ['photographie', 'photographié', 'photo', 'selfie', 'picture'], context: ['paysage', 'nature', 'ville', 'sunset'], prompt: 'photography moment, camera or phone, capturing scenery' },
  { keywords: ['sport', 'fais du sport', 'entraîne', 'entraîné', 'workout', 'gym'], context: [], prompt: 'workout scene, fitness equipment, active lifestyle' },
  { keywords: ['cours', 'couru', 'courais', 'running', 'jogging'], context: [], prompt: 'running path, outdoor exercise, athletic activity' },
  { keywords: ['yoga', 'médite', 'méditation', 'zen'], context: [], prompt: 'yoga or meditation setup, peaceful atmosphere, wellness moment' },
  { keywords: ['danse', 'dansé', 'dansais'], context: [], prompt: 'dancing scene, music and movement, joyful atmosphere' },
  { keywords: ['chante', 'chanté', 'chantais', 'karaoké'], context: [], prompt: 'singing or karaoke setup, microphone, musical moment' },

  // LIEUX & SORTIES
  { keywords: ['parc', 'park', 'jardin', 'garden'], context: [], prompt: 'beautiful park scenery, trees, peaceful outdoor setting, daytime' },
  { keywords: ['plage', 'beach', 'mer', 'ocean'], context: [], prompt: 'beach view, ocean waves, sandy shore, beautiful weather' },
  { keywords: ['restaurant', 'resto', 'dîne', 'dîné'], context: [], prompt: 'restaurant interior, table setting, dining atmosphere' },
  { keywords: ['café', 'coffee shop', 'terrasse'], context: [], prompt: 'cozy cafe interior, coffee shop aesthetic, welcoming atmosphere' },
  { keywords: ['montagne', 'mountain', 'randonnée', 'hiking'], context: [], prompt: 'mountain landscape, scenic view, nature photography' },
  { keywords: ['ville', 'city', 'urbain', 'downtown'], context: [], prompt: 'city street view, urban landscape, vibrant city life' },
  { keywords: ['musée', 'museum', 'exposition', 'gallery'], context: [], prompt: 'museum or gallery interior, art exhibition, cultural atmosphere' },
  { keywords: ['cinéma', 'cinema', 'movie theater'], context: [], prompt: 'cinema interior, movie theater, entertainment venue' },
  { keywords: ['concert', 'festival', 'show'], context: [], prompt: 'concert venue, live music atmosphere, stage lights' },
  { keywords: ['club', 'boîte', 'nightclub', 'soirée'], context: [], prompt: 'nightclub atmosphere, party scene, vibrant nightlife' },
  { keywords: ['bar', 'pub', 'lounge'], context: [], prompt: 'bar interior, drinks atmosphere, social setting' },
  { keywords: ['piscine', 'pool', 'nage', 'nagé'], context: [], prompt: 'swimming pool, aquatic atmosphere, refreshing scene' },
  { keywords: ['bibliothèque', 'library', 'librairie'], context: [], prompt: 'library interior, books shelves, quiet study atmosphere' },

  // DÉPLACEMENTS
  { keywords: ['balade', 'ballade', 'promène', 'promené', 'promenais', 'marche', 'marché', 'marchais'], context: [], prompt: 'walking path, outdoor scenery, peaceful stroll atmosphere' },
  { keywords: ['voiture', 'conduis', 'conduit', 'conduisais', 'route', 'road trip'], context: [], prompt: 'car interior view or exterior, automotive photography, road trip' },
  { keywords: ['train', 'métro', 'subway', 'transport'], context: [], prompt: 'train or metro interior, public transport, commute scene' },
  { keywords: ['avion', 'plane', 'voyage', 'voyagé', 'trip'], context: [], prompt: 'airplane window view, travel scene, journey atmosphere' },
  { keywords: ['vélo', 'bike', 'cyclisme'], context: [], prompt: 'bicycle scene, cycling path, outdoor activity' },

  // NATURE & MÉTÉO
  { keywords: ['soleil', 'ensoleillé', 'beau temps', 'sunny'], context: [], prompt: 'sunny day, beautiful weather, bright blue sky, pleasant outdoor scene' },
  { keywords: ['coucher de soleil', 'sunset', 'lever de soleil', 'sunrise'], context: [], prompt: 'beautiful sunset, orange and pink sky, scenic view' },
  { keywords: ['pluie', 'pleut', 'pleuvait', 'rain'], context: [], prompt: 'rainy day atmosphere, raindrops, cozy rainy weather mood' },
  { keywords: ['neige', 'snow', 'hiver', 'winter'], context: [], prompt: 'snowy landscape, winter scene, white and peaceful' },
  { keywords: ['nuages', 'clouds', 'ciel', 'sky'], context: [], prompt: 'beautiful sky, clouds formation, atmospheric photography' },
  { keywords: ['fleur', 'fleurs', 'flowers', 'bouquet'], context: [], prompt: 'beautiful flowers, bouquet, nature photography, colorful blooms' },
  { keywords: ['arbre', 'trees', 'forêt', 'forest'], context: [], prompt: 'forest scene, trees, nature landscape, peaceful woodland' },

  // VIE QUOTIDIENNE & TRAVAIL
  { keywords: ['travaille', 'travaillé', 'travaillais', 'bureau', 'office', 'desk'], context: [], prompt: 'workspace desk, laptop and coffee, productive work environment' },
  { keywords: ['réunion', 'meeting', 'zoom', 'call'], context: [], prompt: 'video call setup, remote work, professional setting' },
  { keywords: ['shopping', 'achats', 'acheté', 'achetais', 'magasin', 'boutique'], context: [], prompt: 'shopping scene, retail therapy, stores and products' },
  { keywords: ['ménage', 'nettoyage', 'range', 'rangé'], context: [], prompt: 'clean and organized space, tidy home, fresh atmosphere' },
  { keywords: ['dort', 'dormi', 'dormais', 'sommeil', 'sleep', 'sieste'], context: [], prompt: 'cozy bedroom, comfortable bed, peaceful sleep atmosphere' },
  { keywords: ['douche', 'bain', 'bath', 'shower'], context: [], prompt: 'modern bathroom, relaxing bath scene, spa-like atmosphere' },
  { keywords: ['habille', 'habillé', 'vêtements', 'outfit'], context: [], prompt: 'clothing and fashion, wardrobe scene, style photography' },
  { keywords: ['maquille', 'maquillé', 'makeup', 'beauté'], context: [], prompt: 'makeup products, beauty routine, cosmetics display' },
  { keywords: ['coiffe', 'coiffé', 'cheveux', 'hair'], context: [], prompt: 'hair care moment, styling scene, beauty routine' },

  // ANIMAUX
  { keywords: ['chien', 'dog', 'toutou', 'puppy'], context: [], prompt: 'cute dog, pet photography, adorable canine moment' },
  { keywords: ['chat', 'cat', 'chaton', 'kitty'], context: [], prompt: 'cute cat, feline photography, adorable pet moment' },
  { keywords: ['animal', 'pet', 'animaux'], context: [], prompt: 'adorable pet or animal, cute photography' },

  // TECHNOLOGIE & RÉSEAUX SOCIAUX
  { keywords: ['téléphone', 'phone', 'smartphone', 'mobile'], context: [], prompt: 'smartphone in hand, mobile device, modern technology' },
  { keywords: ['ordinateur', 'computer', 'laptop', 'pc'], context: [], prompt: 'laptop or computer setup, tech workspace' },
  { keywords: ['instagram', 'tiktok', 'snap', 'story'], context: [], prompt: 'social media content creation, phone screen, influencer moment' },
];

/**
 * Détecte si l'IA veut envoyer une image basé sur sa réponse
 */
export function detectImageIntent(text: string, contextMessages: any[]): ImageIntent {
  const lowerText = text.toLowerCase();

  console.log('🔍 Détection image - Texte reçu:', lowerText.substring(0, 100));

  // Chercher un pattern qui correspond
  for (const pattern of dailyActivityPatterns) {
    const hasKeyword = pattern.keywords.some(kw => lowerText.includes(kw));

    if (hasKeyword) {
      console.log('✅ Keyword trouvé:', pattern.keywords[0], '→ Génération image activée');
      // Si pas de contexte requis, ou si le contexte correspond
      if (pattern.context.length === 0 || pattern.context.some(ctx => lowerText.includes(ctx))) {
        console.log('✅ Pattern matched:', pattern.prompt.substring(0, 50));
        return {
          shouldGenerateImage: true,
          confidence: 0.9,
          scenario: pattern.prompt,
          classification: 'generic'
        };
      }
    }
  }

  console.log('❌ Aucun pattern détecté dans:', lowerText.substring(0, 100));
  return {
    shouldGenerateImage: false,
    confidence: 0,
    scenario: '',
    classification: 'generic'
  };
}

