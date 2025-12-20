'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, MessageCircle, LogOut, Menu, X, Package } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)

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
    { icon: Package, label: 'Mes demandes personnalisées', path: '/creator/dashboard/requests' },
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
      {/* Header mobile */}
      <header className="lg:hidden bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-gray-900">MyDouble</h1>
          <p className="text-xs text-gray-600">@{slug}</p>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="flex">
        {/* Menu latéral - Desktop & Mobile */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Header desktop uniquement */}
          <div className="hidden lg:block p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">MyDouble</h1>
            <p className="text-sm text-gray-600 mt-1">@{slug}</p>
            {name && <p className="text-xs text-gray-500">{name}</p>}
          </div>

          <nav className="p-4 mt-4 lg:mt-0">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path)
                    setMenuOpen(false)
                  }}
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

        {/* Overlay mobile */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Contenu principal */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
