import { sql } from '@vercel/postgres'

async function checkPasswords() {
  console.log('🔐 Vérification des mots de passe des créatrices\n')

  try {
    const result = await sql`
      SELECT id, name, slug,
             CASE
               WHEN password IS NULL THEN '❌ NULL'
               WHEN password = '' THEN '❌ VIDE'
               ELSE '✅ DÉFINI'
             END as password_status,
             CASE
               WHEN password IS NULL OR password = '' THEN NULL
               ELSE LEFT(password, 10) || '...'
             END as password_preview,
             is_active
      FROM creators
      ORDER BY name
    `

    console.log('📊 État des mots de passe:\n')
    console.log('━'.repeat(80))
    result.rows.forEach((creator: any, index: number) => {
      console.log(`${index + 1}. ${creator.name} (@${creator.slug})`)
      console.log(`   Password: ${creator.password_status}`)
      if (creator.password_preview) {
        console.log(`   Preview: ${creator.password_preview}`)
      }
      console.log(`   Active: ${creator.is_active ? '✅' : '❌'}`)
      console.log('')
    })
    console.log('━'.repeat(80))

    // Vérifier combien n'ont pas de mot de passe
    const missingPasswords = result.rows.filter((c: any) =>
      c.password_status !== '✅ DÉFINI'
    )

    if (missingPasswords.length > 0) {
      console.log(`\n⚠️  ${missingPasswords.length} créatrice(s) sans mot de passe!`)
      console.log('   Elles ne peuvent pas se connecter.')
      console.log('\n💡 Solution: Définir un mot de passe pour chaque créatrice')
    } else {
      console.log('\n✅ Toutes les créatrices ont un mot de passe!')
    }

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message)
  }
}

checkPasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })
