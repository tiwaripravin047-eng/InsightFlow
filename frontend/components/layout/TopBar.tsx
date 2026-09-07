"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Database, Search } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export interface TopBarProps {
  currentDatasetId: string;
  datasets?: Array<{ id: string; name: string }>;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentDatasetId,
  datasets = [
    { id: "demo-college-2026", name: "College Feedback Q3 2026" },
    { id: "city-hospital-q2", name: "City Hospital Patient Experience" },
  ],
  className,
}) => {
  const router = useRouter();

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    router.push(`/dashboard/${newId}/overview`);
  };

  return (
    <header
      className={cn(
        "h-14 border-b bg-card px-4 flex items-center justify-between gap-4 select-none shrink-0 z-20",
        className
      )}
    >
      {/* Brand & Dataset Selector */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/${currentDatasetId}/overview`}
          className="md:hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-1 focus:ring-ring rounded-md"
        >
          <Logo size="sm" showText={false} />
        </Link>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <label htmlFor="dataset-selector" className="sr-only">
            Select Active Dataset
          </label>
          <select
            id="dataset-selector"
            value={currentDatasetId}
            onChange={handleDatasetChange}
            suppressHydrationWarning
            className="text-xs font-semibold bg-background border border-input rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer max-w-xs"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Quick Actions & Mode Indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/${currentDatasetId}/ask`)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/60 hover:bg-muted rounded-md border transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <Search className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ask question about dataset...</span>
          <kbd className="ml-2 text-[10px] font-mono bg-background border px-1.5 py-0.5 rounded text-muted-foreground">
            Ask AI
          </kbd>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Mocks Active</span>
        </div>
      </div>
    </header>
  );
};
