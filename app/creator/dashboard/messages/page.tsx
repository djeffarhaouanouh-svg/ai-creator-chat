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
  const [shareSelectorFor, setShareSelectorFor] = useState<string | null>(null)

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
    await new Promise(resolve => setTimeout(resolve, 500))
    setReactingTo(null)
  }

  const shareToInstagram = async (file: File): Promise<boolean> => {
    if (typeof navigator === 'undefined') return false

    const anyNavigator = navigator as any
    if (anyNavigator.share && anyNavigator.canShare && anyNavigator.canShare({ files: [file] })) {
      try {
        await anyNavigator.share({
          files: [file],
          title: 'Story MyDouble',
          text: 'Story prête à être partagée ✨',
        })
        return true
      } catch (error) {
        console.error('Erreur partage Instagram:', error)
      }
    }
    return false
  }

  const shareToSnapchat = async (file: File): Promise<boolean> => {
    if (typeof navigator === 'undefined') return false

    const anyNavigator = navigator as any
    if (anyNavigator.share && anyNavigator.canShare && anyNavigator.canShare({ files: [file] })) {
      try {
        await anyNavigator.share({
          files: [file],
          title: 'Story MyDouble',
        })
        return true
      } catch (error) {
        console.error('Erreur partage Snapchat:', error)
      }
    }
    return false
  }

  const handleShare = async (message: Message, platform: 'instagram' | 'snapchat') => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Sticker horizontal type "carte" avec fond transparent
    // Taille plus petite pour apparaître comme un vrai sticker dans la story
    canvas.width = 900
    canvas.height = 260

    // Pas de fond plein : par défaut le canvas est transparent.

    // Utilitaire pour dessiner un rectangle arrondi
    const drawRoundedRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      const radius = Math.min(r, h / 2, w / 2)
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + w - radius, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
      ctx.lineTo(x + w, y + h - radius)
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
      ctx.lineTo(x + radius, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
    }

    // Carte blanche
    const cardX = 40
    const cardY = 30
    const cardW = canvas.width - cardX * 2
    const cardH = canvas.height - cardY * 2
    const cardRadius = 36

    ctx.fillStyle = '#ffffff'
    drawRoundedRect(cardX, cardY, cardW, cardH, cardRadius)

    // Onglet MyDouble en haut à gauche
    const headerHeight = 72
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cardX + 24, cardY)
    ctx.lineTo(cardX + 260, cardY)
    ctx.quadraticCurveTo(cardX + 280, cardY, cardX + 280, cardY + 20)
    ctx.lineTo(cardX + 280, cardY + headerHeight)
    ctx.lineTo(cardX + 24, cardY + headerHeight)
    ctx.quadraticCurveTo(cardX, cardY + headerHeight, cardX, cardY + headerHeight - 20)
    ctx.lineTo(cardX, cardY + 20)
    ctx.quadraticCurveTo(cardX, cardY, cardX + 24, cardY)
    ctx.closePath()
    const headerGradient = ctx.createLinearGradient(cardX, cardY, cardX + 280, cardY)
    headerGradient.addColorStop(0, '#f4399c')
    headerGradient.addColorStop(1, '#ff7ac4')
    ctx.fillStyle = headerGradient
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('MyDouble', cardX + 40, cardY + 46)
    ctx.restore()

    // Avatar rond avec initiale
    const avatarX = cardX + 80
    const avatarY = cardY + headerHeight + 70
    const avatarRadius = 38

    const nicknameInitial = (message.fan_nickname || '?').charAt(0).toUpperCase()

    const avatarGradient = ctx.createLinearGradient(
      avatarX - avatarRadius,
      avatarY - avatarRadius,
      avatarX + avatarRadius,
      avatarY + avatarRadius
    )
    avatarGradient.addColorStop(0, '#ff9a9e')
    avatarGradient.addColorStop(1, '#fad0c4')

    ctx.beginPath()
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fillStyle = avatarGradient
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(nicknameInitial, avatarX, avatarY + 10)

    // Prénom / pseudo du fan
    ctx.textAlign = 'left'
    ctx.fillStyle = '#111827'
    ctx.font = '600 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    const nameX = avatarX + avatarRadius + 28
    const nameY = cardY + headerHeight + 40
    ctx.fillText(message.fan_nickname || 'Fan', nameX, nameY)

    // Message (une à deux lignes)
    const maxTextWidth = cardX + cardW - nameX - 160
    ctx.fillStyle = '#111827'
    ctx.font = '24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'

    const words = message.content.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxTextWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)

    const maxLines = 2
    const finalLines = lines.slice(0, maxLines)
    const textStartY = nameY + 40
    const lineHeight = 34

    finalLines.forEach((line, index) => {
      ctx.fillText(line, nameX, textStartY + index * lineHeight)
    })

    if (lines.length > maxLines) {
      const lastLine = finalLines[finalLines.length - 1]
      const withDots = lastLine.replace(/.{0,3}$/, '...')
      ctx.fillText(withDots, nameX, textStartY + (finalLines.length - 1) * lineHeight)
    }

    // Badge "mydouble" à droite
    const badgeW = 190
    const badgeH = 52
    const badgeX = cardX + cardW - badgeW - 32
    const badgeY = cardY + cardH - badgeH - 28

    const badgeRadius = 26
    ctx.beginPath()
    ctx.moveTo(badgeX + badgeRadius, badgeY)
    ctx.lineTo(badgeX + badgeW - badgeRadius, badgeY)
    ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeRadius)
    ctx.lineTo(badgeX + badgeW, badgeY + badgeH - badgeRadius)
    ctx.quadraticCurveTo(
      badgeX + badgeW,
      badgeY + badgeH,
      badgeX + badgeW - badgeRadius,
      badgeY + badgeH
    )
    ctx.lineTo(badgeX + badgeRadius, badgeY + badgeH)
    ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - badgeRadius)
    ctx.lineTo(badgeX, badgeY + badgeRadius)
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + badgeRadius, badgeY)
    ctx.closePath()

    const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY)
    badgeGradient.addColorStop(0, '#f4399c')
    badgeGradient.addColorStop(1, '#ff7ac4')
    ctx.fillStyle = badgeGradient
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = '600 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('mydouble', badgeX + badgeW / 2, badgeY + 34)

    // Export de l'image puis partage ou téléchargement
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const fileName = `mydouble-sticker-${Date.now()}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      let shared = false
      if (platform === 'instagram') {
        shared = await shareToInstagram(file)
      } else {
        shared = await shareToSnapchat(file)
      }

      if (!shared) {
        // Fallback : téléchargement de l'image (desktop ou si Web Share indisponible)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      }
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
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Mes messages</h1>
        <p className="text-sm lg:text-base text-gray-600">Les meilleurs messages de ta communauté</p>
      </div>

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
                className="bg-white rounded-2xl shadow-lg p-4 lg:p-6 hover:shadow-xl transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base lg:text-lg">
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

                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs lg:text-sm font-medium self-start ${emotion.color}`}>
                    <EmotionIcon size={16} />
                    <span className="whitespace-nowrap">{emotion.label}</span>
                  </span>
                </div>

                <p className="text-gray-700 text-sm lg:text-base leading-relaxed mb-4 lg:mb-6">
                  {message.content}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleReact(message.id)}
                    disabled={reactingTo === message.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm lg:text-base font-semibold hover:from-purple-200 hover:to-pink-200 transition-all disabled:opacity-50"
                  >
                    <Heart size={18} className={reactingTo === message.id ? 'fill-current animate-pulse' : ''} />
                    <span>{reactingTo === message.id ? 'Réaction envoyée!' : 'Réagir'}</span>
                  </button>

                  <div className="flex-1 flex flex-col">
                    <button
                      onClick={() =>
                        setShareSelectorFor((current) =>
                          current === message.id ? null : message.id
                        )
                      }
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm lg:text-base font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      <Share2 size={18} />
                      <span>Partager en story</span>
                    </button>
                    <p className="mt-1 text-[11px] text-gray-500 text-center">
                      Ouvre Instagram ou Snapchat avec la story prête à publier
                    </p>
                    {shareSelectorFor === message.id && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            handleShare(message, 'instagram')
                            setShareSelectorFor(null)
                          }}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-purple-200 text-purple-700 shadow-sm hover:bg-purple-50 transition-colors"
                        >
                          📸 Instagram
                        </button>
                        <button
                          onClick={() => {
                            handleShare(message, 'snapchat')
                            setShareSelectorFor(null)
                          }}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-yellow-200 text-yellow-700 shadow-sm hover:bg-yellow-50 transition-colors"
                        >
                          👻 Snapchat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
