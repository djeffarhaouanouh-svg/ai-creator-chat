-- Migration: Create messages table for storing chat conversations

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Index pour rechercher rapidement les messages d'une conversation
  INDEX idx_messages_user_creator (user_id, creator_id, created_at),

  -- Index pour rechercher par créatrice
  INDEX idx_messages_creator (creator_id, created_at)
);

-- Commentaires pour la documentation
COMMENT ON TABLE messages IS 'Stores all chat messages between users and AI creators';
COMMENT ON COLUMN messages.user_id IS 'User ID from localStorage (email or unique identifier)';
COMMENT ON COLUMN messages.creator_id IS 'Creator slug/ID (e.g., lauryncrl, tootatis)';
COMMENT ON COLUMN messages.role IS 'Message sender: user or assistant (AI)';
COMMENT ON COLUMN messages.content IS 'Message text content';
COMMENT ON COLUMN messages.created_at IS 'Timestamp when message was created';
