# 📞 Configuration Vapi - Appel Vocal

Ce guide explique comment configurer l'intégration vocale avec Vapi dans l'application.

## 🔑 Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` à la racine du projet :

```env
# Vapi Configuration
NEXT_PUBLIC_VAPI_PUBLIC_KEY=3d7b48af-8a42-4947-b966-6ab03ad28054
NEXT_PUBLIC_VAPI_ASSISTANT_ID=bbb6761b-493b-4bc6-a277-235f0ddfdfa3
```

⚠️ **Important** : La clé ElevenLabs ne doit **PAS** être dans le frontend. Elle est déjà configurée côté Vapi.

## 📋 Étapes de configuration

1. **Obtenez votre clé publique Vapi** :
   - Connectez-vous à votre compte Vapi
   - Allez dans "API Keys" dans le menu
   - Dans la section "Public API Keys", copiez votre Public Key (format UUID, ex: `3d7b48af-8a42-4947-b966-6ab03ad28054`)

2. **Obtenez l'ID de votre assistant** :
   - Dans votre dashboard Vapi
   - Sélectionnez l'assistant configuré avec ElevenLabs
   - Copiez l'Assistant ID (format UUID)

3. **Configurez le fichier `.env.local`** :
   ```bash
   # Créez le fichier s'il n'existe pas
   touch .env.local
   
   # Ajoutez les variables (remplacez par vos vraies valeurs)
   echo "NEXT_PUBLIC_VAPI_PUBLIC_KEY=pk_votre_cle_ici" >> .env.local
   echo "NEXT_PUBLIC_VAPI_ASSISTANT_ID=votre_assistant_id_ici" >> .env.local
   ```

4. **Redémarrez le serveur de développement** :
   ```bash
   npm run dev
   ```

## ✅ Vérification

Une fois configuré, vous devriez voir le bouton 📞 "Appeler" dans le header de la page de chat.

Si le bouton n'apparaît pas, vérifiez :
- Les variables sont bien définies dans `.env.local`
- Le serveur a été redémarré après l'ajout des variables
- Les variables commencent bien par `NEXT_PUBLIC_` (obligatoire pour Next.js)

## 🎯 Fonctionnalités

- ✅ Appel vocal temps réel (Speech-to-Text + Text-to-Speech)
- ✅ Activation automatique du micro
- ✅ Bouton "Appeler" / "Raccrocher" dans le header
- ✅ Désactivation du champ texte pendant un appel
- ✅ Animation pulse/glow pendant l'appel
- ✅ Transcription des messages dans la console

## 🔒 Sécurité

- La clé publique Vapi peut être exposée côté client (elle est publique par design)
- Ne mettez JAMAIS la clé secrète Vapi dans le frontend
- ElevenLabs est configuré côté serveur Vapi, pas dans votre code

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que votre assistant Vapi est bien publié
3. Assurez-vous que votre navigateur accepte l'accès au microphone (HTTPS requis)

