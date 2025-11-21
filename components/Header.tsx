'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData) {
          setUserRole(userData.role)
        }
      } else {
        setUserRole(null)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUserRole(null)
      } else {
        getUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">DaanSetu</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/ngos"
              className={`${
                isActive('/ngos')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              } transition`}
            >
              NGOs
            </Link>
            <Link
              href="/campaigns"
              className={`${
                pathname?.startsWith('/campaigns') && !pathname?.startsWith('/campaigns/create')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              } transition`}
            >
              Campaigns
            </Link>
            <Link
              href="/csr-campaigns"
              className={`${
                pathname?.startsWith('/csr-campaigns')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              } transition`}
            >
              CSR
            </Link>
            <Link
              href="/volunteer/opportunities"
              className={`${
                pathname?.startsWith('/volunteer')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              } transition`}
            >
              Volunteer
            </Link>
            <Link
              href="/map"
              className={`${
                isActive('/map')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              } transition`}
            >
              Map
            </Link>
            {user && (
              <Link
                href={userRole === 'corporate' ? '/corporate/dashboard' : '/dashboard'}
                className={`${
                  (userRole === 'corporate' ? pathname?.startsWith('/corporate/dashboard') : isActive('/dashboard'))
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                } transition`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden md:block">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex justify-around py-2 overflow-x-auto">
          <Link
            href="/ngos"
            className={`${
              isActive('/ngos') ? 'text-blue-600' : 'text-gray-600'
            } text-xs py-2 px-2 whitespace-nowrap`}
          >
            NGOs
          </Link>
          <Link
            href="/campaigns"
            className={`${
              pathname?.startsWith('/campaigns') ? 'text-blue-600' : 'text-gray-600'
            } text-xs py-2 px-2 whitespace-nowrap`}
          >
            Campaigns
          </Link>
          <Link
            href="/csr-campaigns"
            className={`${
              pathname?.startsWith('/csr-campaigns') ? 'text-blue-600' : 'text-gray-600'
            } text-xs py-2 px-2 whitespace-nowrap`}
          >
            CSR
          </Link>
          <Link
            href="/volunteer/opportunities"
            className={`${
              pathname?.startsWith('/volunteer') ? 'text-blue-600' : 'text-gray-600'
            } text-xs py-2 px-2 whitespace-nowrap`}
          >
            Volunteer
          </Link>
          <Link
            href="/map"
            className={`${
              isActive('/map') ? 'text-blue-600' : 'text-gray-600'
            } text-xs py-2 px-2 whitespace-nowrap`}
          >
            Map
          </Link>
          {user && (
            <Link
              href={userRole === 'corporate' ? '/corporate/dashboard' : '/dashboard'}
              className={`${
                (userRole === 'corporate' ? pathname?.startsWith('/corporate/dashboard') : isActive('/dashboard')) ? 'text-blue-600' : 'text-gray-600'
              } text-xs py-2 px-2 whitespace-nowrap`}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
