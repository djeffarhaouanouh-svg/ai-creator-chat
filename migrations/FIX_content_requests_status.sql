-- Migration URGENTE : Corriger les statuts content_requests
-- À exécuter IMMÉDIATEMENT pour corriger l'erreur de contrainte

-- 1. Mettre à jour les données existantes
UPDATE content_requests SET status = 'price_proposed' WHERE status = 'priced';
UPDATE content_requests SET status = 'paid' WHERE status = 'authorized';

-- 2. Supprimer l'ancienne contrainte
ALTER TABLE content_requests DROP CONSTRAINT IF EXISTS content_requests_status_check;

-- 3. Ajouter la nouvelle contrainte avec les bons statuts
ALTER TABLE content_requests 
  ADD CONSTRAINT content_requests_status_check 
  CHECK (status IN ('pending', 'price_proposed', 'paid', 'delivered', 'cancelled'));

-- 4. Ajouter la colonne media_url si elle n'existe pas
ALTER TABLE content_requests 
  ADD COLUMN IF NOT EXISTS media_url TEXT;

-- 5. Mettre à jour le commentaire
COMMENT ON COLUMN content_requests.status IS 'Request status: pending, price_proposed, paid, delivered, cancelled';

