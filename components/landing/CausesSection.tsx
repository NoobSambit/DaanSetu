"use client";

import { motion } from "framer-motion";
import {
  ChevronRight,
  Clock,
  Droplets,
  GraduationCap,
  Heart,
  PawPrint,
  Search,
  Shield,
  TreePine,
  Utensils,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

import type { LandingCampaign, LandingNgo } from "@/lib/landing/repository";

const IndiaMap = dynamic(() => import("./IndiaMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] w-full items-center justify-center rounded-[24px] bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  ),
});

const categories = [
  {
    icon: GraduationCap,
    label: "Education",
    value: "education",
    color: "text-blue-600",
  },
  { icon: Heart, label: "Healthcare", value: "health", color: "text-red-500" },
  {
    icon: Utensils,
    label: "Food security",
    value: "food",
    color: "text-amber-600",
  },
  {
    icon: Shield,
    label: "Women empowerment",
    value: "women",
    color: "text-purple-600",
  },
  {
    icon: TreePine,
    label: "Environment",
    value: "environment",
    color: "text-green-600",
  },
  {
    icon: PawPrint,
    label: "Animal welfare",
    value: "animals",
    color: "text-orange-500",
  },
  {
    icon: Droplets,
    label: "Disaster relief",
    value: "disaster",
    color: "text-cyan-600",
  },
] as const;

function money(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

export default function CausesSection({
  campaigns,
  ngos,
}: {
  campaigns: LandingCampaign[];
  ngos: LandingNgo[];
}) {
  return (
    <section className="section bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="mb-1.5 text-2xl font-bold text-heading md:text-3xl">
            Causes Across India
          </h2>
          <p className="text-sm text-body">
            Find published organizations and active campaigns by cause.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-card"
        >
          <div className="grid divide-y divide-slate-200 lg:grid-cols-[260px_1fr_320px] lg:divide-x lg:divide-y-0">
            <div className="p-6">
              <form action="/campaigns" method="get" className="relative mb-6">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  name="search"
                  placeholder="Find a cause"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-[13px] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </form>
              <nav className="space-y-1" aria-label="Cause categories">
                {categories.map((category) => (
                  <Link
                    key={category.value}
                    href={`/campaigns?category=${category.value}`}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-heading"
                  >
                    <category.icon className={`h-4 w-4 ${category.color}`} />
                    <span className="flex-1 text-left font-medium">
                      {category.label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-slate-500" />
                  </Link>
                ))}
              </nav>
            </div>

            <div className="relative flex min-h-[400px] items-center justify-center bg-slate-50 p-6">
              <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-inner">
                <IndiaMap ngos={ngos} />
              </div>
            </div>

            <div className="flex flex-col p-6">
              <h3 className="mb-1 text-[15px] font-bold text-heading">
                Active campaigns
              </h3>
              <p className="mb-5 text-[11px] text-body">
                Verified captures update these totals.
              </p>

              <div className="flex-1 space-y-4">
                {campaigns.slice(0, 3).map((campaign, index) => {
                  const progress = Math.min(
                    100,
                    Math.round(
                      (campaign.raisedPaise / campaign.targetPaise) * 100,
                    ),
                  );
                  const deadline = new Intl.DateTimeFormat("en-IN", {
                    day: "numeric",
                    month: "short",
                  }).format(new Date(campaign.deadline));
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="block rounded-[16px] border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="mb-2.5 flex items-center justify-between">
                          <span className="rounded-md bg-blue-100 px-2 py-1 text-[10px] font-bold capitalize text-blue-700">
                            {campaign.category}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                            <Clock className="h-3 w-3" /> Ends {deadline}
                          </span>
                        </div>
                        <h4 className="mb-1 text-[13px] font-bold text-heading">
                          {campaign.title}
                        </h4>
                        <p className="mb-3 text-[11px] text-slate-500">
                          {campaign.ngoName}
                        </p>
                        <div className="mb-2 h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-[#2563eb]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-[#1e293b]">
                            {money(campaign.raisedPaise)}{" "}
                            <span className="font-normal text-slate-500">
                              raised
                            </span>
                          </span>
                          <span className="font-medium text-slate-600">
                            {progress}%
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
                {campaigns.length === 0 && (
                  <div className="rounded-[16px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No active campaigns are published yet.
                    </p>
                  </div>
                )}
              </div>

              <Link
                href="/campaigns"
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-transparent py-2.5 text-[13px] font-bold text-[#2563eb] transition-colors hover:border-blue-100 hover:bg-blue-50"
              >
                View more causes <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
