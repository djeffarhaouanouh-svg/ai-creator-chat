-- Supprimer TOUS les messages avec image_url
DELETE FROM messages WHERE image_url IS NOT NULL AND image_url != '';

-- Afficher combien de messages restent
SELECT COUNT(*) as remaining_messages FROM messages;
