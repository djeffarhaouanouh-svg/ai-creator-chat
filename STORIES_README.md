# 📱 Système de Stories

## Vue d'ensemble

Un système de stories Instagram-like a été ajouté à votre plateforme. Les créatrices peuvent publier des stories éphémères (images ou vidéos) qui disparaissent automatiquement après la durée choisie.

## ✨ Fonctionnalités

### Pour les Créatrices

1. **Gestion depuis le Dashboard** (`/creator/dashboard/edit-profile`)
   - Upload d'images ou vidéos (max 50MB)
   - Choix de la durée : 12h, 24h, 48h ou 72h
   - Ajout de titre et légende (optionnel)
   - Toggle public/abonnés uniquement (cadenas)
   - Statistiques de vues en temps réel
   - Suppression manuelle avant expiration

2. **Contrôle de visibilité**
   - 🔓 **Stories gratuites** : Visibles par tous
   - 🔒 **Stories privées** : Visibles uniquement par les abonnés payants
   - Toggle facile via l'interface (comme pour les photos)

### Pour les Utilisateurs

1. **Affichage sur le profil créatrice**
   - Bulles de stories entre les stats et le contenu exclusif
   - Bordure colorée pour les stories accessibles
   - Cadenas pour les stories réservées aux abonnés
   - Viewer plein écran avec navigation

2. **Expérience de visualisation**
   - Barre de progression automatique
   - Navigation clavier (←/→) et tactile
   - Pause au clic/touch maintenu
   - Compteur de temps écoulé
   - Affichage de la légende

## 🗄️ Structure de la Base de Données

### Table `stories`
```sql
- id (UUID)
- creator_id (VARCHAR)
- title (VARCHAR, optionnel)
- media_url (TEXT)
- media_type ('image' | 'video')
- caption (TEXT, optionnel)
- duration_hours (INTEGER, défaut: 24)
- is_locked (BOOLEAN, défaut: true)
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP)
- is_active (BOOLEAN, défaut: true)
- view_count (INTEGER, défaut: 0)
```

### Table `story_views`
```sql
- id (UUID)
- story_id (UUID)
- user_id (VARCHAR)
- viewed_at (TIMESTAMP)
- UNIQUE(story_id, user_id) -- Une vue par utilisateur
```

## 🔌 API Endpoints

### POST `/api/stories/create`
Créer une nouvelle story
```json
{
  "creatorId": "lauryncrl",
  "mediaUrl": "https://...",
  "mediaType": "image",
  "title": "Ma story",
  "caption": "Hello!",
  "durationHours": 24,
  "isLocked": true
}
```

### GET `/api/stories/list?creatorId=lauryncrl`
Récupérer les stories actives d'une créatrice

### GET `/api/stories/my-stories?creatorId=lauryncrl`
Récupérer toutes les stories d'une créatrice (pour le dashboard)

### POST `/api/stories/view`
Enregistrer une vue
```json
{
  "storyId": "uuid",
  "userId": "user-id"
}
```

### DELETE `/api/stories/delete?storyId=uuid&creatorId=slug`
Supprimer une story (soft delete)

### POST `/api/stories/toggle-lock`
Basculer entre public/privé
```json
{
  "storyId": "uuid",
  "creatorId": "slug",
  "isLocked": false
}
```

## 📁 Fichiers Créés/Modifiés

### Nouveaux fichiers
- `database/stories-schema.sql` - Schéma BDD
- `app/api/stories/create/route.ts` - Créer story
- `app/api/stories/list/route.ts` - Lister stories
- `app/api/stories/my-stories/route.ts` - Stories du créateur
- `app/api/stories/view/route.ts` - Enregistrer vue
- `app/api/stories/delete/route.ts` - Supprimer story
- `app/api/stories/toggle-lock/route.ts` - Toggle visibilité
- `components/StoryViewer.tsx` - Composant viewer

### Fichiers modifiés
- `app/creator/dashboard/edit-profile/page.tsx` - Section gestion stories
- `app/creator/lauryncrl/page.tsx` - Affichage stories publiques

## 🚀 Installation

1. **Créer les tables en base de données**
   ```bash
   # Exécuter le script SQL
   psql -U your_user -d your_database -f database/stories-schema.sql
   ```

2. **Vérifier que l'API d'upload existe**
   - L'endpoint `/api/upload` doit être configuré (Vercel Blob)

3. **Tester l'upload**
   - Aller sur `/creator/dashboard/edit-profile`
   - Publier une story de test
   - Vérifier l'affichage sur le profil public

## 🎨 Personnalisation

### Modifier les durées disponibles
Dans `edit-profile/page.tsx` :
```tsx
<select value={storyDuration} onChange={...}>
  <option value={6}>6 heures</option>
  <option value={12}>12 heures</option>
  <option value={24}>24 heures</option>
  <option value={48}>48 heures</option>
  <option value={96}>4 jours</option>
</select>
```

### Modifier la durée d'affichage dans le viewer
Dans `components/StoryViewer.tsx` :
```tsx
const duration = currentStory.media_type === 'video' ? 15000 : 5000
// Modifier ces valeurs en millisecondes
```

### Personnaliser l'apparence des bulles
Dans `lauryncrl/page.tsx`, section "STORIES" :
```tsx
<div className="w-20 h-20 rounded-full...">
  {/* Changer taille, bordure, etc. */}
</div>
```

## 🔄 Nettoyage Automatique

Les stories expirées sont automatiquement filtrées côté client (`expires_at > NOW()`).

Pour un nettoyage en base de données, vous pouvez :

1. **Créer un cron job** qui appelle la fonction SQL :
   ```sql
   SELECT deactivate_expired_stories();
   ```

2. **Ou utiliser Vercel Cron** :
   ```ts
   // app/api/cron/cleanup-stories/route.ts
   export async function GET() {
     await sql`SELECT deactivate_expired_stories()`;
     return Response.json({ success: true });
   }
   ```

## 📝 Notes Importantes

- **Taille max fichier** : 50MB (configurable dans `edit-profile/page.tsx`)
- **Formats supportés** : Images (jpg, png, gif, webp) et vidéos (mp4, webm, mov)
- **Stockage** : Les médias sont hébergés via Vercel Blob
- **Vues uniques** : Chaque utilisateur ne peut voir une story qu'une fois (comptabilisé)
- **Soft delete** : Les stories supprimées sont marquées `is_active = false` (pas de suppression physique)

## 🐛 Troubleshooting

### Les stories ne s'affichent pas
- Vérifier que les tables existent en BDD
- Vérifier la console pour les erreurs API
- S'assurer que `creator.slug` ou `creator.id` est correct

### L'upload échoue
- Vérifier `/api/upload` endpoint
- Vérifier les credentials Vercel Blob
- Vérifier la taille du fichier (< 50MB)

### Les vues ne sont pas comptabilisées
- S'assurer que `localStorage.getItem('userId')` retourne un ID valide
- Vérifier la console réseau pour l'appel à `/api/stories/view`

## 🎯 Prochaines Améliorations Possibles

- [ ] Notifications push pour nouvelles stories
- [ ] Réactions/likes sur les stories
- [ ] Réponses privées aux stories
- [ ] Stories à la une (highlights)
- [ ] Analytics avancés (taux de complétion, drop-off)
- [ ] Support des sondages et questions
- [ ] Upload multiple (carousel)
- [ ] Filtres et effets sur les images

---

**Créé avec** ❤️ **pour votre plateforme de créatrices**
