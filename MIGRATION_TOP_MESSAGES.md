# Migration - Table top_messages

## ⚠️ IMPORTANT : Exécuter cette migration pour activer les "Meilleurs messages"

La table `top_messages` doit être créée pour que le système de favoris fonctionne.

## Comment exécuter la migration :

### Option 1: Via Vercel Dashboard (Recommandé) ⭐

1. Va sur [vercel.com](https://vercel.com) et ouvre ton projet
2. Va dans l'onglet **Storage**
3. Clique sur ta base de données Postgres
4. Va dans l'onglet **Query**
5. Copie-colle le contenu du fichier `migrations/create_top_messages_table.sql` ci-dessous :

```sql
CREATE TABLE IF NOT EXISTS top_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un message ne peut être ajouté qu'une seule fois par créatrice
  UNIQUE(message_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_top_messages_creator ON top_messages(creator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_top_messages_message ON top_messages(message_id);
```

6. Clique sur **Execute**

### Option 2: Via un client SQL (TablePlus, pgAdmin, DBeaver, etc.)

1. Connecte-toi à ta base de données avec `POSTGRES_URL` ou `DATABASE_URL`
2. Exécute le fichier `migrations/create_top_messages_table.sql`

## Vérifier que ça fonctionne

Après avoir exécuté la migration, tu peux vérifier que la table existe :

```sql
SELECT * FROM top_messages LIMIT 10;
```

Si ça renvoie des résultats (même vide), c'est bon ! 🎉

## Problèmes courants

- **Erreur "relation does not exist"** : La migration n'a pas été exécutée, exécute-la d'abord
- **Erreur "already exists"** : C'est normal, la table existe déjà, tout va bien !


