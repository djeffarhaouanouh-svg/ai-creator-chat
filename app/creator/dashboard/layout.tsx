'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, MessageCircle, BarChart3, Users, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const accountType = localStorage.getItem('accountType')
    const creatorSlug = localStorage.getItem('creatorSlug')
    const creatorName = localStorage.getItem('creatorName')

    if (accountType !== 'creator' || !creatorSlug) {
      router.replace('/login')
      return
    }

    setSlug(creatorSlug)
    setName(creatorName)
  }, [router])

  const logout = () => {
    localStorage.removeItem('accountType')
    localStorage.removeItem('creatorSlug')
    localStorage.removeItem('creatorName')
    router.replace('/login')
  }

  const menuItems = [
    { icon: Home, label: 'Mon compte', path: '/creator/dashboard' },
    { icon: MessageCircle, label: 'Mes messages', path: '/creator/dashboard/messages' },
    { icon: BarChart3, label: 'Stats', path: '/creator/dashboard/stats' },
    { icon: Users, label: 'Abonnements', path: '/creator/dashboard/subscriptions' },
  ]

  if (!slug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="flex">
        {/* Menu latéral */}
        <aside className="w-64 min-h-screen bg-white shadow-lg">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">MyDouble</h1>
            <p className="text-sm text-gray-600 mt-1">@{slug}</p>
            {name && <p className="text-xs text-gray-500">{name}</p>}
          </div>

          <nav className="p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path

              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Se déconnecter</span>
            </button>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
