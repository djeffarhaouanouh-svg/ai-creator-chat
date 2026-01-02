-- ============================================
-- SCHEMA BASE DE DONNÉES SUPABASE
-- Pour AI Creator Chat Dashboard
-- ============================================

-- 1. TABLE USERS (Utilisateurs)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- 2. TABLE CREATORS (Créatrices)
CREATE TABLE IF NOT EXISTS creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    personality TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLE SUBSCRIPTIONS (Abonnements)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'yearly'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    stripe_subscription_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, creator_id)
);

-- 4. TABLE MESSAGES (Conversations)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'user' ou 'assistant'
    tokens_used INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLE PAYMENTS (Paiements)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    stripe_payment_id VARCHAR(255) UNIQUE,
    paypal_order_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'succeeded', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES POUR PERFORMANCES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_creator_id ON messages(creator_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy : Les users peuvent voir leurs propres données
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy : Les users peuvent voir leurs propres subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy : Les users peuvent voir leurs propres messages
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

-- Policy : Tout le monde peut voir les créatrices actives
CREATE POLICY "Anyone can view active creators" ON creators
    FOR SELECT USING (is_active = true);

-- Policy : Les users peuvent voir leurs propres paiements
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FONCTIONS UTILES
-- ============================================

-- Fonction pour obtenir les stats globales
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users WHERE is_active = true),
        'total_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
        'total_messages', (SELECT COUNT(*) FROM messages),
        'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'succeeded'),
        'revenue_this_month', (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE status = 'succeeded' 
            AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONNÉES DE TEST (Optionnel)
-- ============================================

-- Insérer quelques créatrices de test
INSERT INTO creators (name, slug, bio, personality) VALUES
('Emma', 'emma', 'Fitness coach et lifestyle', 'energetic,motivating,friendly'),
('Sophie', 'sophie', 'Travel blogger et aventurière', 'adventurous,spontaneous,caring'),
('Léa', 'lea', 'Gamer et streamer', 'playful,competitive,funny')
ON CONFLICT (slug) DO NOTHING;

-- Note : Les users seront créés automatiquement via l'authentification
