-- ============================================
-- MISE À JOUR TABLE USERS POUR INSCRIPTION
-- Script SQL simplifié (sans vérification email)
-- ============================================

-- Ajouter la colonne password_hash si elle n'existe pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Index sur l'email pour de meilleures performances
CREATE INDEX IF NOT EXISTS idx_users_email_login 
ON users(email);

-- Commentaire
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt du mot de passe utilisateur';

-- Vérification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'password_hash';
