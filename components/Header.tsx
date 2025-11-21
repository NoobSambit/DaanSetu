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
  const [unreadCount, setUnreadCount] = useState(0)
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

        // Fetch unread notification count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)

        setUnreadCount(count || 0)
      } else {
        setUserRole(null)
        setUnreadCount(0)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUserRole(null)
        setUnreadCount(0)
      } else {
        getUser()
      }
    })

    // Set up interval to refresh notification count every 30 seconds
    const interval = setInterval(() => {
      if (user) {
        getUser()
      }
    }, 30000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [supabase.auth, user?.id])

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
              href="/community"
              className={`${
                pathname?.startsWith('/community')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              } transition`}
            >
              Community
            </Link>
            <Link
              href="/leaderboard"
              className={`${
                isActive('/leaderboard')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              } transition`}
            >
              Leaderboard
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
                {/* Notification Bell */}
                <Link href="/notifications" className="relative">
                  <svg
                    className={`w-6 h-6 ${
                      isActive('/notifications') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    } transition`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
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
            href="/volunteer/opportunities"
            className={`${
              pathname?.startsWith('/volunteer') ? 'text-blue-600' : 'text-gray-600'
            } text-xs py-2 px-2 whitespace-nowrap`}
          >
            Volunteer
          </Link>
          <Link
            href="/community"
            className={`${
              pathname?.startsWith('/community') ? 'text-blue-600' : 'text-gray-600'
            } text-xs py-2 px-2 whitespace-nowrap`}
          >
            Community
          </Link>
          <Link
            href="/leaderboard"
            className={`${
              isActive('/leaderboard') ? 'text-blue-600' : 'text-gray-600'
            } text-xs py-2 px-2 whitespace-nowrap`}
          >
            Leaderboard
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
