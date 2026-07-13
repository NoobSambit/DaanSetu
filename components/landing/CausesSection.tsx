"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Search,
  GraduationCap,
  Heart,
  Utensils,
  Shield,
  TreePine,
  PawPrint,
  Droplets,
  ChevronRight,
  Clock,
} from "lucide-react";

// Dynamically import the map to avoid SSR issues with Leaflet
const IndiaMap = dynamic(() => import("./IndiaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[320px] bg-slate-50 flex items-center justify-center rounded-[24px]">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

const categories = [
  { icon: GraduationCap, label: "Education", color: "text-blue-600" },
  { icon: Heart, label: "Healthcare", color: "text-red-500" },
  { icon: Utensils, label: "Food security", color: "text-amber-600" },
  { icon: Shield, label: "Women empowerment", color: "text-purple-600" },
  { icon: TreePine, label: "Environment", color: "text-green-600" },
  { icon: PawPrint, label: "Animal welfare", color: "text-orange-500" },
  { icon: Droplets, label: "Disaster relief", color: "text-cyan-600" },
];

const topCauses = [
  {
    title: "Rural Education Support",
    org: "Pratham Education Foundation",
    progress: 78,
    raised: "₹12.4L",
    goal: "₹16L",
    daysLeft: 14,
    tag: "Education",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Community Health Service",
    org: "Swasth India Initiative",
    progress: 62,
    raised: "₹8.2L",
    goal: "₹13L",
    daysLeft: 21,
    tag: "Healthcare",
    tagColor: "bg-red-100 text-red-700",
  },
  {
    title: "Clean Water Initiative",
    org: "Jal Jeevan Foundation",
    progress: 45,
    raised: "₹5.6L",
    goal: "₹12.5L",
    daysLeft: 30,
    tag: "Environment",
    tagColor: "bg-green-100 text-green-700",
  },
];

export default function CausesSection() {
  return (
    <section className="section bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-heading mb-1.5">
            Causes Across India
          </h2>
          <p className="text-body text-sm">
            Find meaningful causes in your community
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white border border-slate-200 rounded-[24px] shadow-card overflow-hidden"
        >
          <div className="grid lg:grid-cols-[260px_1fr_320px] divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left */}
            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Find a cause near you"
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.label}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 hover:text-heading rounded-xl transition-colors group"
                  >
                    <cat.icon className={`w-4 h-4 ${cat.color}`} />
                    <span className="flex-1 text-left font-medium">
                      {cat.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Center - Map */}
            <div className="relative p-6 min-h-[400px] flex items-center justify-center bg-slate-50">
              <div className="w-full h-full relative rounded-[24px] overflow-hidden shadow-inner border border-slate-200/60 bg-white">
                <IndiaMap />
              </div>
            </div>

            {/* Right */}
            <div className="p-6 flex flex-col">
              <h3 className="text-[15px] font-bold text-heading mb-1">
                Top Causes Near You
              </h3>
              <p className="text-[11px] text-body mb-5">
                Popular causes in your area
              </p>

              <div className="space-y-4 flex-1">
                {topCauses.map((cause, index) => (
                  <motion.div
                    key={cause.title}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-slate-200 rounded-[16px] p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer bg-white"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md ${cause.tagColor}`}
                      >
                        {cause.tag}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <Clock className="w-3 h-3" />
                        {cause.daysLeft} days left
                      </div>
                    </div>
                    <h4 className="text-[13px] font-bold text-heading mb-1">
                      {cause.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-3">
                      {cause.org}
                    </p>

                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                      <div
                        className="bg-[#2563eb] h-2 rounded-full"
                        style={{ width: `${cause.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#1e293b] font-bold">
                        {cause.raised}{" "}
                        <span className="text-slate-500 font-normal">
                          raised
                        </span>
                      </span>
                      <span className="text-slate-600 font-medium">
                        {cause.progress}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button className="w-full mt-4 text-[13px] font-bold text-[#2563eb] flex items-center justify-center gap-1.5 py-2.5 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100">
                View more causes <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
