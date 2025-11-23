export const dynamic = "force-dynamic";
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<'creator' | 'user'>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (accountType === 'creator') {
        const response = await fetch('/api/creator/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: email, password })
        })
        if (!response.ok) throw new Error('Identifiants incorrects')
        const data = await response.json()
        sessionStorage.setItem('creatorId', data.creator.id)
        sessionStorage.setItem('creatorSlug', data.creator.slug)
        router.push('/creator/dashboard')
      } else {
        const response = await fetch('/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        if (!response.ok) throw new Error('Identifiants incorrects')
        const data = await response.json()
        sessionStorage.setItem('userId', data.user.id)
        // Redirection corrigée vers /dashboard au lieu de /user/dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
          <p className="text-gray-500">Accédez à votre espace personnel</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button type="button" onClick={() => setAccountType('user')} className={`flex-1 py-3 px-4 rounded-lg font-medium ${accountType === 'user' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            👤 Abonné
          </button>
          <button type="button" onClick={() => setAccountType('creator')} className={`flex-1 py-3 px-4 rounded-lg font-medium ${accountType === 'creator' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            👩 Créatrice
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {accountType === 'creator' ? 'Identifiant (slug)' : 'Email'}
            </label>
            <input type={accountType === 'creator' ? 'text' : 'email'} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none" placeholder={accountType === 'creator' ? 'sarahmiller' : 'email@exemple.com'} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none" placeholder="••••••••" required />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Lien vers inscription - Visible uniquement pour les utilisateurs */}
        {accountType === 'user' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-semibold">
                Créer un compte
              </Link>
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
