import React from "react";
import { PeriodCompareResponse } from "@/lib/types/api";
import { formatPercent } from "@/lib/utils/formatters";
import { TrendingUp, TrendingDown, ArrowRight, Minus } from "lucide-react";

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
    <section
      aria-labelledby="what-changed-title"
      className="rounded-lg border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 id="what-changed-title" className="text-sm font-semibold text-foreground">
            What Changed? (Period Comparison)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Shift in recurring complaint topics compared to prior period.
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-mono">Current vs Prior</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Improved */}
        <div className="p-3 rounded border bg-muted/20 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sentiment-positive-foreground">
            <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Improved</span>
          </div>
          <div className="space-y-1.5">
            {compareData.improved.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                <span className="text-foreground font-medium truncate max-w-[120px]" title={item.topic}>{item.topic}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sentiment-positive-foreground text-[11px] font-medium">
                    +{formatPercent(item.change_percent)}
                  </span>
                  {item.evidence_insight_id && (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(item.evidence_insight_id!)}
                      aria-label={`View evidence for ${item.topic}`}
                      className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring p-0.5"
                    >
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worsened */}
        <div className="p-3 rounded border bg-muted/20 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sentiment-negative-foreground">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Worsened</span>
          </div>
          <div className="space-y-1.5">
            {compareData.worsened.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                <span className="text-foreground font-medium truncate max-w-[120px]" title={item.topic}>{item.topic}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sentiment-negative-foreground text-[11px] font-medium">
                    +{formatPercent(item.change_percent)}
                  </span>
                  {item.evidence_insight_id && (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(item.evidence_insight_id!)}
                      aria-label={`View evidence for ${item.topic}`}
                      className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring p-0.5"
                    >
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emerging */}
        <div className="p-3 rounded border bg-muted/20 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Emerging</span>
          </div>
          <div className="space-y-1.5">
            {compareData.emerging.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                <span className="text-foreground font-medium truncate max-w-[120px]" title={item.topic}>{item.topic}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    New
                  </span>
                  {item.evidence_insight_id && (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(item.evidence_insight_id!)}
                      aria-label={`View evidence for ${item.topic}`}
                      className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring p-0.5"
                    >
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stable */}
        <div className="p-3 rounded border bg-muted/20 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Stable</span>
          </div>
          <div className="space-y-1.5">
            {compareData.stable.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                <span className="text-foreground font-medium truncate max-w-[120px]" title={item.topic}>{item.topic}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {formatPercent(item.change_percent)}
                  </span>
                  {item.evidence_insight_id && (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(item.evidence_insight_id!)}
                      aria-label={`View evidence for ${item.topic}`}
                      className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring p-0.5"
                    >
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
