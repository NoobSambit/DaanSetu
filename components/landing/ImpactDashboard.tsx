"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  HandCoins,
  HeartPulse,
  MapPin,
  ReceiptIndianRupee,
} from "lucide-react";
import Link from "next/link";

import type { LandingData } from "@/lib/landing/repository";

const causeLabels: Record<string, string> = {
  education: "Education",
  healthcare: "Healthcare",
  hunger: "Food security",
  disaster: "Disaster relief",
  general: "Other verified causes",
};

const causeColors = [
  "bg-blue-600",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-teal-500",
];

function formatMoney(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default function ImpactDashboard({
  metrics,
  causeAmounts,
}: Pick<LandingData, "metrics" | "causeAmounts">) {
  const stats = [
    {
      label: "Captured Funds",
      value: formatMoney(metrics.fundsRaisedPaise),
      icon: HandCoins,
      color: "text-[#2563eb]",
    },
    {
      label: "Approved Hours",
      value: formatCount(metrics.volunteerHours),
      icon: HeartPulse,
      color: "text-[#16a34a]",
    },
    {
      label: "Captured Gifts",
      value: formatCount(metrics.capturedDonations),
      icon: ReceiptIndianRupee,
      color: "text-[#ea580c]",
    },
    {
      label: "Active Campaigns",
      value: formatCount(metrics.activeCampaigns),
      icon: BadgeCheck,
      color: "text-[#9333ea]",
    },
    {
      label: "States Reached",
      value: formatCount(metrics.statesReached),
      icon: MapPin,
      color: "text-[#0d9488]",
    },
  ];
  const hasImpact =
    metrics.fundsRaisedPaise > 0 ||
    metrics.volunteerHours > 0 ||
    metrics.capturedDonations > 0;

  return (
    <section className="section bg-white pb-16 pt-10">
      <div className="container-custom">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[#f8fafc] p-8 md:p-12">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="z-10 lg:col-span-3"
            >
              <h2 className="mb-5 font-serif text-3xl font-bold leading-[1.2] text-[#1e3a8a] md:text-[34px]">
                Track. Measure.
                <br />
                Multiply Impact.
              </h2>
              <p className="mb-8 text-[15px] leading-relaxed text-slate-600">
                These totals come from captured, non-demo donations and approved
                volunteer records.
              </p>
              <Link
                href="/analytics"
                className="flex w-fit items-center gap-2 rounded-[8px] border border-blue-200 bg-white px-6 py-2.5 text-[13px] font-bold text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
              >
                View Full Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative z-10 min-w-0 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] lg:col-span-9"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-[#1e3a8a]">
                  DaanSetu Impact Dashboard
                </h3>
                <span className="rounded-[6px] border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Platform tracked
                </span>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-md"
                  >
                    <stat.icon
                      className={`h-6 w-6 shrink-0 ${stat.color}`}
                      strokeWidth={1.5}
                    />
                    <div className="min-w-0">
                      <p
                        className={`truncate text-[13px] font-bold leading-tight md:text-[14px] ${stat.color}`}
                      >
                        {stat.value}
                      </p>
                      <p className="mt-0.5 text-[9px] font-semibold leading-tight text-slate-500 md:text-[10px]">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {hasImpact ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h4 className="text-[11px] font-bold text-slate-700">
                      Captured funds by cause
                    </h4>
                    <div className="mt-4 space-y-3">
                      {causeAmounts.map((cause, index) => (
                        <div key={cause.cause}>
                          <div className="mb-1 flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-slate-600">
                              {causeLabels[cause.cause] ?? cause.cause}
                            </span>
                            <span className="font-bold text-slate-800">
                              {cause.percentage}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${causeColors[index % causeColors.length]}`}
                              style={{ width: `${cause.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-blue-50/50 p-5 shadow-sm">
                    <h4 className="text-[11px] font-bold text-slate-700">
                      Reporting boundary
                    </h4>
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">
                      Demo payments and NGO-reported beneficiary figures are
                      excluded from these platform totals. Organization-reported
                      impact remains labelled on each NGO profile.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <p className="font-semibold text-slate-700">
                    No platform-tracked impact yet.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Verified captures and approved volunteer hours will appear
                    here automatically.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
