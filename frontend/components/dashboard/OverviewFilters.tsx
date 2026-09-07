"use client";

import React, { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterChips, FilterChipItem } from "@/components/shared/FilterChips";
import { Filter } from "lucide-react";

export interface OverviewFiltersProps {
  categories?: string[];
  className?: string;
}

export const OverviewFilters: React.FC<OverviewFiltersProps> = ({
  categories = ["Hostel", "Cafeteria", "Library", "Campus Logistics", "Academics"],
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "";
  const currentSentiment = searchParams.get("sentiment") || "";
  const currentSeverity = searchParams.get("severity") || "";
  const currentSearch = searchParams.get("search") || "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("offset"); // reset pagination on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleRemoveChip = (key: string) => {
    updateParam(key, "");
  };

  const handleClearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  // Build active chips list
  const chips: FilterChipItem[] = [];
  if (currentCategory) {
    chips.push({ key: "category", label: "Category", value: currentCategory });
  }
  if (currentSentiment) {
    chips.push({ key: "sentiment", label: "Sentiment", value: currentSentiment });
  }
  if (currentSeverity) {
    chips.push({ key: "severity", label: "Severity", value: currentSeverity });
  }
  if (currentSearch) {
    chips.push({ key: "search", label: "Keyword", value: currentSearch, displayValue: `"${currentSearch}"` });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card border rounded-lg shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mr-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Filters:</span>
          </div>

          {/* Category Selector */}
          <select
            value={currentCategory}
            onChange={(e) => updateParam("category", e.target.value)}
            aria-label="Filter by Category"
            suppressHydrationWarning
            className="h-8 text-xs bg-background border border-input rounded px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Sentiment Selector */}
          <select
            value={currentSentiment}
            onChange={(e) => updateParam("sentiment", e.target.value)}
            aria-label="Filter by Sentiment"
            suppressHydrationWarning
            className="h-8 text-xs bg-background border border-input rounded px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="">All Sentiments</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
            <option value="positive">Positive</option>
          </select>

          {/* Severity Selector */}
          <select
            value={currentSeverity}
            onChange={(e) => updateParam("severity", e.target.value)}
            aria-label="Filter by Severity"
            suppressHydrationWarning
            className="h-8 text-xs bg-background border border-input rounded px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Debounced Search Input */}
        <div className="w-full sm:w-auto">
          <SearchInput
            value={currentSearch}
            onChange={(val) => updateParam("search", val)}
            placeholder="Search issues..."
          />
        </div>
      </div>

      {/* Removable Active Filter Chips */}
      <FilterChips chips={chips} onRemove={handleRemoveChip} onClearAll={handleClearAll} />
    </div>
  );
};
