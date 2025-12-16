'use client'

import { useEffect, useState } from 'react'
import { Heart, Laugh, Flame, MessageCircle, Share2, Sparkles } from 'lucide-react'

interface Message {
  id: string
  fan_nickname: string
  content: string
  emotion_badge: 'touching' | 'funny' | 'bold' | 'interesting'
  created_at: string
}

const emotionConfig = {
  touching: { label: 'Touchant', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  funny: { label: 'Drôle', icon: Laugh, color: 'bg-yellow-100 text-yellow-700' },
  bold: { label: 'Audacieux', icon: Flame, color: 'bg-red-100 text-red-700' },
  interesting: { label: 'Intéressant', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [reactingTo, setReactingTo] = useState<string | null>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const creatorSlug = localStorage.getItem('creatorSlug')
      if (!creatorSlug) return

      const response = await fetch(`/api/creator/selected-messages?slug=${creatorSlug}`)
      if (!response.ok) throw new Error('Erreur chargement messages')

      const data = await response.json()
      setMessages(data.messages)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReact = async (messageId: string) => {
    setReactingTo(messageId)
    // Simuler une réaction
    await new Promise(resolve => setTimeout(resolve, 500))
    setReactingTo(null)
    // TODO: Enregistrer la réaction côté serveur
  }

  const handleShare = async (message: Message) => {
    // Générer l'image story
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Format story Instagram 9:16
    canvas.width = 1080
    canvas.height = 1920

    // Fond dégradé
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#9333ea') // purple-600
    gradient.addColorStop(1, '#db2777') // pink-600
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Texte du message
    ctx.fillStyle = 'white'
    ctx.font = 'bold 60px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('"' + message.content.substring(0, 100) + '..."', canvas.width / 2, 800)

    // Surnom
    ctx.font = '40px Arial'
    ctx.fillText('— ' + message.fan_nickname, canvas.width / 2, 900)

    // Branding
    ctx.font = '30px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fillText('MyDouble', canvas.width / 2, 1800)

    // Télécharger l'image
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `story-mydouble-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes messages</h1>
        <p className="text-gray-600">Les meilleurs messages de ta communauté</p>
      </div>

      {/* Messages feed */}
      {messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucun message sélectionné pour le moment</p>
          <p className="text-gray-400 text-sm mt-2">Les messages marquants apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((message) => {
            const emotion = emotionConfig[message.emotion_badge]
            const EmotionIcon = emotion.icon

            return (
              <div
                key={message.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
              >
                {/* Header avec surnom et badge */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {message.fan_nickname}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${emotion.color}`}>
                    <EmotionIcon size={16} />
                    {emotion.label}
                  </span>
                </div>

                {/* Contenu du message */}
                <p className="text-gray-700 text-base leading-relaxed mb-6">
                  {message.content}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReact(message.id)}
                    disabled={reactingTo === message.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold hover:from-purple-200 hover:to-pink-200 transition-all disabled:opacity-50"
                  >
                    <Heart size={18} className={reactingTo === message.id ? 'fill-current animate-pulse' : ''} />
                    {reactingTo === message.id ? 'Réaction envoyée!' : 'Réagir'}
                  </button>

                  <button
                    onClick={() => handleShare(message)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    <Share2 size={18} />
                    Partager en story
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
