import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap"
});

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair",
  display: "swap"
});

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
    <html lang="en" className="scroll-smooth">
      <body className={`antialiased min-h-screen bg-white text-slate-900 ${inter.variable} ${playfair.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
