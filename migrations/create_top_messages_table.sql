-- Migration: Create top_messages table for storing favorite messages
-- Permet aux créatrices de marquer des messages comme "meilleurs messages"

CREATE TABLE IF NOT EXISTS top_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un message ne peut être ajouté qu'une seule fois par créatrice
  UNIQUE(message_id, creator_id)
);

-- Index pour rechercher rapidement les messages favoris d'une créatrice
CREATE INDEX IF NOT EXISTS idx_top_messages_creator ON top_messages(creator_id, created_at DESC);

-- Index pour rechercher par message_id
CREATE INDEX IF NOT EXISTS idx_top_messages_message ON top_messages(message_id);

-- Commentaires pour la documentation
COMMENT ON TABLE top_messages IS 'Stores messages marked as favorites by creators';
COMMENT ON COLUMN top_messages.message_id IS 'ID of the message from messages table';
COMMENT ON COLUMN top_messages.creator_id IS 'Creator slug (e.g., lauryncrl, tootatis)';
COMMENT ON COLUMN top_messages.user_id IS 'User ID who sent the message';

