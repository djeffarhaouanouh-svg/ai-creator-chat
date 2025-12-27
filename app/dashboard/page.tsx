'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MessageCircle, DollarSign, TrendingUp, CreditCard, Settings, LogOut, X, User, Camera, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { storage } from '@/lib/storage'

interface UserStats {
  totalSubscriptions: number
  totalMessages: number
  totalSpent: number
  monthlySpent: number
  newSubscriptionsThisMonth: number
  messagesThisMonth: number
  avgMessagesPerCreator: number
}

interface Subscription {
  id: string
  user_id: string
  creator_id: string
  creator_name: string
  creator_slug: string
  creator_avatar: string
  creator_bio: string
  plan: string
  status: string
  started_at: string
  expires_at: string
}

export default function MonCompte() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [hasSubscriptions, setHasSubscriptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userId = localStorage.getItem('userId')

    if (!userId) {
      router.push('/login')
      return
    }

    setLoading(false)
    loadStats(userId)
  }, [router])

  const loadStats = async (userId: string) => {
    setStatsLoading(true)
    setStatsError(null)

    try {
      const response = await fetch(`/api/user/stats?userId=${userId}`)

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques')
      }

      const data = await response.json()
      setUser(data.user)
      setStats(data.stats)
      setSubscriptions(data.subscriptions)
      
      // Vérifier si l'utilisateur a des abonnements actifs (utilisateur payant)
      const hasActiveSubs = data.subscriptions && data.subscriptions.length > 0
      setHasSubscriptions(hasActiveSubs)

      // Synchroniser les abonnements avec localStorage pour les pages créatrices
      if (data.subscriptions && data.subscriptions.length > 0) {
        data.subscriptions.forEach((sub: Subscription) => {
          if (sub.status === 'active' && sub.creator_slug) {
            storage.subscribe(sub.creator_slug)
          }
        })
      }
    } catch (error) {
      console.error('Erreur stats:', error)
      setStatsError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setStatsLoading(false)
    }
  }

  // UPDATE USER
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('Vous devez être connecté')
      return
    }

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string

    if (!name || !name.trim()) {
      alert('Le nom est requis')
      return
    }

    if (!email || !email.trim()) {
      alert('L\'email est requis')
      return
    }

    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: name.trim(),
          email: email.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      // Mettre à jour le localStorage avec le nouveau nom
      localStorage.setItem('userName', data.user.name)

      // Recharger les données utilisateur
      await loadStats(userId)

      alert('Profil mis à jour avec succès !')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil')
    }
  }

  // Upload avatar (uniquement pour utilisateurs payants)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop volumineuse (max 5MB)')
      return
    }

    setAvatarUploading(true)
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('Vous devez être connecté')
      setAvatarUploading(false)
      return
    }

    try {
      // Upload l'image
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Erreur lors de l\'upload')
      }

      const uploadData = await uploadResponse.json()

      // Mettre à jour l'avatar dans la base de données
      const updateResponse = await fetch('/api/user/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          avatarUrl: uploadData.url
        })
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Erreur lors de la mise à jour de l\'avatar'
        console.error('Avatar update error:', errorData)
        throw new Error(errorMessage)
      }

      // Recharger les données utilisateur
      loadStats(userId)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'avatar')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Supprimer avatar (uniquement pour utilisateurs payants)
  const handleDeleteAvatar = async () => {
    if (!user?.avatar_url) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      return
    }

    setAvatarUploading(true)
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('Vous devez être connecté')
      setAvatarUploading(false)
      return
    }

    try {
      // Mettre à jour l'avatar à null dans la base de données
      const updateResponse = await fetch('/api/user/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          avatarUrl: null
        })
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Erreur lors de la suppression de l\'avatar'
        console.error('Avatar delete error:', errorData)
        throw new Error(errorMessage)
      }

      // Recharger les données utilisateur
      loadStats(userId)
    } catch (error) {
      console.error('Error deleting avatar:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'avatar')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accountType')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e31fc1]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bonjour, {user?.name || 'Utilisateur'} 👋
          </h1>
          <p className="text-gray-400">
            Vue d'ensemble de vos abonnements et conversations sur{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              MyDouble
            </span>
          </p>
        </div>

        {/* STATS */}
        <div className="space-y-6">

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fce7f3' }}>
                  <Users style={{ color: '#e31fc1' }} size={24} />
                </div>
                {stats && stats.newSubscriptionsThisMonth > 0 && (
                  <span className="text-xs text-green-600 font-semibold">
                    +{stats.newSubscriptionsThisMonth} ce mois
                  </span>
                )}
              </div>
              {statsLoading ? (
                <div className="h-8 w-20 bg-gray-700 animate-pulse rounded mb-2"></div>
              ) : (
                <h3 className="text-2xl font-bold text-white">{stats?.totalSubscriptions || 0}</h3>
              )}
              <p className="text-sm text-gray-400">Abonnements actifs</p>
            </div>

            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <MessageCircle className="text-blue-400" size={24} />
                </div>
              </div>
              {statsLoading ? (
                <div className="h-8 w-20 bg-gray-700 animate-pulse rounded mb-2"></div>
              ) : (
                <h3 className="text-2xl font-bold text-white">{stats?.totalMessages || 0}</h3>
              )}
              <p className="text-sm text-gray-400">Messages envoyés</p>
            </div>

            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-400" size={24} />
                </div>
              </div>
              {statsLoading ? (
                <div className="h-8 w-24 bg-gray-700 animate-pulse rounded mb-2"></div>
              ) : (
                <h3 className="text-2xl font-bold text-white">
                  {stats?.monthlySpent.toFixed(2) || '0.00'}€
                </h3>
              )}
              <p className="text-sm text-gray-400">Dépenses mensuelles</p>
            </div>

            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-purple-400" size={24} />
                </div>
              </div>
              {statsLoading ? (
                <div className="h-8 w-20 bg-gray-700 animate-pulse rounded mb-2"></div>
              ) : (
                <h3 className="text-2xl font-bold text-white">
                  {stats?.avgMessagesPerCreator.toFixed(0) || 0}
                </h3>
              )}
              <p className="text-sm text-gray-400">Messages moyens/créatrice</p>
            </div>
          </div>

          {/* PROFIL */}
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Détails du compte</h2>

            {/* Avatar Upload - Uniquement pour les utilisateurs payants */}
            {hasSubscriptions && (
              <div className="mb-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
                    {user?.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.name || 'Avatar'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e31fc1] to-[#ff6b9d] flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-[#e31fc1] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#d11fb1] transition-colors disabled:opacity-50 z-10"
                    title="Changer la photo de profil"
                  >
                    {avatarUploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                  {user?.avatar_url && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={avatarUploading}
                      className="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50 z-10"
                      title="Supprimer la photo de profil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-400 text-center">
                  {user?.avatar_url 
                    ? 'Cliquez sur l\'icône caméra pour changer ou la poubelle pour supprimer'
                    : 'Cliquez sur l\'icône pour ajouter votre photo de profil'
                  }
                </p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Nom</label>
                <input 
                  type="text"
                  name="name"
                  defaultValue={user?.name}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Email</label>
                <input 
                  type="email"
                  name="email"
                  defaultValue={user?.email}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent outline-none"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-[#e31fc1]/50 transition-all"
              >
                Mettre à jour les informations
              </button>
            </form>
          </div>

          {/* ABONNEMENTS */}
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Mes abonnements</h2>
            </div>

            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-gray-700 rounded-lg">
                    <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-700 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : subscriptions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Aucun abonnement actif</p>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-900/50"
                  >
                    <div className="flex items-center gap-4">
                      {subscription.creator_avatar && (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden">
                          <Image
                            src={subscription.creator_avatar}
                            alt={subscription.creator_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold text-white">{subscription.creator_name}</h4>
                        <p className="text-sm text-gray-400">@{subscription.creator_slug}</p>

                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          <span>
                            Actif depuis{" "}
                            {new Date(subscription.started_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="px-3 py-1 text-sm border border-[#e31fc1] text-[#e31fc1] rounded-md hover:bg-[#e31fc1] hover:text-white transition-all"
                      onClick={() => router.push(`/creator/${subscription.creator_slug || subscription.creator_id}`)}
                    >
                      <User size={16} className="mr-2 inline" />
                      Voir profil
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message d'erreur */}
          {statsError && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-8">
              <div className="flex items-center">
                <X className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-300">{statsError}</p>
              </div>
            </div>
          )}

          {/* Bouton de rafraîchissement */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => {
                const userId = sessionStorage.getItem('userId')
                if (userId) loadStats(userId)
              }}
              disabled={statsLoading}
              className="px-6 py-3 bg-gray-900 border-2 border-[#e31fc1] text-[#e31fc1] rounded-lg font-semibold hover:bg-[#e31fc1] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg
                className={`w-5 h-5 ${statsLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {statsLoading ? 'Actualisation...' : 'Actualiser les statistiques'}
            </button>
          </div>

          <div className="flex justify-center pt-8 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-6 py-3 bg-gray-900 border border-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Se déconnecter</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
