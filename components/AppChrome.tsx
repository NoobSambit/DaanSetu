"use client";

import { usePathname } from "next/navigation";

import Header from "@/components/Header";

const protectedPrefixes = [
  "/sign-in",
  "/sign-up",
  "/sign",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/check-email",
  "/ngo/profile",
  "/ngo/dashboard",
  "/dashboard",
];

export function isProtectedSurface(pathname: string) {
  return (
    pathname === "/" ||
    protectedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = !isProtectedSurface(pathname);

  return (
    <>
      {showHeader && <Header />}
      <div id="main-content">{children}</div>
    </>
  );
}
