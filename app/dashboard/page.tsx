'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MessageCircle, DollarSign, TrendingUp, CreditCard, Settings, LogOut, X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { creators } from '@/data/creators'
import Image from 'next/image'

export default function MonCompte() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    totalMessages: 0,
    monthlyRevenue: 0,
    growthRate: 15.3
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const supabase = getSupabaseClient() // ✅ AJOUTÉ
      
      // Récupérer l'ID utilisateur depuis sessionStorage
      const userId = sessionStorage.getItem('userId')
      
      if (!userId) {
        // Pas connecté, rediriger vers login
        router.push('/login')
        return
      }

      // Charger les données utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !userData) {
        console.error('Erreur chargement user:', userError)
        router.push('/login')
        return
      }

      setUser(userData)

      // Charger les abonnements
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          creators (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')

      if (!subsError && subsData) {
        setSubscriptions(subsData)
      }

      // Charger les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)

      const totalMessages = messagesData?.length || 0

      // Calculer les stats
      const totalSubs = subsData?.length || 0
      const monthlyRevenue = totalSubs * 9.99

      setStats({
        totalSubscribers: totalSubs,
        totalMessages: totalMessages,
        monthlyRevenue: monthlyRevenue,
        growthRate: 15.3
      })

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.clear()
    router.push('/login')
  }

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string

    try {
      const supabase = getSupabaseClient() // ✅ AJOUTÉ
      
      const { error } = await supabase
        .from('users')
        .update({ 
          name,
          email: email.toLowerCase(),
          // Ajouter le téléphone si la colonne existe dans ta table
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Profil mis à jour avec succès !')
      loadUserData()
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1f1f1f' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  const subscribedCreators = creators.filter(c => 
    subscriptions.some(sub => sub.creators?.slug === c.username)
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1f1f1f' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bonjour, {user?.name || 'Utilisateur'} 👋
          </h1>
          <p className="text-gray-400">Vue d'ensemble de vos abonnements et conversations</p>
        </div>

        {/* Tableau de bord */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fce7f3' }}>
                  <Users style={{ color: '#e31fc1' }} size={24} />
                </div>
                <span className="text-xs text-green-600 font-semibold">+{stats.growthRate}%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalSubscribers}</h3>
              <p className="text-sm text-gray-600">Abonnements actifs</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="text-blue-600" size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalMessages}</h3>
              <p className="text-sm text-gray-600">Messages envoyés</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.monthlyRevenue.toFixed(2)}€</h3>
              <p className="text-sm text-gray-600">Dépenses mensuelles</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{(stats.totalMessages / Math.max(stats.totalSubscribers, 1)).toFixed(0)}</h3>
              <p className="text-sm text-gray-600">Messages moyens/créatrice</p>
            </div>
          </div>

          {/* Détails du compte */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Détails du compte</h2>
            <p className="text-gray-600 mb-6">Modifiez vos informations personnelles.</p>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Nom</label>
                <input 
                  type="text"
                  name="name"
                  defaultValue={user?.name || ''}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-pink-600"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                <input 
                  type="email"
                  name="email"
                  defaultValue={user?.email || ''}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-pink-600"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Téléphone (optionnel)</label>
                <input 
                  type="tel"
                  name="phone"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-pink-600"
                  placeholder="Votre numéro de téléphone"
                />
              </div>
              <button 
                type="submit"
                className="w-full px-6 py-3 text-white rounded-lg hover:opacity-90 transition-colors font-medium" 
                style={{ backgroundColor: '#e31fc1' }}
              >
                Mettre à jour les informations
              </button>
            </form>
          </div>

          {/* Subscriptions List */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Mes abonnements</h2>
              <button 
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 transition-all"
                style={{ borderColor: '#e31fc1', color: '#e31fc1' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fce7f3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings size={16} className="mr-2 inline" />
                Gérer
              </button>
            </div>

            {subscribedCreators.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Vous n'êtes abonné à aucune créatrice pour le moment</p>
                <button 
                  onClick={() => router.push('/')}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#e31fc1' }}
                >
                  Explorer les créatrices
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {subscribedCreators.map((creator) => {
                  const subscription = subscriptions.find(sub => sub.creators?.slug === creator.username)
                  return (
                    <div 
                      key={creator.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden">
                          <Image
                            src={creator.avatar}
                            alt={creator.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{creator.name}</h4>
                          <p className="text-sm text-gray-500">@{creator.username}</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>{creator.price}€/mois</span>
                            {subscription && (
                              <>
                                <span>•</span>
                                <span>Actif depuis {new Date(subscription.started_at).toLocaleDateString('fr-FR')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 transition-all"
                          style={{ borderColor: '#e31fc1', color: '#e31fc1' }}
                          onClick={() => router.push(`/chat/${creator.id}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fce7f3';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <MessageCircle size={16} className="mr-2 inline" />
                          Discuter
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Boutons de déconnexion */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-gray-700">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center space-x-3 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
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