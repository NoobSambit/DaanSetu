import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/playfair-display";
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "DaanSetu — A Bridge for Giving | NGO Discovery & Impact Platform",
  description:
    "Discover verified NGOs, support meaningful campaigns, volunteer your skills, and track your impact across India. Join 2,500+ donors making a difference.",
  keywords: [
    "NGO",
    "donate",
    "volunteer",
    "India",
    "charity",
    "impact",
    "CSR",
    "DaanSetu",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
      data-theme="light"
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <AppChrome>{children}</AppChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
