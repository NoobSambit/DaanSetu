"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LineChart,
  Lock,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";

import type {
  LandingCampaign,
  LandingNgo,
  LandingReview,
} from "@/lib/landing/repository";

const trustBadges = [
  {
    icon: ShieldCheck,
    label: "Verified NGO\nProfiles",
    color: "text-blue-600",
    border: "border-blue-200",
  },
  {
    icon: Lock,
    label: "Secure Donation\nProcessing",
    color: "text-green-600",
    border: "border-green-200",
  },
  {
    icon: Star,
    label: "Eligible Donor\nReviews",
    color: "text-amber-500",
    border: "border-amber-200",
  },
  {
    icon: BarChart3,
    label: "Transparent Campaign\nProgress",
    color: "text-blue-600",
    border: "border-blue-200",
  },
  {
    icon: ReceiptText,
    label: "Official Tax\nDocuments",
    color: "text-purple-500",
    border: "border-purple-200",
  },
  {
    icon: LineChart,
    label: "Tracked Impact\nReports",
    color: "text-teal-600",
    border: "border-teal-200",
  },
] as const;

function publicNgoAsset(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return path && base
    ? `${base}/storage/v1/object/public/ngos/${path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`
    : null;
}

function money(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

export default function TrustSection({
  ngo,
  campaign,
  review,
}: {
  ngo: LandingNgo | null;
  campaign: LandingCampaign | null;
  review: LandingReview | null;
}) {
  const progress = campaign
    ? Math.min(
        100,
        Math.round((campaign.raisedPaise / campaign.targetPaise) * 100),
      )
    : 0;
  const coverImage = ngo ? publicNgoAsset(ngo.coverImagePath) : null;

  return (
    <section className="section bg-white">
      <div className="container-custom">
        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 text-center lg:text-left"
            >
              <h2 className="mb-2 font-serif text-2xl font-bold text-[#1e3a8a] md:text-[28px]">
                Trust & Transparency You Can Rely On
              </h2>
              <p className="text-[15px] text-slate-500">
                Verification, capture records, moderation, and reporting remain
                auditable.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10 grid grid-cols-3 gap-x-2 gap-y-8"
            >
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <div
                    className={`flex h-[56px] w-[56px] items-center justify-center rounded-full border bg-white shadow-sm ${badge.border}`}
                  >
                    <badge.icon
                      className={`h-[24px] w-[24px] ${badge.color}`}
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="whitespace-pre-line text-[11px] font-bold leading-[1.3] text-[#1e3a8a]">
                    {badge.label}
                  </span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative mt-auto overflow-hidden rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              {review ? (
                <>
                  <div
                    className="flex gap-1 text-amber-400"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${index < review.rating ? "fill-current" : "text-slate-200"}`}
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-[14px] leading-[1.6] text-slate-600">
                    &ldquo;{review.text}&rdquo;
                  </blockquote>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Eligible service or donation review
                  </p>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-700">
                    No eligible reviews are available yet.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    DaanSetu does not substitute fabricated testimonials.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex h-full flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm"
          >
            {ngo ? (
              <>
                <div className="relative flex h-[180px] w-full shrink-0 items-center bg-slate-100">
                  <div className="absolute inset-y-0 right-0 flex w-[60%] items-center justify-center overflow-hidden bg-slate-200">
                    {coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        No cover image published
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 w-[75%] bg-gradient-to-r from-white via-white/95 to-transparent" />
                  <div className="relative z-10 flex h-full max-w-[65%] flex-col justify-center px-6 py-5">
                    <div className="mb-2 flex items-center gap-1.5">
                      <CheckCircle2
                        className={`h-4 w-4 ${ngo.isVerified ? "fill-green-100 text-green-600" : "text-slate-400"}`}
                      />
                      <span
                        className={`text-[11px] font-bold tracking-wider ${ngo.isVerified ? "text-green-700" : "text-slate-600"}`}
                      >
                        {ngo.isVerified ? "VERIFIED NGO" : "PUBLISHED NGO"}
                      </span>
                    </div>
                    <h3 className="mb-1 font-serif text-[20px] font-bold text-[#1e3a8a]">
                      {ngo.name}
                    </h3>
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {[ngo.city, ngo.state].filter(Boolean).join(", ") ||
                        "Location not published"}
                    </p>
                    <p className="line-clamp-2 max-w-[90%] text-[11px] leading-snug text-slate-600">
                      {ngo.tagline ??
                        "This organization has not published a tagline."}
                    </p>
                    {ngo.has80g && (
                      <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified 80G
                        record
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 pt-5">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <p>
                      <span className="font-bold text-[#1e3a8a]">
                        {ngo.averageRating.toFixed(1)}
                      </span>{" "}
                      <span className="text-slate-500">average rating</span>
                    </p>
                    <p>
                      <span className="font-bold text-[#1e3a8a]">
                        {ngo.totalReviews.toLocaleString("en-IN")}
                      </span>{" "}
                      <span className="text-slate-500">eligible reviews</span>
                    </p>
                  </div>
                </div>

                {campaign ? (
                  <div className="mb-4 px-6 pt-5">
                    <h4 className="mb-3 text-[14px] font-bold text-[#1e3a8a]">
                      {campaign.title}
                    </h4>
                    <div className="mb-1.5 flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#2563eb]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[13px] font-bold text-[#1e3a8a]">
                        {progress}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">
                        {money(campaign.raisedPaise)}
                      </span>{" "}
                      raised of {money(campaign.targetPaise)}
                    </p>
                  </div>
                ) : (
                  <p className="mx-6 mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                    This featured NGO has no active campaign.
                  </p>
                )}

                <div className="mt-auto flex justify-center px-6 pb-6 pt-5">
                  <Link
                    href={`/ngos/${ngo.id}`}
                    className="group flex items-center justify-center gap-2 rounded-[8px] border border-slate-200 bg-white px-6 py-2 text-[13px] font-bold text-[#2563eb] transition-colors hover:bg-slate-50"
                  >
                    View NGO Profile
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex min-h-[430px] items-center justify-center p-8">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <ShieldCheck className="mx-auto h-10 w-10 text-blue-500" />
                  <p className="mt-4 font-semibold text-slate-700">
                    No published NGO is available to feature yet.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
