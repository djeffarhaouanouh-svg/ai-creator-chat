-- Migration: Create content_requests table for personalized content requests

CREATE TABLE IF NOT EXISTS content_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'priced', 'authorized', 'delivered')),
    price DECIMAL(10, 2),
    paypal_authorization_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour rechercher rapidement les demandes
CREATE INDEX IF NOT EXISTS idx_content_requests_user_id ON content_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_creator_id ON content_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON content_requests(status);
CREATE INDEX IF NOT EXISTS idx_content_requests_created_at ON content_requests(created_at);

-- Index composite pour rechercher la dernière demande d'un utilisateur pour une créatrice
CREATE INDEX IF NOT EXISTS idx_content_requests_user_creator ON content_requests(user_id, creator_id, created_at DESC);

-- Commentaires pour la documentation
COMMENT ON TABLE content_requests IS 'Stores personalized content requests from users to creators';
COMMENT ON COLUMN content_requests.creator_id IS 'Reference to the creator who will fulfill the request';
COMMENT ON COLUMN content_requests.user_id IS 'Reference to the user making the request';
COMMENT ON COLUMN content_requests.message IS 'Description of the requested personalized content';
COMMENT ON COLUMN content_requests.status IS 'Request status: pending, priced, authorized, delivered';
COMMENT ON COLUMN content_requests.price IS 'Price set by the creator (in EUR)';
COMMENT ON COLUMN content_requests.paypal_authorization_id IS 'PayPal authorization ID for payment';







