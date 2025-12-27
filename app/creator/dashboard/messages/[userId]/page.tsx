'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Bot, User, Star } from 'lucide-react'
import Image from 'next/image'
import { localCreators } from '@/data/creators'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date | string
}

export default function CreatorChatPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [creatorAvatar, setCreatorAvatar] = useState<string | null>(null)
  const [topMessageIds, setTopMessageIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      loadCreatorInfo()
      
      // Charger le setting IA d'abord
      await loadAISetting()
      
      // Toujours charger la conversation (même si IA activée, on peut voir les messages)
      await loadConversation()
      await loadTopMessages()
    }
    
    init()
  }, [userId])
  
  const loadCreatorInfo = () => {
    const creatorSlug = localStorage.getItem('creatorSlug')
    if (creatorSlug) {
      const creator = localCreators.find(c => c.slug === creatorSlug)
      if (creator && creator.avatar) {
        setCreatorAvatar(creator.avatar)
      }
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async () => {
    setLoading(true)
    try {
      const creatorSlug = localStorage.getItem('creatorSlug')
      if (!creatorSlug) {
        router.push('/creator/dashboard/messages')
        return
      }

      // Charger les messages
      const messagesResponse = await fetch(`/api/messages?userId=${userId}&creatorId=${creatorSlug}`)
      if (messagesResponse.ok) {
        const data = await messagesResponse.json()
        console.log('Données reçues de l\'API:', data)
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map((msg: any) => {
            console.log('Message brut:', msg)
            return {
              ...msg,
              content: msg.content || '', // S'assurer que le contenu existe
              timestamp: new Date(msg.timestamp)
            }
          })
          console.log('Messages formatés:', formattedMessages)
          setMessages(formattedMessages)
        } else {
          console.warn('Aucun message ou format invalide:', data)
          setMessages([])
        }
      } else {
        const errorData = await messagesResponse.json().catch(() => ({}))
        console.error('Erreur chargement messages:', messagesResponse.status, messagesResponse.statusText, errorData)
      }

      // Charger les infos utilisateur
      const userResponse = await fetch(`/api/user/info?userId=${userId}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.user) {
          setUserInfo({
            name: userData.user.name || 'Utilisateur',
            email: userData.user.email || ''
          })
          // Charger l'avatar de l'utilisateur si disponible
          if (userData.user.avatar_url) {
            setUserAvatar(userData.user.avatar_url)
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAISetting = async (): Promise<boolean> => {
    try {
      const creatorSlug = localStorage.getItem('creatorSlug')
      if (!creatorSlug) return true // Par défaut activé

      const response = await fetch(`/api/creator/conversation-settings?slug=${creatorSlug}&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const enabled = data.ai_enabled !== false // Par défaut true
        setAiEnabled(enabled)
        return enabled
      }
      return true // Par défaut activé
    } catch (error) {
      console.error('Erreur chargement setting IA:', error)
      return true // Par défaut activé
    }
  }

  const loadTopMessages = async () => {
    try {
      const creatorSlug = localStorage.getItem('creatorSlug')
      if (!creatorSlug) return

      const response = await fetch(`/api/creator/selected-messages?slug=${creatorSlug}`)
      if (response.ok) {
        const data = await response.json()
        const topIds = new Set<string>(data.messages.map((msg: any) => String(msg.id)))
        setTopMessageIds(topIds)
      }
    } catch (error) {
      console.error('Erreur chargement top messages:', error)
    }
  }

  const toggleTopMessage = async (messageId: string, isTop: boolean) => {
    try {
      const creatorSlug = localStorage.getItem('creatorSlug')
      if (!creatorSlug) return

      if (isTop) {
        // Retirer des favoris
        const response = await fetch(
          `/api/creator/top-messages?messageId=${messageId}&creatorSlug=${creatorSlug}`,
          { method: 'DELETE' }
        )
        if (response.ok) {
          setTopMessageIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(messageId)
            return newSet
          })
        }
      } else {
        // Ajouter aux favoris
        const response = await fetch('/api/creator/top-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            creatorSlug,
            userId
          })
        })
        if (response.ok) {
          setTopMessageIds(prev => new Set(prev).add(messageId))
        }
      }
    } catch (error) {
      console.error('Erreur toggle top message:', error)
      alert('Erreur lors de la modification des favoris')
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const content = input.trim()
    setInput('')
    setSending(true)

    try {
      const creatorSlug = localStorage.getItem('creatorSlug')
      if (!creatorSlug) return

      // Envoyer le message
      const response = await fetch('/api/creator/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorSlug,
          userId,
          content
        })
      })

      if (!response.ok) throw new Error('Erreur envoi message')

      // Recharger les messages
      await loadConversation()
    } catch (error) {
      console.error('Erreur envoi message:', error)
      alert('Erreur lors de l\'envoi du message')
      setInput(content) // Remettre le texte en cas d'erreur
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.push('/creator/dashboard/messages')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">{userInfo?.name || 'Conversation'}</h1>
          <p className="text-xs text-gray-500">{userInfo?.email}</p>
        </div>

        {aiEnabled ? (
          <div className="px-3 py-1 bg-purple-100 border border-purple-200 rounded-lg">
            <p className="text-xs text-purple-700 font-medium">🟣 IA activée</p>
          </div>
        ) : (
          <div className="px-3 py-1 bg-orange-100 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-700 font-medium">⚪ Mode manuel</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Aucun message dans cette conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#E31FC1] flex-shrink-0">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={userInfo?.name || 'Utilisateur'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-1">
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-white border border-gray-200 text-gray-900'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  }`}
                >
                  {message.content ? (
                    <p className={`text-sm whitespace-pre-wrap break-words ${
                      message.role === 'user' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {message.content}
                    </p>
                  ) : (
                    <p className={`text-sm italic ${
                      message.role === 'user' ? 'text-gray-400' : 'text-purple-200'
                    }`}>
                      (Message vide)
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-gray-400' : 'text-purple-100'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <button
                    onClick={() => toggleTopMessage(message.id, topMessageIds.has(message.id))}
                    className={`self-start px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      topMessageIds.has(message.id)
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={topMessageIds.has(message.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Star
                      size={14}
                      className={topMessageIds.has(message.id) ? 'fill-current' : ''}
                    />
                    <span className="ml-1">
                      {topMessageIds.has(message.id) ? 'Favori' : 'Marquer'}
                    </span>
                  </button>
                )}
              </div>

              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                  {creatorAvatar ? (
                    <Image
                      src={creatorAvatar}
                      alt="Créatrice"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Bot size={16} />
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        {aiEnabled ? (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-sm text-purple-700 font-medium">
              Désactive l'IA pour écrire
            </p>
            <p className="text-xs text-purple-600 mt-1">
              L'IA gère cette conversation. Désactive l'IA depuis la liste des conversations pour répondre manuellement.
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Tape ton message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-400 bg-white resize-none"
              disabled={sending || aiEnabled}
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending || aiEnabled}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

