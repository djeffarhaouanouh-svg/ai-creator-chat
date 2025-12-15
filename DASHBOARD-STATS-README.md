# Dashboard Créatrice - Statistiques en Temps Réel

## ✅ Fonctionnalités implémentées

### 1. **API Endpoint** - `/api/creator/stats`

Route API qui récupère les statistiques en temps réel depuis la base de données PostgreSQL.

**Paramètres:**
- `slug` (query parameter) - L'identifiant de la créatrice (ex: `tootatis`)

**Statistiques retournées:**
- `totalMessages` - Nombre total de messages échangés
- `totalSubscribers` - Nombre d'abonnés actifs
- `totalRevenue` - Revenus totaux cumulés (€)
- `monthlyRevenue` - Revenus du mois en cours (€)
- `monthlyMessages` - Messages envoyés ce mois
- `newSubscribers` - Nouveaux abonnés ce mois
- `activeConversations` - Utilisateurs actifs (7 derniers jours)

**Exemple d'utilisation:**
```bash
GET /api/creator/stats?slug=tootatis
```

**Réponse:**
```json
{
  "creator": {
    "id": "uuid",
    "name": "Tootatis",
    "slug": "tootatis"
  },
  "stats": {
    "totalMessages": 345,
    "totalSubscribers": 3,
    "totalRevenue": 34.79,
    "monthlyRevenue": 9.94,
    "monthlyMessages": 100,
    "newSubscribers": 1,
    "activeConversations": 3
  }
}
```

---

### 2. **Dashboard Créatrice** - `/creator/dashboard`

Page du dashboard qui affiche toutes les statistiques en temps réel.

**Fonctionnalités:**
- ✨ Chargement automatique des stats au montage du composant
- 🔄 Bouton de rafraîchissement manuel
- 💫 États de chargement avec skeletons animés
- ⚠️ Gestion des erreurs avec messages clairs
- 📊 5 cartes de statistiques principales
- 📈 Indicateurs de croissance mensuelle (badges verts)
- 🎨 Design moderne avec animations

**Cartes affichées:**
1. **Messages totaux** - Avec progression mensuelle
2. **Abonnés actifs** - Avec nouveaux abonnés du mois
3. **Revenus totaux** - Avec revenus du mois
4. **Conversations actives** - Derniers 7 jours
5. **Revenus mensuels** - Mois en cours

---

## 🗄️ Structure de la Base de Données

### Tables utilisées:

1. **`creators`** - Informations des créatrices
   - `id`, `name`, `slug`, `bio`, `is_active`

2. **`users`** - Utilisateurs/abonnés
   - `id`, `email`, `name`, `is_active`

3. **`subscriptions`** - Abonnements
   - `user_id`, `creator_id`, `plan`, `status`, `started_at`, `expires_at`

4. **`messages`** - Conversations
   - `user_id`, `creator_id`, `content`, `role`, `timestamp`

5. **`payments`** - Paiements
   - `user_id`, `subscription_id`, `amount`, `status`, `created_at`

---

## 🧪 Tester avec des données

### Option 1: Utiliser le script de seed

```bash
# Depuis votre client PostgreSQL (psql, pgAdmin, etc.)
\i seed-test-data.sql
```

Ce script créera:
- 5 utilisateurs de test
- 3 abonnements actifs
- ~345 messages
- 7 paiements réussis
- Statistiques complètes pour la créatrice `tootatis`

### Option 2: Vérifier les données existantes

```sql
-- Voir toutes les créatrices
SELECT id, name, slug FROM creators;

-- Voir les stats pour une créatrice
SELECT
  COUNT(DISTINCT s.user_id) as abonnes,
  COUNT(m.id) as messages,
  COALESCE(SUM(p.amount), 0) as revenus
FROM creators c
LEFT JOIN subscriptions s ON c.id = s.creator_id AND s.status = 'active'
LEFT JOIN messages m ON c.id = m.creator_id
LEFT JOIN payments p ON s.id = p.subscription_id AND p.status = 'succeeded'
WHERE c.slug = 'tootatis'
GROUP BY c.id;
```

---

## 🔧 Configuration requise

### Variables d'environnement

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### Dépendances installées

```json
{
  "@vercel/postgres": "^0.x.x",
  "pg": "^8.x.x"
}
```

---

## 🚀 Utilisation

### 1. Connexion créatrice

1. Aller sur `/login`
2. Sélectionner "Créatrice"
3. Entrer le slug (ex: `tootatis`)
4. Entrer le mot de passe
5. → Redirection automatique vers `/creator/dashboard`

### 2. Visualisation des stats

Les statistiques se chargent automatiquement:
- Chargement initial: ~1-2 secondes
- Affichage des skeletons pendant le chargement
- Mise à jour instantanée une fois chargées

### 3. Rafraîchissement

Cliquer sur le bouton "Actualiser les statistiques" pour recharger les données.

---

## 📊 Requêtes SQL utilisées

### Total messages
```sql
SELECT COUNT(*) as total
FROM messages
WHERE creator_id = $1
```

### Abonnés actifs
```sql
SELECT COUNT(DISTINCT user_id) as total
FROM subscriptions
WHERE creator_id = $1 AND status = 'active'
```

### Revenus totaux
```sql
SELECT COALESCE(SUM(p.amount), 0) as total
FROM payments p
JOIN subscriptions s ON p.subscription_id = s.id
WHERE s.creator_id = $1 AND p.status = 'succeeded'
```

### Revenus mensuels
```sql
SELECT COALESCE(SUM(p.amount), 0) as total
FROM payments p
JOIN subscriptions s ON p.subscription_id = s.id
WHERE s.creator_id = $1
  AND p.status = 'succeeded'
  AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
```

### Conversations actives (7 jours)
```sql
SELECT COUNT(DISTINCT user_id) as total
FROM messages
WHERE creator_id = $1
  AND created_at >= NOW() - INTERVAL '7 days'
```

---

## 🎨 Interface utilisateur

### États d'affichage

1. **Loading** - Skeletons gris animés
2. **Loaded** - Données affichées avec formatage
3. **Error** - Message d'erreur rouge avec icône

### Formatage des données

- **Messages**: Format avec séparateurs de milliers (1 234)
- **Revenus**: Format monétaire français (4,97 €)
- **Badges**: Indicateurs verts pour la croissance mensuelle

### Couleurs des cartes

- **Purple** - Messages (principal)
- **Pink** - Abonnés
- **Green** - Revenus
- **Blue** - Conversations actives
- **Yellow** - Revenus mensuels

---

## 🔐 Sécurité

- ✅ Vérification de session (sessionStorage)
- ✅ Redirection si non authentifié
- ✅ Paramètres SQL échappés (protection SQL injection)
- ✅ Gestion des erreurs côté serveur
- ✅ Force dynamic rendering (pas de cache)

---

## 🐛 Debugging

### Logs console

```javascript
// Dans le dashboard
console.log('Stats chargées:', data.stats)

// Dans l'API
console.error('Erreur stats créatrice:', error)
```

### Vérifier l'API directement

```bash
# Dans le navigateur ou avec curl
curl http://localhost:3000/api/creator/stats?slug=tootatis
```

### Erreurs communes

1. **"Créatrice introuvable"** → Vérifier que le slug existe dans la table `creators`
2. **"Erreur interne"** → Vérifier DATABASE_URL et connexion PostgreSQL
3. **"Slug requis"** → Ajouter `?slug=xxx` à l'URL de l'API

---

## 📝 Prochaines améliorations possibles

- [ ] Graphiques de progression (Chart.js)
- [ ] Export des statistiques en PDF/CSV
- [ ] Filtres de dates personnalisés
- [ ] Statistiques par utilisateur
- [ ] Notifications de nouveaux abonnés
- [ ] Analyse de sentiment des messages
- [ ] Taux de réponse et temps moyen

---

## 📞 Support

Pour toute question ou problème:
1. Vérifier les logs console
2. Vérifier la connexion à la base de données
3. Tester l'API endpoint directement
4. Vérifier que les données existent dans la DB

Bon usage du dashboard! 🚀
