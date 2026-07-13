"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Heart, Users, Globe, BarChart3, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Discover NGOs", href: "#discover", icon: Search },
  { label: "Campaigns", href: "#campaigns", icon: Heart },
  { label: "Volunteer", href: "#volunteer", icon: Users },
  { label: "Community", href: "#community", icon: Globe },
  { label: "Impact", href: "#impact", icon: BarChart3 },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
      style={{ height: "64px" }}
    >
      <div className="container-custom h-full flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 relative">
            <Image
              src="/logo.png"
              alt="DaanSetu Logo"
              fill
              sizes="36px"
              className="object-cover scale-[1.5]"
            />
          </div>
          <div>
            <span className="text-lg font-bold text-heading block leading-tight">
              DaanSetu
            </span>
            <span className="text-[10px] text-body leading-none">
              A Bridge for Giving
            </span>
          </div>
        </Link>

        {/* Center: Nav Links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: Buttons */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <Link
            href="/sign-in"
            className="px-4 py-2 text-[13px] font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 text-[13px] font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow"
          >
            Join DaanSetu
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden bg-white border-t border-slate-100 shadow-lg absolute top-[64px] left-0 right-0 z-50"
        >
          <div className="container-custom py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/sign-in"
                className="px-3 py-2 text-sm font-medium text-center text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-3 py-2 text-sm font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Join DaanSetu
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
