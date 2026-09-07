import React from "react";
import { PeriodCompareResponse } from "@/lib/types/api";
import { formatPercent } from "@/lib/utils/formatters";
import { TrendingUp, TrendingDown, Sparkles, Minus, FileText } from "lucide-react";

export interface WhatChangedCardProps {
  compareData: PeriodCompareResponse | null;
  onOpenEvidence: (insightId: string) => void;
  className?: string;
}

export const WhatChangedCard: React.FC<WhatChangedCardProps> = ({
  compareData,
  onOpenEvidence,
  className,
}) => {
  if (!compareData) return null;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            What Changed? (Period Comparison)
          </h2>
          <p className="text-xs text-muted-foreground">
            Computed shift: This Month vs Prior Month
          </p>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
          Algorithmic delta detection
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Improved */}
        <div className="p-3.5 rounded-lg border bg-sentiment-positive-bg/40 border-sentiment-positive-border space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sentiment-positive-foreground">
            <TrendingDown className="w-3.5 h-3.5 text-sentiment-positive-foreground" aria-hidden="true" />
            <span>Improved (Reduced Friction)</span>
          </div>
          <div className="space-y-2">
            {compareData.improved.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-background/80 p-2 rounded border">
                <span className="font-semibold text-foreground">{item.topic}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sentiment-positive-foreground font-bold">
                    +{formatPercent(item.change_percent)}
                  </span>
                  {item.evidence_insight_id && (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(item.evidence_insight_id!)}
                      aria-label={`View evidence for ${item.topic}`}
                      className="p-0.5 text-muted-foreground hover:text-primary rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <FileText className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worsened */}
        <div className="p-3.5 rounded-lg border bg-sentiment-negative-bg/40 border-sentiment-negative-border space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sentiment-negative-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-sentiment-negative-foreground" aria-hidden="true" />
            <span>Worsened (Increased Friction)</span>
          </div>
          <div className="space-y-2">
            {compareData.worsened.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-background/80 p-2 rounded border">
                <span className="font-semibold text-foreground">{item.topic}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sentiment-negative-foreground font-bold">
                    +{formatPercent(item.change_percent)}
                  </span>
                  {item.evidence_insight_id && (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(item.evidence_insight_id!)}
                      aria-label={`View evidence for ${item.topic}`}
                      className="p-0.5 text-muted-foreground hover:text-primary rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <FileText className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emerging */}
        <div className="p-3.5 rounded-lg border bg-purple-500/5 border-purple-200 dark:border-purple-900/40 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span>Emerging (New Cluster)</span>
          </div>
          <div className="space-y-2">
            {compareData.emerging.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-background/80 p-2 rounded border">
                <span className="font-semibold text-foreground">{item.topic}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">
                    {item.volume} rows
                  </span>
                  {item.evidence_insight_id && (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(item.evidence_insight_id!)}
                      aria-label={`View evidence for ${item.topic}`}
                      className="p-0.5 text-muted-foreground hover:text-primary rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <FileText className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stable */}
        <div className="p-3.5 rounded-lg border bg-muted/40 border-border space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Minus className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Stable (Normal Bounds)</span>
          </div>
          <div className="space-y-2">
            {compareData.stable.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-background/80 p-2 rounded border">
                <span className="font-semibold text-foreground">{item.topic}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-muted-foreground font-semibold">
                    ~{formatPercent(item.change_percent)}
                  </span>
                  {item.evidence_insight_id && (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(item.evidence_insight_id!)}
                      aria-label={`View evidence for ${item.topic}`}
                      className="p-0.5 text-muted-foreground hover:text-primary rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <FileText className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
