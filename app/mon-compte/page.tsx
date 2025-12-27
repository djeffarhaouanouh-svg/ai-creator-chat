'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MonComptePage() {
  const router = useRouter()

  useEffect(() => {
    // Vérifier le type de compte dans localStorage
    const accountType = localStorage.getItem('accountType')
    const creatorSlug = localStorage.getItem('creatorSlug')
    const userId = localStorage.getItem('userId')

    console.log('🔍 MON COMPTE - DEBUG:', { accountType, creatorSlug, userId })

    if (accountType === 'creator' && creatorSlug) {
      // Rediriger vers le dashboard créatrice
      console.log('✅ Redirection vers dashboard créatrice')
      router.replace('/creator/dashboard')
    } else if (userId) {
      // Rediriger vers le dashboard utilisateur
      console.log('✅ Redirection vers dashboard utilisateur')
      router.replace('/dashboard')
    } else {
      // Aucune session trouvée, rediriger vers login
      console.log('❌ Aucune session - Redirection vers login')
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e31fc1] mx-auto"></div>
        <p className="mt-4 text-gray-400">Chargement de votre compte...</p>
      </div>
    </div>
  )
}
