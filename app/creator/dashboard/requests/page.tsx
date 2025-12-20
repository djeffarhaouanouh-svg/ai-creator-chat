'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Clock, CheckCircle, Lock, Gift, Euro, Upload, X } from 'lucide-react'

interface ContentRequest {
  id: string
  creator_id: string
  user_id: string
  message: string
  status: 'pending' | 'priced' | 'authorized' | 'delivered'
  price: number | null
  paypal_authorization_id: string | null
  created_at: string
  user_name: string | null
  user_email: string | null
}

export default function CreatorRequestsPage() {
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ContentRequest[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'priced' | 'authorized' | 'delivered'>('all')
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [pricingRequest, setPricingRequest] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [deliveringRequest, setDeliveringRequest] = useState<string | null>(null)
  const [contentUrl, setContentUrl] = useState('')
  const [contentType, setContentType] = useState<'image' | 'video' | 'audio' | 'other'>('image')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const accountType = localStorage.getItem('accountType')
    const creatorSlug = localStorage.getItem('creatorSlug')

    if (accountType !== 'creator' || !creatorSlug) {
      router.replace('/login')
      return
    }

    setSlug(creatorSlug)
    setLoading(false)
    loadRequests(creatorSlug)
  }, [router])

  const loadRequests = async (creatorSlug: string) => {
    setLoadingRequests(true)
    try {
      const res = await fetch(`/api/content-request/list?creatorSlug=${creatorSlug}`)
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      if (data.success) {
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleSetPrice = async (requestId: string) => {
    const price = parseFloat(priceInput)
    if (isNaN(price) || price <= 0) {
      alert('Veuillez entrer un prix valide')
      return
    }

    try {
      const res = await fetch('/api/content-request/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, price }),
      })

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        throw new Error(`Erreur serveur (${res.status}): ${res.statusText}`);
      }

      if (!res.ok || !data.success) {
        const errorMessage = data?.error || `Erreur ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      // Recharger les demandes
      if (slug) loadRequests(slug)
      setPricingRequest(null)
      setPriceInput('')
    } catch (error: any) {
      console.error('Error setting price:', error)
      const errorMessage = error?.message || 'Erreur lors de la mise à jour du prix';
      alert(errorMessage)
    }
  }

  const handleDeliverContent = async (requestId: string) => {
    if (!contentUrl.trim() && !selectedFile) {
      alert('Veuillez entrer une URL de contenu ou sélectionner un fichier')
      return
    }

    try {
      setUploading(true)
      setDeliveringRequest(requestId)
      
      let finalContentUrl = contentUrl.trim()

      // Si un fichier est sélectionné, l'uploader d'abord
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('contentType', contentType)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          throw new Error('Erreur lors de l\'upload du fichier')
        }

        const uploadData = await uploadRes.json()
        if (!uploadData.success || !uploadData.url) {
          throw new Error(uploadData.error || 'Erreur lors de l\'upload')
        }

        finalContentUrl = uploadData.url
      }

      // Livrer le contenu avec l'URL
      const res = await fetch('/api/content-request/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          contentUrl: finalContentUrl,
          contentType,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Erreur lors de la livraison')
      }

      // Recharger les demandes
      if (slug) loadRequests(slug)
      setDeliveringRequest(null)
      setContentUrl('')
      setSelectedFile(null)
      setContentType('image')
    } catch (error: any) {
      console.error('Error delivering content:', error)
      alert(error?.message || 'Erreur lors de la livraison du contenu')
    } finally {
      setUploading(false)
      setDeliveringRequest(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'priced':
        return <Euro className="w-5 h-5 text-blue-600" />
      case 'authorized':
        return <Lock className="w-5 h-5 text-purple-600" />
      case 'delivered':
        return <Gift className="w-5 h-5 text-green-600" />
      default:
        return <Package className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'priced':
        return 'Prix proposé'
      case 'authorized':
        return 'Paiement sécurisé'
      case 'delivered':
        return 'Livré'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'priced':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'authorized':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus)

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
      <div className="max-w-6xl mx-auto px-4 py-6 md:p-8">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes demandes personnalisées
          </h1>
          <p className="text-gray-600">
            Gérez les demandes de contenu personnalisé de vos fans
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({requests.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                filterStatus === 'pending'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('priced')}
              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                filterStatus === 'priced'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Prix proposé ({requests.filter(r => r.status === 'priced').length})
            </button>
            <button
              onClick={() => setFilterStatus('authorized')}
              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                filterStatus === 'authorized'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">Paiement sécurisé</span>
              <span className="sm:hidden">Sécurisé</span> ({requests.filter(r => r.status === 'authorized').length})
            </button>
            <button
              onClick={() => setFilterStatus('delivered')}
              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                filterStatus === 'delivered'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Livrées ({requests.filter(r => r.status === 'delivered').length})
            </button>
          </div>
        </div>

        {/* Liste des demandes */}
        {loadingRequests ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des demandes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Aucune demande {filterStatus !== 'all' ? `avec le statut "${getStatusLabel(filterStatus)}"` : ''}</p>
            <p className="text-gray-400 text-sm mt-2">Les demandes de vos fans apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100 hover:border-purple-200 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Infos de base */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {getStatusIcon(request.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        <span className="hidden sm:inline">
                          {new Date(request.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="sm:hidden">
                          {new Date(request.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Demande de :</p>
                      <p className="font-semibold text-gray-900">
                        {request.user_name || request.user_email || 'Utilisateur anonyme'}
                      </p>
                      {request.user_email && (
                        <p className="text-sm text-gray-500">{request.user_email}</p>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Message :</p>
                      <textarea
                        readOnly
                        value={request.message}
                        className="w-full text-black bg-gray-50 rounded-lg p-3 border border-gray-200 resize-none"
                        rows={3}
                      />
                    </div>

                    {request.price != null && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Prix proposé :</p>
                        <p className="text-xl font-bold text-purple-600">
                          {(() => {
                            const priceNum = typeof request.price === 'number' 
                              ? request.price 
                              : parseFloat(String(request.price));
                            return isNaN(priceNum) ? '0.00' : priceNum.toFixed(2);
                          })()} €
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 md:w-64">
                    {request.status === 'pending' && (
                      <div className="space-y-2">
                        {pricingRequest === request.id ? (
                          <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                              placeholder="Prix en €"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSetPrice(request.id)}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => {
                                  setPricingRequest(null)
                                  setPriceInput('')
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPricingRequest(request.id)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                          >
                            <Euro className="w-4 h-4" />
                            Proposer un prix
                          </button>
                        )}
                      </div>
                    )}

                    {request.status === 'authorized' && (
                      <div className="space-y-2">
                        {deliveringRequest === request.id ? (
                          <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                            <select
                              value={contentType}
                              onChange={(e) => setContentType(e.target.value as any)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="image">Image</option>
                              <option value="video">Vidéo</option>
                              <option value="audio">Audio</option>
                              <option value="other">Autre</option>
                            </select>
                            
                            {/* Upload de fichier */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Ou sélectionner un fichier depuis la galerie :
                              </label>
                              <input
                                type="file"
                                accept="image/*,video/*,audio/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setSelectedFile(file)
                                    setContentUrl('') // Réinitialiser l'URL si on sélectionne un fichier
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-black text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                              {selectedFile && (
                                <p className="text-sm text-gray-600">
                                  Fichier sélectionné : {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                              )}
                            </div>

                            <div className="text-center text-sm text-gray-500">OU</div>

                            {/* URL manuelle */}
                            <input
                              type="url"
                              value={contentUrl}
                              onChange={(e) => {
                                setContentUrl(e.target.value)
                                setSelectedFile(null) // Réinitialiser le fichier si on entre une URL
                              }}
                              placeholder="URL du contenu (image, vidéo, audio...)"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button
                                onClick={() => {
                                  setDeliveringRequest(null)
                                  setContentUrl('')
                                  setSelectedFile(null)
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeliverContent(request.id)}
                                disabled={(!contentUrl.trim() && !selectedFile) || uploading}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {uploading ? 'Upload en cours...' : 'Livrer'}
                              </button>
                              <button
                                onClick={() => {
                                  setDeliveringRequest(null)
                                  setContentUrl('')
                                  setSelectedFile(null)
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeliveringRequest(request.id)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Livrer le contenu
                          </button>
                        )}
                      </div>
                    )}

                    {request.status === 'delivered' && (
                      <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Contenu livré
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bouton de rafraîchissement */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => slug && loadRequests(slug)}
            disabled={loadingRequests}
            className="px-6 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              className={`w-5 h-5 ${loadingRequests ? 'animate-spin' : ''}`}
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
            {loadingRequests ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>
    </div>
  )
}

