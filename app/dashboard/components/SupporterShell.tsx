"use client";

import {
  Bell,
  ChevronDown,
  Flame,
  HandHeart,
  HeartHandshake,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOutAction } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Discover", href: "/ngos", icon: Sparkles },
  { label: "Campaigns", href: "/campaigns", icon: HeartHandshake },
  {
    label: "Volunteer",
    href: "/volunteer/opportunities",
    icon: HandHeart,
  },
  { label: "Community", href: "/community", icon: UsersRound },
] as const;

const accountLinks = [
  { label: "Giving & receipts", href: "/dashboard/giving" },
  { label: "My impact", href: "/dashboard/impact" },
  { label: "Saved posts", href: "/dashboard/bookmarks" },
  { label: "Profile", href: "/dashboard/profile/edit" },
  { label: "Security", href: "/dashboard/security" },
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function SupporterShell({
  name,
  email,
  unreadNotifications,
  streakDays,
  children,
}: {
  name: string;
  email: string;
  unreadNotifications: number;
  streakDays: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <a
        href="#supporter-dashboard-content"
        className="sr-only z-[70] rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-700 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to dashboard content
      </a>

      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1680px] items-center gap-3 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="DaanSetu supporter home"
          >
            <span className="relative h-9 w-9 overflow-hidden rounded-xl">
              <Image
                src="/logo.png"
                alt=""
                fill
                sizes="36px"
                className="scale-[1.48] object-cover"
                priority
              />
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight text-[#101b4d] sm:block">
              DaanSetu
            </span>
          </Link>

          <nav
            className="ml-2 hidden items-center gap-0.5 xl:flex"
            aria-label="Primary navigation"
          >
            {primaryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13px] font-semibold transition",
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form
            action="/ngos"
            method="get"
            role="search"
            className="relative ml-auto hidden w-full max-w-[410px] md:block xl:ml-4"
          >
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="search"
              aria-label="Search causes and organizations"
              placeholder="Search causes, NGOs, campaigns…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
            <Link
              href="/notifications"
              aria-label={`${unreadNotifications} unread notifications`}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {Math.min(unreadNotifications, 9)}
                  {unreadNotifications > 9 ? "+" : ""}
                </span>
              )}
            </Link>
            <Link
              href="/community"
              aria-label="Community conversations"
              className="hidden h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-blue-700 sm:grid"
            >
              <MessageSquare className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>
            <div className="mx-1 hidden h-7 w-px bg-slate-200 lg:block" />
            <div className="hidden items-center gap-2 rounded-xl px-2 py-1.5 lg:flex">
              <Flame className="h-5 w-5 text-orange-500" aria-hidden="true" />
              <span className="text-xs leading-tight text-slate-500">
                <strong className="block text-sm text-slate-900">
                  {streakDays}
                </strong>
                day streak
              </span>
            </div>

            <details className="group relative hidden lg:block">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#101b4d] text-xs font-bold text-white">
                  {initials(name)}
                </span>
                <span className="max-w-28 truncate text-sm font-bold text-slate-900">
                  {name}
                </span>
                <ChevronDown
                  className="h-4 w-4 text-slate-400 transition group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{email}</p>
                </div>
                <nav className="py-1" aria-label="Account navigation">
                  {accountLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <form
                  action={signOutAction}
                  className="border-t border-slate-100 pt-1"
                >
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </form>
              </div>
            </details>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 xl:hidden"
              aria-expanded={mobileOpen}
              aria-controls="supporter-mobile-navigation"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
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
          <div
            id="supporter-mobile-navigation"
            className="border-t border-slate-100 bg-white px-4 py-4 xl:hidden"
          >
            <form
              action="/ngos"
              method="get"
              role="search"
              className="relative md:hidden"
            >
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                name="search"
                aria-label="Search causes and organizations"
                placeholder="Search DaanSetu…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </form>
            <nav
              className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-3"
              aria-label="Mobile navigation"
            >
              {[...primaryLinks, ...accountLinks].map((item) => {
                const Icon =
                  "icon" in item
                    ? item.icon
                    : item.href === "/dashboard/security"
                      ? ShieldCheck
                      : UserRound;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold",
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <form
              action={signOutAction}
              className="mt-3 border-t border-slate-100 pt-3"
            >
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        )}
      </header>

      <main id="supporter-dashboard-content">{children}</main>
    </div>
  );
}
