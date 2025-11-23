-- Ajouter les mots de passe pour les connexions

-- 1. Ajouter la colonne password aux créatrices
ALTER TABLE creators ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 2. Ajouter la colonne password aux utilisateurs
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 3. Définir les mots de passe par défaut pour les créatrices
UPDATE creators SET password = 'password123' WHERE slug = 'sarahmiller';
UPDATE creators SET password = 'password123' WHERE slug = 'emmalaurent';
UPDATE creators SET password = 'password123' WHERE slug = 'juliemartin';

-- Afficher les identifiants
SELECT name, slug, password FROM creators;
