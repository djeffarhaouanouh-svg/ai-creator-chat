'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, User, Users } from 'lucide-react'

export default function NavBar() {
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accountType, setAccountType] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    // Check if user is authenticated
    const accountTypeFromStorage = localStorage.getItem('accountType')
    setAccountType(accountTypeFromStorage)
    setIsAuthenticated(!!accountTypeFromStorage)
  }, [])

  // Don't render anything until mounted (avoid hydration issues)
  if (!mounted) {
    return null
  }

  const navItems = [
    {
      name: 'Accueil',
      href: '/',
      icon: Home,
    },
    {
      name: 'Mes messages',
      href: '/mes-messages',
      icon: MessageCircle,
    },
    {
      name: 'Mon compte',
      href: isAuthenticated ? '/mon-compte' : '/login',
      icon: User,
    },
    {
      name: 'Nous rejoindre',
      href: '/pourquoi-nous-rejoindre',
      icon: Users,
    },
  ]

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
                  <Icon className={`w-6 h-6 ${!isActive && 'group-hover:scale-110 transition-transform'}`} />
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
