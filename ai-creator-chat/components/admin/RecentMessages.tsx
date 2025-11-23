// components/admin/RecentMessages.tsx
'use client'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  users: {
    email: string
    name?: string
  }
  creators: {
    name: string
  }
}

interface RecentMessagesProps {
  messages: Message[]
  limit?: number
}

export default function RecentMessages({ messages, limit = 10 }: RecentMessagesProps) {
  const displayMessages = messages.slice(0, limit)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          💬 Messages récents
          <span className="text-sm font-normal text-gray-500">
            ({displayMessages.length})
          </span>
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {displayMessages.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Aucun message pour le moment
          </div>
        ) : (
          displayMessages.map((message) => (
            <div
              key={message.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {message.users.name?.[0]?.toUpperCase() || message.users.email[0].toUpperCase()}
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg">
                      👩
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {message.role === 'user'
                        ? message.users.name || message.users.email
                        : message.creators.name}
                    </span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-xs text-gray-500">
                      {message.role === 'user' ? message.creators.name : 'Utilisateur'}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {truncateText(message.content)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {messages.length > limit && (
        <div className="p-4 border-t border-gray-100 text-center">
          <button className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
            Voir tous les messages ({messages.length})
          </button>
        </div>
      )}
    </div>
  )
}
