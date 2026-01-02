# Migrations Base de Données

## ⚠️ MIGRATION URGENTE - PayPal Order ID

**Si vous avez l'erreur : `column "paypal_order_id" of relation "payments" does not exist`**

Exécutez IMMÉDIATEMENT le fichier : `migrations/add_paypal_order_id_to_payments.sql`

### Comment exécuter :

1. **Via Vercel Dashboard (Recommandé)** :
   - Va sur [vercel.com](https://vercel.com) et ouvre ton projet
   - Va dans l'onglet **Storage**
   - Clique sur ta base de données Postgres
   - Va dans l'onglet **Query**
   - Copie-colle le contenu de `migrations/add_paypal_order_id_to_payments.sql`
   - Clique sur **Execute**

2. **Via un script TypeScript** :
   ```bash
   npx tsx scripts/add-paypal-order-id.ts
   ```

3. **Via un client SQL** (TablePlus, pgAdmin, DBeaver, etc.) :
   - Connecte-toi à ta base de données
   - Exécute le fichier `migrations/add_paypal_order_id_to_payments.sql`

---

## ⚠️ MIGRATION URGENTE - Content Requests Status

**Si vous avez l'erreur : `violates check constraint "content_requests_status_check"`**

Exécutez IMMÉDIATEMENT le fichier : `migrations/FIX_content_requests_status.sql`

### Comment exécuter :

1. **Via Vercel Dashboard (Recommandé)** :
   - Va sur [vercel.com](https://vercel.com) et ouvre ton projet
   - Va dans l'onglet **Storage**
   - Clique sur ta base de données Postgres
   - Va dans l'onglet **Query**
   - Copie-colle le contenu de `migrations/FIX_content_requests_status.sql`
   - Clique sur **Execute**

2. **Via un client SQL** (TablePlus, pgAdmin, DBeaver, etc.) :
   - Connecte-toi à ta base de données
   - Exécute le fichier `migrations/FIX_content_requests_status.sql`

---

## Comment exécuter la migration pour créer la table `messages`

### Option 1: Via Vercel Dashboard (Recommandé)

1. Va sur [vercel.com](https://vercel.com) et ouvre ton projet
2. Va dans l'onglet **Storage**
3. Clique sur ta base de données Postgres
4. Va dans l'onglet **Query**
5. Copie-colle le contenu de `create_messages_table.sql`
6. Clique sur **Execute**

### Option 2: Via Vercel CLI

```bash
# Installe Vercel CLI si ce n'est pas déjà fait
npm i -g vercel

# Login
vercel login

# Ouvre le dashboard Postgres
vercel env pull
psql $POSTGRES_URL < migrations/create_messages_table.sql
```

### Option 3: Via un outil SQL local

Si tu as déjà accès à ta base de données Postgres via un client SQL (TablePlus, pgAdmin, DBeaver, etc.):

1. Connecte-toi à ta base avec `POSTGRES_URL` ou `DATABASE_URL`
2. Exécute le fichier `create_messages_table.sql`

## Vérifier que ça fonctionne

Après avoir exécuté la migration, tu peux vérifier que la table existe :

```sql
SELECT * FROM messages LIMIT 10;
```

Si ça renvoie des résultats (même vide), c'est bon ! 🎉

## Notes importantes

- ✅ La table `messages` stocke tous les messages de chat de manière permanente
- ✅ Les conversations sont maintenant sauvegardées en base de données
- ✅ Plus de perte de conversations en vidant le cache ou changeant de navigateur
- ✅ Chaque message est lié à un `user_id` et un `creator_id`
- ✅ Les index permettent des recherches rapides même avec des millions de messages
