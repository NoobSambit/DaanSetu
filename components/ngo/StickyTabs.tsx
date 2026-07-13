"use client";

import { useEffect, useState } from "react";

export interface TabItem {
  id: string;
  label: string;
}

interface StickyTabsProps {
  tabs: TabItem[];
}

export default function StickyTabs({ tabs }: StickyTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Offset for the sticky header

      let currentActive = tabs[0]?.id;
      for (const tab of tabs) {
        const element = document.getElementById(tab.id);
        if (element) {
          const { top } = element.getBoundingClientRect();
          const absoluteTop = top + window.scrollY;
          if (scrollPosition >= absoluteTop) {
            currentActive = tab.id;
          }
        }
      }
      setActiveTab(currentActive);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initialize

    return () => window.removeEventListener("scroll", handleScroll);
  }, [tabs]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100; // Offset for the sticky tabs
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (tabs.length === 0) return null;

  return (
    <div className="sticky top-[50px] z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <nav
        className="-mb-px flex gap-7 overflow-x-auto px-3"
        aria-label="Profile sections"
      >
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            onClick={(e) => handleClick(e, tab.id)}
            className={`
              whitespace-nowrap border-b-2 px-0.5 py-3 text-sm font-medium transition-colors
              ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }
            `}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
