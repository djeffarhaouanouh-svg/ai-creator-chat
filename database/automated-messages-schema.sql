-- Schéma de base de données pour les messages automatiques

-- Table principale des messages automatiques
CREATE TABLE IF NOT EXISTS automated_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,

    -- Contenu du message
    content TEXT NOT NULL,
    image_url TEXT,
    image_type VARCHAR(50),

    -- Configuration du déclencheur
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('scheduled', 'message_count')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    message_count_threshold INTEGER,

    -- Statut
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Validations
    CONSTRAINT valid_scheduled CHECK (
        trigger_type != 'scheduled' OR scheduled_at IS NOT NULL
    ),
    CONSTRAINT valid_message_count CHECK (
        trigger_type != 'message_count' OR message_count_threshold IS NOT NULL
    ),
    CONSTRAINT fk_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

-- Table pour tracker les envois (évite les doublons)
CREATE TABLE IF NOT EXISTS automated_message_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automated_message_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(automated_message_id, user_id),
    CONSTRAINT fk_automated_message FOREIGN KEY (automated_message_id)
        REFERENCES automated_messages(id) ON DELETE CASCADE
);

-- Index pour optimiser les requêtes

-- Trouver les messages automatiques actifs d'une créatrice
CREATE INDEX IF NOT EXISTS idx_automated_messages_creator_active
    ON automated_messages(creator_id, is_active);

-- Trouver les messages planifiés prêts à être envoyés
CREATE INDEX IF NOT EXISTS idx_automated_messages_scheduled
    ON automated_messages(trigger_type, scheduled_at, is_active)
    WHERE trigger_type = 'scheduled';

-- Trouver les triggers de compteur pour une créatrice
CREATE INDEX IF NOT EXISTS idx_automated_messages_count
    ON automated_messages(creator_id, trigger_type, is_active)
    WHERE trigger_type = 'message_count';

-- Vérifier si un utilisateur a déjà reçu un message
CREATE INDEX IF NOT EXISTS idx_automated_sends_message_user
    ON automated_message_sends(automated_message_id, user_id);

-- Suivre les envois par utilisateur
CREATE INDEX IF NOT EXISTS idx_automated_sends_user
    ON automated_message_sends(user_id, sent_at);
