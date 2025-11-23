#!/bin/bash

# Script d'installation automatique du Dashboard Admin
# Pour AI Creator Chat

echo "🚀 Installation du Dashboard Admin..."
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher un succès
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Fonction pour afficher une étape
step() {
    echo -e "${BLUE}→${NC} $1"
}

# Fonction pour afficher une erreur
error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier que nous sommes dans un projet Next.js
if [ ! -f "package.json" ]; then
    error "Erreur : Ce script doit être exécuté dans un projet Next.js"
    exit 1
fi

success "Projet Next.js détecté"

# Créer les dossiers nécessaires
step "Création des dossiers..."
mkdir -p lib
mkdir -p components/admin
mkdir -p app/api/admin/stats
mkdir -p app/api/admin/users
mkdir -p app/api/admin/messages
mkdir -p app/admin
success "Dossiers créés"

# Installer Supabase
step "Installation de @supabase/supabase-js..."
if command -v yarn &> /dev/null; then
    yarn add @supabase/supabase-js
else
    npm install @supabase/supabase-js
fi
success "@supabase/supabase-js installé"

# Créer le fichier .env.local s'il n'existe pas
if [ ! -f ".env.local" ]; then
    step "Création du fichier .env.local..."
    cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton-anon-key-ici

# Admin Dashboard
ADMIN_PASSWORD=change-moi-tout-de-suite

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxx
EOL
    success "Fichier .env.local créé"
    echo ""
    echo "⚠️  IMPORTANT : Édite .env.local avec tes vraies clés Supabase !"
    echo ""
else
    step ".env.local existe déjà, ajout des variables Supabase..."
    if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "" >> .env.local
        echo "# Supabase Configuration" >> .env.local
        echo "NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co" >> .env.local
        echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=ton-anon-key-ici" >> .env.local
        echo "ADMIN_PASSWORD=change-moi-tout-de-suite" >> .env.local
        success "Variables ajoutées à .env.local"
    else
        success "Variables Supabase déjà présentes"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
success "Installation terminée ! 🎉"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. Crée un projet sur https://supabase.com (gratuit)"
echo "2. Va dans SQL Editor et exécute le script supabase-schema.sql"
echo "3. Copie ton URL et ta clé dans .env.local"
echo "4. Lance 'npm run dev' ou 'yarn dev'"
echo "5. Va sur http://localhost:3000/admin"
echo ""
echo "📖 Lis README-ADMIN.md pour plus de détails"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
