'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ImageCropModal from '@/components/ImageCropModal'

interface GalleryPhoto {
  id: string
  url: string
  isLocked: boolean
  order: number
}

export default function EditProfilePage() {
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Informations du profil
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  // Refs pour les inputs file
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // États pour le recadrage
  const [cropModal, setCropModal] = useState<{
    open: boolean
    image: string
    type: 'avatar' | 'cover' | 'gallery'
    aspectRatio: number
  }>({
    open: false,
    image: '',
    type: 'avatar',
    aspectRatio: 1
  })

  // Photos de la galerie
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([
    { id: '1', url: '/laurin.png', isLocked: false, order: 1 },
    { id: '2', url: '/laurin-4.png', isLocked: true, order: 2 },
    { id: '3', url: '/laurin-2.png', isLocked: false, order: 3 },
    { id: '4', url: '/laurin-5.png', isLocked: true, order: 4 },
    { id: '5', url: '/laurin-3.png', isLocked: true, order: 5 },
    { id: '6', url: '/laurin-6.png', isLocked: true, order: 6 },
  ])

  useEffect(() => {
    const accountType = localStorage.getItem('accountType')
    const creatorSlug = localStorage.getItem('creatorSlug')
    const creatorName = localStorage.getItem('creatorName')

    if (accountType !== 'creator' || !creatorSlug) {
      router.replace('/login')
      return
    }

    setSlug(creatorSlug)
    setName(creatorName || '')
    setLoading(false)
  }, [router])

  const togglePhotoLock = (photoId: string) => {
    setGalleryPhotos(prev =>
      prev.map(photo =>
        photo.id === photoId
          ? { ...photo, isLocked: !photo.isLocked }
          : photo
      )
    )
  }

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleCoverClick = () => {
    coverInputRef.current?.click()
  }

  const handleGalleryClick = () => {
    galleryInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCropModal({
          open: true,
          image: e.target?.result as string,
          type: 'avatar',
          aspectRatio: 1 // Carré pour l'avatar
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCropModal({
          open: true,
          image: e.target?.result as string,
          type: 'cover',
          aspectRatio: 16 / 9 // Format paysage pour la couverture
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCropModal({
          open: true,
          image: e.target?.result as string,
          type: 'gallery',
          aspectRatio: 1 // Carré comme Instagram
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    // Sauvegarder l'image recadrée selon le type
    if (cropModal.type === 'avatar') {
      setAvatarUrl(croppedImage)
    } else if (cropModal.type === 'cover') {
      setCoverUrl(croppedImage)
    } else if (cropModal.type === 'gallery') {
      const newPhoto: GalleryPhoto = {
        id: Date.now().toString(),
        url: croppedImage,
        isLocked: true,
        order: galleryPhotos.length + 1
      }
      setGalleryPhotos(prev => [...prev, newPhoto])
    }

    // Fermer le modal
    setCropModal({ open: false, image: '', type: 'avatar', aspectRatio: 1 })

    // Réinitialiser les inputs file
    if (avatarInputRef.current) avatarInputRef.current.value = ''
    if (coverInputRef.current) coverInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handleCropCancel = () => {
    setCropModal({ open: false, image: '', type: 'avatar', aspectRatio: 1 })

    // Réinitialiser les inputs file
    if (avatarInputRef.current) avatarInputRef.current.value = ''
    if (coverInputRef.current) coverInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implémenter la sauvegarde en base de données
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    alert('Profil sauvegardé avec succès !')
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
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/50 rounded-lg transition-all"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier mon profil
          </h1>
        </div>

        {/* Informations de base */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Informations de base</h2>

          <div className="space-y-6">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d&apos;affichage
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all text-gray-900"
                placeholder="Votre nom"
              />
            </div>

            {/* Photo de profil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo de profil
              </label>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="px-4 py-2 border-2 border-purple-300 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                >
                  Changer la photo
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                JPG, PNG ou GIF. Taille maximale : 5 MB
              </p>
            </div>

            {/* Image de couverture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image de couverture
              </label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              <div
                onClick={handleCoverClick}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-all cursor-pointer"
              >
                {coverUrl ? (
                  <img src={coverUrl} alt="Couverture" className="w-full h-48 object-cover rounded-lg mb-2" />
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-600 mb-1">Cliquez pour télécharger</p>
                    <p className="text-sm text-gray-500">
                      Recommandé : 1920x1080px
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Galerie de contenu exclusif */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Contenu exclusif</h2>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleGalleryChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleGalleryClick}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
            >
              + Ajouter une photo
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Gérez les photos qui apparaissent sur votre profil. Les photos avec le cadenas sont réservées aux abonnés.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group rounded-xl overflow-hidden aspect-square border-2 border-gray-200 hover:border-purple-400 transition-all"
              >
                <img
                  src={photo.url}
                  alt={`Photo ${photo.order}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay au survol */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => togglePhotoLock(photo.id)}
                    className={`p-2 rounded-lg ${
                      photo.isLocked
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white transition-all`}
                    title={photo.isLocked ? 'Déverrouiller' : 'Verrouiller'}
                  >
                    {photo.isLocked ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                      </svg>
                    )}
                  </button>

                  <button
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Badge statut */}
                <div className="absolute top-2 right-2">
                  {photo.isLocked ? (
                    <div className="bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Privée
                    </div>
                  ) : (
                    <div className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                      </svg>
                      Gratuite
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>

      </div>

      {/* Modal de recadrage */}
      {cropModal.open && (
        <ImageCropModal
          image={cropModal.image}
          aspectRatio={cropModal.aspectRatio}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
          title={
            cropModal.type === 'avatar'
              ? 'Recadrer la photo de profil'
              : cropModal.type === 'cover'
              ? 'Recadrer l\'image de couverture'
              : 'Recadrer la photo'
          }
        />
      )}
    </div>
  )
}
