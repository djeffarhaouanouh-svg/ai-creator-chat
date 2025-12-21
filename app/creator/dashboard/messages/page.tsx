'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Laugh, Flame, MessageCircle, Share2, Sparkles, Bot, ChevronRight, Send, ChevronUp } from 'lucide-react'

interface Message {
  id: string
  fan_nickname: string
  content: string
  emotion_badge: 'touching' | 'funny' | 'bold' | 'interesting'
  created_at: string
}

interface Conversation {
  user_id: string
  user_name: string
  user_email: string
  last_message: string
  last_message_role: 'user' | 'assistant'
  last_message_at: string
  total_messages: number
  ai_enabled: boolean
}

const emotionConfig = {
  touching: { label: 'Touchant', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  funny: { label: 'Drôle', icon: Laugh, color: 'bg-yellow-100 text-yellow-700' },
  bold: { label: 'Audacieux', icon: Flame, color: 'bg-red-100 text-red-700' },
  interesting: { label: 'Intéressant', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [togglingConversation, setTogglingConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [reactingTo, setReactingTo] = useState<string | null>(null)
  const [shareSelectorFor, setShareSelectorFor] = useState<string | null>(null)
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())
  const [conversationInputs, setConversationInputs] = useState<Record<string, string>>({})
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadConversations()
    loadMessages()
  }, [])

  const loadConversations = async () => {
    setConversationsLoading(true)
    try {
      const creatorSlug = localStorage.getItem('creatorSlug')
      if (!creatorSlug) return

      const response = await fetch(`/api/creator/conversations?slug=${creatorSlug}`)
      if (!response.ok) throw new Error('Erreur chargement conversations')

      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
    } finally {
      setConversationsLoading(false)
    }
  }

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

  const handleToggleAI = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher la navigation au clic sur le toggle

    setTogglingConversation(conversation.user_id)
    const newAiEnabled = !conversation.ai_enabled

    console.log('🔄 TOGGLE IA - Début:', {
      user_id: conversation.user_id,
      user_name: conversation.user_name,
      currentAiEnabled: conversation.ai_enabled,
      newAiEnabled: newAiEnabled
    })

    try {
      const creatorSlug = localStorage.getItem('creatorSlug')
      if (!creatorSlug) {
        console.error('❌ creatorSlug manquant dans localStorage')
        return
      }

      console.log('📤 Envoi requête toggle IA:', {
        creatorSlug,
        userId: conversation.user_id,
        aiEnabled: newAiEnabled
      })

      const response = await fetch('/api/creator/conversation-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorSlug,
          userId: conversation.user_id,
          aiEnabled: newAiEnabled
        })
      })

      const responseData = await response.json()

      console.log('📥 Réponse toggle IA:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      })

      if (!response.ok) {
        console.error('❌ Erreur réponse toggle:', responseData)
        throw new Error('Erreur mise à jour IA')
      }

      // Mettre à jour l'état local
      setConversations(prev =>
        prev.map(conv =>
          conv.user_id === conversation.user_id
            ? { ...conv, ai_enabled: newAiEnabled }
            : conv
        )
      )

      console.log('✅ Toggle IA terminé avec succès:', {
        user_id: conversation.user_id,
        new_ai_enabled: newAiEnabled
      })
    } catch (error) {
      console.error('❌ Erreur toggle IA:', error)
      alert('Erreur lors de la mise à jour de l\'IA')
    } finally {
      setTogglingConversation(null)
    }
  }

  const handleConversationClick = (conversation: Conversation, e: React.MouseEvent<HTMLDivElement>) => {
    // Si on clique sur le toggle, la flèche déroulante ou la textarea, ne pas naviguer
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('textarea') || target.closest('.message-input-container') || target.closest('.expand-toggle')) {
      return
    }
    
    // Naviguer vers le chat complet
    router.push(`/creator/dashboard/messages/${conversation.user_id}`)
  }

  const handleToggleExpand = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedConversations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId)
      } else {
        newSet.add(conversationId)
      }
      return newSet
    })
  }

  const handleSendMessage = async (conversation: Conversation) => {
    const input = conversationInputs[conversation.user_id]?.trim()
    if (!input || sendingMessages.has(conversation.user_id)) return

    setSendingMessages(prev => new Set(prev).add(conversation.user_id))

    try {
      const creatorSlug = localStorage.getItem('creatorSlug')
      if (!creatorSlug) return

      const response = await fetch('/api/creator/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorSlug,
          userId: conversation.user_id,
          content: input
        })
      })

      if (!response.ok) throw new Error('Erreur envoi message')

      // Vider l'input et recharger les conversations pour mettre à jour le dernier message
      setConversationInputs(prev => {
        const newInputs = { ...prev }
        delete newInputs[conversation.user_id]
        return newInputs
      })
      
      // Recharger les conversations pour mettre à jour le dernier message
      await loadConversations()
    } catch (error) {
      console.error('Erreur envoi message:', error)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setSendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(conversation.user_id)
        return newSet
      })
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

  const shareToSnapchat = (url: string) => {
    try {
      // Télécharger simplement l'image en PNG
      const link = document.createElement('a')
      link.href = url
      link.download = 'mydouble-sticker.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erreur téléchargement Snapchat:', error)
    }
  }

  const handleShare = async (message: Message, platform: 'instagram' | 'snapchat') => {
    // Dimensions de base du sticker
    const width = 1200
    const cardX = 40
    const cardY = 30
    const headerHeight = 72
    const cardRadius = 36
    const cardW = width - cardX * 2
    const textPaddingX = 40
    const nameX = cardX + 48
    const nameY = cardY + headerHeight + 56
    const textStartX = nameX
    const lineHeight = 34

    // 1) Mesure du texte sur un canvas temporaire
    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')
    if (!measureCtx) return
    measureCtx.font = '24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'

    const maxTextWidth = cardX + cardW - textStartX - textPaddingX
    const words = message.content.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word
      const metrics = measureCtx.measureText(testLine)
      if (metrics.width > maxTextWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)

    const textStartY = nameY + 40
    const textHeight = lines.length * lineHeight
    const cardH = (textStartY - cardY) + textHeight + 40 // marge bas
    const height = cardH + cardY * 2

    // 2) Canvas final avec bonne hauteur
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Carte blanche
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

    // Onglet MyDouble
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

    // Nom du fan
    ctx.textAlign = 'left'
    ctx.fillStyle = '#111827'
    ctx.font = '600 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(message.fan_nickname || 'Fan', nameX, nameY)

    // Message multi-lignes
    ctx.font = '24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = '#111827'
    lines.forEach((line, index) => {
      ctx.fillText(line, textStartX, textStartY + index * lineHeight)
    })

    // Signature "mydouble"
    ctx.font = '600 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = '#9ca3af'
    ctx.textAlign = 'right'
    ctx.fillText('mydouble', cardX + cardW - textPaddingX, cardY + cardH - 24)

    // Export de l'image puis partage ou téléchargement
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const fileName = `mydouble-sticker-${Date.now()}.png`
      const url = URL.createObjectURL(blob)

      if (platform === 'instagram') {
        const file = new File([blob], fileName, { type: 'image/png' })
        const shared = await shareToInstagram(file)
        if (!shared) {
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          a.click()
        }
        URL.revokeObjectURL(url)
      } else {
        // Snapchat : téléchargement + ouverture de l'app
        shareToSnapchat(url)
        // on libère l'URL un peu plus tard
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      }
    })
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      } else if (diffDays === 1) {
        return 'Hier'
      } else if (diffDays < 7) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })
      } else {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      }
    } catch {
      return ''
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading || conversationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Section Mes conversations */}
      <div>
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Mes conversations</h1>
          <p className="text-sm lg:text-base text-gray-600">Gère tes conversations et active ou désactive l'IA pour chacune</p>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune conversation pour le moment</p>
            <p className="text-gray-400 text-sm mt-2">Les conversations apparaîtront ici</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation) => {
                const isExpanded = expandedConversations.has(conversation.user_id)
                const inputValue = conversationInputs[conversation.user_id] || ''
                const isSending = sendingMessages.has(conversation.user_id)
                
                return (
                  <div
                    key={conversation.user_id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <div
                      onClick={(e) => handleConversationClick(conversation, e)}
                      className="p-4 lg:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {getInitials(conversation.user_name)}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base lg:text-lg truncate">
                                {conversation.user_name}
                              </h3>
                              <p className="text-xs text-gray-500 truncate">{conversation.user_email}</p>
                            </div>

                            {/* Badge et Toggle */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  conversation.ai_enabled
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {conversation.ai_enabled ? '🟣 IA activée' : '⚪ IA désactivée'}
                              </span>

                              {/* Toggle */}
                              <button
                                onClick={(e) => handleToggleAI(conversation, e)}
                                disabled={togglingConversation === conversation.user_id}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                  conversation.ai_enabled
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                    : 'bg-gray-200'
                                } ${togglingConversation === conversation.user_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    conversation.ai_enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Dernier message */}
                          {conversation.last_message && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 line-clamp-2 flex items-start gap-1">
                                {conversation.last_message_role === 'assistant' && (
                                  <Bot size={14} className="mt-0.5 flex-shrink-0 text-purple-600" />
                                )}
                                <span>{conversation.last_message}</span>
                              </p>
                              {(conversation.last_message_at || conversation.total_messages > 0) && (
                                <div className="flex items-center gap-2 mt-2">
                                  {conversation.last_message_at && (
                                    <p className="text-xs text-gray-400">
                                      {formatDate(conversation.last_message_at)}
                                    </p>
                                  )}
                                  {conversation.total_messages > 0 && (
                                    <span className="text-xs text-gray-400">
                                      {conversation.last_message_at && '• '}
                                      {conversation.total_messages} message{conversation.total_messages > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Flèche déroulante pour la textarea */}
                          <div className="mt-3">
                            <button
                              onClick={(e) => handleToggleExpand(conversation.user_id, e)}
                              className="expand-toggle flex items-center gap-1 text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <span>Réduire</span>
                                  <ChevronUp size={16} />
                                </>
                              ) : (
                                <>
                                  <span>Répondre</span>
                                  <ChevronRight size={16} />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Zone de saisie (affichée si expandée) */}
                    {isExpanded && (
                      <div 
                        className="px-4 lg:px-6 pb-4 lg:pb-6 message-input-container"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {conversation.ai_enabled ? (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-purple-700 font-medium">
                              Désactive l'IA pour écrire
                            </p>
                            <p className="text-xs text-purple-600 mt-1">
                              L'IA gère cette conversation. Désactive l'IA pour répondre manuellement.
                            </p>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <textarea
                              value={inputValue}
                              onChange={(e) => {
                                setConversationInputs(prev => ({
                                  ...prev,
                                  [conversation.user_id]: e.target.value
                                }))
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendMessage(conversation)
                                }
                              }}
                              placeholder="Tape ton message..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-400 bg-white resize-none text-sm"
                              disabled={isSending}
                              rows={1}
                              style={{ minHeight: '40px', maxHeight: '80px' }}
                            />
                            <button
                              onClick={() => handleSendMessage(conversation)}
                              disabled={!inputValue.trim() || isSending}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isSending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Send size={18} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Section Mes messages */}
      <div>
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
                    className="sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm lg:text-base font-semibold hover:from-purple-200 hover:to-pink-200 transition-all disabled:opacity-50"
                  >
                    <Heart size={18} className={reactingTo === message.id ? 'fill-current animate-pulse' : ''} />
                    <span>{reactingTo === message.id ? 'Réaction envoyée!' : 'Réagir'}</span>
                  </button>

                  <div className="sm:w-1/2 flex flex-col">
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
                  </div>
                </div>

                {shareSelectorFor === message.id && (
                  <div className="mt-2">
                    <p className="text-[11px] text-gray-500 text-center">
                      Ouvre Instagram ou Snapchat avec la story prête à publier
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleShare(message, 'instagram')}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-purple-200 text-purple-700 shadow-sm hover:bg-purple-50 transition-colors"
                      >
                        📸 Instagram
                      </button>
                      <button
                        onClick={() => handleShare(message, 'snapchat')}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-yellow-200 text-yellow-700 shadow-sm hover:bg-yellow-50 transition-colors"
                      >
                        👻 Snapchat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
