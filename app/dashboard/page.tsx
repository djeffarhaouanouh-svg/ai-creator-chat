'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MessageCircle, DollarSign, TrendingUp, CreditCard, Settings, LogOut, X, User } from 'lucide-react'
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
    alert('Mise à jour du profil à implémenter via API')
    // TODO: Créer /api/user/update
  }

  const handleLogout = () => {
    localStorage.removeItem('accountType')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1f1f1f' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1f1f1f' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bonjour, {user?.name || 'Utilisateur'} 👋
          </h1>
          <p className="text-gray-400">Vue d'ensemble de vos abonnements et conversations</p>
        </div>

        {/* STATS */}
        <div className="space-y-6">

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
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
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
              ) : (
                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalSubscriptions || 0}</h3>
              )}
              <p className="text-sm text-gray-600">Abonnements actifs</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="text-blue-600" size={24} />
                </div>
              </div>
              {statsLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
              ) : (
                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalMessages || 0}</h3>
              )}
              <p className="text-sm text-gray-600">Messages envoyés</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
              {statsLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
              ) : (
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats?.monthlySpent.toFixed(2) || '0.00'}€
                </h3>
              )}
              <p className="text-sm text-gray-600">Dépenses mensuelles</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
              {statsLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
              ) : (
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats?.avgMessagesPerCreator.toFixed(0) || 0}
                </h3>
              )}
              <p className="text-sm text-gray-600">Messages moyens/créatrice</p>
            </div>
          </div>

          {/* PROFIL */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Détails du compte</h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Nom</label>
                <input 
                  type="text"
                  name="name"
                  defaultValue={user?.name}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <input 
                  type="email"
                  name="email"
                  defaultValue={user?.email}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full px-6 py-3 text-white rounded-lg"
                style={{ backgroundColor: '#e31fc1' }}
              >
                Mettre à jour les informations
              </button>
            </form>
          </div>

          {/* ABONNEMENTS */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Mes abonnements</h2>
            </div>

            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : subscriptions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun abonnement actif</p>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
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
                        <h4 className="font-semibold text-gray-900">{subscription.creator_name}</h4>
                        <p className="text-sm text-gray-500">@{subscription.creator_slug}</p>

                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          <span>
                            Actif depuis{" "}
                            {new Date(subscription.started_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="px-3 py-1 text-sm border rounded-md"
                      style={{ borderColor: '#e31fc1', color: '#e31fc1' }}
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
              <div className="flex items-center">
                <X className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-sm text-red-700">{statsError}</p>
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
              className="px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

          <div className="flex justify-center pt-8 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-6 py-3 bg-gray-800 text-white rounded-lg"
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
