'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CreatorStats {
  totalMessages: number
  totalSubscribers: number
  totalRevenue: number
  monthlyRevenue: number
  monthlyMessages: number
  newSubscribers: number
  activeConversations: number
  // Stats contenus personnalisés
  deliveredContent: number
  contentRevenue: number
  contentRevenueThisMonth: number
  pendingRequests: number
}

interface Subscriber {
  subscription_id: string
  user_id: string
  user_name: string
  user_email: string
  plan: string
  status: string
  started_at: string
  expires_at: string
  total_messages: number
  recent_messages: number
}

export default function CreatorDashboardPage() {
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    const accountType = localStorage.getItem('accountType')
    const creatorSlug = localStorage.getItem('creatorSlug')
    const creatorName = localStorage.getItem('creatorName')

    console.log('🔍 CREATOR DASHBOARD - DEBUG:', { accountType, creatorSlug, creatorName })

    if (accountType !== 'creator' || !creatorSlug) {
      console.log('❌ Pas de session créatrice - Redirection vers login')
      router.replace('/login')
      return
    }

    console.log('✅ Session créatrice trouvée')
    setSlug(creatorSlug)
    setName(creatorName)
    setLoading(false)

    // Charger les statistiques
    loadStats(creatorSlug)
  }, [router])

  const loadStats = async (creatorSlug: string) => {
    setStatsLoading(true)
    setStatsError(null)

    try {
      const response = await fetch(`/api/creator/stats?slug=${creatorSlug}`)

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques')
      }

      const data = await response.json()
      setStats(data.stats)
      setSubscribers(data.subscribers || [])
    } catch (error) {
      console.error('Erreur stats:', error)
      setStatsError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setStatsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('accountType')
    localStorage.removeItem('creatorSlug')
    localStorage.removeItem('creatorName')
    router.replace('/login')
  }

  if (loading || !slug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-6 md:p-8">

        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Créatrice
            </h1>
            <p className="text-gray-600">
              Connectée en tant que <span className="font-semibold text-purple-600">@{slug}</span>
            </p>
            {name && (
              <p className="text-sm text-gray-500 mt-1">{name}</p>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Actions rapides</h2>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => router.push('/creator/dashboard/edit-profile')}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Modifier mon profil</h3>
                  <p className="text-sm text-gray-500">Photo, nom et contenu exclusif</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                router.push('/creator/dashboard/messages#meilleurs-messages')
                setTimeout(() => {
                  const element = document.getElementById('meilleurs-messages')
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 300)
              }}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-pink-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Les meilleurs messages</h3>
                  <p className="text-sm text-gray-500">Partager en story</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push(`/creator/${slug}`)}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Voir mon profil</h3>
                  <p className="text-sm text-gray-500">Accéder à ma page créatrice</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/creator/dashboard/automated-messages')}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Messages automatiques</h3>
                  <p className="text-sm text-gray-500">Planifier des messages personnalisés</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Messages totaux</p>
                {statsLoading ? (
                  <div className="h-9 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.totalMessages.toLocaleString() || 0}
                  </p>
                )}
                {stats && stats.monthlyMessages > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    +{stats.monthlyMessages} ce mois
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Abonnés actifs</p>
                {statsLoading ? (
                  <div className="h-9 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.totalSubscribers.toLocaleString() || 0}
                  </p>
                )}
                {stats && stats.newSubscribers > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    +{stats.newSubscribers} ce mois
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Revenus totaux</p>
                {statsLoading ? (
                  <div className="h-9 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.totalRevenue.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }) || '0 €'}
                  </p>
                )}
                {stats && stats.monthlyRevenue > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    +{stats.monthlyRevenue.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    })} ce mois
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques supplémentaires */}
        {stats && !statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Conversations actives</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.activeConversations}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Derniers 7 jours
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Revenus mensuels</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.monthlyRevenue.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Mois en cours
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Contenus Personnalisés */}
        {stats && !statsLoading && (
          <div className="mb-8">
            {/* Encadrement de la section avec fond distinct */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-200">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-purple-900">Contenus Personnalisés</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Contenus vendus</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.deliveredContent || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total livrés
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Revenus contenus</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.contentRevenue.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </p>
                    {stats.contentRevenueThisMonth > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        +{stats.contentRevenueThisMonth.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        })} ce mois
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Demandes en attente</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.pendingRequests || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      À traiter
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {statsError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700">{statsError}</p>
            </div>
          </div>
        )}

        {/* Liste des abonnés */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Mes abonnés</h2>

          {statsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">Aucun abonné pour le moment</p>
              <p className="text-gray-400 text-sm mt-2">Vos abonnés apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscribers.map((subscriber) => (
                <div
                  key={subscriber.subscription_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-purple-200 transition-all gap-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar initiales */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {subscriber.user_name?.charAt(0).toUpperCase() || subscriber.user_email?.charAt(0).toUpperCase() || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">
                        {subscriber.user_name || 'Sans nom'}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">{subscriber.user_email}</p>

                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                        <span>
                          Abonné depuis le{" "}
                          {new Date(subscriber.started_at).toLocaleDateString("fr-FR")}
                        </span>
                        {subscriber.total_messages > 0 && (
                          <>
                            <span>•</span>
                            <span>{subscriber.total_messages} messages</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    {/* Badge activité */}
                    {subscriber.recent_messages > 0 ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Actif
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                        Inactif
                      </span>
                    )}

                    {/* Plan */}
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full capitalize">
                      {subscriber.plan}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton de rafraîchissement */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => slug && loadStats(slug)}
            disabled={statsLoading}
            className="px-6 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

        {/* Bouton Se déconnecter */}
        <div className="mt-8 flex justify-center pb-8">
          <button
            onClick={logout}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
          >
            Se déconnecter
          </button>
        </div>

      </div>
    </div>
  )
}
