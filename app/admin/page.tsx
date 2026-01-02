'use client'

import { useState, useEffect } from 'react'
import StatsCard from '@/components/admin/StatsCard'
import RevenueChart from '@/components/admin/RevenueChart'
import UsersList from '@/components/admin/UsersList'
import RecentMessages from '@/components/admin/RecentMessages'
import CohortAnalysis from '@/components/admin/CohortAnalysis'
import MetricsGrid from '@/components/admin/MetricsGrid'
import RetentionTrendChart from '@/components/admin/RetentionTrendChart'

interface DashboardData {
  stats: {
    global: {
      total_users: number
      total_subscriptions: number
      total_messages: number
      total_revenue: number
      revenue_this_month: number
    }
    byCreator: Array<{
      creator_id: string
      creators: { name: string }
      count: number
    }>
    revenueChart: Array<{
      date: string
      amount: number
    }>
  }
  users: any[]
  messages: any[]
  cohorts?: {
    retention_type: string
    cohorts: any[]
    activity_metrics: any
    value_metrics: any
    retention_trend: any[]
  }
  topFans?: {
    success: boolean
    topFans: any[]
    total: number
    creator?: any
  }
  stories?: {
    success: boolean
    stories: any[]
    total: number
  }
  contentRequests?: {
    success: boolean
    requests: any[]
    stats: any
    total: number
  }
  doublesIa?: {
    success: boolean
    doubles: any[]
    stats: any
    total: number
  }
  creatorsStats?: {
    creators?: any[]
    creator?: any
    stats?: any
  }
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'messages' | 'top-fans' | 'stories' | 'content-requests' | 'doubles-ia' | 'creators'>('overview')
  const [retentionType, setRetentionType] = useState<'classic' | 'rolling'>('rolling')

  // Fonction pour charger les données
  const fetchData = async (adminPassword: string, isInitialLogin: boolean = false) => {
    try {
      setLoading(true)

      const headers = {
        'Authorization': `Bearer ${adminPassword}`,
        'Content-Type': 'application/json'
      }

      // Charger stats
      const statsRes = await fetch('/api/admin/stats', { headers })
      if (!statsRes.ok) {
        const errorData = await statsRes.json().catch(() => ({}))
        if (statsRes.status === 401) {
          throw new Error('Mot de passe incorrect')
        }
        throw new Error(errorData.error || 'Erreur de connexion')
      }
      const stats = await statsRes.json()

      // Charger users
      const usersRes = await fetch(`/api/admin/users?page=${currentPage}&limit=20`, { headers })
      const users = await usersRes.json()

      // Charger messages
      const messagesRes = await fetch('/api/admin/messages?limit=20', { headers })
      const messages = await messagesRes.json()

      // Charger cohorts (si onglet analytics)
      // Préserver les données existantes si le chargement échoue
      let cohorts = data?.cohorts
      if (activeTab === 'analytics') {
        try {
          const cohortsRes = await fetch(`/api/admin/cohorts?type=${retentionType}`, { headers })
          if (cohortsRes.ok) {
            cohorts = await cohortsRes.json()
          } else {
            console.warn('Erreur lors du chargement des cohorts, conservation des données existantes')
            // Garder les données existantes si la requête échoue
          }
        } catch (error) {
          console.error('Erreur lors du chargement des cohorts:', error)
          // Garder les données existantes en cas d'erreur
        }
      }

      // Charger top fans
      let topFans = undefined
      if (activeTab === 'top-fans' || activeTab === 'overview') {
        const topFansRes = await fetch('/api/admin/top-fans?limit=20', { headers })
        if (topFansRes.ok) {
          topFans = await topFansRes.json()
        }
      }

      // Charger stories
      let stories = undefined
      if (activeTab === 'stories' || activeTab === 'overview') {
        const storiesRes = await fetch('/api/admin/stories?limit=20', { headers })
        if (storiesRes.ok) {
          stories = await storiesRes.json()
        }
      }

      // Charger content requests
      let contentRequests = undefined
      if (activeTab === 'content-requests' || activeTab === 'overview') {
        const contentRequestsRes = await fetch('/api/admin/content-requests?limit=20', { headers })
        if (contentRequestsRes.ok) {
          contentRequests = await contentRequestsRes.json()
        }
      }

      // Charger doubles IA
      let doublesIa = undefined
      if (activeTab === 'doubles-ia' || activeTab === 'overview') {
        const doublesIaRes = await fetch('/api/admin/doubles-ia?limit=20', { headers })
        if (doublesIaRes.ok) {
          doublesIa = await doublesIaRes.json()
        }
      }

      // Charger creators stats
      let creatorsStats = undefined
      if (activeTab === 'creators' || activeTab === 'overview') {
        const creatorsStatsRes = await fetch('/api/admin/creators-stats', { headers })
        if (creatorsStatsRes.ok) {
          creatorsStats = await creatorsStatsRes.json()
        }
      }

      setData({
        stats,
        users: users.users || [],
        messages: messages.messages || [],
        cohorts: cohorts !== undefined ? cohorts : data?.cohorts, // Préserver si undefined
        topFans: topFans !== undefined ? topFans : data?.topFans,
        stories: stories !== undefined ? stories : data?.stories,
        contentRequests: contentRequests !== undefined ? contentRequests : data?.contentRequests,
        doublesIa: doublesIa !== undefined ? doublesIa : data?.doublesIa,
        creatorsStats: creatorsStats !== undefined ? creatorsStats : data?.creatorsStats
      })

      setIsAuthenticated(true)
      setError('')

      // Sauvegarder le mot de passe dans sessionStorage
      sessionStorage.setItem('adminPassword', adminPassword)
    } catch (err: any) {
      // Ne déconnecter que si c'est le login initial, pas lors des refresh
      if (isInitialLogin) {
        const errorMessage = err?.message || 'Erreur de connexion'
        setError(errorMessage)
        setIsAuthenticated(false)
        console.error('Erreur de connexion admin:', err)
      } else {
        console.error('Erreur lors du chargement des données:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  // Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData(password, true)
  }

  // Vérifier si déjà connecté
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('adminPassword')
    if (savedPassword) {
      fetchData(savedPassword, true)
    }
  }, [])

  // Refresh data when tab changes or retention type changes
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('adminPassword')
    if (isAuthenticated && savedPassword) {
      fetchData(savedPassword, false)
    }
  }, [activeTab, retentionType])

  // Auto-refresh every 30 seconds (mais pas pour analytics qui est lourd)
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('adminPassword')
    if (isAuthenticated && savedPassword && activeTab !== 'analytics') {
      const interval = setInterval(() => {
        fetchData(savedPassword, false)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, activeTab])

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-500">
              Entrez le mot de passe pour accéder
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Mot de passe par défaut: <code className="bg-gray-100 px-2 py-1 rounded">admin123</code>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
                placeholder="Entrez le mot de passe admin"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  const { stats, users, messages } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gérez votre plateforme AI Creator Chat
              </p>
            </div>
            <button
              onClick={() => {
                setIsAuthenticated(false)
                setPassword('')
                sessionStorage.removeItem('adminPassword')
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Déconnexion
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'overview', label: '📊 Vue d\'ensemble' },
              { id: 'analytics', label: '📈 Analytics' },
              { id: 'users', label: '👥 Utilisateurs' },
              { id: 'messages', label: '💬 Messages' },
              { id: 'top-fans', label: '⭐ Top Fans' },
              { id: 'stories', label: '📸 Stories' },
              { id: 'content-requests', label: '🎁 Contenus' },
              { id: 'doubles-ia', label: '🤖 Doubles IA' },
              { id: 'creators', label: '👩 Créatrices' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Utilisateurs"
                value={stats.global.total_users.toLocaleString()}
                icon="👥"
              />
              <StatsCard
                title="Abonnements Actifs"
                value={stats.global.total_subscriptions.toLocaleString()}
                icon="✅"
              />
              <StatsCard
                title="Messages Envoyés"
                value={stats.global.total_messages.toLocaleString()}
                icon="💬"
              />
              <StatsCard
                title="Revenus Total"
                value={`${stats.global.total_revenue.toLocaleString()} €`}
                icon="💰"
                subtitle={`${stats.global.revenue_this_month.toFixed(2)} € ce mois`}
              />
            </div>

            {/* Revenue Chart */}
            <RevenueChart data={stats.revenueChart} />

            {/* Stats by Creator */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">👩 Abonnés par créatrice</h3>
              <div className="space-y-3">
                {stats.byCreator.map((creator, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {creator.creators.name}
                    </span>
                    <span className="text-sm font-bold text-purple-600">
                      {creator.count} abonné{creator.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Messages */}
            <RecentMessages messages={messages} limit={10} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <>
            {loading && !data.cohorts ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des analytics...</p>
                </div>
              </div>
            ) : data.cohorts ? (
              <div className="space-y-8">
                {/* Metrics Grid */}
                <MetricsGrid
                  activityMetrics={data.cohorts.activity_metrics}
                  valueMetrics={data.cohorts.value_metrics}
                />

                {/* Retention Trend Chart */}
                <RetentionTrendChart data={data.cohorts.retention_trend} />

                {/* Cohort Analysis Table */}
                <CohortAnalysis
                  cohorts={data.cohorts.cohorts}
                  retentionType={data.cohorts.retention_type}
                  onRetentionTypeChange={(type) => setRetentionType(type)}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <UsersList
            users={users}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}

        {activeTab === 'messages' && (
          <RecentMessages messages={messages} limit={50} />
        )}

        {activeTab === 'top-fans' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-4">⭐ Top Fans</h2>
              {data.topFans?.topFans && data.topFans.topFans.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Rang</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilisateur</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Messages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topFans.topFans.map((fan: any) => (
                        <tr key={fan.userId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="text-lg font-bold text-purple-600">#{fan.rank}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {fan.avatar && (
                                <img src={fan.avatar} alt={fan.name} className="w-10 h-10 rounded-full" />
                              )}
                              <div>
                                <div className="font-medium text-gray-900">{fan.name}</div>
                                {fan.email && (
                                  <div className="text-sm text-gray-500">{fan.email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {fan.messageCount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun top fan disponible</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-4">📸 Stories</h2>
              {data.stories?.stories && data.stories.stories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.stories.stories.map((story: any) => (
                    <div key={story.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{story.creator_name || 'Inconnu'}</span>
                        <div className="flex gap-2">
                          {story.is_locked && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">🔒</span>}
                          {story.is_expired && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Expiré</span>}
                          {!story.is_active && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactif</span>}
                        </div>
                      </div>
                      {story.media_url && (
                        <div className="mb-2">
                          {story.media_type === 'image' ? (
                            <img src={story.media_url} alt={story.title || 'Story'} className="w-full h-48 object-cover rounded" />
                          ) : (
                            <video src={story.media_url} className="w-full h-48 object-cover rounded" controls />
                          )}
                        </div>
                      )}
                      {story.title && (
                        <h3 className="font-semibold text-gray-900 mb-1">{story.title}</h3>
                      )}
                      {story.caption && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{story.caption}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(story.created_at).toLocaleDateString('fr-FR')}</span>
                        <span>👁️ {story.view_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune story disponible</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'content-requests' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-4">🎁 Demandes de Contenu Personnalisé</h2>
              {data.contentRequests?.stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{data.contentRequests.stats.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">{data.contentRequests.stats.pending}</div>
                    <div className="text-sm text-gray-600">En attente</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{data.contentRequests.stats.paid}</div>
                    <div className="text-sm text-gray-600">Payé</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{data.contentRequests.stats.delivered}</div>
                    <div className="text-sm text-gray-600">Livré</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-pink-600">{data.contentRequests.stats.total_revenue.toFixed(2)} €</div>
                    <div className="text-sm text-gray-600">Revenus</div>
                  </div>
                </div>
              )}
              {data.contentRequests?.requests && data.contentRequests.requests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Créatrice</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilisateur</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Message</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Prix</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.contentRequests.requests.map((request: any) => (
                        <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{request.creator_name || 'Inconnu'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{request.user_name || request.user_email || 'Inconnu'}</div>
                            {request.user_email && (
                              <div className="text-sm text-gray-500">{request.user_email}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-xs truncate text-sm text-gray-700">{request.message}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              request.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              request.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {request.price ? `${request.price.toFixed(2)} €` : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune demande de contenu disponible</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'doubles-ia' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-4">🤖 Doubles IA</h2>
              {data.doublesIa?.stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{data.doublesIa.stats.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{data.doublesIa.stats.completed}</div>
                    <div className="text-sm text-gray-600">Complétés</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{data.doublesIa.stats.processing}</div>
                    <div className="text-sm text-gray-600">En cours</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{data.doublesIa.stats.failed}</div>
                    <div className="text-sm text-gray-600">Échoués</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-pink-600">{data.doublesIa.stats.public_count}</div>
                    <div className="text-sm text-gray-600">Publics</div>
                  </div>
                </div>
              )}
              {data.doublesIa?.doubles && data.doublesIa.doubles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilisateur</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Voix</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Public</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.doublesIa.doubles.map((double: any) => (
                        <tr key={double.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{double.user_name || double.user_email || 'Inconnu'}</div>
                            {double.user_email && (
                              <div className="text-sm text-gray-500">{double.user_email}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">{double.name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              double.status === 'completed' ? 'bg-green-100 text-green-800' :
                              double.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {double.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{double.voice_name || '-'}</td>
                          <td className="py-3 px-4">
                            {double.is_public ? (
                              <span className="text-green-600 font-semibold">✓</span>
                            ) : (
                              <span className="text-gray-400">✗</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(double.created_at).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun double IA disponible</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'creators' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-4">👩 Statistiques par Créatrice</h2>
              {data.creatorsStats?.creators && data.creatorsStats.creators.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Créatrice</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Messages</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Abonnés</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenus</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Jours actifs</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Dernière connexion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.creatorsStats.creators.map((creator: any) => (
                        <tr key={creator.creator_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{creator.creator_name}</div>
                            <div className="text-sm text-gray-500">@{creator.creator_slug}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {creator.totalMessages.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {creator.totalSubscribers.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-purple-600">
                            {creator.totalRevenue.toFixed(2)} €
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-blue-600">{creator.activeDays || 0}</span>
                            <span className="text-sm text-gray-500 ml-1">jours</span>
                          </td>
                          <td className="py-3 px-4 text-right text-sm">
                            {creator.last_login ? (
                              <div>
                                <div className="text-gray-900">{new Date(creator.last_login).toLocaleDateString('fr-FR')}</div>
                                {creator.daysSinceLastLogin !== null && (
                                  <div className="text-gray-500">
                                    Il y a {creator.daysSinceLastLogin} jour{creator.daysSinceLastLogin > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Jamais connecté</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : data.creatorsStats?.creator && data.creatorsStats.stats ? (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {data.creatorsStats.creator.name}
                    </h3>
                    <p className="text-sm text-gray-500">@{data.creatorsStats.creator.slug}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{data.creatorsStats.stats.totalMessages.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Messages totaux</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{data.creatorsStats.stats.totalSubscribers.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Abonnés</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">{data.creatorsStats.stats.totalRevenue.toFixed(2)} €</div>
                      <div className="text-sm text-gray-600">Revenus totaux</div>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-pink-600">{data.creatorsStats.stats.monthlyRevenue.toFixed(2)} €</div>
                      <div className="text-sm text-gray-600">Revenus ce mois</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">📅 Activité</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{data.creatorsStats.stats.activeDays || 0}</div>
                        <div className="text-xs text-gray-600">Jours actifs</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {data.creatorsStats.creator.last_login 
                            ? new Date(data.creatorsStats.creator.last_login).toLocaleDateString('fr-FR')
                            : 'Jamais'}
                        </div>
                        <div className="text-xs text-gray-600">Dernière connexion</div>
                        {data.creatorsStats.stats.daysSinceLastLogin !== null && (
                          <div className="text-xs text-gray-500 mt-1">
                            Il y a {data.creatorsStats.stats.daysSinceLastLogin} jour{data.creatorsStats.stats.daysSinceLastLogin > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {data.creatorsStats.creator.created_at 
                            ? new Date(data.creatorsStats.creator.created_at).toLocaleDateString('fr-FR')
                            : '-'}
                        </div>
                        <div className="text-xs text-gray-600">Date d'inscription</div>
                      </div>
                    </div>
                  </div>
                  {data.creatorsStats.stats.contentRevenue > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Contenus Personnalisés</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-lg font-bold text-yellow-600">{data.creatorsStats.stats.deliveredContent}</div>
                          <div className="text-xs text-gray-600">Livrés</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-600">{data.creatorsStats.stats.contentRevenue.toFixed(2)} €</div>
                          <div className="text-xs text-gray-600">Revenus</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-600">{data.creatorsStats.stats.contentRevenueThisMonth.toFixed(2)} €</div>
                          <div className="text-xs text-gray-600">Ce mois</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-600">{data.creatorsStats.stats.pendingRequests}</div>
                          <div className="text-xs text-gray-600">En attente</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune statistique disponible</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}