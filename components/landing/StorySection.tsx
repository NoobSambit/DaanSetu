"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Quote, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { LandingStory } from "@/lib/landing/repository";

export default function StorySection({
  story,
}: {
  story: LandingStory | null;
}) {
  return (
    <section className="bg-white py-20">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="mb-6 font-serif text-2xl font-bold leading-tight text-[#1e293b]">
                Every Contribution
                <br />
                <span className="text-[#2563eb]">
                  Becomes a Story of Change
                </span>
              </h2>
              {story ? (
                <>
                  <h3 className="mb-2 text-[15px] font-bold text-[#1e293b]">
                    {story.title}
                  </h3>
                  <p className="line-clamp-6 text-[13px] leading-relaxed text-slate-600">
                    {story.content}
                  </p>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                  <p className="mt-3 text-[13px] font-semibold text-slate-700">
                    No approved impact stories are featured yet.
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    Stories appear here only after moderation and explicit
                    approval.
                  </p>
                </div>
              )}
            </div>
            <Link
              href="/impact-stories"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-[13px] font-semibold text-[#2563eb] transition-colors hover:bg-slate-50"
            >
              Read Impact Stories <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex h-full flex-col"
          >
            <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-[24px] bg-slate-100">
              {story?.imageUrl ? (
                <Image
                  src={story.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                  <Quote className="h-14 w-14 text-blue-300" />
                </div>
              )}
              <div className="absolute left-4 top-4 rounded-full bg-[#1e293b]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-sm">
                Verified story
              </div>
            </div>
            <p className="px-2 text-[13px] font-medium text-slate-600">
              Community evidence, reviewed before publication
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex h-full flex-col justify-between rounded-[24px] border border-slate-200 bg-slate-50 p-8"
          >
            <div>
              <CalendarDays className="h-8 w-8 text-emerald-600" />
              <h3 className="mt-6 text-lg font-bold text-slate-900">
                Publication record
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {story
                  ? `Featured ${new Date(story.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}`
                  : "There is no approved publication record to display."}
              </p>
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Approved content only
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex h-full flex-col justify-between rounded-[24px] bg-[#fef9f3] p-8"
          >
            <div>
              <Quote className="h-8 w-8 text-[#1e3a8a]" />
              <p className="mt-6 text-[15px] font-medium leading-relaxed text-[#334155]">
                {story
                  ? `Published by ${story.authorName}`
                  : "DaanSetu never invents testimonials to fill an empty state."}
              </p>
            </div>
            <p className="mt-8 text-[11px] text-[#64748b]">
              Platform-tracked and organization-reported impact remain separate.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
