"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Heart,
  LayoutDashboard,
  Menu,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { signOutAction } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { href: "/ngos", label: "Discover", icon: Search },
  { href: "/campaigns", label: "Campaigns", icon: Heart },
  { href: "/volunteer/opportunities", label: "Volunteer", icon: Users },
  { href: "/community", label: "Community", icon: Users },
] as const;

function dashboardHref(role: string | null) {
  if (role === "ngo") return "/ngo/dashboard";
  if (role === "corporate") return "/corporate/dashboard";
  if (role === "admin") return "/admin/operations";
  return "/dashboard";
}

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let mounted = true;

    async function syncUser(nextUser?: User | null) {
      const activeUser =
        nextUser === undefined
          ? (await supabase.auth.getUser()).data.user
          : nextUser;
      if (!mounted) return;

      setUser(activeUser);
      if (!activeUser) {
        setUserRole(null);
        setUnreadCount(0);
        return;
      }

      const [{ data: profile }, { count }] = await Promise.all([
        supabase
          .from("users")
          .select("role")
          .eq("id", activeUser.id)
          .maybeSingle(),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", activeUser.id)
          .eq("is_read", false),
      ]);
      if (!mounted) return;
      setUserRole(profile?.role ?? null);
      setUnreadCount(count ?? 0);
    }

    void syncUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => void syncUser(session?.user ?? null),
    );
    const interval = window.setInterval(() => void syncUser(), 60_000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [supabase]);

  const isActive = (href: string) =>
    href === "/ngos"
      ? pathname.startsWith("/ngos")
      : href === "/campaigns"
        ? pathname.startsWith("/campaigns")
        : href === "/volunteer/opportunities"
          ? pathname.startsWith("/volunteer")
          : pathname.startsWith(href);

  const closeMenu = () => setMobileOpen(false);
  const dashboard = dashboardHref(userRole);

  return (
    <header className="app-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="container-custom flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="DaanSetu home"
        >
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl">
            <Image
              src="/logo.png"
              alt=""
              fill
              sizes="36px"
              className="object-cover scale-[1.5]"
              priority
            />
          </span>
          <span className="hidden sm:block">
            <span className="block text-base font-bold leading-4 text-heading">
              DaanSetu
            </span>
            <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-body">
              A bridge for giving
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary navigation"
        >
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`app-nav-link ${isActive(href) ? "app-nav-link-active" : ""}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <Link
            href="/analytics"
            aria-current={
              pathname.startsWith("/analytics") ? "page" : undefined
            }
            className={`app-nav-link ${pathname.startsWith("/analytics") ? "app-nav-link-active" : ""}`}
          >
            Impact
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href="/notifications"
                className="icon-button relative"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    className="notification-count"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href={dashboard}
                className="hidden btn btn-secondary h-10 px-3 text-sm sm:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Dashboard
              </Link>
              <form action={signOutAction} className="hidden sm:block">
                <button
                  type="submit"
                  className="btn btn-ghost h-10 px-3 text-sm"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden btn btn-ghost h-10 px-3 text-sm sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="hidden btn btn-primary h-10 px-3 text-sm sm:inline-flex"
              >
                Join DaanSetu
              </Link>
            </>
          )}
          <button
            type="button"
            className="icon-button lg:hidden"
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="app-mobile-menu lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="container-custom grid gap-1 py-3">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMenu}
                aria-current={isActive(href) ? "page" : undefined}
                className={`app-mobile-link ${isActive(href) ? "app-mobile-link-active" : ""}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
            <Link
              href="/analytics"
              onClick={closeMenu}
              className="app-mobile-link"
            >
              Impact dashboard
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
              {user ? (
                <>
                  <Link
                    href={dashboard}
                    onClick={closeMenu}
                    className="btn btn-secondary"
                  >
                    Dashboard
                  </Link>
                  <form action={signOutAction}>
                    <button type="submit" className="btn btn-ghost w-full">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={closeMenu}
                    className="btn btn-secondary"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={closeMenu}
                    className="btn btn-primary"
                  >
                    Join DaanSetu
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
