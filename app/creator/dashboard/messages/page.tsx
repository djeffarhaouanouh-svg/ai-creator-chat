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
    await new Promise(resolve => setTimeout(resolve, 500))
    setReactingTo(null)
  }

  const handleShare = async (message: Message) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Format story Instagram 1080x1920
    canvas.width = 1080
    canvas.height = 1920

    // Fond dégradé MyDouble
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    bgGradient.addColorStop(0, '#4c1d95') // violet
    bgGradient.addColorStop(0.5, '#a855f7') // violet clair
    bgGradient.addColorStop(1, '#ec4899') // rose
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Carte blanche centrale
    const cardMarginH = 80
    const cardMarginTop = 260
    const cardMarginBottom = 260
    const cardW = canvas.width - cardMarginH * 2
    const cardH = canvas.height - cardMarginTop - cardMarginBottom
    const cardX = cardMarginH
    const cardY = cardMarginTop
    const cardRadius = 48

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

    ctx.fillStyle = '#ffffff'
    drawRoundedRect(cardX, cardY, cardW, cardH, cardRadius)

    // Bandeau MyDouble en haut de la carte
    const headerHeight = 96
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cardX, cardY)
    ctx.lineTo(cardX + cardW, cardY)
    ctx.lineTo(cardX + cardW, cardY + headerHeight)
    ctx.lineTo(cardX, cardY + headerHeight)
    ctx.closePath()
    const headerGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY)
    headerGradient.addColorStop(0, '#ec4899')
    headerGradient.addColorStop(1, '#a855f7')
    ctx.fillStyle = headerGradient
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 46px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('MyDouble', cardX + 48, cardY + 62)
    ctx.restore()

    // Message du fan
    const textPaddingX = 64
    const textStartX = cardX + textPaddingX
    let textY = cardY + headerHeight + 80

    ctx.fillStyle = '#111827'
    ctx.font = '32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'left'

    const maxTextWidth = cardX + cardW - textStartX - textPaddingX
    const maxLines = 6
    const lineHeight = 44

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

    const finalLines = lines.slice(0, maxLines)
    finalLines.forEach((line, index) => {
      ctx.fillText(line, textStartX, textY + index * lineHeight)
    })

    if (lines.length > maxLines) {
      const lastLine = finalLines[finalLines.length - 1]
      const withDots = lastLine.replace(/.{0,3}$/, '...')
      ctx.fillText(withDots, textStartX, textY + (finalLines.length - 1) * lineHeight)
    }

    // Pseudo du fan (optionnel)
    if (message.fan_nickname) {
      const pseudoY = cardY + cardH - 120
      ctx.font = '28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(`— ${message.fan_nickname}`, textStartX, pseudoY)
    }

    // Signature "via MyDouble"
    ctx.font = '24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = '#9ca3af'
    ctx.textAlign = 'right'
    ctx.fillText('via MyDouble', cardX + cardW - textPaddingX, cardY + cardH - 60)

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    // Export de l'image puis partage ou téléchargement
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const fileName = `mydouble-story-${Date.now()}.png`

      if (
        isMobile &&
        typeof navigator !== 'undefined' &&
        'canShare' in navigator &&
        'share' in navigator
      ) {
        try {
          const file = new File([blob], fileName, { type: 'image/png' })
          // @ts-ignore - Web Share API avec fichiers
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            // @ts-ignore
            await navigator.share({
              files: [file],
              title: 'Story MyDouble',
              text: 'Story prête à être partagée ✨',
            })
            return
          }
        } catch (error) {
          console.error('Erreur partage natif:', error)
        }
      }

      // Fallback : téléchargement de l'image (desktop ou si Web Share indisponible)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
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
                      onClick={() => handleShare(message)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm lg:text-base font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      <Share2 size={18} />
                      <span>Partager en story</span>
                    </button>
                    <p className="mt-1 text-[11px] text-gray-500 text-center">
                      Ouvre Instagram avec la story prête à publier
                    </p>
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
