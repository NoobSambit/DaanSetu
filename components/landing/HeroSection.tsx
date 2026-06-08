"use client";

import { motion } from "framer-motion";
import { Shield, Heart, Award, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-white pt-14 pb-0 md:pt-20 md:pb-4 lg:pt-28 lg:pb-8">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/landing_page_images/hero_image.png"
          alt="DaanSetu Hero Background"
          fill
          priority
          className="object-cover object-[85%_center] lg:object-right-center"
        />
        {/* Responsive gradient overlay to guarantee text legibility on all devices */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-80% to-transparent lg:from-white/40 lg:via-transparent lg:to-transparent" />
        {/* Bottom fade overlay to blend the image smoothly into the next white section */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Column (Text content) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 flex flex-col justify-center"
          >
            <h1 className="font-serif text-[40px] md:text-[48px] lg:text-[54px] leading-[1.1] font-bold text-heading mb-5">
              Where Compassion
              <br />
              Becomes Action
            </h1>

            <p className="text-base md:text-lg text-body leading-relaxed mb-8 max-w-lg">
              Discover trusted NGOs, support meaningful campaigns, volunteer your
              skills, and see the impact we create together across India.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Explore Causes
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-white text-primary-600 text-sm font-semibold rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-all"
              >
                Join the Movement
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-600 fill-amber-600/10" />
                <span>Verified NGOs</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-amber-600 fill-amber-600/10" />
                <span>Secure Giving</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600 fill-amber-600/10" />
                <span>Transparent Impact</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Spacer to keep background image visible */}
          <div className="lg:col-span-7 h-[400px] lg:h-[500px] hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
