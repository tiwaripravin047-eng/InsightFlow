import React from "react";
import { Sparkles, ArrowUpRight, ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";

export interface ExecutiveSummaryProps {
  onOpenEvidence: (insightId: string) => void;
  className?: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  onOpenEvidence,
  className,
}) => {
  return (
    <div className="rounded-lg border bg-gradient-to-r from-card via-card to-primary/5 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            AI Executive Digest
          </h2>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border">
          Model: roberta-v1 + llama-grounded
        </span>
      </div>

      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
        Feedback volume increased <strong className="font-semibold text-foreground">+12.4%</strong> over the past 30 days.
        Operational dissatisfaction is strongly concentrated in two critical clusters:
        <span className="inline-block mx-1 font-semibold text-severity-high-foreground underline decoration-dotted underline-offset-2">
          Food Quality (+37% growth)
        </span>
        and
        <span className="inline-block mx-1 font-semibold text-severity-critical-foreground underline decoration-dotted underline-offset-2">
          Wi-Fi Connectivity (328 mentions, 88% negative)
        </span>
        . Meanwhile, positive sentiment around digital library access improved (+14.5%).
      </p>

      {/* Grounded Key Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Finding 1 */}
        <div className="p-3 rounded-md border bg-background/80 flex flex-col justify-between space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-severity-high-foreground">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Mess Food Freshness</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-trend-rising-foreground bg-trend-rising-bg px-1.5 py-0.5 rounded">
              +37.0%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            214 verbatims citing cold meals & serving delays in Dining Hall B.
          </p>
          <button
            type="button"
            onClick={() => onOpenEvidence("ins-food-quality-001")}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline self-start pt-1 focus:outline-none focus:ring-1 focus:ring-ring rounded"
          >
            <span>Review Evidence</span>
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        {/* Finding 2 */}
        <div className="p-3 rounded-md border bg-background/80 flex flex-col justify-between space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-severity-critical-foreground">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Library Wi-Fi Drops</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-severity-critical-foreground bg-severity-critical-bg px-1.5 py-0.5 rounded">
              Critical (88% Neg)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            328 verbatims citing dropped connections during afternoon study hours.
          </p>
          <button
            type="button"
            onClick={() => onOpenEvidence("ins-wifi-reliability-002")}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline self-start pt-1 focus:outline-none focus:ring-1 focus:ring-ring rounded"
          >
            <span>Review Evidence</span>
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        {/* Finding 3 */}
        <div className="p-3 rounded-md border bg-background/80 flex flex-col justify-between space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sentiment-positive-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Digital Catalog Portal</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-sentiment-positive-foreground bg-sentiment-positive-bg px-1.5 py-0.5 rounded">
              74% Positive
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            184 verbatims praising remote research access speed and off-campus proxy.
          </p>
          <button
            type="button"
            onClick={() => onOpenEvidence("ins-library-hours-004")}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline self-start pt-1 focus:outline-none focus:ring-1 focus:ring-ring rounded"
          >
            <span>Review Evidence</span>
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
