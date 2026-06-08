"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck, Lock, Star, BarChart3, ReceiptText, LineChart,
  Users, BookOpen, ArrowRight, CheckCircle2,
  Building2, MapPin
} from "lucide-react";

const trustBadges = [
  { icon: ShieldCheck, label: "Verified NGO\\nProfiles", color: "text-blue-600", border: "border-blue-200" },
  { icon: Lock, label: "Secure Donation\\nProcessing", color: "text-green-600", border: "border-green-200" },
  { icon: Star, label: "Ratings & Donor\\nReviews", color: "text-amber-500", border: "border-amber-200" },
  { icon: BarChart3, label: "Transparent Campaign\\nProgress", color: "text-blue-600", border: "border-blue-200" },
  { icon: ReceiptText, label: "80G Tax\\nReceipts", color: "text-purple-500", border: "border-purple-200" },
  { icon: LineChart, label: "Real Impact\\nReports", color: "text-teal-600", border: "border-teal-200" },
];

export default function TrustSection() {
  return (
    <section className="section bg-white">
      <div className="container-custom">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-x-10 gap-y-10">
          
          {/* LEFT COLUMN: Title, Badges, Testimonial */}
          <div className="flex flex-col">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl md:text-[28px] font-serif font-bold text-[#1e3a8a] mb-2">Trust & Transparency You Can Rely On</h2>
              <p className="text-slate-500 text-[15px]">Every NGO, every campaign, every rupee is accountable</p>
            </motion.div>

            {/* Circular Badges Grid (3 columns, 2 rows) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-3 gap-y-8 gap-x-2 mb-10">
              {trustBadges.map((badge, index) => (
                <div key={index} className="flex flex-col items-center text-center gap-3">
                  <div className={`w-[56px] h-[56px] bg-white rounded-full flex items-center justify-center border ${badge.border} shadow-sm`}>
                    <badge.icon className={`w-[24px] h-[24px] ${badge.color}`} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-bold text-[#1e3a8a] leading-[1.3] whitespace-pre-line">
                    {badge.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Testimonial Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex flex-col relative overflow-hidden mt-auto">
              <div className="flex items-start gap-5">
                {/* Image placeholder */}
                <div className="w-[76px] h-[76px] rounded-full shrink-0 overflow-hidden relative border border-slate-100 shadow-sm">
                   <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-500 text-[10px] font-medium">Photo</span>
                   </div>
                </div>
                
                <div className="flex-1 flex flex-col pt-1 pb-6">
                  <blockquote className="text-slate-600 text-[14px] leading-[1.6] mb-3">
                    "Transparent updates and real stories give me confidence that my contribution truly makes a difference."
                  </blockquote>
                  <p className="text-[13px] text-slate-500">
                    — <span className="text-[#1e3a8a] font-bold">Neha Sharma</span>, Donor
                  </p>
                </div>
              </div>

              {/* Slider Dots */}
              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5">
                <div className="w-[5px] h-[5px] bg-[#1e3a8a] rounded-full" />
                <div className="w-[5px] h-[5px] bg-slate-200 rounded-full" />
                <div className="w-[5px] h-[5px] bg-slate-200 rounded-full" />
                <div className="w-[5px] h-[5px] bg-slate-200 rounded-full" />
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: NGO Profile Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white border border-slate-200 rounded-[20px] shadow-sm flex flex-col overflow-hidden h-full">
            
            {/* Header Banner - Image with Gradient Overlay */}
            <div className="relative w-full h-[180px] bg-slate-100 flex items-center shrink-0">
              {/* The Image (Right side) */}
              <div className="absolute right-0 top-0 bottom-0 w-[60%] bg-slate-200 overflow-hidden flex justify-center items-center">
                <span className="text-slate-400 text-xs font-medium bg-white/50 px-3 py-1 rounded backdrop-blur-sm">Children learning image</span>
              </div>
              
              {/* Gradient overlay to seamlessly blend white background into the image */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent w-[75%]" />
              
              {/* Content overlaid on the white part */}
              <div className="relative z-10 px-6 py-5 max-w-[65%] flex flex-col justify-center h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 fill-green-100" />
                  <span className="text-[11px] font-bold text-green-700 tracking-wider">VERIFIED NGO</span>
                </div>
                
                <h3 className="text-[20px] font-serif font-bold text-[#1e3a8a] mb-1">Prerna Foundation</h3>
                
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current text-amber-400/30" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 ml-1">4.7 (256 reviews)</span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2.5">
                  <MapPin className="w-3 h-3" />
                  Jaipur, Rajasthan
                </div>

                <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 mb-3 max-w-[90%]">
                  Working for quality education and holistic development of underprivileged children.
                </p>

                <div>
                  <div className="inline-flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
                    <span className="text-[10px] font-bold text-green-700">80G Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Progress Section */}
            <div className="px-6 pt-5 mb-4">
              <h4 className="text-[14px] font-bold text-[#1e3a8a] mb-3">Library & Learning Center for Rural Children</h4>
              
              <div className="flex items-center gap-3 mb-1.5">
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-[#2563eb] h-full rounded-full" style={{ width: "73%" }} />
                </div>
                <span className="text-[13px] font-bold text-[#1e3a8a]">73%</span>
              </div>
              
              <p className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">₹8,75,000</span> raised of ₹12,00,000
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between px-6 mb-5">
              <div className="flex items-start gap-2.5">
                <Users className="w-[22px] h-[22px] text-[#2563eb] shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-[#1e3a8a] leading-none">1,250</p>
                  <p className="text-[10px] text-slate-500 mt-1">Children Supported</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5">
                <Building2 className="w-[22px] h-[22px] text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-[#1e3a8a] leading-none">18</p>
                  <p className="text-[10px] text-slate-500 mt-1">Learning Centers</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5">
                <BookOpen className="w-[22px] h-[22px] text-green-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-[#1e3a8a] leading-none">24,560</p>
                  <p className="text-[10px] text-slate-500 mt-1">Books Distributed</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="px-6 pb-6 mt-auto flex justify-center">
              <button className="px-6 py-2 bg-white border border-slate-200 text-[#2563eb] text-[13px] font-bold rounded-[8px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 group">
                View NGO Profile <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
