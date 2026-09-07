"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Database, Search, Menu } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export interface TopBarProps {
  currentDatasetId: string;
  datasets?: Array<{ id: string; name: string }>;
  className?: string;
  onToggleMobileNav?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentDatasetId,
  datasets = [
    { id: "demo-college-2026", name: "College Feedback Q3 2026" },
    { id: "city-hospital-q2", name: "City Hospital Patient Experience" },
  ],
  className,
  onToggleMobileNav,
}) => {
  const router = useRouter();

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    router.push(`/dashboard/${newId}/overview`);
  };

  return (
    <header
      className={cn(
        "h-13 border-b bg-card px-4 flex items-center justify-between gap-4 select-none shrink-0 z-20",
        className
      )}
    >
      {/* Brand & Dataset Selector */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileNav && (
          <button
            type="button"
            onClick={onToggleMobileNav}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        <Link
          href={`/dashboard/${currentDatasetId}/overview`}
          className="md:hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-1 focus:ring-ring rounded"
        >
          <Logo size="sm" showText={false} />
        </Link>
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          <label htmlFor="dataset-selector" className="sr-only">
            Select Active Dataset
          </label>
          <select
            id="dataset-selector"
            value={currentDatasetId}
            onChange={handleDatasetChange}
            suppressHydrationWarning
            className="text-xs font-medium bg-background border border-input rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer max-w-xs"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Search & Honest Mode Indicator */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/${currentDatasetId}/ask`)}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <Search className="w-3 h-3" aria-hidden="true" />
          <span>Search or query feedback...</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted border">
          <span>Demo Data</span>
        </span>
      </div>
    </header>
  );
};
