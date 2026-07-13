import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Globe2,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  PenSquare,
  Search,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import { getUserRole } from "@/lib/auth/profile";
import {
  calculateNgoProfileCompletion,
  NGO_CAUSE_LABELS,
} from "@/lib/ngo/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "NGO Dashboard | DaanSetu" };
export const dynamic = "force-dynamic";

function assetUrl(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base) return null;
  return `${base}/storage/v1/object/public/ngos/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function formatNumber(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export default async function NgoDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/ngo/dashboard");
  if ((await getUserRole(supabase, user.id)) !== "ngo") redirect("/dashboard");

  const { data: ngo } = await supabase
    .from("ngos")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ngo) redirect("/ngo/profile");

  const [
    verificationResult,
    campaignsResult,
    volunteersResult,
    followersResult,
    notificationsResult,
  ] = await Promise.allSettled([
    supabase
      .from("ngo_verifications")
      .select("verification_status")
      .eq("ngo_id", ngo.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("ngo_id", ngo.id)
      .eq("status", "active"),
    supabase
      .from("volunteer_opportunities")
      .select("id", { count: "exact", head: true })
      .eq("ngo_id", ngo.id)
      .eq("status", "active"),
    supabase.rpc("get_follower_count", {
      entity_uuid: ngo.id,
      entity_type_param: "ngo",
    }),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  const verification =
    verificationResult.status === "fulfilled"
      ? verificationResult.value.data
      : null;
  const campaignsCount =
    campaignsResult.status === "fulfilled"
      ? (campaignsResult.value.count ?? 0)
      : 0;
  const volunteersCount =
    volunteersResult.status === "fulfilled"
      ? (volunteersResult.value.count ?? 0)
      : 0;
  const followerCount =
    followersResult.status === "fulfilled"
      ? Number(followersResult.value.data ?? 0)
      : 0;
  const unreadCount =
    notificationsResult.status === "fulfilled"
      ? (notificationsResult.value.count ?? 0)
      : 0;

  const displayName = ngo.display_name ?? ngo.name ?? "Your Organization";
  const logo = assetUrl(ngo.logo_path);
  const verificationStatus =
    verification?.verification_status ?? "not-submitted";
  const isPublished = ngo.profile_status === "published";

  const profileInput = {
    legalName: ngo.legal_name,
    displayName: ngo.display_name,
    tagline: ngo.tagline,
    description: ngo.description,
    mission: ngo.mission,
    foundingYear: ngo.founding_year,
    organizationType: ngo.organization_type,
    logoPath: ngo.logo_path,
    coverImagePath: ngo.cover_image_path,
    addressLine1: ngo.address_line_1,
    addressLine2: ngo.address_line_2,
    city: ngo.city,
    state: ngo.state,
    postalCode: ngo.postal_code,
    countryCode: ngo.country_code,
    latitude: ngo.latitude,
    longitude: ngo.longitude,
    primaryCause: ngo.category,
    impactAreas: ngo.impact_areas,
    beneficiaryGroups: ngo.beneficiary_groups,
    programSummary: ngo.program_summary,
    vision: ngo.vision,
    theoryOfChange: ngo.theory_of_change,
    coreValues: ngo.core_values,
    operatingStates: ngo.operating_states,
    teamSize: ngo.team_size,
    beneficiariesReached: ngo.beneficiaries_reached,
    communitiesServed: ngo.communities_served,
    volunteersEngaged: ngo.volunteers_engaged,
    websiteUrl: ngo.website_url,
    publicEmail: ngo.public_email,
    publicPhone: ngo.public_phone,
    socialLinks: ngo.social_links,
    isDiscoverable: ngo.is_discoverable,
    acceptsDonations: ngo.accepts_donations,
    acceptsVolunteers: ngo.accepts_volunteers,
  };
  const completion = calculateNgoProfileCompletion(profileInput, {
    verificationStatus: verification?.verification_status,
    onboardingStep: ngo.onboarding_step,
  });

  const primaryCause =
    typeof ngo.category === "string" && ngo.category in NGO_CAUSE_LABELS
      ? NGO_CAUSE_LABELS[ngo.category as keyof typeof NGO_CAUSE_LABELS]
      : null;

  const quickActions = [
    {
      label: "Edit Profile",
      href: "/ngo/profile",
      icon: PenSquare,
      description: "Update your organization details",
    },
    ...(isPublished
      ? [
          {
            label: "View Public Profile",
            href: `/ngos/${ngo.id}`,
            icon: Globe2,
            description: "See how supporters see you",
          },
        ]
      : []),
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      description: `${unreadCount} unread`,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      label: "Settings",
      href: "/ngo/profile",
      icon: Settings,
      description: "Manage account settings",
    },
  ];

  const stats = [
    {
      label: "Followers",
      value: formatNumber(followerCount),
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Active Campaigns",
      value: String(campaignsCount),
      icon: Target,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Volunteer Ops",
      value: String(volunteersCount),
      icon: Heart,
      color: "text-rose-600 bg-rose-50",
    },
    {
      label: "Beneficiaries",
      value: formatNumber(ngo.beneficiaries_reached),
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 h-14 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/ngo/dashboard"
            className="flex shrink-0 items-center gap-2"
            aria-label="DaanSetu Dashboard"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
              <img src="/logo.png" alt="" className="h-10 w-10 object-cover" />
            </span>
            <span className="text-xl font-bold tracking-tight text-[#10214e]">
              Daan<span className="text-blue-600">Setu</span>
            </span>
            <span className="ml-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              NGO
            </span>
          </Link>

          <nav
            className="ml-auto hidden items-center gap-1 md:flex"
            aria-label="Dashboard navigation"
          >
            <Link
              href="/ngo/dashboard"
              className="flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-1.5 text-[13px] font-semibold text-blue-600"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <Link
              href="/ngo/profile"
              className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Building2 className="h-3.5 w-3.5" />
              Profile
            </Link>
            {isPublished && (
              <Link
                href={`/ngos/${ngo.id}`}
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Globe2 className="h-3.5 w-3.5" />
                Public Page
              </Link>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2.5 md:ml-4">
            <Link
              href="/notifications"
              className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              {logo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-slate-500">
                  {displayName.slice(0, 1)}
                </span>
              )}
            </div>
            <span className="hidden text-[13px] font-medium text-slate-500 lg:block max-w-[150px] truncate">
              {user.email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-[#10214e] via-[#1e3a6e] to-[#0d5c4d] px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.15),transparent_50%)]" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 bg-white/10 shadow-lg backdrop-blur-sm">
                  {logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={logo}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-white/80" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {displayName}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {primaryCause && (
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                        {primaryCause}
                      </span>
                    )}
                    {(ngo.city || ngo.state) && (
                      <span className="flex items-center gap-1 text-sm text-white/70">
                        <MapPin className="h-3.5 w-3.5" />
                        {[ngo.city, ngo.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${isPublished ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"}`}
                    >
                      {isPublished ? "● Published" : "○ Draft"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 sm:shrink-0">
                <Link
                  href="/ngo/profile"
                  className="flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <PenSquare className="h-4 w-4" />
                  Edit Profile
                </Link>
                {isPublished && (
                  <Link
                    href={`/ngos/${ngo.id}`}
                    className="flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#10214e] shadow-sm transition hover:bg-slate-50"
                  >
                    <Globe2 className="h-4 w-4" />
                    View Public Page
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Profile completion bar */}
          {completion.percentage < 100 && (
            <div className="flex items-center gap-4 border-t border-slate-100 px-6 py-3.5 sm:px-8">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    Profile Completion
                  </span>
                  <span className="font-bold text-blue-600">
                    {completion.percentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${completion.percentage}%` }}
                  />
                </div>
              </div>
              <Link
                href="/ngo/profile"
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 text-xs font-bold text-blue-600 hover:bg-blue-100"
              >
                Complete Profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </section>

        {/* Stats Grid */}
        <section
          className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
          aria-label="Key metrics"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Main Content Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Quick Actions
            </h2>
            <div className="mt-4 space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3.5 rounded-xl border border-slate-100 p-3.5 transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {action.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {action.description}
                      </p>
                    </div>
                    {"badge" in action && action.badge != null && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {action.badge > 9 ? "9+" : action.badge}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Organization Overview */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Building2 className="h-4 w-4 text-blue-600" />
              Organization Overview
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {/* Verification Status */}
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck
                    className={`h-5 w-5 ${verificationStatus === "verified" ? "text-emerald-500" : verificationStatus === "pending" ? "text-amber-500" : "text-slate-400"}`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Verification
                    </p>
                    <p
                      className={`mt-0.5 text-xs font-bold ${verificationStatus === "verified" ? "text-emerald-600" : verificationStatus === "pending" ? "text-amber-600" : "text-slate-500"}`}
                    >
                      {verificationStatus === "verified"
                        ? "Verified ✓"
                        : verificationStatus === "pending"
                          ? "Under Review"
                          : "Not Submitted"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Status */}
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={`h-5 w-5 ${isPublished ? "text-emerald-500" : "text-slate-400"}`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Profile Status
                    </p>
                    <p
                      className={`mt-0.5 text-xs font-bold ${isPublished ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {isPublished
                        ? "Published & Visible"
                        : "Draft — Not Public"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Founding Info */}
              {ngo.founding_year && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Founded
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-slate-600">
                        {ngo.founding_year} ·{" "}
                        {new Date().getFullYear() - ngo.founding_year}+ years
                        active
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {(ngo.city || ngo.state) && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-5 w-5 text-violet-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Headquarters
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-slate-600">
                        {[ngo.city, ngo.state, ngo.country_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Summary */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-800">
                Activity Summary
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {formatNumber(ngo.team_size)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    Team Members
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-600">
                    {formatNumber(ngo.communities_served)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    Communities
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-rose-600">
                    {formatNumber(ngo.volunteers_engaged)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    Volunteers
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-600">
                    {formatNumber(ngo.beneficiaries_reached)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    Beneficiaries
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Operations summary */}
        <section className="mt-6 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50 p-6 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">
              Manage your campaigns, volunteers, reports, and organization
              profile
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Campaign management, volunteer coordination, impact reports, donor
              analytics, and more are on the way. Stay tuned!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
