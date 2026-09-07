import React from "react";
import { cn } from "@/lib/utils/cn";
import { Filter, X } from "lucide-react";

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export interface FilterBarProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 p-3 bg-card border rounded-lg shadow-2xs",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mr-1">
          <Filter className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Filters:</span>
        </div>

        {activeFilters.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">None active</span>
        ) : (
          activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border"
            >
              <span className="text-muted-foreground">{filter.label}:</span>
              <span className="font-semibold">{filter.value}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter(filter.key)}
                aria-label={`Remove filter for ${filter.label}`}
                className="ml-0.5 p-0.5 hover:bg-muted rounded-full focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" aria-hidden="true" />
              </button>
            </span>
          ))
        )}

        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-primary hover:underline ml-1 focus:outline-none focus:ring-1 focus:ring-ring rounded px-1"
          >
            Clear all
          </button>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2 ml-auto">{children}</div>
      )}
    </div>
  );
};
