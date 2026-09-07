import React from "react";
import { cn } from "@/lib/utils/cn";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  delta?: {
    value: number;
    label?: string;
    isInverse?: boolean; // If true, negative delta is good (e.g. reduction in complaints)
  };
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subValue,
  delta,
  onClick,
  className,
}) => {
  const isClickable = Boolean(onClick);

  let deltaTextColor = "text-muted-foreground";
  let DeltaIcon = Minus;

  if (delta) {
    const isWorse = delta.isInverse ? delta.value > 0 : delta.value < 0;
    const isBetter = delta.isInverse ? delta.value < 0 : delta.value > 0;

    if (isBetter) {
      deltaTextColor = "text-sentiment-positive-foreground";
      DeltaIcon = ArrowUp;
    } else if (isWorse) {
      deltaTextColor = "text-sentiment-negative-foreground";
      DeltaIcon = ArrowDown;
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      className={cn(
        "rounded-lg border bg-card p-4 transition-colors text-card-foreground",
        isClickable &&
          "cursor-pointer hover:bg-muted/30 hover:border-foreground/20 focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
    >
      <div className="text-xs font-medium text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground font-mono">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-muted-foreground truncate">{subValue}</span>
        )}
      </div>

      {delta && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("inline-flex items-center gap-0.5 font-medium", deltaTextColor)}>
            <DeltaIcon className="w-3 h-3" aria-hidden="true" />
            <span>
              {delta.value > 0 ? "+" : ""}
              {delta.value}%
            </span>
          </span>
          {delta.label && <span>{delta.label}</span>}
        </div>
      )}
    </div>
  );
};
