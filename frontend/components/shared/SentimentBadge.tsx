import React from "react";
import { SentimentType } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";
import { Frown, Meh, Smile, Shuffle } from "lucide-react";

export interface SentimentBadgeProps {
  sentiment: SentimentType | string;
  className?: string;
  showIcon?: boolean;
}

const sentimentConfig: Record<
  SentimentType,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }> }
> = {
  positive: {
    label: "Positive",
    bg: "bg-sentiment-positive-bg",
    text: "text-sentiment-positive-foreground",
    border: "border-sentiment-positive-border",
    icon: Smile,
  },
  negative: {
    label: "Negative",
    bg: "bg-sentiment-negative-bg",
    text: "text-sentiment-negative-foreground",
    border: "border-sentiment-negative-border",
    icon: Frown,
  },
  neutral: {
    label: "Neutral",
    bg: "bg-sentiment-neutral-bg",
    text: "text-sentiment-neutral-foreground",
    border: "border-sentiment-neutral-border",
    icon: Meh,
  },
  mixed: {
    label: "Mixed",
    bg: "bg-sentiment-mixed-bg",
    text: "text-sentiment-mixed-foreground",
    border: "border-sentiment-mixed-border",
    icon: Shuffle,
  },
};

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  className,
  showIcon = true,
}) => {
  const normKey = (sentiment?.toLowerCase() || "neutral") as SentimentType;
  const config = sentimentConfig[normKey] || sentimentConfig.neutral;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border",
        config.bg,
        config.text,
        config.border,
        className
      )}
      role="status"
      aria-label={`Sentiment: ${config.label}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden={true} />}
      <span>{config.label}</span>
    </span>
  );
};
