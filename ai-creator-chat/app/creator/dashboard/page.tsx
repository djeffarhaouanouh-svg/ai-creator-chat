'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StatsCard from '@/components/admin/StatsCard'

export default function CreatorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [creatorName, setCreatorName] = useState('')

  useEffect(() => {
    const creatorId = sessionStorage.getItem('creatorId')
    const creatorSlug = sessionStorage.getItem('creatorSlug')
    if (!creatorId) { router.push('/login'); return }
    setCreatorName(creatorSlug || '')
    fetchData(creatorId)
  }, [])

  const fetchData = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/creator/stats?creatorId=${creatorId}`)
      const data = await response.json()
      setData(data)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.clear()
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Mon Dashboard</h1>
            <p className="text-sm text-gray-500">Bonjour @{creatorName} 👋</p>
          </div>
          <button onClick={handleLogout} className="text-gray-700 hover:text-gray-900">Déconnexion</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Abonnés" value={data.stats.subscribers.toString()} icon="👥" />
          <StatsCard title="Messages" value={data.stats.messages.toString()} icon="💬" />
          <StatsCard title="Revenus Total" value={`${data.stats.total_revenue.toFixed(2)} €`} icon="💰" />
          <StatsCard title="Ce mois" value={`${data.stats.revenue_this_month.toFixed(2)} €`} icon="📈" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold mb-4">👥 Mes abonnés ({data.subscribers.length})</h3>
            <div className="space-y-3">
              {data.subscribers.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Aucun abonné</p>
              ) : (
                data.subscribers.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{sub.users.name || 'Anonyme'}</p>
                      <p className="text-sm text-gray-500">{sub.users.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">{sub.plan}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h3 className="text-lg font-semibold mb-4">💬 Messages récents ({data.recent_messages.length})</h3>
            <div className="space-y-3">
              {data.recent_messages.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Aucun message</p>
              ) : (
                data.recent_messages.map((msg: any) => (
                  <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">{msg.users.name || msg.users.email}</span>
                      <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
