import React from "react";
import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";

export interface FilterChipItem {
  key: string;
  label: string;
  value: string;
  displayValue?: string;
}

export interface FilterChipsProps {
  chips: FilterChipItem[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  onRemove,
  onClearAll,
  className,
}) => {
  if (!chips || chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 pt-1", className)}>
      <span className="text-[11px] text-muted-foreground mr-0.5">Active:</span>
      {chips.map((chip) => (
        <span
          key={`${chip.key}-${chip.value}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-foreground border border-border/80 select-none"
        >
          <span className="text-muted-foreground font-normal">{chip.label}:</span>
          <span className="font-medium capitalize">{chip.displayValue || chip.value}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={`Remove filter ${chip.label}`}
            className="text-muted-foreground hover:text-foreground rounded p-0.5 focus:outline-none focus:ring-1 focus:ring-ring ml-0.5"
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        </span>
      ))}

      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1 px-1 focus:outline-none focus:ring-1 focus:ring-ring rounded"
        >
          Clear all
        </button>
      )}
    </div>
  );
};
