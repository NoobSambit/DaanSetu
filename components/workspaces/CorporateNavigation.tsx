"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Users,
} from "lucide-react";

const links = [
  { href: "/corporate/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/corporate/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/corporate/employees", label: "Employees", icon: Users },
  { href: "/corporate/settlements", label: "Matching", icon: Handshake },
  { href: "/corporate/profile", label: "Company", icon: Building2 },
] as const;

export default function CorporateNavigation() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/corporate/invitations") ||
    pathname.includes("paypal-return") ||
    pathname.includes("paypal-cancel")
  ) {
    return null;
  }

  return (
    <nav className="workspace-nav" aria-label="Corporate workspace">
      <div className="workspace-nav-inner container-custom">
        <span className="workspace-label">Corporate workspace</span>
        <div className="workspace-links">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`workspace-link ${active ? "workspace-link-active" : ""}`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
