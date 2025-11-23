# Scripts NPM à ajouter

Ajoute ces scripts dans ton `package.json` pour faciliter la gestion :

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    
    // 👇 NOUVEAUX SCRIPTS
    "creators:list": "node scripts/manage-creators.js list",
    "creators:seed": "node scripts/manage-creators.js seed",
    "creators:add": "node scripts/manage-creators.js add",
    "admin:open": "open http://localhost:3000/admin"
  }
}
```

## 📦 Dépendances à installer

Si ce n'est pas déjà fait :

```bash
npm install @supabase/supabase-js
# ou
yarn add @supabase/supabase-js
```

## 🎯 Utilisation des scripts

### Lister les créatrices
```bash
npm run creators:list
```

### Créer les créatrices par défaut
```bash
npm run creators:seed
```
Crée automatiquement :
- Emma (fitness coach)
- Sophie (travel blogger)
- Léa (gamer)
- Chloé (artiste)
- Marie (psychologue)

### Ajouter une créatrice
```bash
node scripts/manage-creators.js add "Julie" "julie" "Coach business" "professional,motivating"
```

### Activer/Désactiver une créatrice
```bash
node scripts/manage-creators.js toggle emma
```

### Supprimer une créatrice
```bash
node scripts/manage-creators.js delete julie
```

### Ouvrir le dashboard admin
```bash
npm run admin:open
# ou directement : http://localhost:3000/admin
```

## 💡 Tips

1. **Toujours seed les créatrices** après avoir créé la base de données
2. **Utilise `toggle`** plutôt que `delete` pour désactiver temporairement
3. **Le slug** doit être unique et sans espaces (utilise des tirets)
4. **La personnalité** doit être une liste de traits séparés par des virgules

## 🎨 Personnalités disponibles

Tu peux combiner ces traits pour créer des personnalités uniques :

**Traits positifs :**
- friendly, caring, supportive, kind, warm
- energetic, enthusiastic, passionate, excited
- funny, playful, witty, humorous
- intelligent, wise, thoughtful, insightful
- creative, artistic, imaginative
- adventurous, spontaneous, bold
- calm, peaceful, relaxed, zen

**Traits professionnels :**
- professional, serious, formal
- motivating, inspiring, encouraging
- empathetic, understanding, compassionate
- confident, assertive, direct

**Traits spécifiques :**
- geek, tech-savvy, nerdy
- sporty, athletic, fit
- romantic, flirty, charming
- mysterious, intriguing
- competitive, ambitious

**Exemple de bonnes combinaisons :**
```javascript
// Coach fitness
personality: "energetic,motivating,friendly,supportive"

// Gamer
personality: "playful,competitive,funny,geek"

// Psychologue
personality: "empathetic,calm,understanding,wise"

// Artiste
personality: "creative,artistic,emotional,inspiring"

// Business coach
personality: "professional,confident,motivating,direct"
```

## 🚀 Workflow recommandé

1. **Après installation** :
   ```bash
   npm run creators:seed
   npm run creators:list
   ```

2. **Pour ajouter une nouvelle créatrice** :
   ```bash
   node scripts/manage-creators.js add "Nom" "slug" "Bio" "traits"
   npm run creators:list  # Vérifier
   ```

3. **Tester dans le dashboard** :
   ```bash
   npm run dev
   npm run admin:open
   ```

4. **En production** :
   - Ne jamais supprimer les créatrices avec des abonnements actifs
   - Utilise `toggle` pour les désactiver temporairement
   - Backup la base avant toute modification importante
