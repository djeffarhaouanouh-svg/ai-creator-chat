-- ============================================
-- DONNÉES DE TEST POUR DASHBOARD CRÉATRICE
-- Exécutez ce fichier pour tester les statistiques
-- ============================================

-- Note: Remplacez les UUID si nécessaire avec ceux de votre base

-- 1. Créer des utilisateurs de test
INSERT INTO users (email, name, is_active) VALUES
('user1@test.com', 'Alice Dupont', true),
('user2@test.com', 'Bob Martin', true),
('user3@test.com', 'Claire Dubois', true),
('user4@test.com', 'David Bernard', true),
('user5@test.com', 'Emma Laurent', true)
ON CONFLICT (email) DO NOTHING;

-- 2. Récupérer les IDs (à adapter selon votre créatrice)
-- Exemple pour tootatis (remplacez par le bon slug)
DO $$
DECLARE
    creator_id_var UUID;
    user1_id UUID;
    user2_id UUID;
    user3_id UUID;
    user4_id UUID;
    user5_id UUID;
    sub1_id UUID;
    sub2_id UUID;
    sub3_id UUID;
BEGIN
    -- Récupérer l'ID de la créatrice (exemple: tootatis)
    SELECT id INTO creator_id_var FROM creators WHERE slug = 'tootatis' LIMIT 1;

    -- Récupérer les IDs des utilisateurs
    SELECT id INTO user1_id FROM users WHERE email = 'user1@test.com' LIMIT 1;
    SELECT id INTO user2_id FROM users WHERE email = 'user2@test.com' LIMIT 1;
    SELECT id INTO user3_id FROM users WHERE email = 'user3@test.com' LIMIT 1;
    SELECT id INTO user4_id FROM users WHERE email = 'user4@test.com' LIMIT 1;
    SELECT id INTO user5_id FROM users WHERE email = 'user5@test.com' LIMIT 1;

    -- 3. Créer des abonnements actifs
    INSERT INTO subscriptions (user_id, creator_id, plan, status, started_at, expires_at)
    VALUES
        (user1_id, creator_id_var, 'monthly', 'active', NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days'),
        (user2_id, creator_id_var, 'monthly', 'active', NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days'),
        (user3_id, creator_id_var, 'monthly', 'active', NOW() - INTERVAL '5 days', NOW() + INTERVAL '55 days')
    ON CONFLICT (user_id, creator_id) DO UPDATE
    SET status = 'active'
    RETURNING id INTO sub1_id;

    -- Récupérer les IDs des abonnements
    SELECT id INTO sub1_id FROM subscriptions WHERE user_id = user1_id AND creator_id = creator_id_var LIMIT 1;
    SELECT id INTO sub2_id FROM subscriptions WHERE user_id = user2_id AND creator_id = creator_id_var LIMIT 1;
    SELECT id INTO sub3_id FROM subscriptions WHERE user_id = user3_id AND creator_id = creator_id_var LIMIT 1;

    -- 4. Créer des messages (conversations)
    -- Messages de user1 (ancien abonné, beaucoup de messages)
    INSERT INTO messages (user_id, creator_id, content, role, timestamp)
    SELECT
        user1_id,
        creator_id_var,
        'Message ' || generate_series,
        CASE WHEN generate_series % 2 = 0 THEN 'user' ELSE 'assistant' END,
        NOW() - (generate_series || ' hours')::INTERVAL
    FROM generate_series(1, 150);

    -- Messages de user2 (actif récemment)
    INSERT INTO messages (user_id, creator_id, content, role, timestamp)
    SELECT
        user2_id,
        creator_id_var,
        'Message ' || generate_series,
        CASE WHEN generate_series % 2 = 0 THEN 'user' ELSE 'assistant' END,
        NOW() - (generate_series || ' hours')::INTERVAL
    FROM generate_series(1, 80);

    -- Messages de user3 (nouveau, peu de messages)
    INSERT INTO messages (user_id, creator_id, content, role, timestamp)
    SELECT
        user3_id,
        creator_id_var,
        'Message ' || generate_series,
        CASE WHEN generate_series % 2 = 0 THEN 'user' ELSE 'assistant' END,
        NOW() - (generate_series || ' hours')::INTERVAL
    FROM generate_series(1, 25);

    -- Messages de user4 (inactif depuis longtemps)
    INSERT INTO messages (user_id, creator_id, content, role, timestamp)
    SELECT
        user4_id,
        creator_id_var,
        'Message ancien ' || generate_series,
        CASE WHEN generate_series % 2 = 0 THEN 'user' ELSE 'assistant' END,
        NOW() - INTERVAL '60 days' - (generate_series || ' hours')::INTERVAL
    FROM generate_series(1, 40);

    -- Messages ce mois
    INSERT INTO messages (user_id, creator_id, content, role, timestamp)
    SELECT
        user1_id,
        creator_id_var,
        'Message du mois ' || generate_series,
        CASE WHEN generate_series % 2 = 0 THEN 'user' ELSE 'assistant' END,
        NOW() - (generate_series || ' hours')::INTERVAL
    FROM generate_series(1, 50);

    -- 5. Créer des paiements
    -- Paiements réussis (anciens)
    INSERT INTO payments (user_id, subscription_id, amount, currency, status, created_at)
    VALUES
        (user1_id, sub1_id, 4.97, 'EUR', 'succeeded', NOW() - INTERVAL '30 days'),
        (user1_id, sub1_id, 4.97, 'EUR', 'succeeded', NOW() - INTERVAL '60 days'),
        (user1_id, sub1_id, 4.97, 'EUR', 'succeeded', NOW() - INTERVAL '90 days'),
        (user2_id, sub2_id, 4.97, 'EUR', 'succeeded', NOW() - INTERVAL '15 days'),
        (user3_id, sub3_id, 4.97, 'EUR', 'succeeded', NOW() - INTERVAL '5 days');

    -- Paiements de ce mois
    INSERT INTO payments (user_id, subscription_id, amount, currency, status, created_at)
    VALUES
        (user1_id, sub1_id, 4.97, 'EUR', 'succeeded', NOW() - INTERVAL '3 days'),
        (user2_id, sub2_id, 4.97, 'EUR', 'succeeded', NOW() - INTERVAL '1 day');

    RAISE NOTICE 'Données de test insérées avec succès pour la créatrice: %', creator_id_var;
END $$;

-- 6. Vérifier les données insérées
SELECT
    'Messages totaux' as stat,
    COUNT(*) as valeur
FROM messages
WHERE creator_id = (SELECT id FROM creators WHERE slug = 'tootatis' LIMIT 1)

UNION ALL

SELECT
    'Abonnés actifs' as stat,
    COUNT(DISTINCT user_id)::text as valeur
FROM subscriptions
WHERE creator_id = (SELECT id FROM creators WHERE slug = 'tootatis' LIMIT 1)
AND status = 'active'

UNION ALL

SELECT
    'Revenus totaux' as stat,
    COALESCE(SUM(amount), 0)::text as valeur
FROM payments p
JOIN subscriptions s ON p.subscription_id = s.id
WHERE s.creator_id = (SELECT id FROM creators WHERE slug = 'tootatis' LIMIT 1)
AND p.status = 'succeeded';
