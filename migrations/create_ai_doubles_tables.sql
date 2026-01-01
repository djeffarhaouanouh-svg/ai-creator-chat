-- Migration pour créer les tables des doubles IA personnels
-- Date: 2025-01-01
-- Description: Tables pour la fonctionnalité "Créer mon double IA"

-- Table principale des doubles IA
CREATE TABLE IF NOT EXISTS ai_doubles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Nom du double (ex: "Mon IA")
  status VARCHAR(20) DEFAULT 'onboarding', -- onboarding, active, paused, deleted

  -- Prompt système assemblé
  system_prompt TEXT,

  -- Voix ElevenLabs
  voice_id VARCHAR(100),
  voice_name VARCHAR(100),

  -- Statistiques
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,

  -- Paramètres
  is_public BOOLEAN DEFAULT false, -- Peut être partagé publiquement
  share_slug VARCHAR(50) UNIQUE, -- URL de partage (ex: /talk-to/john-ai)

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP -- Quand l'onboarding est terminé
);

-- Table pour stocker les règles de style d'écriture
CREATE TABLE IF NOT EXISTS ai_double_writing_styles (
  id SERIAL PRIMARY KEY,
  ai_double_id INTEGER NOT NULL REFERENCES ai_doubles(id) ON DELETE CASCADE,

  -- Métadonnées des captures
  screenshots_count INTEGER DEFAULT 0,
  total_messages_analyzed INTEGER DEFAULT 0,

  -- Règles de style (format JSON pour flexibilité)
  style_rules JSONB NOT NULL,
  -- Exemple de structure:
  -- {
  --   "message_length": "short", // short, medium, long
  --   "sentence_structure": "fragments", // complete, fragments, mixed
  --   "punctuation": "minimal", // minimal, normal, expressive
  --   "emoji_frequency": "high", // none, low, medium, high
  --   "emoji_types": ["😊", "😂", "❤️"],
  --   "common_expressions": ["mdr", "genre", "trop"],
  --   "language_level": "casual", // formal, neutral, casual, slang
  --   "avg_words_per_message": 12,
  --   "uses_abbreviations": true,
  --   "uses_caps": "rarely" // never, rarely, sometimes, often
  -- }

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table pour stocker la personnalité
CREATE TABLE IF NOT EXISTS ai_double_personalities (
  id SERIAL PRIMARY KEY,
  ai_double_id INTEGER NOT NULL REFERENCES ai_doubles(id) ON DELETE CASCADE,

  -- Règles de personnalité (format JSON)
  personality_rules JSONB NOT NULL,
  -- Exemple de structure:
  -- {
  --   "tone": "friendly", // professional, friendly, casual, humorous
  --   "energy_level": "high", // low, medium, high
  --   "formality": "casual", // formal, semi-formal, casual
  --   "empathy": "high", // low, medium, high
  --   "humor_style": "sarcastic", // none, light, sarcastic, witty
  --   "response_length": "short", // concise, short, medium, detailed
  --   "proactivity": "medium", // passive, medium, proactive
  --   "topics_comfortable": ["tech", "music", "travel"],
  --   "topics_avoid": ["politics", "religion"],
  --   "conversation_boundaries": {
  --     "flirting": false,
  --     "personal_questions": true,
  --     "advice_giving": true
  --   }
  -- }

  -- Réponses brutes du questionnaire (pour debug/amélioration)
  questionnaire_answers JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table pour stocker les échantillons vocaux
CREATE TABLE IF NOT EXISTS ai_double_voice_samples (
  id SERIAL PRIMARY KEY,
  ai_double_id INTEGER NOT NULL REFERENCES ai_doubles(id) ON DELETE CASCADE,

  -- Fichier audio
  file_url TEXT NOT NULL, -- URL Vercel Blob
  file_size INTEGER, -- Taille en bytes
  duration_seconds DECIMAL(5,2), -- Durée en secondes

  -- Phrase enregistrée
  phrase_text TEXT NOT NULL,
  phrase_type VARCHAR(20), -- affirmation, question, emotion, etc.

  -- Ordre dans la séquence
  sequence_number INTEGER NOT NULL,

  -- Qualité
  is_approved BOOLEAN DEFAULT true, -- Si l'utilisateur valide l'enregistrement

  created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les conversations avec le double
CREATE TABLE IF NOT EXISTS ai_double_conversations (
  id SERIAL PRIMARY KEY,
  ai_double_id INTEGER NOT NULL REFERENCES ai_doubles(id) ON DELETE CASCADE,

  -- Si c'est une conversation partagée (quelqu'un d'autre parle au double)
  visitor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  visitor_name VARCHAR(100), -- Nom du visiteur si non connecté

  -- Métadonnées
  title VARCHAR(200), -- Titre auto-généré ou manuel
  message_count INTEGER DEFAULT 0,

  -- Statut
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP
);

-- Table pour les messages dans les conversations
CREATE TABLE IF NOT EXISTS ai_double_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES ai_double_conversations(id) ON DELETE CASCADE,

  role VARCHAR(20) NOT NULL, -- user, assistant
  content TEXT NOT NULL,

  -- Audio (si message vocal)
  audio_url TEXT,

  -- Métadonnées
  tokens_used INTEGER,
  model_used VARCHAR(50), -- ex: gpt-4, claude-3

  created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les partages publics
CREATE TABLE IF NOT EXISTS ai_double_shares (
  id SERIAL PRIMARY KEY,
  ai_double_id INTEGER NOT NULL REFERENCES ai_doubles(id) ON DELETE CASCADE,

  -- Statistiques de partage
  view_count INTEGER DEFAULT 0,
  conversation_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,

  -- Paramètres de partage
  allow_anonymous BOOLEAN DEFAULT true,
  require_login BOOLEAN DEFAULT false,
  max_messages_per_conversation INTEGER DEFAULT 50,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_ai_doubles_user_id ON ai_doubles(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_doubles_share_slug ON ai_doubles(share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_double_conversations_double_id ON ai_double_conversations(ai_double_id);
CREATE INDEX IF NOT EXISTS idx_ai_double_messages_conversation_id ON ai_double_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_double_voice_samples_double_id ON ai_double_voice_samples(ai_double_id);

-- Contrainte unique : un utilisateur ne peut avoir qu'un seul double IA actif
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_double_per_user
  ON ai_doubles(user_id)
  WHERE status = 'active';

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_ai_double_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER ai_doubles_updated_at
  BEFORE UPDATE ON ai_doubles
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_double_updated_at();

CREATE TRIGGER ai_double_conversations_updated_at
  BEFORE UPDATE ON ai_double_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_double_updated_at();
