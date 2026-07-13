"use client";

import { motion } from "framer-motion";
import { Heart, Users, TrendingUp, Building2 } from "lucide-react";
import Image from "next/image";

const features = [
  {
    image: "/landing_page_images/feature_tiles/give_with_confidence.png",
    icon: Heart,
    iconBg: "bg-blue-600",
    title: "Give with Confidence",
    description:
      "Discover verified NGOs, donate securely, and create lasting impact.",
    cta: "Start Giving",
    btnBg: "bg-blue-600 hover:bg-blue-700",
  },
  {
    image: "/landing_page_images/feature_tiles/volunteer_your_skills.png",
    icon: Users,
    iconBg: "bg-emerald-600",
    title: "Volunteer Your Skills",
    description:
      "Find opportunities that match your skills, interests, and availability.",
    cta: "Find Opportunities",
    btnBg: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    image: "/landing_page_images/feature_tiles/grow_your_impact.png",
    icon: TrendingUp,
    iconBg: "bg-orange-600",
    title: "Grow Your Impact",
    description:
      "Raise funds, engage volunteers, share updates, and measure results.",
    cta: "Register Your NGO",
    btnBg: "bg-orange-600 hover:bg-orange-700",
  },
  {
    image: "/landing_page_images/feature_tiles/power_meaningful_csr.png",
    icon: Building2,
    iconBg: "bg-violet-600",
    title: "Power Meaningful CSR",
    description: "Drive CSR initiatives, engage employees, and amplify impact.",
    cta: "Explore CSR Solutions",
    btnBg: "bg-violet-600 hover:bg-violet-700",
  },
];

export default function FeatureCards() {
  return (
    <section className="pt-6 pb-10 md:pt-8 md:pb-14 lg:pt-10 lg:pb-16 bg-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group"
            >
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col">
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="relative px-5 pt-8 pb-5 flex flex-col flex-1">
                  <div
                    className={`absolute -top-[22px] left-5 w-11 h-11 ${feature.iconBg} rounded-full flex items-center justify-center shadow-lg border-[3.5px] border-white z-10`}
                  >
                    <feature.icon className="w-4 h-4 text-white fill-white/10" />
                  </div>
                  <h3 className="text-base font-bold text-heading mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-body leading-relaxed mb-5 flex-1">
                    {feature.description}
                  </p>
                  <button
                    className={`px-4 py-2 rounded-lg text-xs font-semibold text-white ${feature.btnBg} transition-all inline-flex items-center gap-1.5 self-start shadow-sm`}
                  >
                    {feature.cta}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
