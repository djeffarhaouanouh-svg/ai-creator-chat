-- Migration pour support multimodal (images dans le chat)
-- Backward compatible : toutes les colonnes sont nullables

-- 1. Ajouter colonnes image_url et image_type à la table messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_type VARCHAR(50);

COMMENT ON COLUMN messages.image_url IS 'URL vers image (upload utilisateur ou générée par IA)';
COMMENT ON COLUMN messages.image_type IS 'Type: user_upload ou ai_generated';

-- Index pour rechercher les messages avec images
CREATE INDEX IF NOT EXISTS idx_messages_with_images
  ON messages(image_url) WHERE image_url IS NOT NULL;

-- 2. Table de tracking des images générées par l'IA
CREATE TABLE IF NOT EXISTS ai_generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  message_id INTEGER,
  image_url TEXT NOT NULL,
  classification VARCHAR(50) NOT NULL CHECK (classification IN ('generic', 'personal', 'intimate')),
  prompt_used TEXT,
  generation_cost DECIMAL(10, 4) DEFAULT 0.04,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_generated_images IS 'Tracking des images générées par DALL-E pour monitoring et coûts';

CREATE INDEX idx_ai_images_user_creator ON ai_generated_images(user_id, creator_id, created_at);
CREATE INDEX idx_ai_images_classification ON ai_generated_images(classification);

-- 3. Table des compteurs pour limiter génération d'images (1 image / 4 messages)
CREATE TABLE IF NOT EXISTS image_generation_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  last_image_at TIMESTAMP WITH TIME ZONE,
  personal_images_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

COMMENT ON TABLE image_generation_counters IS 'Compteurs pour limites de génération (1 image/4 messages, max 10 personnelles)';

CREATE INDEX idx_counters_user_creator ON image_generation_counters(user_id, creator_id);

-- 4. Table des profils visuels des créatrices (pour DALL-E)
CREATE TABLE IF NOT EXISTS creator_visual_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_slug VARCHAR(255) UNIQUE NOT NULL,
  base_description TEXT NOT NULL,
  style_modifiers TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE creator_visual_profiles IS 'Descriptions visuelles des créatrices pour générer images cohérentes';

-- 5. Seed des profils visuels pour les 3 créatrices (descriptions génériques)
INSERT INTO creator_visual_profiles (creator_slug, base_description, style_modifiers) VALUES
(
  'lauryncrl',
  'A beautiful young French woman, age 24, long wavy brown hair, athletic slim build 1m68, fair slightly tanned skin, almond-shaped brown eyes, high cheekbones, bright smile, casual chic style',
  'photorealistic, natural lighting, lifestyle photography, Instagram aesthetic'
),
(
  'toomuclucile',
  'A sporty young French woman, age 26, shoulder-length brown hair, fit athletic build 1m65, energetic expression, confident demeanor, streetwear casual style',
  'photorealistic, fitness aesthetic, dynamic pose, motivational vibe'
),
(
  'tootatis',
  'A stylish young French woman, age 25, long blonde hair, model-like appearance 1m72, piercing eyes, playful confident smile, elegant sophisticated style',
  'photorealistic, soft glamour lighting, fashion photography, editorial style'
)
ON CONFLICT (creator_slug) DO NOTHING;

-- Logs de succès
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_add_multimodal_support exécutée avec succès';
  RAISE NOTICE '✓ Colonnes image_url et image_type ajoutées à messages';
  RAISE NOTICE '✓ Table ai_generated_images créée';
  RAISE NOTICE '✓ Table image_generation_counters créée';
  RAISE NOTICE '✓ Table creator_visual_profiles créée';
  RAISE NOTICE '✓ Profils visuels des 3 créatrices insérés';
END $$;
