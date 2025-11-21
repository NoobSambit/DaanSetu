import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "DaanSetu - NGO Discovery Platform",
  description: "Discover and connect with NGOs across India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
