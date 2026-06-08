"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, HandCoins, HeartPulse, Users, BadgeCheck, MapPin, HandHeart, Share2, Sparkles, UserPlus } from "lucide-react";
import Image from "next/image";

export default function ImpactDashboard() {
  const linePoints = [
    { x: 0, y: 90 }, { x: 27.3, y: 85 }, { x: 54.5, y: 80 }, { x: 81.8, y: 75 },
    { x: 109.1, y: 70 }, { x: 136.4, y: 55 }, { x: 163.6, y: 60 }, { x: 190.9, y: 45 },
    { x: 218.2, y: 30 }, { x: 245.5, y: 35 }, { x: 272.7, y: 15 }, { x: 300, y: 0 }
  ];

  const linePath = `M ${linePoints.map(p => `${p.x} ${p.y}`).join(" L ")}`;

  return (
    <section className="section bg-white pt-10 pb-16">
      <div className="container-custom">
        <div className="bg-[#f8fafc] border border-slate-200/70 rounded-[32px] p-8 md:p-12 overflow-hidden relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left - Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="lg:col-span-3 z-10"
            >
              <h2 className="text-3xl md:text-[34px] font-serif font-bold text-[#1e3a8a] mb-5 leading-[1.2]">
                Track. Measure.<br />Multiply Impact.
              </h2>
              <p className="text-slate-600 text-[15px] leading-relaxed mb-8">
                Our real-time dashboard shows the collective difference we&apos;re making across India.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-white border border-blue-200 text-blue-600 text-[13px] font-bold rounded-[8px] hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2"
              >
                View Full Dashboard <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>

            {/* Right - Dashboard Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              className="lg:col-span-9 bg-white border border-slate-200/80 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 min-w-0 overflow-hidden relative z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[15px] font-bold text-[#1e3a8a]">DaanSetu Impact Dashboard</h3>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-white px-3 py-1.5 rounded-[6px] border border-slate-200 cursor-pointer hover:bg-slate-50 shadow-sm">
                  Last 12 Months <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Row 1: 5 Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: "Funds Raised", value: "₹24.6 Cr+", icon: UserPlus, color: "text-[#2563eb]" },
                  { label: "Volunteer Hours", value: "1,85,000+", icon: HeartPulse, color: "text-[#16a34a]" },
                  { label: "Lives Supported", value: "3.8M+", icon: Users, color: "text-[#ea580c]" },
                  { label: "Active Campaigns", value: "950+", icon: BadgeCheck, color: "text-[#9333ea]" },
                  { label: "States Reached", value: "28", icon: MapPin, color: "text-[#0d9488]" },
                ].map((stat) => (
                  <div key={stat.label} className="border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-md transition-shadow bg-white min-w-0">
                    <stat.icon className={`w-6 h-6 ${stat.color} shrink-0`} strokeWidth={1.5} />
                    <div className="min-w-0">
                      <p className={`text-[13px] md:text-[14px] font-bold ${stat.color} truncate leading-tight`}>{stat.value}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-500 font-semibold mt-0.5 leading-tight">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2: 3 Columns (Charts & Updates) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                
                {/* Col 1: Donut Chart */}
                <div className="border border-slate-100 rounded-xl p-4 shadow-sm bg-white">
                  <h4 className="text-[11px] font-bold text-slate-700 mb-4">Impact by Cause</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-[85px] h-[85px] shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#2563eb" strokeWidth="25" strokeDasharray="34 100" strokeDashoffset="0" pathLength="100" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#f97316" strokeWidth="25" strokeDasharray="22 100" strokeDashoffset="-34" pathLength="100" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#22c55e" strokeWidth="25" strokeDasharray="16 100" strokeDashoffset="-56" pathLength="100" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#a855f7" strokeWidth="25" strokeDasharray="12 100" strokeDashoffset="-72" pathLength="100" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#14b8a6" strokeWidth="25" strokeDasharray="8 100" strokeDashoffset="-84" pathLength="100" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#94a3b8" strokeWidth="25" strokeDasharray="8 100" strokeDashoffset="-92" pathLength="100" />
                        <circle cx="50" cy="50" r="22" fill="white" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      {[
                        { label: "Education", pct: "34%", color: "bg-blue-600" },
                        { label: "Healthcare", pct: "22%", color: "bg-orange-500" },
                        { label: "Food Security", pct: "16%", color: "bg-green-500" },
                        { label: "Women Empowerment", pct: "12%", color: "bg-purple-500" },
                        { label: "Environment", pct: "8%", color: "bg-teal-500" },
                        { label: "Others", pct: "8%", color: "bg-slate-400" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between w-full text-[9px] text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                            <span className="truncate max-w-[65px] font-medium">{item.label}</span>
                          </div>
                          <span className="font-bold text-slate-700">{item.pct}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Col 2: Line Chart */}
                <div className="border border-slate-100 rounded-xl p-4 shadow-sm bg-white flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[11px] font-bold text-slate-700">Impact Over Time</h4>
                    <span className="text-[9px] text-slate-400 font-semibold">(in Cr)</span>
                  </div>
                  <div className="flex-1 w-full relative pl-4 pb-4">
                    {/* Y Axis labels */}
                    <div className="absolute left-0 top-[-4px] bottom-4 flex flex-col justify-between text-[8px] font-medium text-slate-400">
                      <span>10</span><span>8</span><span>6</span><span>4</span><span>2</span><span>0</span>
                    </div>
                    
                    {/* Chart Area */}
                    <div className="w-full h-full relative border-l border-b border-slate-100">
                      <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                        {/* Grid lines */}
                        {[20, 40, 60, 80].map(y => (
                          <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#f8fafc" strokeWidth="1" />
                        ))}
                        {/* Line */}
                        <path d={linePath} stroke="#3b82f6" strokeWidth="2.5" fill="none" />
                        {/* Points */}
                        {linePoints.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                        ))}
                      </svg>
                    </div>
                    
                    {/* X Axis labels */}
                    <div className="absolute left-4 right-0 bottom-0 flex justify-between text-[7px] font-medium text-slate-400 pt-1">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                      <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                    </div>
                  </div>
                </div>

                {/* Col 3: Recent Updates */}
                <div className="border border-slate-100 rounded-xl p-4 shadow-sm bg-white flex flex-col">
                  <h4 className="text-[11px] font-bold text-slate-700 mb-4">Recent Campaign Updates</h4>
                  <div className="flex-1 flex flex-col gap-3">
                    {[
                      { img: "/landing_page_images/feature_tiles/give_with_confidence.png", title: "Rural Education Support", sub: "Progress updated • 2h ago" },
                      { img: "/landing_page_images/feature_tiles/volunteer_your_skills.png", title: "Healthcare for All", sub: "New milestone reached • 5h ago" },
                      { img: "/landing_page_images/feature_tiles/grow_your_impact.png", title: "Clean Water Initiative", sub: "25 new villages covered • 1d ago" },
                    ].map((update, i) => (
                      <div key={i} className="flex gap-2.5 items-center group cursor-pointer">
                        <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden relative shrink-0">
                          <Image src={update.img} fill className="object-cover group-hover:scale-110 transition-transform" alt="campaign" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{update.title}</p>
                          <p className="text-[9px] font-medium text-slate-500 mt-0.5">{update.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-3 text-right">
                    <span className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline">View all updates &rarr;</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Timeline */}
              <div className="border border-slate-100 rounded-xl p-4 shadow-sm bg-white">
                <h4 className="text-[11px] font-bold text-slate-700 mb-4">Your Impact Timeline</h4>
                <div className="relative flex justify-between items-start px-4 mt-3">
                  {/* Background connecting line */}
                  <div className="absolute top-[14px] left-8 right-8 h-[2px] bg-slate-100 z-0" />
                  
                  {/* Timeline nodes */}
                  {[
                    { month: "Jan", desc: "Donated to 3 campaigns", icon: HandHeart, bg: "bg-[#2563eb]" },
                    { month: "Mar", desc: "Volunteered 12 hours", icon: Users, bg: "bg-[#16a34a]" },
                    { month: "Jun", desc: "Shared a campaign", icon: Share2, bg: "bg-[#0d9488]" },
                    { month: "Sep", desc: "Raised ₹25,000", icon: HandCoins, bg: "bg-[#ea580c]" },
                    { month: "Dec", desc: "Impacted 250+ lives", icon: Sparkles, bg: "bg-[#d97706]" },
                  ].map((node, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${node.bg} text-white flex items-center justify-center ring-[6px] ring-white shadow-sm`}>
                        <node.icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </div>
                      <div className="text-center mt-1">
                        <p className="text-[11px] font-bold text-slate-700 mb-0.5">{node.month}</p>
                        <p className="text-[9px] font-medium text-slate-500 max-w-[80px] leading-[1.3]">{node.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
