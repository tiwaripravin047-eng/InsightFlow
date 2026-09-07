import React from "react";
import { ArrowRight, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

export interface ExecutiveSummaryProps {
  onOpenEvidence: (insightId: string) => void;
  className?: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  onOpenEvidence,
  className,
}) => {
  return (
    <section
      aria-labelledby="overview-summary-title"
      className="rounded-lg border bg-card p-5 text-card-foreground space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 id="overview-summary-title" className="text-sm font-semibold text-foreground">
          Key Summary & Signals
        </h2>
        <span className="text-xs text-muted-foreground font-mono">30-day window</span>
      </div>

      {/* Primary Statement */}
      <p className="text-sm text-foreground/90 leading-relaxed max-w-4xl">
        Negative feedback increased primarily due to connectivity disruptions in library study zones and dining hall meal service delays, while satisfaction with digital catalog resources rose steadily.
      </p>

      {/* 3 Concrete Supporting Signal Blocks (Insight -> Why -> Evidence) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Signal 1 */}
        <div className="p-3 rounded-md bg-muted/40 border flex flex-col justify-between space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-severity-critical-foreground" aria-hidden="true" />
                <span>Wi-Fi Connectivity</span>
              </span>
              <span className="font-mono text-[11px] text-severity-critical-foreground font-medium">
                88% neg
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              328 complaints regarding afternoon drops in the Main Library.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenEvidence("ins-wifi-reliability-002")}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors self-start focus:outline-none focus:ring-1 focus:ring-ring rounded"
          >
            <span>View evidence</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        {/* Signal 2 */}
        <div className="p-3 rounded-md bg-muted/40 border flex flex-col justify-between space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-severity-high-foreground" aria-hidden="true" />
                <span>Dining Freshness</span>
              </span>
              <span className="font-mono text-[11px] text-severity-high-foreground font-medium">
                +37% vol
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              214 verbatims citing cold food and peak service delays in Dining Hall B.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenEvidence("ins-food-quality-001")}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors self-start focus:outline-none focus:ring-1 focus:ring-ring rounded"
          >
            <span>View evidence</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        {/* Signal 3 */}
        <div className="p-3 rounded-md bg-muted/40 border flex flex-col justify-between space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-sentiment-positive-foreground" aria-hidden="true" />
                <span>Digital Portal</span>
              </span>
              <span className="font-mono text-[11px] text-sentiment-positive-foreground font-medium">
                74% pos
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              184 verbatims commending off-campus proxy access and search speeds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenEvidence("ins-library-hours-004")}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors self-start focus:outline-none focus:ring-1 focus:ring-ring rounded"
          >
            <span>View evidence</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
