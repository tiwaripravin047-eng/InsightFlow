import React from "react";
import { Theme } from "@/lib/types/api";
import { formatPercent } from "@/lib/utils/formatters";

export interface ThemeOverviewMetricsProps {
  themes: Theme[];
  className?: string;
}

export const ThemeOverviewMetrics: React.FC<ThemeOverviewMetricsProps> = ({
  themes,
  className,
}) => {
  const totalThemes = themes.length;
  const totalSubThemes = themes.reduce((acc, t) => acc + (t.sub_themes?.length || 0), 0);
  const totalVolume = themes.reduce((acc, t) => acc + t.volume, 0);

  // Highest volume theme
  const topTheme = [...themes].sort((a, b) => b.volume - a.volume)[0];

  // Highest negative ratio theme
  const mostNegativeTheme = [...themes].sort(
    (a, b) => (b.sentiment_breakdown?.negative || 0) - (a.sentiment_breakdown?.negative || 0)
  )[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Themes */}
      <div className="rounded-lg border bg-card p-4 space-y-1">
        <div className="text-xs font-medium text-muted-foreground">
          Total Themes
        </div>
        <div className="text-2xl font-semibold font-mono text-foreground">{totalThemes}</div>
        <div className="text-xs text-muted-foreground">Across {totalVolume} verbatims</div>
      </div>

      {/* Total Sub-Themes */}
      <div className="rounded-lg border bg-card p-4 space-y-1">
        <div className="text-xs font-medium text-muted-foreground">
          Sub-Themes
        </div>
        <div className="text-2xl font-semibold font-mono text-foreground">{totalSubThemes}</div>
        <div className="text-xs text-muted-foreground">Granular topic branches</div>
      </div>

      {/* Leading Volume */}
      <div className="rounded-lg border bg-card p-4 space-y-1">
        <div className="text-xs font-medium text-muted-foreground">
          Dominant Category
        </div>
        <div className="text-sm font-semibold text-foreground truncate" title={topTheme?.label}>
          {topTheme ? topTheme.label : "—"}
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {topTheme ? `${topTheme.volume} mentions` : "—"}
        </div>
      </div>

      {/* Highest Negative Ratio */}
      <div className="rounded-lg border bg-card p-4 space-y-1">
        <div className="text-xs font-medium text-muted-foreground">
          Highest Negative Friction
        </div>
        <div className="text-sm font-semibold text-foreground truncate" title={mostNegativeTheme?.label}>
          {mostNegativeTheme ? mostNegativeTheme.label : "—"}
        </div>
        <div className="text-xs text-sentiment-negative-foreground font-mono font-medium">
          {mostNegativeTheme?.sentiment_breakdown?.negative
            ? `${formatPercent(mostNegativeTheme.sentiment_breakdown.negative * 100)} negative`
            : "—"}
        </div>
      </div>
    </div>
  );
};
