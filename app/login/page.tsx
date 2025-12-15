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

  // Validation côté client
  const validateInputs = () => {
    if (accountType === 'user') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Adresse email invalide')
        return false
      }
    } else {
      if (!email.trim()) {
        setError('Veuillez entrer votre identifiant')
        return false
      }
    }

    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return false
    }

    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!validateInputs()) {
      return
    }

    setLoading(true)

    try {
      if (accountType === 'creator') {
        // Connexion Créatrice
        const response = await fetch('/api/creator/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: email.trim().toLowerCase(), password })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Identifiants incorrects')
        }

        // Sauvegarder les infos de session dans localStorage pour persistance
        localStorage.setItem('accountType', 'creator')
        localStorage.setItem('creatorSlug', data.creator.slug)
        localStorage.setItem('creatorName', data.creator.name)

        // Redirection vers le dashboard créatrice
        router.push('/creator/dashboard')

      } else {
        // Connexion Utilisateur
        const response = await fetch('/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase(), password })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Identifiants incorrects')
        }

        // Sauvegarder les infos de session dans localStorage pour persistance
        localStorage.setItem('accountType', 'user')
        localStorage.setItem('userId', data.user.id)
        localStorage.setItem('userName', data.user.name || data.user.email)

        // Redirection vers le dashboard utilisateur
        router.push('/dashboard')
      }

    } catch (err) {
      console.error('Erreur de connexion:', err)
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
      setLoading(false)
    }
  }

  // Gestion du changement de type de compte
  const handleAccountTypeChange = (type: 'creator' | 'user') => {
    setAccountType(type)
    setError('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h1>
          <p className="text-gray-500">Accédez à votre espace personnel</p>
        </div>

        {/* Toggle Type de compte */}
        <div className="flex gap-2 mb-6" role="group" aria-label="Type de compte">
          <button
            type="button"
            onClick={() => handleAccountTypeChange('user')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              accountType === 'user'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={accountType === 'user'}
          >
            <span className="mr-2">👤</span>
            Abonné
          </button>

          <button
            type="button"
            onClick={() => handleAccountTypeChange('creator')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              accountType === 'creator'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-pressed={accountType === 'creator'}
          >
            <span className="mr-2">✨</span>
            Créatrice
          </button>
        </div>

        {/* Formulaire de connexion */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email / Identifiant */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {accountType === 'creator' ? 'Identifiant (slug)' : 'Adresse email'}
            </label>
            <input
              id="email"
              type={accountType === 'creator' ? 'text' : 'email'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder={
                accountType === 'creator'
                  ? 'tootatis'
                  : 'email@exemple.com'
              }
              autoComplete={accountType === 'creator' ? 'username' : 'email'}
              required
              disabled={loading}
            />
            {accountType === 'creator' && (
              <p className="text-xs text-gray-500 mt-1">
                Votre identifiant unique (ex: tootatis)
              </p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-shake"
              role="alert"
              aria-live="assertive"
            >
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          )}

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Connexion en cours...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Lien vers inscription (uniquement pour les utilisateurs) */}
        {accountType === 'user' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link
                href="/signup"
                className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        )}

        {/* Retour à l'accueil */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center"
          >
            <span className="mr-1">←</span>
            Retour à l'accueil
          </Link>
        </div>
      </div>

      {/* Animation shake pour les erreurs */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  )
}
