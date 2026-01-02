# 🔄 Récupération des paiements PayPal non enregistrés

## Problème résolu

Si un paiement PayPal a été effectué mais que l'abonnement n'a pas été créé à cause de l'erreur `column "paypal_order_id" does not exist`, vous pouvez maintenant récupérer ce paiement de plusieurs façons.

---

## ✅ Étape 1 : Exécuter la migration (OBLIGATOIRE)

Avant de récupérer les paiements, vous devez d'abord ajouter la colonne manquante :

### Option A : Via Vercel Dashboard (Recommandé)
1. Allez sur [vercel.com](https://vercel.com) et ouvrez votre projet
2. Onglet **Storage** → Cliquez sur votre base de données Postgres
3. Onglet **Query**
4. Copiez-collez le contenu de `migrations/add_paypal_order_id_to_payments.sql`
5. Cliquez sur **Execute**

### Option B : Via script TypeScript
```bash
npx tsx scripts/add-paypal-order-id.ts
```

### Option C : Via client SQL
Exécutez directement le fichier `migrations/add_paypal_order_id_to_payments.sql` dans votre client SQL.

---

## 🔍 Étape 2 : Récupérer le paiement

Une fois la migration exécutée, vous avez **3 options** pour récupérer le paiement :

### Option 1 : Via l'interface web (Le plus simple) ⭐

1. Allez sur : `http://localhost:3000/admin/recover-payment` (ou votre URL de production)
2. Entrez le **PayPal Order ID** (obligatoire)
3. Entrez le **User ID** et **Creator Slug** si vous voulez créer un nouvel abonnement
4. Cliquez sur "Récupérer le paiement"

**Comment trouver le PayPal Order ID ?**
- Vérifiez votre email de confirmation PayPal
- Connectez-vous à votre compte PayPal → Activité → Détails de la transaction

### Option 2 : Via l'API REST

```bash
curl -X POST http://localhost:3000/api/subscriptions/recover \
  -H "Content-Type: application/json" \
  -d '{
    "paypalOrderId": "5O190127TN364715T",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "creatorSlug": "lauryncrl",
    "amount": 9.99
  }'
```

### Option 3 : Via le script en ligne de commande

```bash
npx tsx scripts/recover-paypal-payment.ts
```

Le script vous posera des questions interactives :
- PayPal Order ID
- User ID
- Creator Slug
- Montant (optionnel)

---

## 📋 Informations nécessaires

Pour récupérer un paiement, vous aurez besoin de :

1. **PayPal Order ID** (obligatoire)
   - Trouvé dans l'email PayPal ou dans le compte PayPal
   - Format : `5O190127TN364715T` ou similaire

2. **User ID** (requis pour créer un nouvel abonnement)
   - UUID de l'utilisateur
   - Format : `123e4567-e89b-12d3-a456-426614174000`

3. **Creator Slug** (requis pour créer un nouvel abonnement)
   - Slug du créateur (ex: `lauryncrl`, `tootatis`)

4. **Montant** (optionnel)
   - Montant payé en EUR

---

## 🔄 Ce que fait la récupération

1. **Vérifie si le paiement existe déjà**
   - Si oui et que l'abonnement est actif → Tout est bon ✅
   - Si oui mais l'abonnement n'existe pas → Crée l'abonnement manquant
   - Si non → Crée le paiement et l'abonnement

2. **Crée l'abonnement si nécessaire**
   - Durée : 30 jours
   - Statut : `active`
   - Plan : `monthly`

3. **Enregistre le paiement**
   - Statut : `succeeded`
   - Associe le PayPal Order ID

---

## 🛠️ Dépannage

### Erreur : "column paypal_order_id does not exist"
→ Exécutez d'abord la migration (Étape 1)

### Erreur : "Creator not found"
→ Vérifiez que le creator slug est correct (ex: `lauryncrl`)

### Erreur : "User not found"
→ Vérifiez que le User ID est correct (format UUID)

### Le paiement existe déjà
→ C'est normal ! Le système vous indiquera que le paiement est déjà enregistré.

---

## 📝 Exemple complet

**Scénario :** Un utilisateur a payé 9.99€ pour s'abonner à `lauryncrl` mais l'abonnement n'a pas été créé.

**Solution :**
1. Exécuter la migration
2. Aller sur `/admin/recover-payment`
3. Entrer :
   - PayPal Order ID : `5O190127TN364715T`
   - User ID : `123e4567-e89b-12d3-a456-426614174000`
   - Creator Slug : `lauryncrl`
   - Montant : `9.99`
4. Cliquer sur "Récupérer le paiement"

**Résultat :** L'abonnement est créé et l'utilisateur peut maintenant accéder au contenu.

---

## 🔗 Fichiers créés

- `migrations/add_paypal_order_id_to_payments.sql` - Migration SQL
- `scripts/add-paypal-order-id.ts` - Script pour exécuter la migration
- `scripts/recover-paypal-payment.ts` - Script CLI pour récupérer les paiements
- `app/api/subscriptions/recover/route.ts` - API endpoint
- `app/admin/recover-payment/page.tsx` - Interface web
- `RECOVER-PAYMENT.md` - Ce fichier

---

## 💡 Note importante

Si vous avez plusieurs paiements non enregistrés, vous devrez les récupérer un par un. Le système vérifie automatiquement si un paiement existe déjà avant d'en créer un nouveau.

