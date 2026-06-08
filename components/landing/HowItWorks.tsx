"use client";

import { motion } from "framer-motion";
import { Search, Handshake, HandHeart, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Search,
    iconBg: "bg-[#1e40af]", // Deep blue
    badgeBg: "bg-[#1e40af]",
    dotColor: "bg-[#1e40af]",
    dotPosition: "-top-2 -right-3",
    dotSize: "w-3 h-3",
    number: "1",
    title: "Discover",
    description: "Explore causes by category, location, or need. Find verified NGOs and campaigns you care about.",
  },
  {
    icon: Handshake,
    iconBg: "bg-[#15803d]", // Green
    badgeBg: "bg-[#15803d]",
    dotColor: "bg-[#15803d]",
    dotPosition: "-bottom-2 -left-2",
    dotSize: "w-2.5 h-2.5",
    number: "2",
    title: "Connect",
    description: "Learn about the organization, read reviews, and see how your support can help.",
  },
  {
    icon: HandHeart,
    iconBg: "bg-[#c2410c]", // Orange
    badgeBg: "bg-[#c2410c]",
    dotColor: "bg-[#c2410c]",
    dotPosition: "-top-3 -right-2",
    dotSize: "w-2.5 h-2.5",
    number: "3",
    title: "Contribute",
    description: "Donate, volunteer, fundraise, or start a campaign. Every action creates impact.",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-[#7e22ce]", // Purple
    badgeBg: "bg-[#7e22ce]",
    dotColor: "bg-[#7e22ce]",
    dotPosition: "top-1 -left-3",
    dotSize: "w-3 h-3",
    number: "4",
    title: "Track Impact",
    description: "Follow real-time updates, transparent reports, and stories of change you helped create.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section bg-slate-50/50 pt-16 pb-10 lg:pb-12 overflow-hidden">
      <div className="container-custom relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1e3a8a]">
            How DaanSetu Works
          </h2>
          <div className="flex items-center justify-center gap-4 mt-5">
            <span className="w-16 h-[1px] bg-slate-300" />
            <span className="text-slate-500 text-sm md:text-base font-medium tracking-wide">
              A simple journey from intention to impact
            </span>
            <span className="w-16 h-[1px] bg-slate-300" />
          </div>
        </motion.div>

        <div className="relative w-full mt-8">
          {/* Beautiful Suspension Bridge Graphic (Spread wider to fill screen) */}
          <div className="hidden lg:block absolute top-[-70px] left-0 w-full h-[200px] z-0 select-none pointer-events-none">
            <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full">
              {/* Deck */}
              <line x1="0" y1="120" x2="1000" y2="120" stroke="#cbd5e1" strokeWidth="4" />
              <line x1="0" y1="128" x2="1000" y2="128" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="0" y1="124" x2="1000" y2="124" stroke="#f8fafc" strokeWidth="2" />
              
              {/* Suspender Cables */}
              {[...Array(49)].map((_, i) => {
                const x = (i + 1) * 20;
                let spanStart = 0;
                if (x <= 233.33) spanStart = -33.33;
                else if (x <= 500) spanStart = 233.33;
                else if (x <= 766.67) spanStart = 500;
                else spanStart = 766.67;
                
                const spanWidth = 266.67;
                const t = (x - spanStart) / spanWidth;
                const y = Math.pow(1 - t, 2) * 20 + 2 * (1 - t) * t * 220 + Math.pow(t, 2) * 20;
                
                if (Math.abs(y - 120) < 4 || Math.abs(y - 20) < 4) return null;

                return (
                  <line key={x} x1={x} y1={y} x2={x} y2={120} stroke="#cbd5e1" strokeWidth="1.5" opacity="0.6" />
                );
              })}

              {/* Main Suspension Cables */}
              <path d="M -33.33 20 Q 100 220 233.33 20" stroke="#94a3b8" strokeWidth="3.5" fill="none" />
              <path d="M 233.33 20 Q 366.67 220 500 20" stroke="#94a3b8" strokeWidth="3.5" fill="none" />
              <path d="M 500 20 Q 633.33 220 766.67 20" stroke="#94a3b8" strokeWidth="3.5" fill="none" />
              <path d="M 766.67 20 Q 900 220 1033.33 20" stroke="#94a3b8" strokeWidth="3.5" fill="none" />

              {/* Towers (Repositioned to support the wider spans) */}
              {[233.33, 500, 766.67].map(x => (
                <g key={x}>
                  {/* Tower Base */}
                  <rect x={x - 10} y={120} width={20} height={80} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x={x - 14} y={185} width={28} height={15} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
                  
                  {/* Tower Pillar */}
                  <path d={`M ${x - 6} 120 L ${x - 4} 10 L ${x + 4} 10 L ${x + 6} 120`} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                  <path d={`M ${x - 6} 10 L ${x + 6} 10 L ${x + 6} -5 L ${x - 6} -5 Z`} fill="#94a3b8" />
                  
                  {/* Cross bracing */}
                  <line x1={x - 5} y1={45} x2={x + 5} y2={45} stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1={x - 5} y1={85} x2={x + 5} y2={85} stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1={x - 5} y1={45} x2={x + 5} y2={85} stroke="#cbd5e1" strokeWidth="1" />
                  <line x1={x - 5} y1={85} x2={x + 5} y2={45} stroke="#cbd5e1" strokeWidth="1" />
                </g>
              ))}
            </svg>
          </div>

          {/* Unified Layout: Grid on Mobile, Absolute Positioning on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-12 lg:block lg:relative w-full h-auto lg:h-[240px] px-4 lg:px-0 z-10">
            {steps.map((step, index) => {
              // Left coordinates that match the center points of the SVG spans perfectly (10%, 36.66%, 63.33%, 90%)
              const leftPositions = ["10%", "36.666%", "63.333%", "90%"];
              
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="flex flex-col items-center group lg:absolute lg:top-0 lg:w-[260px]"
                  style={{ left: `calc(${leftPositions[index]} - 130px)` }}
                >
                  {/* Outer White Circle, Inner Solid Circle with White Icon */}
                  <div className="relative inline-flex mb-8">
                    {/* Floating dot */}
                    <motion.div 
                      animate={{ y: [-3, 3, -3] }} 
                      transition={{ repeat: Infinity, duration: 3 + index, ease: "easeInOut" }}
                      className={`absolute ${step.dotPosition} ${step.dotSize} ${step.dotColor} rounded-full shadow-sm`} 
                    />
                    
                    {/* Pulsing glow on hover */}
                    <div className={`absolute inset-0 ${step.iconBg} rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                    
                    <div className="relative w-[100px] h-[100px] rounded-full bg-white flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 group-hover:-translate-y-1 transition-transform duration-300">
                      <div className={`w-[64px] h-[64px] ${step.iconBg} rounded-full flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                        <step.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                  {/* Title with Inline Step Number */}
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shadow-md ${step.badgeBg}`}>
                      {step.number}
                    </span>
                    <h3 className="text-[19px] font-bold font-serif text-[#1e3a8a] tracking-tight group-hover:text-primary-600 transition-colors">
                      {step.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-[14px] text-slate-500 leading-[1.6] max-w-[240px] mx-auto text-center">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
