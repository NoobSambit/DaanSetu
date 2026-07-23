"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeIndianRupee,
  Building2,
  ClipboardCheck,
  Flag,
  Landmark,
  ReceiptText,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

const links = [
  { href: "/admin/operations", label: "Overview", icon: ShieldCheck },
  { href: "/admin/ngo-verifications", label: "NGOs", icon: Building2 },
  { href: "/admin/fundraisers", label: "Fundraisers", icon: ClipboardCheck },
  { href: "/admin/moderation", label: "Moderation", icon: Flag },
  { href: "/admin/refunds", label: "Refunds", icon: ReceiptText },
  { href: "/admin/payouts", label: "Payouts", icon: Landmark },
  { href: "/admin/csr-settlements", label: "CSR", icon: BadgeIndianRupee },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
] as const;

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="workspace-nav" aria-label="Admin workspace">
      <div className="workspace-nav-inner container-custom">
        <span className="workspace-label">Admin workspace</span>
        <div className="workspace-links">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href === "/admin/operations" && pathname === "/admin");
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
