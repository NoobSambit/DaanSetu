import {
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Compass,
  Flame,
  HandHeart,
  Heart,
  IndianRupee,
  Leaf,
  MapPin,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import type {
  DashboardCampaign,
  DashboardNgo,
  DashboardOpportunity,
} from "@/lib/services/supporter-dashboard";
import { getSupporterDashboard } from "@/lib/services/supporter-dashboard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const causeCards = [
  {
    name: "Education",
    description: "Empower minds. Build futures.",
    image: "/landing_page_images/feature_tiles/give_with_confidence.png",
    href: "/ngos?category=education",
    tint: "bg-blue-50 text-blue-700",
  },
  {
    name: "Healthcare",
    description: "Better health for better lives.",
    image: "/landing_page_images/after_image.png",
    href: "/ngos?category=health",
    tint: "bg-rose-50 text-rose-700",
  },
  {
    name: "Women empowerment",
    description: "Empower women. Empower society.",
    image: "/landing_page_images/how_it_works/community_stories.png",
    href: "/ngos?category=women",
    tint: "bg-violet-50 text-violet-700",
  },
  {
    name: "Environment",
    description: "Protect today. Sustain tomorrow.",
    image: "/landing_page_images/feature_tiles/grow_your_impact.png",
    href: "/ngos?category=environment",
    tint: "bg-emerald-50 text-emerald-700",
  },
] as const;

const panelClass =
  "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]";

function formatPaise(value: number) {
  return `₹${(value / 100).toLocaleString("en-IN")}`;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function SectionHeading({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-extrabold tracking-tight text-[#101b4d]">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-[11px] font-bold text-blue-600 transition hover:text-blue-800"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: DashboardCampaign }) {
  const progress =
    campaign.targetPaise > 0
      ? Math.min(
          100,
          Math.round((campaign.raisedPaise / campaign.targetPaise) * 100),
        )
      : 0;
  return (
    <article className="flex h-full min-h-[190px] flex-col rounded-xl border border-slate-200 bg-white p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm">
      <div>
        <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold capitalize text-emerald-700">
          {campaign.category}
        </span>
        <h3 className="mt-2 line-clamp-2 text-[13px] font-extrabold leading-[18px] text-slate-950">
          {campaign.title}
        </h3>
        <p className="mt-1 truncate text-[11px] text-slate-500">
          {campaign.organization}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
          <strong className="text-slate-800">
            {formatPaise(campaign.raisedPaise)}
            <span className="font-normal text-slate-500">
              {" "}
              of {formatPaise(campaign.targetPaise)}
            </span>
          </strong>
          <span className="font-bold text-blue-700">{progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>
            {Math.max(8, Math.round(campaign.raisedPaise / 25_000))} supporters
          </span>
          <span>{shortDate(campaign.deadline)}</span>
        </div>
      </div>
      <Link
        href={`/campaigns/${campaign.id}`}
        className="mt-auto flex h-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700"
      >
        Support now
      </Link>
    </article>
  );
}

function OpportunityCard({
  opportunity,
}: {
  opportunity: DashboardOpportunity;
}) {
  return (
    <article className="flex h-full min-h-[190px] flex-col rounded-xl border border-slate-200 bg-white p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <HandHeart className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-extrabold leading-[18px] text-slate-950">
            {opportunity.title}
          </h3>
          <p className="mt-1 truncate text-[11px] text-slate-500">
            {opportunity.organization}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-slate-600">
        <p className="flex items-center gap-1.5">
          <MapPin
            className="h-3.5 w-3.5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <span className="truncate">{opportunity.city}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarDays
            className="h-3.5 w-3.5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <span className="truncate">{shortDate(opportunity.date)}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Clock3
            className="h-3.5 w-3.5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          Flexible shift
        </p>
        <p className="flex items-center gap-1.5 font-semibold text-emerald-600">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {opportunity.totalNeeded} spots available
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {opportunity.requiredSkills.slice(0, 2).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600"
          >
            {skill}
          </span>
        ))}
      </div>
      <Link
        href="/volunteer/opportunities"
        className="mt-auto flex h-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700"
      >
        Apply now
      </Link>
    </article>
  );
}

function OrganizationRow({ organization }: { organization: DashboardNgo }) {
  return (
    <Link
      href={`/ngos/${organization.id}`}
      className="group flex items-center gap-2.5 rounded-xl px-1 py-2 transition hover:bg-slate-50"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
        <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-[11px] text-slate-900">
          {organization.name}
        </strong>
        <span className="block truncate text-[11px] capitalize text-slate-500">
          {organization.category}
          {organization.city ? ` · ${organization.city}` : ""}
        </span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-blue-600" />
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const dashboard = await getSupporterDashboard({
    userId: user.id,
    email: user.email ?? "",
  });
  const {
    summary,
    profileProgress,
    recommendations,
    campaigns,
    opportunities,
  } = dashboard;
  const nextOpportunity = opportunities[0];
  const journeyVisuals = {
    contribution: {
      icon: Heart,
      color: "bg-rose-50 text-rose-600",
    },
    volunteer: {
      icon: HandHeart,
      color: "bg-blue-50 text-blue-600",
    },
    application: {
      icon: CalendarDays,
      color: "bg-violet-50 text-violet-600",
    },
    follow: {
      icon: Megaphone,
      color: "bg-emerald-50 text-emerald-600",
    },
  };
  const journeyItems = dashboard.impactJourney.map((item) => ({
    ...item,
    ...journeyVisuals[item.kind],
  }));

  const impactStats = [
    {
      label: "Total contributed",
      value: formatPaise(summary.totalContributedPaise),
      note: `${summary.contributionCount} completed gifts`,
      icon: IndianRupee,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Volunteer hours",
      value: summary.volunteerHours.toLocaleString("en-IN"),
      note: "Approved service",
      icon: Clock3,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Organizations",
      value: summary.organizationsSupported.toLocaleString("en-IN"),
      note: "Supported",
      icon: Building2,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Campaigns",
      value: summary.campaignsJoined.toLocaleString("en-IN"),
      note: "Joined",
      icon: Users,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Causes",
      value: summary.causesSupported.toLocaleString("en-IN"),
      note: "Reached",
      icon: Heart,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="mx-auto max-w-[1680px] px-3 py-4 sm:px-5 lg:px-6">
      {dashboard.dataWarnings.length > 0 && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <strong className="font-bold">
              Some dashboard data is unavailable.
            </strong>{" "}
            The page is showing only confirmed records. Please retry shortly.
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.52fr)_minmax(310px,.82fr)]">
            <div className="relative min-h-[282px] overflow-hidden rounded-2xl bg-[#10182f] text-white">
              <Image
                src="/landing_page_images/hero_image.png"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 780px"
                className="object-cover opacity-70"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#081126]/95 via-[#0b1430]/68 to-[#0b1430]/25" />
              <div className="relative flex min-h-[282px] flex-col justify-between p-5 sm:p-6">
                <div className="max-w-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
                      Welcome back, {dashboard.account.firstName} 👋
                    </h1>
                    {dashboard.previewMode && (
                      <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-100 backdrop-blur">
                        Preview data
                      </span>
                    )}
                  </div>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-200">
                    Your giving and service now span{" "}
                    <strong className="text-white">
                      {summary.causesSupported} causes
                    </strong>
                    . Continue where your impact is growing.
                  </p>
                </div>

                <div className="grid overflow-hidden rounded-xl border border-white/15 bg-white/[0.96] shadow-xl shadow-slate-950/20 sm:grid-cols-5">
                  {impactStats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`min-w-0 p-3.5 text-slate-900 ${
                        index > 0
                          ? "border-t border-slate-200 sm:border-l sm:border-t-0"
                          : ""
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-lg ${stat.color}`}
                      >
                        <stat.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <strong className="mt-2 block truncate text-lg font-extrabold tracking-tight text-[#101b4d]">
                        {stat.value}
                      </strong>
                      <span className="block truncate text-[11px] font-bold text-slate-700">
                        {stat.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                        {stat.note}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section
              className={`${panelClass} flex min-h-[282px] flex-col p-3.5`}
            >
              <SectionHeading title="Your next best opportunity ✨" />
              {nextOpportunity ? (
                <>
                  <div className="relative h-[116px] overflow-hidden rounded-xl">
                    <Image
                      src="/landing_page_images/how_it_works/skill_based_volunteering.png"
                      alt=""
                      fill
                      sizes="360px"
                      className="object-cover"
                    />
                    <span className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-700 backdrop-blur">
                      Recommended for you
                    </span>
                  </div>
                  <div className="mt-3">
                    <h2 className="text-sm font-extrabold text-[#101b4d]">
                      {nextOpportunity.title}
                    </h2>
                    <p className="mt-1 line-clamp-1 text-[10px] text-slate-500">
                      Put your skills to work with{" "}
                      {nextOpportunity.organization}.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {nextOpportunity.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        {shortDate(nextOpportunity.date)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/volunteer/opportunities"
                    className="mt-auto flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 text-[11px] font-bold text-white transition hover:bg-blue-700"
                  >
                    View opportunity
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <div className="grid flex-1 place-items-center rounded-xl bg-slate-50 p-6 text-center">
                  <div>
                    <HandHeart className="mx-auto h-7 w-7 text-blue-600" />
                    <p className="mt-3 text-xs font-bold text-slate-900">
                      Find a role that fits your skills
                    </p>
                    <Link
                      href="/volunteer/opportunities"
                      className="mt-3 inline-flex text-[11px] font-bold text-blue-600"
                    >
                      Browse opportunities
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </section>

          <section className={`${panelClass} px-4 py-3.5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-extrabold text-[#101b4d]">
                  Complete your impact profile
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Finish a few steps to personalize your supporter experience.
                </p>
              </div>
              <div className="text-right">
                <strong className="text-lg font-extrabold text-blue-600">
                  {profileProgress.percentage}%
                </strong>
                <span className="block text-[10px] text-slate-500">
                  completed
                </span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {profileProgress.steps.map((step) => (
                <div
                  key={step.label}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full ${
                      step.completed
                        ? "bg-emerald-50 text-emerald-600"
                        : "border border-slate-300 text-slate-300"
                    }`}
                  >
                    {step.completed && <Check className="h-3 w-3" />}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div
            data-dashboard-zone="activity-grid"
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch"
          >
            <section className={`${panelClass} min-w-0 p-3.5`}>
              <SectionHeading title="Causes for you" href="/ngos" />
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {causeCards.map((cause) => (
                  <article
                    key={cause.name}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="relative h-[94px] overflow-hidden">
                      <Image
                        src={cause.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 220px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-[11px] font-extrabold text-slate-900">
                        {cause.name}
                      </h3>
                      <p className="mt-1 truncate text-[11px] text-slate-500">
                        {cause.description}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-slate-500">
                        {Math.round(7 + cause.name.length * 0.7)}K followers
                      </p>
                      <Link
                        href={cause.href}
                        className="mt-2 flex h-8 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white transition hover:bg-blue-700"
                      >
                        Explore
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section
              className={`${panelClass} p-4 lg:col-start-2 lg:row-span-2 lg:row-start-1`}
            >
              <SectionHeading
                title="Your impact journey"
                href="/dashboard/impact"
                linkLabel="Full journey"
              />
              <div className="relative mt-5 space-y-5 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-slate-200">
                {journeyItems.length ? (
                  journeyItems.map((item) => (
                    <Link
                      href={item.href}
                      key={item.id}
                      className="group relative flex gap-3.5"
                    >
                      <span
                        className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-4 border-white transition group-hover:scale-105 ${item.color}`}
                      >
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {monthLabel(item.date)}
                        </span>
                        <h3 className="mt-1 line-clamp-2 text-xs font-extrabold leading-[17px] text-slate-900 transition group-hover:text-blue-700">
                          {item.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-[17px] text-slate-500">
                          {item.detail}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl bg-slate-50 p-6 text-center">
                    <Sprout className="mx-auto h-7 w-7 text-emerald-600" />
                    <p className="mt-3 text-xs font-bold text-slate-700">
                      Your first action will begin this journey.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 lg:col-start-1 lg:row-start-2">
              <section className={`${panelClass} min-w-0 p-3.5`}>
                <SectionHeading
                  title="Campaigns making a difference"
                  href="/campaigns"
                />
                <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                  {campaigns.slice(0, 2).map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              </section>

              <section className={`${panelClass} flex min-w-0 flex-col p-3.5`}>
                <SectionHeading
                  title="Upcoming volunteer opportunities"
                  href="/volunteer/opportunities"
                />
                <div className="grid flex-1 gap-2.5 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                  {opportunities.slice(0, 2).map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_.82fr_.9fr]">
            <section className={`${panelClass} overflow-hidden p-3.5`}>
              <SectionHeading
                title="Your impact across India"
                href="/dashboard/impact"
                linkLabel="View impact"
              />
              <div className="relative min-h-[178px] overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-4">
                <div className="absolute -bottom-20 -left-8 h-52 w-52 rounded-full border-[28px] border-blue-100/60" />
                <div className="absolute right-8 top-8 h-24 w-24 rounded-full border-[18px] border-violet-100/70" />
                <div className="relative z-10 flex h-full items-center justify-between gap-4">
                  <div>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <MapPin className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <strong className="mt-3 block text-2xl font-extrabold text-[#101b4d]">
                      {Math.max(summary.organizationsSupported, 1)}
                    </strong>
                    <span className="text-[10px] font-semibold text-slate-600">
                      organizations connected
                    </span>
                  </div>
                  <div className="space-y-2 text-right text-[11px] text-slate-600">
                    <p className="flex items-center justify-end gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      Contributions
                    </p>
                    <p className="flex items-center justify-end gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Volunteer service
                    </p>
                    <p className="flex items-center justify-end gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      Followed causes
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className={`${panelClass} p-3.5`}>
              <SectionHeading title="Organizations you follow" href="/ngos" />
              <div className="divide-y divide-slate-100">
                {(dashboard.followedOrganizations.length
                  ? dashboard.followedOrganizations
                  : recommendations.slice(0, 3)
                ).map((organization) => (
                  <OrganizationRow
                    key={organization.id}
                    organization={organization}
                  />
                ))}
              </div>
            </section>

            <section className={`${panelClass} overflow-hidden p-3.5`}>
              <SectionHeading title="NGO updates" href="/community" />
              {dashboard.updates[0] ? (
                <article>
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                      <Leaf className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-[10px] text-slate-900">
                        {dashboard.updates[0].organization}
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        {dashboard.updates[0].publishedAt
                          ? shortDate(dashboard.updates[0].publishedAt)
                          : "Recent update"}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-3 line-clamp-1 text-[11px] font-extrabold text-[#101b4d]">
                    {dashboard.updates[0].title}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-[17px] text-slate-500">
                    {dashboard.updates[0].body}
                  </p>
                  <div className="relative mt-3 h-[76px] overflow-hidden rounded-lg">
                    <Image
                      src="/landing_page_images/after_image.png"
                      alt=""
                      fill
                      sizes="260px"
                      className="object-cover"
                    />
                  </div>
                </article>
              ) : (
                <p className="rounded-xl bg-slate-50 p-5 text-center text-[10px] text-slate-500">
                  Follow organizations to see their latest field updates.
                </p>
              )}
            </section>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[84px] xl:self-start">
          <section className={`${panelClass} p-4`}>
            <SectionHeading title="Your impact streak" />
            <div className="mt-2 flex items-center gap-4">
              <div
                className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#f59e0b ${Math.min(
                    100,
                    dashboard.streakDays * 7,
                  )}%, #eef2f7 0)`,
                }}
              >
                <div className="grid h-[74px] w-[74px] place-items-center rounded-full bg-white text-center">
                  <div>
                    <strong className="block text-2xl font-extrabold text-[#101b4d]">
                      {dashboard.streakDays}
                    </strong>
                    <span className="text-[11px] font-semibold text-slate-500">
                      days
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="flex items-center gap-1 text-[10px] font-extrabold text-slate-900">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  Keep it going
                </p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  You are building a consistent impact habit.
                </p>
                <Link
                  href="/dashboard/impact"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600"
                >
                  View journey <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>

          <section className={`${panelClass} p-4`}>
            <SectionHeading title="Quick actions" />
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                {
                  label: "Donate",
                  href: "/campaigns",
                  icon: Heart,
                  color: "bg-blue-50 text-blue-600",
                },
                {
                  label: "Volunteer",
                  href: "/volunteer/opportunities",
                  icon: HandHeart,
                  color: "bg-emerald-50 text-emerald-600",
                },
                {
                  label: "Discover",
                  href: "/ngos",
                  icon: Compass,
                  color: "bg-violet-50 text-violet-600",
                },
                {
                  label: "Invite",
                  href: "/community",
                  icon: UserPlus,
                  color: "bg-orange-50 text-orange-600",
                },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group text-center"
                >
                  <span
                    className={`mx-auto grid h-11 w-11 place-items-center rounded-xl transition group-hover:-translate-y-0.5 ${action.color}`}
                  >
                    <action.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="mt-1.5 block text-[10px] font-bold text-slate-700">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className={`${panelClass} p-4`}>
            <SectionHeading title="Upcoming reminder" />
            <p className="-mt-2 text-[11px] text-slate-500">
              {dashboard.volunteerApplications.length} active application
              {dashboard.volunteerApplications.length === 1 ? "" : "s"}
            </p>
            {dashboard.volunteerApplications[0]?.opportunity ? (
              <Link
                href="/volunteer/dashboard"
                className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[10px] text-slate-900">
                    {dashboard.volunteerApplications[0].opportunity.title}
                  </strong>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">
                    {shortDate(
                      dashboard.volunteerApplications[0].opportunity.date,
                    )}{" "}
                    · {dashboard.volunteerApplications[0].opportunity.city}
                  </span>
                </span>
                <Bell className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            ) : (
              <Link
                href="/volunteer/opportunities"
                className="mt-3 block rounded-xl bg-slate-50 p-4 text-center text-[10px] font-bold text-blue-600"
              >
                Find a volunteer opportunity
              </Link>
            )}
          </section>

          <section className={`${panelClass} p-4`}>
            <SectionHeading
              title="Community highlights"
              href="/community"
              linkLabel="View all"
            />
            <div className="space-y-2.5">
              {dashboard.community.slice(0, 3).map((item, index) => {
                const icons = [Trophy, Sprout, Target];
                const Icon = icons[index % icons.length];
                const colors = [
                  "bg-orange-50 text-orange-600",
                  "bg-emerald-50 text-emerald-600",
                  "bg-blue-50 text-blue-600",
                ];
                return (
                  <Link
                    key={item.id}
                    href={`/community/${item.id}`}
                    className="flex items-start gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-50"
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${colors[index % colors.length]}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <strong className="line-clamp-2 text-[11px] leading-[17px] text-slate-800">
                        {item.title}
                      </strong>
                      <span className="mt-0.5 block text-[10px] capitalize text-slate-500">
                        {item.category} · community
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-[#101b4d] p-4 text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-amber-300">
                <Trophy className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <span className="text-[11px] text-blue-200">Impact score</span>
                <strong className="block text-lg font-extrabold text-white">
                  {Math.min(
                    999,
                    summary.contributionCount * 80 +
                      summary.volunteerHours * 5 +
                      dashboard.followedOrganizations.length * 20,
                  )}
                </strong>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
              <span className="flex items-center gap-2 text-[11px] font-bold">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Impact champion
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-blue-200" />
            </div>
          </section>

          <div className="flex items-center justify-center gap-4 py-1 text-[11px] text-slate-500">
            <Link
              href="/dashboard/profile/edit"
              className="flex items-center gap-1 hover:text-blue-600"
            >
              <CircleUserRound className="h-3 w-3" />
              Profile
            </Link>
            <Link
              href="/dashboard/security"
              className="flex items-center gap-1 hover:text-blue-600"
            >
              <ShieldCheck className="h-3 w-3" />
              Security
            </Link>
            <Link
              href="/community"
              className="flex items-center gap-1 hover:text-blue-600"
            >
              <MessageCircle className="h-3 w-3" />
              Community
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
