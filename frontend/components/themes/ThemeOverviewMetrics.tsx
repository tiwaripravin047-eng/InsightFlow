import React from "react";
import { Theme } from "@/lib/types/api";
import { formatPercent } from "@/lib/utils/formatters";
import { Layers, GitBranch, AlertTriangle, BarChart3 } from "lucide-react";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Themes */}
      <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Discovered Themes</span>
          <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div className="text-2xl font-bold text-foreground">{totalThemes}</div>
        <div className="text-xs text-muted-foreground">Across {totalVolume} total verbatims</div>
      </div>

      {/* Total Sub-Themes */}
      <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Sub-Topic Branches</span>
          <GitBranch className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div className="text-2xl font-bold text-foreground">{totalSubThemes}</div>
        <div className="text-xs text-muted-foreground">Granular topic clusters</div>
      </div>

      {/* Leading Volume */}
      <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Dominant Category</span>
          <BarChart3 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="text-sm font-bold text-foreground truncate" title={topTheme?.label}>
          {topTheme ? topTheme.label : "—"}
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {topTheme ? `${topTheme.volume} mentions` : "—"}
        </div>
      </div>

      {/* Highest Negative Ratio */}
      <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Highest Friction</span>
          <AlertTriangle className="w-4 h-4 text-severity-high-foreground" aria-hidden="true" />
        </div>
        <div className="text-sm font-bold text-severity-high-foreground truncate" title={mostNegativeTheme?.label}>
          {mostNegativeTheme ? mostNegativeTheme.label : "—"}
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {mostNegativeTheme?.sentiment_breakdown?.negative
            ? `${formatPercent(mostNegativeTheme.sentiment_breakdown.negative * 100)} negative`
            : "—"}
        </div>
      </div>
    </div>
  );
};
