"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // Assuming utils exists, if not I'll create a simple one or use template literals

export type MatchTab = "analyse" | "h2h" | "compos" | "events" | "stats";

interface MatchTabsProps {
  currentTab: MatchTab;
  onTabChange: (tab: MatchTab) => void;
  showLiveTabs: boolean;
  isLive?: boolean;
}

export function MatchTabs({ currentTab, onTabChange, showLiveTabs, isLive = false }: MatchTabsProps) {
  const tabs = [
    { id: "analyse", label: "Analyse" },
    { id: "compos", label: "Compos" },
  ];

  if (showLiveTabs) {
    tabs.push({ id: "events", label: "Évènements" });
    if (!isLive) {
      tabs.push({ id: "stats", label: "Statistiques" });
    }
  }

  return (
    <nav className="flex items-center justify-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex rounded-2xl bg-zinc-900/80 p-1.5 backdrop-blur-sm shadow-xl border border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as MatchTab)}
            className={`
              relative px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl
              ${currentTab === tab.id 
                ? "bg-zinc-800 text-cyan-400 shadow-lg" 
                : "text-zinc-500 hover:text-zinc-300"
              }
            `}
          >
            {tab.label}
            {currentTab === tab.id && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-cyan-500" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
