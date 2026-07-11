"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

const footerColumns = [
  { title: "Explore", links: [{ label: "Discover NGOs", href: "/ngos" }, { label: "Browse Campaigns", href: "/campaigns" }, { label: "Volunteer", href: "/volunteer/opportunities" }, { label: "Community Stories", href: "/community" }, { label: "Impact Dashboard", href: "/analytics" }] },
  { title: "Causes", links: [{ label: "Education", href: "/ngos?category=education" }, { label: "Healthcare", href: "/ngos?category=healthcare" }, { label: "Food Security", href: "/ngos?category=food-security" }, { label: "Environment", href: "/ngos?category=environment" }] },
  { title: "Get involved", links: [{ label: "Start a fundraiser", href: "/campaigns/create" }, { label: "Create a post", href: "/community/create" }, { label: "Corporate CSR", href: "/csr-campaigns" }] },
  { title: "Your account", links: [{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications", href: "/notifications" }, { label: "Volunteer profile", href: "/volunteer/profile" }] },
  { title: "Trust & Safety", links: [{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }, { label: "Refund Policy", href: "/refund-policy" }, { label: "Grievance Redressal", href: "/grievance" }] },
];

export default function Footer() {
  return (
    <footer className="bg-transparent text-white">
      <div className="container-custom pt-6 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-6 mb-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 relative">
                <Image src="/logo.png" alt="DaanSetu Logo" fill sizes="32px" className="object-cover scale-[1.5]" />
              </div>
              <div>
                <span className="text-base font-bold block leading-tight">DaanSetu</span>
                <span className="text-[10px] text-slate-400 leading-none">A Bridge for Giving</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-[250px]">
              Connecting compassionate hearts with verified causes across India. Every donation, every volunteer hour — makes a difference.
            </p>
            <Link href="/campaigns" className="text-xs font-semibold text-primary-300 hover:text-white">See active causes →</Link>
          </div>

          {/* Link Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="text-xs font-semibold mb-3 text-white">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[11px] text-slate-400 hover:text-white transition-colors duration-200">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-5 mb-5">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400"><Mail className="w-3.5 h-3.5 text-primary-400 shrink-0" /><span>support@daansetu.org</span></div>
            <div className="flex items-center gap-2 text-xs text-slate-400"><Phone className="w-3.5 h-3.5 text-primary-400 shrink-0" /><span>+91 80-1234-5678</span></div>
            <div className="flex items-center gap-2 text-xs text-slate-400"><MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" /><span>Bengaluru, Karnataka, India</span></div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-slate-500">
            © {new Date().getFullYear()} DaanSetu. All rights reserved. Made with <Heart className="w-2.5 h-2.5 text-red-500 inline fill-red-500" /> in India.
          </p>
          <div className="flex gap-5 text-[10px] text-slate-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/ngos" className="hover:text-white transition-colors">Directory</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
