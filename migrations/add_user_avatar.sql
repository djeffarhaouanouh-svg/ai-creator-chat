-- Migration: Add avatar_url column to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Commentaire
COMMENT ON COLUMN users.avatar_url IS 'URL de la photo de profil de l\'utilisateur (uniquement pour utilisateurs payants)';





