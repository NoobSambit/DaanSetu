"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  HandCoins,
  UserCheck,
  Megaphone,
  Building2,
  BookOpen,
  BrainCircuit,
} from "lucide-react";

const impactCards = [
  {
    title: "One-time &\nRecurring Donations",
    image: "/landing_page_images/how_it_works/donations.png",
    description: "Give once or regularly. Every contribution creates change.",
    Icon: HandCoins,
    iconColor: "bg-[#2563eb]", // Blue
  },
  {
    title: "Skills-based\nVolunteering",
    image: "/landing_page_images/how_it_works/skill_based_volunteering.png",
    description: "Share your skills, mentor, teach, and empower communities.",
    Icon: UserCheck,
    iconColor: "bg-[#16a34a]", // Green
  },
  {
    title: "Fundraising\nCampaigns",
    image: "/landing_page_images/how_it_works/fundraising_campaigns.png",
    description:
      "Start your own campaign. Inspire your network to create impact.",
    Icon: Megaphone,
    iconColor: "bg-[#f97316]", // Orange
  },
  {
    title: "Corporate CSR &\nEmployee Giving",
    image: "/landing_page_images/how_it_works/corporate_csr.png",
    description:
      "Drive CSR initiatives and engage employees in meaningful action.",
    Icon: Building2,
    iconColor: "bg-[#0d9488]", // Teal
  },
  {
    title: "Community\nStories",
    image: "/landing_page_images/how_it_works/community_stories.png",
    description: "Share stories, follow NGOs, and celebrate impact together.",
    Icon: BookOpen,
    iconColor: "bg-[#eab308]", // Yellow
  },
  {
    title: "AI-powered\nRecommendations",
    image: "/landing_page_images/how_it_works/ai_powered_recommendation.png",
    description: "Get personalized NGO, campaign, and volunteer opportunities.",
    Icon: BrainCircuit,
    iconColor: "bg-[#4f46e5]", // Indigo
  },
];

export default function ImpactWays() {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1e293b] mb-3">
            Multiple Ways to Create Impact
          </h2>
          <p className="text-slate-600 text-base max-w-2xl mx-auto">
            Choose what matters to you. Make an impact that matters.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-4 lg:gap-6">
          {impactCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex flex-col group"
            >
              <div className="relative mb-5">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm">
                  <Image
                    src={card.image}
                    alt={card.title.replace("\n", " ")}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {/* Circular Icon overlay */}
                <div
                  className={`absolute -bottom-4 left-4 ${card.iconColor} text-white p-2.5 rounded-full shadow-lg ring-4 ring-white z-10`}
                >
                  <card.Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="pt-2 px-1">
                <h3 className="text-[15px] sm:text-base font-bold text-[#1e293b] mb-2 leading-tight whitespace-pre-line group-hover:text-primary-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
