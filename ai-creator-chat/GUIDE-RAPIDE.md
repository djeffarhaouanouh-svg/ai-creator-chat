# 📦 Package Dashboard Admin - Fichiers créés

## 🎯 Vue d'ensemble

Tu as maintenant un **backend complet avec dashboard admin** pour ton site AI Creator Chat !

## 📁 Liste des fichiers créés

### 1. Base de données
- **`supabase-schema.sql`** - Script SQL pour créer toutes les tables dans Supabase
  - Tables : users, creators, subscriptions, messages, payments
  - Indexes pour les performances
  - Row Level Security (RLS)
  - Fonctions SQL utiles

### 2. Configuration
- **`.env.local.example`** - Exemple de variables d'environnement
- **`lib/supabase.ts`** - Client Supabase + Types TypeScript
- **`lib/admin-utils.ts`** - Fonctions utilitaires pour gérer les données

### 3. API Routes (Backend)
- **`app/api/admin/stats/route.ts`** - API pour récupérer les stats globales
- **`app/api/admin/users/route.ts`** - API pour la liste des utilisateurs
- **`app/api/admin/messages/route.ts`** - API pour les messages récents

### 4. Composants UI
- **`components/admin/StatsCard.tsx`** - Carte de statistique
- **`components/admin/RevenueChart.tsx`** - Graphique des revenus
- **`components/admin/UsersList.tsx`** - Liste des utilisateurs avec pagination
- **`components/admin/RecentMessages.tsx`** - Messages récents

### 5. Dashboard Admin
- **`app/admin/page.tsx`** - Page principale du dashboard avec :
  - Login sécurisé par mot de passe
  - Vue d'ensemble avec stats
  - Onglet utilisateurs
  - Onglet messages
  - Auto-refresh toutes les 30 secondes

### 6. Documentation & Scripts
- **`README-ADMIN.md`** - Guide complet d'installation et d'utilisation
- **`install.sh`** - Script d'installation automatique
- **`GUIDE-RAPIDE.md`** - Ce fichier !

## 🚀 Installation rapide (3 minutes)

### Option 1 : Automatique (Recommandé)

```bash
# Rendre le script exécutable
chmod +x install.sh

# Lancer l'installation
./install.sh
```

### Option 2 : Manuelle

1. **Créer un projet Supabase** sur https://supabase.com

2. **Exécuter le SQL** dans Supabase SQL Editor :
   - Copie tout `supabase-schema.sql`
   - Colle dans SQL Editor
   - Execute

3. **Installer la dépendance** :
   ```bash
   npm install @supabase/supabase-js
   ```

4. **Copier les fichiers** dans ton projet :
   ```bash
   # Créer les dossiers
   mkdir -p lib components/admin app/api/admin/{stats,users,messages} app/admin

   # Copier les fichiers
   cp lib/supabase.ts ton-projet/lib/
   cp lib/admin-utils.ts ton-projet/lib/
   cp components/admin/*.tsx ton-projet/components/admin/
   cp app/api/admin/**/*.ts ton-projet/app/api/admin/
   cp app/admin/page.tsx ton-projet/app/admin/
   ```

5. **Configurer .env.local** :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ton-anon-key
   ADMIN_PASSWORD=ton-mot-de-passe-secret
   ```

6. **Lancer** :
   ```bash
   npm run dev
   ```

7. **Accéder au dashboard** : http://localhost:3000/admin

## 💡 Utilisation dans ton code

### Enregistrer un utilisateur lors de l'inscription

```typescript
import { createUser } from '@/lib/admin-utils'

// Lors de l'inscription
const user = await createUser('user@example.com', 'John Doe')
```

### Créer un abonnement après paiement

```typescript
import { createSubscription } from '@/lib/admin-utils'

// Après validation du paiement Stripe
const subscription = await createSubscription({
  user_id: userId,
  creator_id: creatorId,
  plan: 'monthly',
  stripe_subscription_id: stripeSubId
})
```

### Sauvegarder les messages du chat

```typescript
import { saveMessage } from '@/lib/admin-utils'

// Sauvegarder le message de l'utilisateur
await saveMessage({
  user_id: userId,
  creator_id: creatorId,
  content: userMessage,
  role: 'user'
})

// Sauvegarder la réponse de l'IA
await saveMessage({
  user_id: userId,
  creator_id: creatorId,
  content: aiResponse,
  role: 'assistant'
})
```

### Vérifier si un utilisateur a accès

```typescript
import { checkUserHasAccess } from '@/lib/admin-utils'

const hasAccess = await checkUserHasAccess(userId, creatorId)
if (!hasAccess) {
  return { error: 'Abonnement requis' }
}
```

### Enregistrer un paiement

```typescript
import { createPayment, updatePaymentStatus } from '@/lib/admin-utils'

// Créer le paiement
const payment = await createPayment({
  user_id: userId,
  subscription_id: subscriptionId,
  amount: 4.97,
  stripe_payment_id: paymentIntent.id
})

// Après confirmation Stripe
await updatePaymentStatus(payment.id, 'succeeded')
```

## 📊 Dashboard Features

### Vue d'ensemble
- ✅ Total utilisateurs
- ✅ Abonnements actifs
- ✅ Messages envoyés
- ✅ Revenus total + ce mois
- ✅ Graphique revenus 30 jours
- ✅ Stats par créatrice
- ✅ Messages récents

### Onglet Utilisateurs
- ✅ Liste complète avec pagination
- ✅ Email, nom, date d'inscription
- ✅ Abonnements actifs par user
- ✅ Nombre de messages
- ✅ Statut actif/inactif

### Onglet Messages
- ✅ Tous les messages récents
- ✅ Filtrage par créatrice
- ✅ User + Créatrice + Contenu
- ✅ Horodatage relatif

## 🎨 Personnalisation

### Changer les couleurs
Dans `app/admin/page.tsx`, remplace les classes Tailwind :
```tsx
// Violet/Rose → Bleu/Cyan
from-purple-600 to-pink-600  →  from-blue-600 to-cyan-600
```

### Ajouter des stats custom
1. Crée une fonction SQL dans Supabase
2. Appelle-la dans `app/api/admin/stats/route.ts`
3. Affiche le résultat dans `app/admin/page.tsx`

### Exporter des données
Utilise les fonctions d'export :
```typescript
import { exportUsersToCSV, exportPaymentsToCSV } from '@/lib/admin-utils'

const csvData = await exportUsersToCSV()
// Télécharge le CSV
```

## 🔐 Sécurité

- ✅ Password protection sur `/admin`
- ✅ Bearer token sur les API routes
- ✅ Row Level Security sur toutes les tables
- ✅ Aucune donnée sensible côté client
- ✅ Variables d'environnement sécurisées

## 📈 Limites Supabase (Plan gratuit)

- **Base de données** : 500 MB
- **Bande passante** : 2 GB/mois
- **Requests** : 50,000/mois
- **Backups** : Quotidiens automatiques

💡 **Largement suffisant pour commencer !**

## 🆘 Support

Si tu rencontres un problème :

1. Vérifie que tu as bien exécuté `supabase-schema.sql`
2. Vérifie que `.env.local` a les bonnes clés
3. Regarde la console du navigateur pour les erreurs
4. Lis `README-ADMIN.md` pour plus de détails
5. Demande-moi de l'aide ! 🚀

## 🎉 C'est tout !

Tu as maintenant un **backend professionnel** pour gérer :
- 👥 Tes utilisateurs
- 💰 Tes revenus
- 💬 Tes conversations
- 📊 Tes statistiques

Tout ça **gratuitement** avec Supabase ! 🔥

Bon développement ! 💪
