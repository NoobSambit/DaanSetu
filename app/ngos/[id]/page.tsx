/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Award,
  BadgeCheck,
  Bell,
  Bookmark,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Flag,
  Globe2,
  HandHeart,
  Heart,
  Home,
  Laptop,
  BookOpen,
  Leaf,
  Baby,
  User,
  Accessibility,
  Lightbulb,
  HeartPulse,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

import DonateButton from "@/components/DonateButton";

// Custom SVG components for Brand Icons (since lucide-react removed them)
function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import NGOMap from "@/components/NGOMap";
import FollowNgoButton from "@/components/ngo/FollowNgoButton";
import ShareProfileButton from "@/components/ngo/ShareProfileButton";
import StickyTabs, { type TabItem } from "@/components/ngo/StickyTabs";
import {
  NGO_CAUSE_LABELS,
  calculateNgoProfileCompletion,
} from "@/lib/ngo/profile";
import { createClient } from "@/lib/supabase/server";
import type { NGO } from "@/lib/types/database.types";

export const dynamic = "force-dynamic";

function assetUrl(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !base) return null;
  return `${base}/storage/v1/object/public/ngos/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function formatNumber(value: number | null | undefined) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-IN", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function humanize(value: string | null | undefined) {
  if (!value) return null;
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function causeLabel(cause: unknown) {
  if (typeof cause === "string" && cause in NGO_CAUSE_LABELS) {
    return NGO_CAUSE_LABELS[cause as keyof typeof NGO_CAUSE_LABELS];
  }
  return typeof cause === "string" && cause ? humanize(cause) : null;
}

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`;
    const parsed = new URL(withProtocol);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PublicProfileHeader({
  userEmail,
  unreadCount,
  isOwner,
  ngoId,
}: {
  userEmail: string | null;
  unreadCount: number;
  isOwner: boolean;
  ngoId: string;
}) {
  const initial = userEmail?.slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-50 h-[50px] border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center gap-5 px-[2%]">
        <Link
          href={isOwner ? "/ngo/dashboard" : "/"}
          className="flex shrink-0 items-center gap-2"
          aria-label="DaanSetu home"
        >
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
            <img src="/logo.png" alt="" className="h-10 w-10 object-cover" />
          </span>
          <span className="text-2xl font-bold tracking-tight text-[#10214e]">
            Daan<span className="text-blue-600">Setu</span>
          </span>
        </Link>

        {isOwner ? (
          /* ── NGO Owner Navigation ── */
          <>
            <nav
              className="ml-auto hidden items-center gap-1 lg:flex"
              aria-label="NGO management navigation"
            >
              <Link
                href="/ngo/dashboard"
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Home className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <Link
                href="/ngo/profile"
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Building2 className="h-3.5 w-3.5" />
                Edit Profile
              </Link>
              <Link
                href={`/ngos/${ngoId}`}
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold text-blue-600 bg-blue-50"
              >
                <Globe2 className="h-3.5 w-3.5" />
                Public Profile
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-2.5 lg:ml-4">
              <Link
                href="/notifications"
                className="relative rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-sm font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <span className="hidden text-[13px] font-medium text-slate-500 lg:block max-w-[160px] truncate">
                {userEmail}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </>
        ) : (
          /* ── Public / Visitor Navigation ── */
          <>
            <form action="/ngos" className="ml-[10%] hidden w-[255px] lg:block">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  name="search"
                  placeholder="Search for NGOs, causes, programs..."
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </form>

            <nav
              className="ml-auto hidden items-center gap-7 text-base font-semibold text-[#0d1d46] lg:flex"
              aria-label="Primary navigation"
            >
              <Link href="/" className="hover:text-blue-600">
                Explore
              </Link>
              <Link href="/ngos" className="text-blue-600">
                NGOs
              </Link>
              <Link href="/campaigns" className="hover:text-blue-600">
                Programs
              </Link>
              <Link
                href="/volunteer/opportunities"
                className="hover:text-blue-600"
              >
                Opportunities
              </Link>
              <Link href="/csr-campaigns" className="hover:text-blue-600">
                CSR Hub
              </Link>
              <Link href="/impact-stories" className="hover:text-blue-600">
                Impact Stories
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-3 lg:ml-5">
              {userEmail ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-sm font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-lg font-bold text-emerald-800"
                    aria-label="Open dashboard"
                  >
                    {initial}
                  </Link>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className="rounded-md border border-blue-200 px-3 py-1.5 text-base font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Sign in
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function SectionCard({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

export default async function NGOProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("ngos")
    .select("*")
    .eq("id", id)
    .eq("profile_status", "published")
    .maybeSingle();

  if (!data) notFound();
  const ngo = data as NGO;

  const [
    programsResult,
    updatesResult,
    galleryResult,
    serviceAreasResult,
    campaignsResult,
    volunteerOpsResult,
    followerCountResult,
    verificationResult,
    notificationsResult,
  ] = await Promise.allSettled([
    supabase
      .from("ngo_programs")
      .select("*", { count: "exact" })
      .eq("ngo_id", ngo.id)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("ngo_updates")
      .select("*")
      .eq("ngo_id", ngo.id)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("ngo_gallery_images")
      .select("*")
      .eq("ngo_id", ngo.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("ngo_service_areas")
      .select("*")
      .eq("ngo_id", ngo.id)
      .order("sort_order", { ascending: true })
      .order("state", { ascending: true })
      .limit(8),
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
      .from("ngo_verifications")
      .select(
        "verification_status, registration_number, ngo_darpan_id, pan_number, has_12a, has_80g, has_fcra, documents_verified",
      )
      .eq("ngo_id", ngo.id)
      .maybeSingle(),
    user
      ? supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false)
      : Promise.resolve({ count: 0 }),
  ]);

  const programs =
    programsResult.status === "fulfilled" && programsResult.value.data
      ? programsResult.value.data
      : [];
  const updates =
    updatesResult.status === "fulfilled" && updatesResult.value.data
      ? updatesResult.value.data
      : [];
  const galleryImages =
    galleryResult.status === "fulfilled" && galleryResult.value.data
      ? galleryResult.value.data
      : [];
  const serviceAreas =
    serviceAreasResult.status === "fulfilled" && serviceAreasResult.value.data
      ? serviceAreasResult.value.data
      : [];
  const programsCount =
    programsResult.status === "fulfilled"
      ? (programsResult.value.count ?? programs.length)
      : programs.length;
  const campaignsCount =
    campaignsResult.status === "fulfilled"
      ? (campaignsResult.value.count ?? 0)
      : 0;
  const volunteerOpsCount =
    volunteerOpsResult.status === "fulfilled"
      ? (volunteerOpsResult.value.count ?? 0)
      : 0;
  const followerCount =
    followerCountResult.status === "fulfilled"
      ? Number(followerCountResult.value.data ?? 0)
      : 0;
  const verification =
    verificationResult.status === "fulfilled"
      ? verificationResult.value.data
      : null;
  const unreadCount =
    notificationsResult.status === "fulfilled"
      ? (notificationsResult.value.count ?? 0)
      : 0;

  const cover = assetUrl(ngo.cover_image_path);
  const logo = assetUrl(ngo.logo_path);
  const displayName = ngo.display_name ?? ngo.name ?? "Organization";
  const primaryCause = causeLabel(ngo.category);
  const organizationType = humanize(ngo.organization_type);
  const yearsActive = ngo.founding_year
    ? Math.max(0, new Date().getFullYear() - ngo.founding_year)
    : null;
  const hasCoordinates =
    Number.isFinite(ngo.latitude) && Number.isFinite(ngo.longitude);
  const lastUpdated = formatDate(ngo.updated_at);
  const websiteUrl = safeExternalUrl(ngo.website_url);
  const socialLinks = Object.entries(ngo.social_links ?? {})
    .map(([name, url]) => ({
      name: humanize(name) ?? name,
      url: safeExternalUrl(url),
    }))
    .filter((entry): entry is { name: string; url: string } =>
      Boolean(entry.url),
    );

  const uniqueStates =
    serviceAreas.length > 0
      ? Array.from(
          new Set(serviceAreas.map((area) => area.state).filter(Boolean)),
        )
      : Array.from(new Set((ngo.operating_states ?? []).filter(Boolean)));

  const operatingAreas =
    serviceAreas.length > 0
      ? serviceAreas.map((area) => ({
          label: [area.city, area.district, area.state]
            .filter(Boolean)
            .join(", "),
          programsCount: area.programs_count,
        }))
      : uniqueStates.map((state) => ({ label: state, programsCount: null }));

  const fullAddress = [
    ngo.address_line_1,
    ngo.address_line_2,
    [ngo.city, ngo.state, ngo.postal_code].filter(Boolean).join(" "),
    ngo.country_code,
  ].filter(Boolean);

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

  const isVerificationComplete = Boolean(
    ngo.is_verified || verification?.verification_status === "verified",
  );
  const completion = calculateNgoProfileCompletion(profileInput, {
    verificationStatus: isVerificationComplete ? "verified" : "pending",
  });
  const profileCompleteness = completion.percentage;
  const activityCount = programsCount + campaignsCount + volunteerOpsCount;

  const verificationBadges = [
    isVerificationComplete ? "Verified NGO" : null,
    isVerificationComplete && verification?.has_12a ? "12A" : null,
    isVerificationComplete && verification?.has_80g ? "80G" : null,
    isVerificationComplete && verification?.has_fcra ? "FCRA" : null,
    isVerificationComplete && verification?.pan_number ? "PAN Verified" : null,
  ].filter((value): value is string => Boolean(value));

  const hasAbout = Boolean(
    ngo.description ||
    ngo.mission ||
    ngo.vision ||
    ngo.theory_of_change ||
    ngo.core_values?.length,
  );
  const hasImpact = Boolean(
    ngo.program_summary ||
    ngo.impact_areas?.length ||
    ngo.beneficiary_groups?.length ||
    primaryCause,
  );
  const hasMetrics =
    programsCount > 0 ||
    ngo.beneficiaries_reached != null ||
    ngo.communities_served != null ||
    ngo.volunteers_engaged != null;
  const hasContact = Boolean(
    websiteUrl || ngo.public_email || ngo.public_phone || fullAddress.length,
  );
  const hasSupport = Boolean(ngo.accepts_donations || ngo.accepts_volunteers);
  const hasImpactDashboard = Boolean(
    hasMetrics ||
    campaignsCount ||
    volunteerOpsCount ||
    uniqueStates.length ||
    yearsActive,
  );

  const tabs: TabItem[] = [];
  if (hasAbout) tabs.push({ id: "about", label: "About" });
  if (programs.length) tabs.push({ id: "programs", label: "Programs" });
  if (hasImpact) tabs.push({ id: "impact", label: "Impact" });
  if (galleryImages.length) tabs.push({ id: "media", label: "Media" });
  if (updates.length) tabs.push({ id: "updates", label: "Updates" });
  if (isVerificationComplete)
    tabs.push({ id: "transparency", label: "Transparency" });

  const quickStats = [
    verification?.registration_number
      ? {
          label: "Registration Number",
          value: verification.registration_number,
          icon: FileText,
          tone: "blue",
        }
      : null,
    verification?.ngo_darpan_id
      ? {
          label: "NGO Darpan ID",
          value: verification.ngo_darpan_id,
          icon: FileCheck2,
          tone: "rose",
        }
      : null,
    yearsActive != null
      ? {
          label: "Years Active",
          value: `${yearsActive}+ Years`,
          icon: Clock3,
          tone: "emerald",
        }
      : null,
    programsCount != null
      ? {
          label: "Programs Running",
          value: `${programsCount} Active`,
          icon: Target,
          tone: "amber",
        }
      : null,
    uniqueStates.length > 0
      ? {
          label: "States Served",
          value: `${uniqueStates.length} State${uniqueStates.length === 1 ? "" : "s"}`,
          icon: MapPin,
          tone: "violet",
        }
      : null,
    {
      label: "Last Profile Update",
      value: lastUpdated,
      icon: CalendarDays,
      tone: "blue",
    },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const toneClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-500",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };

  // Determine if the logged-in user owns this NGO
  const isOwner = Boolean(user && ngo.user_id === user.id);

  return (
    <>
      <PublicProfileHeader
        userEmail={user?.email ?? null}
        unreadCount={unreadCount}
        isOwner={isOwner}
        ngoId={ngo.id}
      />

      <main className="min-h-screen bg-[#f8fafc] text-[#0f1b3d]">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[76.2%_23.8%]">
          <div className="min-w-0 bg-[#f8fafc]">
            <section className="relative h-[340px] overflow-visible bg-[#111827]">
              {cover ? (
                <img
                  src={cover}
                  alt={`${displayName} cover`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(37,99,235,0.28),transparent_34%),linear-gradient(105deg,#111827_0%,#263451_48%,#0f766e_120%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/78 via-slate-900/32 to-slate-900/5" />
              <div className="absolute left-[4.5%] top-[50px] w-full max-w-[800px] pr-5 text-white">
                <h1 className="text-[32px] font-bold leading-[1.15] tracking-tight text-white drop-shadow-md sm:text-[40px] lg:text-[48px]">
                  {ngo.tagline ?? ngo.mission ?? displayName}
                </h1>
                {ngo.description && (
                  <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg max-w-2xl drop-shadow">
                    {ngo.description}
                  </p>
                )}
              </div>
            </section>

            <div className="relative z-10 -mt-[120px] px-[4.5%]">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] items-start">
                <section className="min-h-[190px] w-full rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.08)]">
                  <div className="flex gap-4">
                    <div className="flex h-[106px] w-[106px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                      {logo ? (
                        <img
                          src={logo}
                          alt={`${displayName} logo`}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-blue-50 text-3xl font-bold text-blue-600">
                          {displayName.slice(0, 1)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-3xl font-bold tracking-[-0.02em] text-[#10214e]">
                          {displayName}
                        </h2>
                        {isVerificationComplete && (
                          <BadgeCheck
                            className="h-5 w-5 shrink-0 fill-blue-600 text-white"
                            aria-label="Verified NGO"
                          />
                        )}
                      </div>
                      {(ngo.tagline || ngo.description) && (
                        <p className="mt-1.5 text-base leading-relaxed text-slate-500">
                          {ngo.tagline ?? ngo.description}
                        </p>
                      )}
                      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                        {(ngo.city || ngo.state) && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />{" "}
                            {[ngo.city, ngo.state, ngo.country_code]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                        {primaryCause && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                            {primaryCause}
                          </span>
                        )}
                        {organizationType && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />{" "}
                            {organizationType}
                          </span>
                        )}
                        {ngo.founding_year && (
                          <span>Founded {ngo.founding_year}</span>
                        )}
                        {followerCount > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />{" "}
                            <strong className="text-slate-700">
                              {formatNumber(followerCount)}
                            </strong>{" "}
                            Followers
                          </span>
                        )}
                      </div>

                      {verificationBadges.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {verificationBadges.map((badge) => {
                            if (badge === "Verified NGO") {
                              return (
                                <span
                                  key={badge}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                                  {badge}
                                </span>
                              );
                            }
                            return (
                              <span
                                key={badge}
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm"
                              >
                                {badge}{" "}
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="hidden w-[96px] shrink-0 border-l border-slate-100 pl-4 sm:block">
                      <p className="text-center text-sm font-medium text-slate-500">
                        Impact Score
                      </p>
                      <div className="relative mx-auto mt-2 flex h-[76px] w-[76px] items-center justify-center">
                        <svg
                          className="absolute inset-0 h-full w-full -rotate-90"
                          viewBox="0 0 100 100"
                          aria-hidden="true"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="41"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="41"
                            fill="none"
                            stroke="#059669"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="257.6"
                            strokeDashoffset={
                              257.6 - (257.6 * profileCompleteness) / 100
                            }
                          />
                        </svg>
                        <div className="text-center">
                          <span className="text-3xl font-bold text-[#10214e]">
                            {profileCompleteness}
                          </span>
                          <span className="block text-sm text-slate-500">
                            /100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4">
                    {ngo.accepts_donations && (
                      <DonateButton
                        ngoId={ngo.id}
                        ngoName={displayName}
                        isAuthenticated={Boolean(user)}
                        text="Donate"
                        icon={<CircleDollarSign className="h-4 w-4" />}
                        className="inline-flex h-9 min-w-[135px] items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm"
                      />
                    )}
                    {ngo.accepts_volunteers && (
                      <Link
                        href="/volunteer/opportunities"
                        className="inline-flex h-9 min-w-[130px] items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        <Heart className="h-4 w-4 text-blue-600" /> Volunteer
                      </Link>
                    )}
                    <FollowNgoButton
                      ngoId={ngo.id}
                      initialFollowerCount={followerCount}
                      isAuthenticated={Boolean(user)}
                      className="inline-flex h-9 min-w-[140px] items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    />
                  </div>
                </section>

                <div className="flex-col gap-3 hidden lg:flex">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.08)]">
                    <h2 className="mb-4 text-[13px] font-bold text-slate-800">
                      Organization Health
                    </h2>
                    <div className="space-y-4 text-[13px]">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-slate-500">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />{" "}
                            Profile Completeness
                          </span>
                          <strong className="text-slate-900">
                            {profileCompleteness}%
                          </strong>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${profileCompleteness}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-slate-500">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />{" "}
                          Verification Status
                        </span>
                        <strong
                          className={
                            isVerificationComplete
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }
                        >
                          {isVerificationComplete ? "Complete" : "Not verified"}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-slate-500">
                          <Award className="h-4 w-4 text-emerald-500" />{" "}
                          Transparency Rating
                        </span>
                        <strong
                          className={
                            isVerificationComplete
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }
                        >
                          {isVerificationComplete ? "Excellent" : "Pending"}
                        </strong>
                      </div>
                      {activityCount > 0 && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-slate-500">
                            <Activity className="h-4 w-4 text-emerald-500" />{" "}
                            Activity Status
                          </span>
                          <strong className="text-emerald-600">Active</strong>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-slate-500">
                          <Clock3 className="h-4 w-4 text-amber-500" /> Last
                          Updated
                        </span>
                        <strong className="text-slate-900">
                          {lastUpdated}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <ShareProfileButton
                      title={`${displayName} - DaanSetu NGO Profile`}
                      className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white text-[11.5px] font-semibold text-slate-600 shadow-[0_2px_4px_rgba(15,23,42,0.03)] transition hover:bg-slate-50"
                    />
                    <button className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white text-[11.5px] font-semibold text-slate-600 shadow-[0_2px_4px_rgba(15,23,42,0.03)] transition hover:bg-slate-50">
                      <Bookmark className="h-3 w-3" /> Save
                    </button>
                    <button className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white text-[11.5px] font-semibold text-slate-600 shadow-[0_2px_4px_rgba(15,23,42,0.03)] transition hover:bg-slate-50">
                      <AlertTriangle className="h-3 w-3 text-rose-500" /> Report
                      Issue
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 block rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
                <div className="flex items-center justify-between text-xs">
                  <span>Profile completeness</span>
                  <strong>{profileCompleteness}%</strong>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
              </div>

              <section className="mt-4 flex flex-wrap items-center justify-between gap-y-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
                {quickStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClasses[stat.tone]}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold text-[#10214e]">
                          {stat.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] font-medium text-slate-500">
                          {stat.value}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </section>

              <StickyTabs tabs={tabs} />

              <div className="mt-5 grid gap-5 xl:grid-cols-[55%_minmax(0,45%)] items-stretch">
                {hasAbout && (
                  <SectionCard
                    id="about"
                    className="overflow-hidden h-full flex flex-col"
                  >
                    <div className="p-6">
                      {ngo.description && (
                        <p className="text-[15px] leading-[1.65] text-slate-600 whitespace-pre-line">
                          {ngo.description}
                        </p>
                      )}

                      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {ngo.mission && (
                          <div className="min-w-0 border-slate-100 xl:border-r xl:pr-5">
                            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-[#10214e]">
                              <Flag className="h-3.5 w-3.5 text-blue-600" />{" "}
                              Mission
                            </h3>
                            <p className="mt-2 line-clamp-6 text-[13px] leading-[1.6] text-slate-500">
                              {ngo.mission}
                            </p>
                          </div>
                        )}
                        {ngo.vision && (
                          <div className="min-w-0 border-slate-100 xl:border-r xl:pr-5">
                            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-[#10214e]">
                              <HeartPulse className="h-3.5 w-3.5 text-rose-500" />{" "}
                              Vision
                            </h3>
                            <p className="mt-2 line-clamp-6 text-[13px] leading-[1.6] text-slate-500">
                              {ngo.vision}
                            </p>
                          </div>
                        )}
                        {ngo.core_values?.length > 0 && (
                          <div className="min-w-0 border-slate-100 xl:border-r xl:pr-5">
                            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-[#10214e]">
                              <Award className="h-3.5 w-3.5 text-amber-500" />{" "}
                              Core Values
                            </h3>
                            <ul className="mt-2 space-y-1 text-[13px] leading-[1.6] text-slate-500">
                              {ngo.core_values.slice(0, 5).map((value) => (
                                <li key={value}>• {value}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {ngo.theory_of_change && (
                          <div className="min-w-0">
                            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-[#10214e]">
                              <Activity className="h-3.5 w-3.5 text-violet-500" />{" "}
                              Theory of Change
                            </h3>
                            <p className="mt-2 line-clamp-6 text-[13px] leading-[1.6] text-slate-500">
                              {ngo.theory_of_change}
                            </p>
                          </div>
                        )}
                      </div>

                      {hasMetrics && (
                        <div className="mt-8">
                          <h3 className="text-[15px] font-bold text-[#10214e]">
                            Program Summary
                          </h3>
                          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {programsCount > 0 && (
                              <Metric
                                value={String(programsCount)}
                                label="Active Programs"
                              />
                            )}
                            {ngo.beneficiaries_reached != null && (
                              <Metric
                                value={`${formatNumber(ngo.beneficiaries_reached)}+`}
                                label="Beneficiaries Reached"
                              />
                            )}
                            {ngo.communities_served != null && (
                              <Metric
                                value={`${formatNumber(ngo.communities_served)}+`}
                                label="Communities Served"
                              />
                            )}
                            {ngo.volunteers_engaged != null && (
                              <Metric
                                value={`${formatNumber(ngo.volunteers_engaged)}+`}
                                label="Volunteers Engaged"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                <div className="min-w-0 flex flex-col gap-5">
                  {hasImpact && (
                    <SectionCard id="impact" className="p-5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#10214e]">
                          Impact Focus
                        </h2>
                        <Link
                          href="#impact"
                          className="text-[13px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View All
                        </Link>
                      </div>
                      <div className="mt-5 flex flex-col gap-6 sm:flex-row">
                        {primaryCause && (
                          <div className="sm:w-[150px] shrink-0 sm:border-r sm:border-slate-100 sm:pr-5">
                            <p className="text-sm font-semibold text-[#10214e]">
                              Primary Cause
                            </p>
                            <span className="mt-2.5 inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-[13px] font-semibold text-blue-600">
                              {primaryCause}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 space-y-5 sm:pl-2">
                          {ngo.impact_areas?.length > 0 && (
                            <TagGroup
                              label="Impact Areas"
                              values={ngo.impact_areas}
                              tone="impact"
                            />
                          )}
                          {ngo.beneficiary_groups?.length > 0 && (
                            <TagGroup
                              label="Beneficiary Groups"
                              values={ngo.beneficiary_groups}
                              tone="beneficiary"
                            />
                          )}
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  {(operatingAreas.length > 0 || hasCoordinates) && (
                    <SectionCard className="p-5 relative flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#10214e]">
                          Where We Work
                        </h2>
                      </div>
                      <div className="mt-5 grid gap-6 sm:grid-cols-[1.3fr_1fr] items-center flex-1">
                        {hasCoordinates ? (
                          <div className="h-[240px] w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                            <NGOMap
                              ngos={[ngo]}
                              center={[ngo.latitude, ngo.longitude]}
                              zoom={5}
                            />
                          </div>
                        ) : (
                          <div className="flex h-[240px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 text-blue-300">
                            <MapPin className="h-8 w-8" />
                          </div>
                        )}
                        <ul className="grid content-center gap-3.5">
                          {operatingAreas.slice(0, 5).map((area) => (
                            <li
                              key={area.label}
                              className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-600"
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span className="truncate">{area.label}</span>
                              </span>
                              {area.programsCount != null && (
                                <span className="shrink-0 text-slate-500">
                                  {area.programsCount} Programs
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link
                        href="#map"
                        className="absolute bottom-5 right-5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View All Locations
                      </Link>
                    </SectionCard>
                  )}
                </div>

                {programs.length > 0 && (
                  <SectionCard id="programs" className="p-3 xl:col-span-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#10214e]">
                        Programs &amp; Initiatives
                      </h2>
                      <Link
                        href={`/ngos/${ngo.id}/programs`}
                        className="text-sm font-semibold text-blue-600"
                      >
                        View All Programs
                      </Link>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {programs.map((program) => {
                        const image = assetUrl(program.image_path);
                        return (
                          <article
                            key={program.id}
                            className="overflow-hidden rounded-md border border-slate-200 bg-white"
                          >
                            <div className="relative h-16 bg-slate-100">
                              {image ? (
                                <img
                                  src={image}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <ImageIcon className="h-5 w-5 text-slate-300" />
                                </div>
                              )}
                            </div>
                            <div className="p-2">
                              <h3 className="line-clamp-1 text-sm font-bold text-[#10214e]">
                                {program.title}
                              </h3>
                              {program.summary && (
                                <p className="mt-1 line-clamp-2 text-xs leading-[1.45] text-slate-500">
                                  {program.summary}
                                </p>
                              )}
                              <div className="mt-2 flex gap-3 text-xs text-slate-500">
                                {program.beneficiaries_reached != null && (
                                  <span>
                                    <strong className="block text-sm text-slate-800">
                                      {formatNumber(
                                        program.beneficiaries_reached,
                                      )}
                                    </strong>
                                    Beneficiaries
                                  </span>
                                )}
                                {program.volunteers_needed != null && (
                                  <span>
                                    <strong className="block text-sm text-slate-800">
                                      {formatNumber(program.volunteers_needed)}
                                    </strong>
                                    Volunteers
                                  </span>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}

                {updates.length > 0 && (
                  <SectionCard id="updates" className="p-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#10214e]">
                        Latest Updates &amp; Stories
                      </h2>
                      <Link
                        href={`/ngos/${ngo.id}/updates`}
                        className="text-sm font-semibold text-blue-600"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="relative mt-3 space-y-2.5 border-l border-slate-200 pl-4">
                      {updates.map((update) => (
                        <article key={update.id} className="relative">
                          <span className="absolute -left-[18px] top-1 h-1.5 w-1.5 rounded-full border border-blue-500 bg-white" />
                          <time className="text-xs text-slate-400">
                            {formatDate(
                              update.published_at ?? update.created_at,
                            )}
                          </time>
                          <h3 className="line-clamp-1 text-sm font-medium text-slate-700">
                            {update.title}
                          </h3>
                        </article>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {galleryImages.length > 0 && (
                  <SectionCard id="media" className="p-3 xl:col-span-2">
                    <h2 className="text-base font-bold text-[#10214e]">
                      Media Gallery
                    </h2>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {galleryImages.map((image) => (
                        <img
                          key={image.id}
                          src={assetUrl(image.image_path) ?? ""}
                          alt={image.alt_text ?? image.caption ?? ""}
                          className="h-20 w-full rounded-md object-cover"
                        />
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-3 border-l border-slate-200 bg-white p-3 xl:p-4">
            {hasSupport && (
              <SectionCard className="p-4">
                <h2 className="text-base font-bold text-[#10214e]">
                  Support This NGO
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your support helps create real change.
                </p>
                <div className="mt-3 space-y-2">
                  {ngo.accepts_donations && (
                    <DonateButton
                      ngoId={ngo.id}
                      ngoName={displayName}
                      isAuthenticated={Boolean(user)}
                      text="Donate Now"
                      className="flex h-8 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
                    />
                  )}
                  {ngo.accepts_volunteers && (
                    <Link
                      href="/volunteer/opportunities"
                      className="flex h-8 w-full items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      <Users className="h-3.5 w-3.5" /> Volunteer With Us
                    </Link>
                  )}
                  <Link
                    href="/csr-campaigns"
                    className="flex h-8 w-full items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Building2 className="h-3.5 w-3.5" /> Partner Through CSR
                  </Link>
                </div>
              </SectionCard>
            )}

            <SectionCard className="p-5">
              <h2 className="text-base font-bold text-[#10214e] mb-5">
                Organization Snapshot
              </h2>
              <dl className="space-y-3.5 text-sm">
                {organizationType && (
                  <SnapshotRow
                    label="Organization Type"
                    value={organizationType}
                    icon={Building2}
                  />
                )}
                {ngo.founding_year && (
                  <SnapshotRow
                    label="Founded"
                    value={String(ngo.founding_year)}
                    icon={CalendarDays}
                  />
                )}
                {(ngo.city || ngo.state) && (
                  <SnapshotRow
                    label="Headquarters"
                    value={[ngo.city, ngo.state].filter(Boolean).join(", ")}
                    icon={MapPin}
                  />
                )}
                {primaryCause && (
                  <SnapshotRow
                    label="Primary Cause"
                    value={primaryCause}
                    icon={Target}
                  />
                )}
                {uniqueStates.length > 0 && (
                  <SnapshotRow
                    label="Operating States"
                    value={`${uniqueStates.length} State${uniqueStates.length === 1 ? "" : "s"}`}
                    icon={Globe2}
                  />
                )}
                {ngo.team_size != null && (
                  <SnapshotRow
                    label="Team Size"
                    value={`${formatNumber(ngo.team_size)} Full-time`}
                    icon={Users}
                  />
                )}
                {ngo.volunteers_engaged != null && (
                  <SnapshotRow
                    label="Volunteers"
                    value={`${formatNumber(ngo.volunteers_engaged)}+ Active`}
                    icon={HandHeart}
                  />
                )}
              </dl>
            </SectionCard>

            {hasContact && (
              <SectionCard className="p-5">
                <h2 className="text-base font-bold text-[#10214e] mb-5">
                  Contact Information
                </h2>
                <ul className="space-y-3.5">
                  {websiteUrl && (
                    <li className="grid grid-cols-[18px_75px_1fr] items-start gap-2.5">
                      <Globe2 className="mt-0.5 h-4 w-4 text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-500">
                        Website
                      </span>
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:underline"
                      >
                        <span className="truncate">{ngo.website_url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </li>
                  )}
                  {ngo.public_email && (
                    <li className="grid grid-cols-[18px_75px_1fr] items-start gap-2.5">
                      <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-500">
                        Email
                      </span>
                      <a
                        href={`mailto:${ngo.public_email}`}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:underline"
                      >
                        <span className="truncate">{ngo.public_email}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </li>
                  )}
                  {ngo.public_phone && (
                    <li className="grid grid-cols-[18px_75px_1fr] items-start gap-2.5">
                      <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-500">
                        Phone
                      </span>
                      <a
                        href={`tel:${ngo.public_phone}`}
                        className="text-[13px] font-semibold text-slate-700 hover:text-blue-600"
                      >
                        {ngo.public_phone}
                      </a>
                    </li>
                  )}
                  {fullAddress.length > 0 && (
                    <li className="grid grid-cols-[18px_75px_1fr] items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-500">
                        Address
                      </span>
                      <span className="text-[13px] font-medium leading-[1.6] text-[#10214e]">
                        {fullAddress.join(", ")}
                      </span>
                    </li>
                  )}
                </ul>
              </SectionCard>
            )}

            {socialLinks.length > 0 && (
              <SectionCard className="p-5">
                <h2 className="text-base font-bold text-[#10214e] mb-4">
                  Social Presence
                </h2>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((link) => {
                    const lName = link.name.toLowerCase();
                    let Icon: React.ComponentType<
                      React.SVGProps<SVGSVGElement>
                    > = ExternalLink;
                    let colorClass =
                      "text-slate-600 border-slate-200 hover:bg-slate-50";
                    if (lName.includes("linkedin")) {
                      Icon = LinkedinIcon;
                      colorClass =
                        "text-[#0a66c2] border-[#0a66c2]/20 hover:bg-[#0a66c2]/5";
                    } else if (lName.includes("instagram")) {
                      Icon = InstagramIcon;
                      colorClass =
                        "text-[#e1306c] border-[#e1306c]/20 hover:bg-[#e1306c]/5";
                    } else if (lName.includes("facebook")) {
                      Icon = FacebookIcon;
                      colorClass =
                        "text-[#1877f2] border-[#1877f2]/20 hover:bg-[#1877f2]/5";
                    } else if (lName.includes("youtube")) {
                      Icon = YoutubeIcon;
                      colorClass =
                        "text-[#ff0000] border-[#ff0000]/20 hover:bg-[#ff0000]/5";
                    } else if (lName.includes("twitter") || lName === "x") {
                      Icon = TwitterIcon;
                      colorClass =
                        "text-black border-slate-300 hover:bg-slate-50";
                    }
                    return (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        title={link.name}
                        className={`flex h-11 w-14 sm:w-16 items-center justify-center rounded-xl border bg-white transition-colors ${colorClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {isVerificationComplete && (
              <SectionCard id="transparency" className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-[#10214e]">
                    Verification Center
                  </h2>
                  <Link
                    href="#transparency"
                    className="text-[13px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View Details
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-[13px] font-bold text-[#10214e]">
                  {verificationBadges.map((badge) => (
                    <span key={badge} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 fill-emerald-500 text-white" />
                      {badge}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {hasImpactDashboard && (
              <SectionCard className="p-5">
                <h2 className="text-base font-bold text-[#10214e] mb-4">
                  Impact Dashboard
                </h2>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                  {programsCount > 0 && (
                    <SidebarMetric
                      value={String(programsCount)}
                      label="Programs Active"
                    />
                  )}
                  {ngo.beneficiaries_reached != null && (
                    <SidebarMetric
                      value={`${formatNumber(ngo.beneficiaries_reached)}+`}
                      label="Communities Served"
                    />
                  )}
                  {ngo.volunteers_engaged != null && (
                    <SidebarMetric
                      value={`${formatNumber(ngo.volunteers_engaged)}+`}
                      label="Volunteers Engaged"
                    />
                  )}
                  {campaignsCount > 0 && (
                    <SidebarMetric
                      value={String(campaignsCount)}
                      label="Campaigns Run"
                    />
                  )}
                  {uniqueStates.length > 0 && (
                    <SidebarMetric
                      value={String(uniqueStates.length)}
                      label="States Reached"
                    />
                  )}
                  {yearsActive != null && (
                    <SidebarMetric
                      value={`${yearsActive}+`}
                      label="Years Active"
                    />
                  )}
                </div>
              </SectionCard>
            )}
          </aside>
        </div>

        {hasSupport && (
          <section className="mx-[3.5%] mb-3 mt-3 flex flex-col items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 px-6 py-3 sm:flex-row">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600">
              <Heart className="h-5 w-5" />
            </span>
            <div className="mr-auto">
              <h2 className="text-xl font-bold text-[#10214e]">
                Ready to support this mission?
              </h2>
              <p className="text-sm text-slate-500">
                Join supporters helping this organization create meaningful
                impact.
              </p>
            </div>
            {ngo.accepts_donations && (
              <DonateButton
                ngoId={ngo.id}
                ngoName={displayName}
                isAuthenticated={Boolean(user)}
                text="Donate Now"
                className="flex h-8 min-w-[170px] items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
              />
            )}
            {ngo.accepts_volunteers && (
              <Link
                href="/volunteer/opportunities"
                className="flex h-8 min-w-[170px] items-center justify-center gap-2 rounded-md border border-blue-300 bg-white px-5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                <Heart className="h-3.5 w-3.5" /> Volunteer
              </Link>
            )}
            <Link
              href="/csr-campaigns"
              className="flex h-8 min-w-[170px] items-center justify-center gap-2 rounded-md border border-blue-300 bg-white px-5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Building2 className="h-3.5 w-3.5" /> Partner Through CSR
            </Link>
          </section>
        )}
      </main>
    </>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <strong className="block text-2xl font-bold text-blue-600">
        {value}
      </strong>
      <span className="mt-1.5 block text-[13px] leading-[1.4] text-slate-500">
        {label}
      </span>
    </div>
  );
}

function SidebarMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-h-[85px] flex-col justify-center rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
      <strong className="block text-[22px] font-bold text-blue-600">
        {value}
      </strong>
      <span className="mt-1 block text-[11px] font-medium leading-[1.3] text-slate-500">
        {label}
      </span>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
}) {
  return (
    <div className="grid grid-cols-[18px_110px_1fr] items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 text-slate-400" />
      <dt className="text-[13px] font-medium text-slate-500">{label}</dt>
      <dd className="text-[13px] font-bold text-[#10214e] break-words">
        {value}
      </dd>
    </div>
  );
}

function getTagConfig(value: string, tone: "impact" | "beneficiary") {
  const v = value.toLowerCase();
  if (tone === "impact") {
    if (v.includes("rural") || v.includes("village"))
      return {
        Icon: Home,
        classes: "bg-orange-50 text-orange-700",
        iconClasses: "text-orange-500",
      };
    if (v.includes("women") || v.includes("girl"))
      return {
        Icon: Heart,
        classes: "bg-pink-50 text-pink-700",
        iconClasses: "text-pink-500",
      };
    if (v.includes("skill") || v.includes("employ") || v.includes("livelihood"))
      return {
        Icon: Lightbulb,
        classes: "bg-amber-50 text-amber-700",
        iconClasses: "text-amber-500",
      };
    if (v.includes("digital") || v.includes("tech"))
      return {
        Icon: Laptop,
        classes: "bg-indigo-50 text-indigo-700",
        iconClasses: "text-indigo-500",
      };
    if (v.includes("child") || v.includes("education") || v.includes("school"))
      return {
        Icon: BookOpen,
        classes: "bg-emerald-50 text-emerald-700",
        iconClasses: "text-emerald-500",
      };
    if (v.includes("environ") || v.includes("nature") || v.includes("climate"))
      return {
        Icon: Leaf,
        classes: "bg-green-50 text-green-700",
        iconClasses: "text-green-500",
      };
    if (v.includes("health") || v.includes("med"))
      return {
        Icon: Activity,
        classes: "bg-rose-50 text-rose-700",
        iconClasses: "text-rose-500",
      };
    return {
      Icon: Target,
      classes: "bg-blue-50 text-blue-700",
      iconClasses: "text-blue-500",
    };
  } else {
    if (v.includes("child") || v.includes("infant"))
      return {
        Icon: Baby,
        classes: "bg-blue-50 text-blue-700",
        iconClasses: "text-blue-500",
      };
    if (v.includes("women") || v.includes("girl") || v.includes("mother"))
      return {
        Icon: User,
        classes: "bg-pink-50 text-pink-700",
        iconClasses: "text-pink-500",
      };
    if (v.includes("student") || v.includes("youth") || v.includes("teen"))
      return {
        Icon: Users,
        classes: "bg-indigo-50 text-indigo-700",
        iconClasses: "text-indigo-500",
      };
    if (v.includes("rural") || v.includes("communit"))
      return {
        Icon: Home,
        classes: "bg-slate-100 text-slate-700",
        iconClasses: "text-slate-500",
      };
    if (v.includes("disab") || v.includes("handicap") || v.includes("special"))
      return {
        Icon: Accessibility,
        classes: "bg-orange-50 text-orange-700",
        iconClasses: "text-orange-500",
      };
    return {
      Icon: Users,
      classes: "bg-slate-50 text-slate-700",
      iconClasses: "text-slate-500",
    };
  }
}

function TagGroup({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: "impact" | "beneficiary";
}) {
  return (
    <div>
      <p className="text-[13px] font-bold text-[#10214e] mb-3">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {values.map((value) => {
          const { Icon, classes, iconClasses } = getTagConfig(value, tone);
          return (
            <span
              key={value}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${classes}`}
            >
              <Icon className={`h-[14px] w-[14px] ${iconClasses}`} />
              {humanize(value)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
