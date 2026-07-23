"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, UserRound } from "lucide-react";

const links = [
  { href: "/volunteer/opportunities", label: "Opportunities", icon: Compass },
  {
    href: "/volunteer/dashboard",
    label: "My participation",
    icon: LayoutDashboard,
  },
  { href: "/volunteer/profile", label: "My profile", icon: UserRound },
] as const;

export default function VolunteerNavigation() {
  const pathname = usePathname();

  return (
    <nav className="workspace-nav" aria-label="Volunteer workspace">
      <div className="workspace-nav-inner container-custom">
        <span className="workspace-label">Volunteer workspace</span>
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
