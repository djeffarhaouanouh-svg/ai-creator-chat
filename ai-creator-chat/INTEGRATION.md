# 🔗 Intégration avec ton application AI Creator Chat

Ce guide explique comment intégrer le backend Supabase avec ton application de chat existante.

## 🎯 Points d'intégration

### 1. Page d'inscription / Login

Quand un utilisateur s'inscrit ou se connecte :

```typescript
// app/signup/page.tsx ou ton système d'auth
import { createUser, getUserByEmail, updateUserLastLogin } from '@/lib/admin-utils'

async function handleSignup(email: string, name: string) {
  try {
    // Vérifier si l'utilisateur existe déjà
    let user = await getUserByEmail(email)
    
    if (!user) {
      // Créer un nouvel utilisateur
      user = await createUser(email, name)
      console.log('Utilisateur créé:', user)
    } else {
      // Mettre à jour la dernière connexion
      await updateUserLastLogin(user.id)
    }
    
    // Sauvegarder l'ID dans la session/cookie
    // sessionStorage.setItem('userId', user.id)
    
    return user
  } catch (error) {
    console.error('Erreur inscription:', error)
    throw error
  }
}
```

### 2. Page de paiement / Abonnement

Après un paiement Stripe réussi :

```typescript
// app/api/webhook/stripe/route.ts (ou ton handler Stripe)
import { createSubscription, createPayment, updatePaymentStatus } from '@/lib/admin-utils'
import { getCreatorBySlug } from '@/lib/admin-utils'

export async function POST(req: Request) {
  // ... vérification webhook Stripe ...
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    
    // Récupérer les infos
    const userId = session.metadata.user_id
    const creatorSlug = session.metadata.creator_slug
    const plan = session.metadata.plan // 'weekly', 'monthly', 'yearly'
    
    // Récupérer la créatrice
    const creator = await getCreatorBySlug(creatorSlug)
    if (!creator) throw new Error('Créatrice non trouvée')
    
    // Créer l'abonnement
    const subscription = await createSubscription({
      user_id: userId,
      creator_id: creator.id,
      plan: plan,
      stripe_subscription_id: session.subscription,
      expires_at: calculateExpiryDate(plan) // fonction à créer
    })
    
    // Enregistrer le paiement
    const payment = await createPayment({
      user_id: userId,
      subscription_id: subscription.id,
      amount: session.amount_total / 100, // Stripe donne en centimes
      stripe_payment_id: session.payment_intent
    })
    
    // Marquer comme réussi
    await updatePaymentStatus(payment.id, 'succeeded')
    
    console.log('Abonnement créé avec succès !')
  }
}

function calculateExpiryDate(plan: string): string {
  const now = new Date()
  switch (plan) {
    case 'weekly':
      now.setDate(now.getDate() + 7)
      break
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      break
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1)
      break
  }
  return now.toISOString()
}
```

### 3. Page de chat - Vérifier l'accès

Avant d'afficher le chat, vérifier si l'utilisateur a un abonnement actif :

```typescript
// app/chat/[creator]/page.tsx
import { checkUserHasAccess, getCreatorBySlug } from '@/lib/admin-utils'

export default async function ChatPage({ params }: { params: { creator: string } }) {
  // Récupérer l'ID de l'utilisateur depuis ta session
  const userId = getUserIdFromSession() // fonction à créer selon ton auth
  
  // Récupérer la créatrice
  const creator = await getCreatorBySlug(params.creator)
  if (!creator) {
    return <div>Créatrice non trouvée</div>
  }
  
  // Vérifier l'accès
  const hasAccess = await checkUserHasAccess(userId, creator.id)
  
  if (!hasAccess) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Abonnement requis</h2>
        <p className="mb-4">
          Tu dois être abonné à {creator.name} pour accéder au chat
        </p>
        <a 
          href={`/subscribe/${creator.slug}`}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg"
        >
          S'abonner maintenant
        </a>
      </div>
    )
  }
  
  // L'utilisateur a accès, afficher le chat
  return <ChatInterface creator={creator} userId={userId} />
}
```

### 4. Chat - Sauvegarder les messages

Quand l'utilisateur envoie un message ou reçoit une réponse :

```typescript
// components/ChatInterface.tsx (ou ton composant de chat)
import { saveMessage, getConversationHistory } from '@/lib/admin-utils'
import { useState, useEffect } from 'react'

export default function ChatInterface({ creator, userId }: { creator: any, userId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  
  // Charger l'historique au montage
  useEffect(() => {
    loadHistory()
  }, [])
  
  async function loadHistory() {
    const history = await getConversationHistory(userId, creator.id, 50)
    setMessages(history)
  }
  
  async function sendMessage() {
    if (!input.trim()) return
    
    // Sauvegarder le message utilisateur
    const userMessage = await saveMessage({
      user_id: userId,
      creator_id: creator.id,
      content: input,
      role: 'user'
    })
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    // Envoyer à l'API Claude
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        creator: creator.name,
        personality: creator.personality
      })
    })
    
    const data = await response.json()
    
    // Sauvegarder la réponse de l'IA
    const aiMessage = await saveMessage({
      user_id: userId,
      creator_id: creator.id,
      content: data.response,
      role: 'assistant',
      tokens_used: data.usage?.total_tokens || 0
    })
    
    setMessages(prev => [...prev, aiMessage])
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <h2 className="font-semibold">{creator.name}</h2>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 border rounded-lg px-4 py-2"
            placeholder="Écris un message..."
          />
          <button
            onClick={sendMessage}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 5. Dashboard utilisateur - Afficher ses abonnements

```typescript
// app/dashboard/page.tsx
import { getUserSubscriptions } from '@/lib/admin-utils'

export default async function UserDashboard() {
  const userId = getUserIdFromSession()
  const subscriptions = await getUserSubscriptions(userId)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Mes abonnements</h1>
      
      <div className="grid gap-4">
        {subscriptions.map((sub: any) => (
          <div key={sub.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {sub.creators.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Plan: {sub.plan} - Status: {sub.status}
                </p>
              </div>
              <a
                href={`/chat/${sub.creators.slug}`}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg"
              >
                Discuter
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🔄 Schéma d'intégration complet

```
1. INSCRIPTION
   └─> createUser() ou getUserByEmail()
        └─> updateUserLastLogin()

2. ABONNEMENT
   └─> (Paiement Stripe)
        └─> createSubscription()
        └─> createPayment()
        └─> updatePaymentStatus('succeeded')

3. ACCÈS AU CHAT
   └─> checkUserHasAccess()
        └─> Si OUI: Afficher le chat
        └─> Si NON: Rediriger vers abonnement

4. CONVERSATION
   └─> getConversationHistory() (charger l'historique)
   └─> Pour chaque message:
        └─> saveMessage(user) 
        └─> Appel API Claude
        └─> saveMessage(assistant)

5. DASHBOARD USER
   └─> getUserSubscriptions() (afficher abonnements)
   └─> Pour chaque subscription: lien vers chat

6. DASHBOARD ADMIN
   └─> /admin (tout est déjà prêt !)
```

## 🎯 Variables de session

Tu dois gérer l'ID utilisateur dans ta session. Exemples :

### Option 1 : SessionStorage (Simple)
```typescript
// Après login
sessionStorage.setItem('userId', user.id)

// Pour récupérer
function getUserIdFromSession() {
  return sessionStorage.getItem('userId')
}
```

### Option 2 : Cookies (Plus sécurisé)
```typescript
import { cookies } from 'next/headers'

// Après login (server-side)
cookies().set('userId', user.id, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7 // 7 jours
})

// Pour récupérer
function getUserIdFromSession() {
  return cookies().get('userId')?.value
}
```

### Option 3 : Authentification Supabase complète
```typescript
// Si tu veux utiliser l'auth complète de Supabase
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createServerComponentClient({ cookies })
const { data: { session } } = await supabase.auth.getSession()
const userId = session?.user?.id
```

## ✅ Checklist d'intégration

- [ ] Installer Supabase : `npm install @supabase/supabase-js`
- [ ] Copier tous les fichiers dans ton projet
- [ ] Exécuter `supabase-schema.sql` dans Supabase
- [ ] Configurer `.env.local` avec tes clés Supabase
- [ ] Ajouter les créatrices dans la table `creators`
- [ ] Intégrer `createUser()` dans ton système d'inscription
- [ ] Intégrer `createSubscription()` après paiement Stripe
- [ ] Ajouter `checkUserHasAccess()` avant d'afficher le chat
- [ ] Utiliser `saveMessage()` dans ton composant de chat
- [ ] Tester le dashboard admin : http://localhost:3000/admin

## 🎉 C'est terminé !

Tu as maintenant un backend complet qui track automatiquement :
- ✅ Tous tes utilisateurs
- ✅ Tous les abonnements
- ✅ Tous les messages
- ✅ Tous les paiements
- ✅ Toutes les stats

Et un dashboard pour tout visualiser ! 🚀
