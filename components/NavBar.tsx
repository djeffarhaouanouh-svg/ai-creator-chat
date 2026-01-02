'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, User, Users, Trophy, Lock, Globe } from 'lucide-react'
import { storage } from '@/lib/storage'

export default function NavBar() {
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accountType, setAccountType] = useState<string | null>(null)
  const [hasSubscriptions, setHasSubscriptions] = useState(false)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [creatorSlug, setCreatorSlug] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    // Check if user is authenticated
    const accountTypeFromStorage = localStorage.getItem('accountType')
    const creatorSlugFromStorage = localStorage.getItem('creatorSlug')
    setAccountType(accountTypeFromStorage)
    setCreatorSlug(creatorSlugFromStorage)
    setIsAuthenticated(!!accountTypeFromStorage)
    
    // Check if user has active subscriptions (paying user)
    if (accountTypeFromStorage === 'user') {
      const subscriptions = storage.getSubscriptions()
      setHasSubscriptions(subscriptions.length > 0)
    }

    // Check for new messages
    const checkMessages = async () => {
      let hasUnread = false

      // Si c'est une créatrice, vérifier les messages utilisateurs
      if (accountTypeFromStorage === 'creator') {
        const creatorSlug = localStorage.getItem('creatorSlug')
        if (creatorSlug) {
          try {
            const response = await fetch(`/api/creator/conversations?slug=${creatorSlug}`)
            if (response.ok) {
              const data = await response.json()

              if (data.conversations && data.conversations.length > 0) {
                for (const conv of data.conversations) {
                  if (conv.last_message_role === 'user' && conv.last_message_at) {
                    const lastReadKey = `creator_conversation_lastRead_${creatorSlug}_${conv.user_id}`
                    const lastReadTime = localStorage.getItem(lastReadKey)
                    const lastReadDate = lastReadTime ? new Date(lastReadTime) : null
                    const msgDate = new Date(conv.last_message_at)

                    if (!lastReadDate || msgDate > lastReadDate) {
                      hasUnread = true
                      break
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Erreur vérification messages créatrice:', error)
          }
        }
      } else {
        // Si c'est un utilisateur, vérifier les messages créatrices
        const subscriptions = storage.getSubscriptions()
        const userId = localStorage.getItem('userId')

        // Vérifier les messages dans la base de données (messages manuels de la créatrice)
        if (userId) {
          for (const creatorId of subscriptions) {
            try {
              const response = await fetch(`/api/messages?userId=${userId}&creatorId=${creatorId}`)
              if (response.ok) {
                const data = await response.json()
                if (data.messages && data.messages.length > 0) {
                  const lastReadKey = `lastViewed_${creatorId}`
                  const lastReadTime = localStorage.getItem(lastReadKey)
                  const lastReadDate = lastReadTime ? new Date(lastReadTime) : null

                  // Vérifier s'il y a des messages de l'assistant plus récents que la dernière lecture
                  const hasNewInConversation = data.messages.some((msg: any) => {
                    // Seulement les messages de l'assistant (réponses de la créatrice)
                    if (msg.role !== 'assistant') return false

                    if (!lastReadDate) return true // Si jamais lu, tous les messages sont nouveaux
                    const msgDate = new Date(msg.timestamp)
                    return msgDate > lastReadDate
                  })

                  if (hasNewInConversation) {
                    hasUnread = true
                  }
                }
              }
            } catch (error) {
              console.error('Erreur lors de la vérification des messages:', error)
            }
          }
        }

        // Fallback: vérifier aussi dans le localStorage (pour les messages stockés localement)
        subscriptions.forEach(creatorId => {
          const session = storage.getChatSession(creatorId)
          if (!session || !session.messages || session.messages.length === 0) return

          const lastReadKey = `lastViewed_${creatorId}`
          const lastReadTime = localStorage.getItem(lastReadKey)
          const lastReadDate = lastReadTime ? new Date(lastReadTime) : null

          const hasNewInConversation = session.messages.some(msg => {
            if (msg.role !== 'assistant') return false
            if (!lastReadDate) return true
            const msgDate = new Date(msg.timestamp)
            return msgDate > lastReadDate
          })

          if (hasNewInConversation) {
            hasUnread = true
          }
        })
      }

      setHasNewMessages(hasUnread)
    }

    checkMessages()

    // Check messages every 5 seconds when on the page
    const interval = setInterval(checkMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  // Don't render anything until mounted (avoid hydration issues)
  if (!mounted) {
    return null
  }

  // Menu selon le type d'utilisateur
  let navItems: Array<{ name: string; href: string; icon: any }> = []

  if (accountType === 'creator') {
    // Menu créatrice
    navItems = [
      {
        name: 'Mes messages',
        href: '/mes-messages',
        icon: MessageCircle,
      },
      {
        name: 'Mon profil',
        href: '/mon-compte',
        icon: User,
      },
      {
        name: 'Ma page',
        href: creatorSlug ? `/creator/${creatorSlug}` : '/',
        icon: Globe,
      },
      {
        name: 'Classement',
        href: '/meilleur-fan',
        icon: Trophy,
      },
      {
        name: 'Contenu privé',
        href: '/creator/dashboard/requests',
        icon: Lock,
      },
    ]
  } else if (hasSubscriptions) {
    // Menu utilisateur payant
    navItems = [
      {
        name: 'Créer mon IA',
        href: '/creer-mon-double-ia',
        icon: Users,
      },
      {
        name: 'Accueil',
        href: '/',
        icon: Home,
      },
      {
        name: 'Messages',
        href: '/mes-messages',
        icon: MessageCircle,
      },
      {
        name: 'Mon compte',
        href: isAuthenticated ? '/mon-compte' : '/login',
        icon: User,
      },
      {
        name: 'Classement',
        href: '/meilleur-fan',
        icon: Trophy,
      },
    ]
  } else {
    // Menu visiteur normal (non connecté ou pas d'abonnement)
    navItems = [
      {
        name: 'Créer mon IA',
        href: '/creer-mon-double-ia',
        icon: Users,
      },
      {
        name: 'Accueil',
        href: '/',
        icon: Home,
      },
      {
        name: 'Messages',
        href: '/mes-messages',
        icon: MessageCircle,
      },
      {
        name: 'Mon compte',
        href: isAuthenticated ? '/mon-compte' : '/login',
        icon: User,
      },
    ]
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full group"
              >
                <div className={`
                  flex flex-col items-center justify-center gap-1
                  transition-all duration-200
                  ${isActive ? 'text-[#E31FC1]' : 'text-gray-400 group-hover:text-gray-200'}
                `}>
                  <div className="relative">
                    <Icon className={`w-6 h-6 ${!isActive && 'group-hover:scale-110 transition-transform'}`} />
                    {/* Bulle de notification pour les messages */}
                    {(item.name === 'Mes messages' || item.name === 'Messages') && hasNewMessages && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
