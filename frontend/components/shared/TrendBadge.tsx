import React from "react";
import { TrendType } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, Minus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

export interface TrendBadgeProps {
  trend: TrendType | string;
  changePercent?: number | null;
  className?: string;
  showIcon?: boolean;
}

const trendConfig: Record<
  TrendType,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }> }
> = {
  rising: {
    label: "Rising",
    bg: "bg-trend-rising-bg",
    text: "text-trend-rising-foreground",
    icon: TrendingUp,
  },
  declining: {
    label: "Declining",
    bg: "bg-trend-declining-bg",
    text: "text-trend-declining-foreground",
    icon: TrendingDown,
  },
  stable: {
    label: "Stable",
    bg: "bg-trend-stable-bg",
    text: "text-trend-stable-foreground",
    icon: Minus,
  },
  emerging: {
    label: "Emerging",
    bg: "bg-trend-emerging-bg",
    text: "text-trend-emerging-foreground",
    icon: Sparkles,
  },
  resolved: {
    label: "Resolved",
    bg: "bg-sentiment-positive-bg",
    text: "text-sentiment-positive-foreground",
    icon: CheckCircle2,
  },
};

export const TrendBadge: React.FC<TrendBadgeProps> = ({
  trend,
  changePercent,
  className,
  showIcon = true,
}) => {
  const normKey = (trend?.toLowerCase() || "stable") as TrendType;
  const config = trendConfig[normKey] || trendConfig.stable;
  const Icon = config.icon;

  const displayChange =
    changePercent !== undefined && changePercent !== null
      ? ` (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%)`
      : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border border-transparent",
        config.bg,
        config.text,
        className
      )}
      role="status"
      aria-label={`Trend: ${config.label}${displayChange}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden={true} />}
      <span>
        {config.label}
        {displayChange}
      </span>
    </span>
  );
};
