'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { signOutAction } from '@/app/auth/actions'

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [supabase] = useState(() => createClient())

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

  const isActive = (path: string) => pathname === path

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 relative">
              <Image src="/logo.png" alt="DaanSetu Logo" fill sizes="32px" className="object-cover scale-[1.5]" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-blue-800 transition-all">
              DaanSetu
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/ngos"
              className={`${
                isActive('/ngos')
                  ? 'text-blue-600 font-semibold bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } transition-all px-3 py-2 rounded-lg text-sm font-medium`}
            >
              NGOs
            </Link>
            <Link
              href="/campaigns"
              className={`${
                pathname?.startsWith('/campaigns') && !pathname?.startsWith('/campaigns/create')
                  ? 'text-blue-600 font-semibold bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } transition-all px-3 py-2 rounded-lg text-sm font-medium`}
            >
              Campaigns
            </Link>
            <Link
              href="/volunteer/opportunities"
              className={`${
                pathname?.startsWith('/volunteer')
                  ? 'text-blue-600 font-semibold bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } transition-all px-3 py-2 rounded-lg text-sm font-medium`}
            >
              Volunteer
            </Link>
            <Link
              href="/community"
              className={`${
                pathname?.startsWith('/community')
                  ? 'text-blue-600 font-semibold bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } transition-all px-3 py-2 rounded-lg text-sm font-medium`}
            >
              Community
            </Link>
            <Link
              href="/leaderboard"
              className={`${
                isActive('/leaderboard')
                  ? 'text-blue-600 font-semibold bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } transition-all px-3 py-2 rounded-lg text-sm font-medium`}
            >
              Leaderboard
            </Link>
            {user && (
              <Link
                href={userRole === 'ngo' ? '/ngo/dashboard' : userRole === 'corporate' ? '/corporate/dashboard' : '/dashboard'}
                className={`${
                  (userRole === 'ngo' ? pathname?.startsWith('/ngo/dashboard') : userRole === 'corporate' ? pathname?.startsWith('/corporate/dashboard') : isActive('/dashboard'))
                    ? 'text-blue-600 font-semibold bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                } transition-all px-3 py-2 rounded-lg text-sm font-medium`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <svg
                    className={`w-5 h-5 ${
                      isActive('/notifications') ? 'text-blue-600' : 'text-slate-600'
                    } transition-colors`}
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
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <span className="text-sm text-slate-600 hidden lg:block max-w-[150px] truncate">
                  {user.email}
                </span>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all font-medium"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  className="btn btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-slate-200 bg-white">
        <div className="flex justify-around py-1 overflow-x-auto scrollbar-hide">
          <Link
            href="/ngos"
            className={`${
              isActive('/ngos') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-600'
            } text-xs py-2 px-3 whitespace-nowrap rounded-lg transition-all`}
          >
            NGOs
          </Link>
          <Link
            href="/campaigns"
            className={`${
              pathname?.startsWith('/campaigns') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-600'
            } text-xs py-2 px-3 whitespace-nowrap rounded-lg transition-all`}
          >
            Campaigns
          </Link>
          <Link
            href="/volunteer/opportunities"
            className={`${
              pathname?.startsWith('/volunteer') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-600'
            } text-xs py-2 px-3 whitespace-nowrap rounded-lg transition-all`}
          >
            Volunteer
          </Link>
          <Link
            href="/community"
            className={`${
              pathname?.startsWith('/community') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-600'
            } text-xs py-2 px-3 whitespace-nowrap rounded-lg transition-all`}
          >
            Community
          </Link>
          <Link
            href="/leaderboard"
            className={`${
              isActive('/leaderboard') ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-600'
            } text-xs py-2 px-3 whitespace-nowrap rounded-lg transition-all`}
          >
            Leaderboard
          </Link>
          {user && (
            <Link
              href={userRole === 'ngo' ? '/ngo/dashboard' : userRole === 'corporate' ? '/corporate/dashboard' : '/dashboard'}
              className={`${
                (userRole === 'ngo' ? pathname?.startsWith('/ngo/dashboard') : userRole === 'corporate' ? pathname?.startsWith('/corporate/dashboard') : isActive('/dashboard')) ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-600'
              } text-xs py-2 px-3 whitespace-nowrap rounded-lg transition-all`}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
