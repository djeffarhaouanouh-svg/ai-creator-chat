'use client'

import { useState, useEffect } from 'react'
import StatsCard from '@/components/admin/StatsCard'
import RevenueChart from '@/components/admin/RevenueChart'
import UsersList from '@/components/admin/UsersList'
import RecentMessages from '@/components/admin/RecentMessages'

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
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'messages'>('overview')

  // Fonction pour charger les données
  const fetchData = async (adminPassword: string) => {
    try {
      setLoading(true)
      
      const headers = {
        'Authorization': `Bearer ${adminPassword}`,
        'Content-Type': 'application/json'
      }

      // Charger stats
      const statsRes = await fetch('/api/admin/stats', { headers })
      if (!statsRes.ok) throw new Error('Unauthorized')
      const stats = await statsRes.json()

      // Charger users
      const usersRes = await fetch(`/api/admin/users?page=${currentPage}&limit=20`, { headers })
      const users = await usersRes.json()

      // Charger messages
      const messagesRes = await fetch('/api/admin/messages?limit=20', { headers })
      const messages = await messagesRes.json()

      setData({
        stats,
        users: users.users || [],
        messages: messages.messages || []
      })

      setIsAuthenticated(true)
      setError('')
      
      // Sauvegarder le mot de passe dans sessionStorage
      sessionStorage.setItem('adminPassword', adminPassword)
    } catch (err) {
      setError('Mot de passe incorrect')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  // Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData(password)
  }

  // Vérifier si déjà connecté
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('adminPassword')
    if (savedPassword) {
      fetchData(savedPassword)
    }
  }, [])

  // Refresh data when page changes
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('adminPassword')
    if (isAuthenticated && savedPassword) {
      fetchData(savedPassword)
    }
  }, [currentPage])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('adminPassword')
    if (isAuthenticated && savedPassword) {
      const interval = setInterval(() => {
        fetchData(savedPassword)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
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
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            {['overview', 'users', 'messages'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' && '📊 Vue d\'ensemble'}
                {tab === 'users' && '👥 Utilisateurs'}
                {tab === 'messages' && '💬 Messages'}
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
      </main>
    </div>
  )
}