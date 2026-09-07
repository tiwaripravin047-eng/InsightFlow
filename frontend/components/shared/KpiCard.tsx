import React from "react";
import { cn } from "@/lib/utils/cn";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

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

  let deltaColor = "text-muted-foreground bg-muted";
  let DeltaIcon = Minus;

  if (delta) {
    const isWorse = delta.isInverse ? delta.value > 0 : delta.value < 0;
    const isBetter = delta.isInverse ? delta.value < 0 : delta.value > 0;

    if (isBetter) {
      deltaColor = "text-sentiment-positive-foreground bg-sentiment-positive-bg border border-sentiment-positive-border";
      DeltaIcon = ArrowUpRight;
    } else if (isWorse) {
      deltaColor = "text-sentiment-negative-foreground bg-sentiment-negative-bg border border-sentiment-negative-border";
      DeltaIcon = ArrowDownRight;
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
        "rounded-lg border bg-card p-5 shadow-sm transition-all text-card-foreground",
        isClickable &&
          "cursor-pointer hover:border-primary/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold select-none",
              deltaColor
            )}
          >
            <DeltaIcon className="w-3 h-3" aria-hidden="true" />
            <span>
              {delta.value > 0 ? "+" : ""}
              {delta.value}%
            </span>
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-muted-foreground">{subValue}</span>
        )}
      </div>

      {delta?.label && (
        <p className="mt-1 text-xs text-muted-foreground">{delta.label}</p>
      )}
    </div>
  );
};
