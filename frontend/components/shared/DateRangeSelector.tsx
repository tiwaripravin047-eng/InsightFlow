import React from "react";
import { cn } from "@/lib/utils/cn";
import { Calendar } from "lucide-react";

export interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const presets = [
  { id: "7d", label: "Past 7 Days" },
  { id: "30d", label: "Past 30 Days" },
  { id: "90d", label: "Past 90 Days" },
  { id: "all", label: "All Time" },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn("inline-flex items-center gap-1 bg-muted/60 p-1 rounded-md border text-xs", className)}>
      <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1 mr-0.5" aria-hidden="true" />
      {presets.map((preset) => {
        const isSelected = value === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            aria-pressed={isSelected}
            className={cn(
              "px-2.5 py-1 rounded font-medium transition-colors select-none",
              isSelected
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};
