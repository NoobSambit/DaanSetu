"use client";

import { motion } from "framer-motion";
import { Heart, Users, Building2, Briefcase, ArrowRight } from "lucide-react";

const ctaCards = [
  { 
    icon: Heart, 
    bg: "bg-gradient-to-br from-blue-600/90 to-blue-700/95 border border-blue-400/30 shadow-lg shadow-blue-500/10 hover:from-blue-600 hover:to-blue-700", 
    title: "Start Giving", 
    description: "Find verified causes and make your first donation today" 
  },
  { 
    icon: Users, 
    bg: "bg-gradient-to-br from-emerald-600/90 to-emerald-700/95 border border-emerald-400/30 shadow-lg shadow-emerald-500/10 hover:from-emerald-600 hover:to-emerald-700", 
    title: "Find Volunteer Opportunities", 
    description: "Match your skills with NGOs that need your help" 
  },
  { 
    icon: Building2, 
    bg: "bg-gradient-to-br from-rose-600/90 to-rose-700/95 border border-rose-400/30 shadow-lg shadow-rose-500/10 hover:from-rose-600 hover:to-rose-700", 
    title: "Register Your NGO", 
    description: "Join our platform and reach thousands of supporters" 
  },
  { 
    icon: Briefcase, 
    bg: "bg-gradient-to-br from-amber-600/90 to-amber-700/95 border border-amber-400/30 shadow-lg shadow-amber-500/10 hover:from-amber-600 hover:to-amber-700", 
    title: "Explore CSR Solutions", 
    description: "Drive corporate impact with our enterprise tools" 
  },
];

export default function CommunityCTA() {
  return (
    <section className="relative pt-20 pb-6 bg-transparent">
      <div className="container-custom text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#0f172a] mb-3 leading-tight">A Community That Celebrates Impact</h2>
          <p className="text-white text-sm font-bold mb-1.5 tracking-wide" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>Follow. Share. Inspire.</p>
          <p className="text-white/90 text-xs max-w-md mx-auto mb-8 font-medium" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>Together, let&apos;s build a world of kindness, compassion, and a sustainable future.</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ctaCards.map((card, index) => (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.98 }}
              className={`${card.bg} rounded-2xl p-4 text-left transition-all duration-300 group backdrop-blur-sm shadow-lg`}
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{card.title}</h3>
              <p className="text-[11px] text-white/70 mb-3">{card.description}</p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-white/90 group-hover:text-white transition-colors">
                Learn More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
