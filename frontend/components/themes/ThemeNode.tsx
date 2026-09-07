import React, { useState } from "react";
import { Theme, SubTheme } from "@/lib/types/api";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { formatPercent } from "@/lib/utils/formatters";
import { ChevronDown, ChevronRight, ArrowRight, CornerDownRight } from "lucide-react";

export interface ThemeNodeProps {
  theme: Theme;
  defaultExpanded?: boolean;
  onOpenEvidence: (insightId: string) => void;
  onExploreFeedback: (keyword: string) => void;
  className?: string;
}

export const ThemeNode: React.FC<ThemeNodeProps> = ({
  theme,
  defaultExpanded = false,
  onOpenEvidence,
  onExploreFeedback,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const breakdown = theme.sentiment_breakdown || { negative: 0, neutral: 0, positive: 0 };
  const negPct = (breakdown.negative || 0) * 100;
  const neutPct = (breakdown.neutral || 0) * 100;
  const posPct = (breakdown.positive || 0) * 100;

  return (
    <div className="rounded-lg border bg-card shadow-2xs overflow-hidden transition-all">
      {/* Primary Theme Node Header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        className="p-3.5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 focus-visible:bg-muted/50 focus-visible:outline-none select-none"
      >
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <div className="p-0.5 rounded text-muted-foreground hover:text-foreground">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-foreground" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="font-medium text-sm text-foreground flex items-center gap-2">
              <span>{theme.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded border">
                {theme.sub_themes?.length || 0} sub-themes
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {theme.volume} total verbatims
            </div>
          </div>
        </div>

        {/* Compact Horizontal Sentiment Distribution Bar */}
        <div className="flex-1 max-w-xs min-w-[180px] space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
            <span className="text-sentiment-negative-foreground font-medium">
              {formatPercent(negPct)} Neg
            </span>
            <span>{formatPercent(neutPct)} Neut</span>
            <span className="text-sentiment-positive-foreground font-medium">
              {formatPercent(posPct)} Pos
            </span>
          </div>
          <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-muted">
            <div style={{ width: `${negPct}%` }} className="bg-sentiment-negative" title={`Negative: ${formatPercent(negPct)}`} />
            <div style={{ width: `${neutPct}%` }} className="bg-sentiment-neutral" title={`Neutral: ${formatPercent(neutPct)}`} />
            <div style={{ width: `${posPct}%` }} className="bg-sentiment-positive" title={`Positive: ${formatPercent(posPct)}`} />
          </div>
        </div>

        {/* Trend & Primary Action */}
        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <TrendBadge trend={theme.trend} />
          <button
            type="button"
            onClick={() => onOpenEvidence("ins-food-quality-001")}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border bg-background hover:bg-muted text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          >
            <span>Evidence</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Expanded Sub-Themes Hierarchy */}
      {isExpanded && theme.sub_themes && theme.sub_themes.length > 0 && (
        <div className="border-t bg-muted/10 divide-y divide-border/50">
          {theme.sub_themes.map((sub: SubTheme) => {
            const subNeg = (sub.sentiment_breakdown?.negative || 0) * 100;
            return (
              <div
                key={sub.id}
                className="px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 hover:bg-muted/30 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-[200px]">
                  <CornerDownRight className="w-3 h-3 text-muted-foreground shrink-0" aria-hidden="true" />
                  <div>
                    <span className="font-medium text-foreground">{sub.label}</span>
                    <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                      ({sub.volume} mentions)
                    </span>
                  </div>
                </div>

                {/* Sub-theme sentiment indicator */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-muted-foreground">Negative:</span>
                    <span className="text-sentiment-negative-foreground font-medium">
                      {formatPercent(subNeg)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onExploreFeedback(sub.label)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 px-1 focus:outline-none focus:ring-1 focus:ring-ring rounded"
                  >
                    <span>Inspect Feedback</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
