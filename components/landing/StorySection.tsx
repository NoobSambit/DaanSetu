"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Users, UserCheck, GraduationCap } from "lucide-react";

export default function StorySection() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Column 1: Text Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#1e293b] mb-6 leading-tight">
                Every Contribution
                <br />
                <span className="text-[#2563eb]">
                  Becomes a Story of Change
                </span>
              </h2>

              <h3 className="text-[15px] font-bold text-[#1e293b] mb-1">
                From a Struggle to a Future
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Meena&apos;s journey with education
              </p>

              <p className="text-[13px] text-slate-600 leading-relaxed mb-6">
                Meena, from a small village in Bihar, had to walk 5 km daily to
                attend school. With support from a DaanSetu funded education
                program, her village now has a learning center.
              </p>

              <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex flex-col items-center gap-1.5">
                  <Users className="w-5 h-5 text-[#b45309]" />
                  <div className="text-center">
                    <span className="font-bold text-[13px] text-[#1e293b] block">
                      150
                    </span>
                    <span className="text-[9px] text-slate-500 leading-tight block">
                      Children
                      <br />
                      Educated
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <UserCheck className="w-5 h-5 text-[#b45309]" />
                  <div className="text-center">
                    <span className="font-bold text-[13px] text-[#1e293b] block">
                      12
                    </span>
                    <span className="text-[9px] text-slate-500 leading-tight block">
                      Teachers
                      <br />
                      Trained
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <GraduationCap className="w-5 h-5 text-[#b45309]" />
                  <div className="text-center">
                    <span className="font-bold text-[13px] text-[#1e293b] block">
                      98%
                    </span>
                    <span className="text-[9px] text-slate-500 leading-tight block">
                      School
                      <br />
                      Attendance
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full border border-slate-200 rounded-xl py-3 px-4 text-[13px] font-semibold text-[#2563eb] flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              Read Impact Stories <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Column 2: Before Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col h-full"
          >
            <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-4">
              <Image
                src="/landing_page_images/before_image.png"
                alt="Before support"
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 bg-[#1e293b]/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                Before
              </div>
            </div>
            <p className="text-[13px] text-slate-600 font-medium px-2">
              Limited access to education
            </p>
          </motion.div>

          {/* Column 3: After Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col h-full"
          >
            <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-4">
              <Image
                src="/landing_page_images/after_image.png"
                alt="After support"
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4 bg-[#16a34a] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                After
              </div>
            </div>
            <p className="text-[13px] text-slate-600 font-medium px-2">
              Confident, learning, and dreaming big
            </p>
          </motion.div>

          {/* Column 4: Testimonial Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-[#fef9f3] rounded-[24px] p-8 flex flex-col justify-between h-full"
          >
            <div>
              <div className="mb-5 text-[#1e3a8a]">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 11C10 13.2 8.4 15 6 15C3.6 15 2 13.2 2 11C2 8.8 4 6 7 6V8C5.5 8 4.5 9 4.2 10.2C4.7 10 5.3 9.8 6 9.8C8.2 9.8 10 10.4 10 11ZM20 11C20 13.2 18.4 15 16 15C13.6 15 12 13.2 12 11C12 8.8 14 6 17 6V8C15.5 8 14.5 9 14.2 10.2C14.7 10 15.3 9.8 16 9.8C18.2 9.8 20 10.4 20 11Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <p className="text-[#334155] text-[15px] font-medium leading-relaxed mb-6">
                &ldquo;Now I dream of becoming a teacher and helping other
                children like me.&rdquo;
              </p>
              <div>
                <p className="text-[13px] font-bold text-[#1e3a8a] mb-0.5">
                  — Meena Kumari
                </p>
                <p className="text-[11px] text-[#64748b]">Class 8 Student</p>
              </div>
            </div>

            <div className="flex gap-2 mt-8">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full" />
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
