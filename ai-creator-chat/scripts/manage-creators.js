// scripts/manage-creators.js
// Script pour gérer les créatrices facilement
// Usage: node scripts/manage-creators.js [command]

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Liste des créatrices par défaut
const DEFAULT_CREATORS = [
  {
    name: 'Emma',
    slug: 'emma',
    bio: 'Coach fitness passionnée et lifestyle influencer. Je t\'aide à atteindre tes objectifs !',
    personality: 'energetic,motivating,friendly,supportive',
    avatar_url: 'https://i.pravatar.cc/150?img=1'
  },
  {
    name: 'Sophie',
    slug: 'sophie',
    bio: 'Travel blogger et aventurière dans l\'âme. Partage tes rêves de voyage avec moi !',
    personality: 'adventurous,spontaneous,caring,dreamer',
    avatar_url: 'https://i.pravatar.cc/150?img=5'
  },
  {
    name: 'Léa',
    slug: 'lea',
    bio: 'Gamer passionnée et streamer. Prête pour une session gaming ?',
    personality: 'playful,competitive,funny,geek',
    avatar_url: 'https://i.pravatar.cc/150?img=9'
  },
  {
    name: 'Chloé',
    slug: 'chloe',
    bio: 'Artiste et créative. Parlons d\'art, de musique et de créativité !',
    personality: 'artistic,creative,emotional,inspiring',
    avatar_url: 'https://i.pravatar.cc/150?img=12'
  },
  {
    name: 'Marie',
    slug: 'marie',
    bio: 'Étudiante en psychologie. Je suis là pour t\'écouter et te comprendre.',
    personality: 'empathetic,intelligent,calm,understanding',
    avatar_url: 'https://i.pravatar.cc/150?img=16'
  }
]

async function listCreators() {
  console.log('📋 Liste des créatrices :\n')
  
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('❌ Erreur:', error.message)
    return
  }
  
  if (data.length === 0) {
    console.log('⚠️  Aucune créatrice trouvée')
    console.log('💡 Utilise: node scripts/manage-creators.js seed')
    return
  }
  
  data.forEach(creator => {
    console.log(`✨ ${creator.name} (@${creator.slug})`)
    console.log(`   Bio: ${creator.bio}`)
    console.log(`   Personnalité: ${creator.personality}`)
    console.log(`   Active: ${creator.is_active ? '✅' : '❌'}`)
    console.log(`   ID: ${creator.id}`)
    console.log('')
  })
}

async function seedCreators() {
  console.log('🌱 Création des créatrices par défaut...\n')
  
  for (const creator of DEFAULT_CREATORS) {
    const { data, error } = await supabase
      .from('creators')
      .upsert([creator], { onConflict: 'slug' })
      .select()
      .single()
    
    if (error) {
      console.error(`❌ Erreur pour ${creator.name}:`, error.message)
    } else {
      console.log(`✅ ${creator.name} créée avec succès !`)
    }
  }
  
  console.log('\n🎉 Terminé !')
}

async function addCreator(name, slug, bio, personality) {
  if (!name || !slug) {
    console.error('❌ Usage: node scripts/manage-creators.js add <name> <slug> [bio] [personality]')
    return
  }
  
  console.log(`➕ Ajout de ${name}...`)
  
  const { data, error } = await supabase
    .from('creators')
    .insert([{
      name,
      slug,
      bio: bio || `Créatrice ${name}`,
      personality: personality || 'friendly,caring'
    }])
    .select()
    .single()
  
  if (error) {
    console.error('❌ Erreur:', error.message)
    return
  }
  
  console.log('✅ Créatrice ajoutée avec succès !')
  console.log('ID:', data.id)
}

async function deleteCreator(slug) {
  if (!slug) {
    console.error('❌ Usage: node scripts/manage-creators.js delete <slug>')
    return
  }
  
  console.log(`🗑️  Suppression de @${slug}...`)
  
  const { error } = await supabase
    .from('creators')
    .delete()
    .eq('slug', slug)
  
  if (error) {
    console.error('❌ Erreur:', error.message)
    return
  }
  
  console.log('✅ Créatrice supprimée avec succès !')
}

async function toggleCreator(slug) {
  if (!slug) {
    console.error('❌ Usage: node scripts/manage-creators.js toggle <slug>')
    return
  }
  
  // Récupérer l'état actuel
  const { data: creator, error: fetchError } = await supabase
    .from('creators')
    .select('is_active')
    .eq('slug', slug)
    .single()
  
  if (fetchError) {
    console.error('❌ Créatrice non trouvée')
    return
  }
  
  // Inverser l'état
  const { error } = await supabase
    .from('creators')
    .update({ is_active: !creator.is_active })
    .eq('slug', slug)
  
  if (error) {
    console.error('❌ Erreur:', error.message)
    return
  }
  
  console.log(`✅ @${slug} est maintenant ${!creator.is_active ? 'active' : 'inactive'}`)
}

// Main
const command = process.argv[2]
const args = process.argv.slice(3)

async function main() {
  switch (command) {
    case 'list':
      await listCreators()
      break
    
    case 'seed':
      await seedCreators()
      break
    
    case 'add':
      await addCreator(...args)
      break
    
    case 'delete':
      await deleteCreator(args[0])
      break
    
    case 'toggle':
      await toggleCreator(args[0])
      break
    
    default:
      console.log('📚 Commandes disponibles:\n')
      console.log('  list                          Liste toutes les créatrices')
      console.log('  seed                          Crée les créatrices par défaut')
      console.log('  add <name> <slug> [bio]       Ajoute une nouvelle créatrice')
      console.log('  delete <slug>                 Supprime une créatrice')
      console.log('  toggle <slug>                 Active/Désactive une créatrice')
      console.log('')
      console.log('Exemples:')
      console.log('  node scripts/manage-creators.js list')
      console.log('  node scripts/manage-creators.js seed')
      console.log('  node scripts/manage-creators.js add "Julie" "julie" "Fitness coach"')
      console.log('  node scripts/manage-creators.js toggle emma')
      console.log('  node scripts/manage-creators.js delete julie')
  }
}

main().catch(console.error)
