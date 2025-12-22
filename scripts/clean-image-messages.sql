-- Supprimer tous les messages avec des URLs d'images invalides
DELETE FROM messages WHERE image_url IS NOT NULL;
