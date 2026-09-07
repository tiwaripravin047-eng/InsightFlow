import React from "react";
import { Insight } from "@/lib/types/api";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { formatPercent } from "@/lib/utils/formatters";
import { Radar, FileText, ArrowRight } from "lucide-react";

export interface IssueRadarProps {
  insights: Insight[];
  onOpenEvidence: (insightId: string) => void;
  className?: string;
}

export const IssueRadar: React.FC<IssueRadarProps> = ({
  insights,
  onOpenEvidence,
  className,
}) => {
  // Auto-ranked by priority_score descending
  const sorted = [...insights].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="rounded-lg border bg-card shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Priority Issue Radar
          </h2>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Ranked by Priority Formula
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {sorted.length} prioritized issues
        </span>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
            <tr>
              <th scope="col" className="px-4 py-3 text-center w-12">Score</th>
              <th scope="col" className="px-4 py-3">Issue Title & Topic</th>
              <th scope="col" className="px-4 py-3">Severity</th>
              <th scope="col" className="px-4 py-3">Sentiment</th>
              <th scope="col" className="px-4 py-3">Trend</th>
              <th scope="col" className="px-4 py-3 text-right">Volume</th>
              <th scope="col" className="px-4 py-3 text-right">Confidence</th>
              <th scope="col" className="px-4 py-3 text-center">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-muted/40 transition-colors group"
              >
                {/* Priority Score Bubble */}
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-mono font-bold text-xs text-primary border border-primary/20">
                    {item.priority_score}
                  </div>
                </td>

                {/* Title & Topic & Categories */}
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground leading-snug">
                    {item.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/80">{item.topic_label}</span>
                    <span>•</span>
                    <span>{item.affected_categories.join(", ")}</span>
                  </div>
                </td>

                {/* Severity */}
                <td className="px-4 py-3">
                  <SeverityBadge severity={item.severity} />
                </td>

                {/* Sentiment */}
                <td className="px-4 py-3">
                  <SentimentBadge sentiment={item.sentiment} />
                </td>

                {/* Trend */}
                <td className="px-4 py-3">
                  <TrendBadge trend={item.trend} changePercent={item.change_percent} />
                </td>

                {/* Volume */}
                <td className="px-4 py-3 text-right font-mono font-medium">
                  {item.volume}
                </td>

                {/* Confidence */}
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {formatPercent(item.confidence * 100)}
                </td>

                {/* Evidence Link */}
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onOpenEvidence(item.id)}
                    aria-label={`View evidence for ${item.title}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Evidence</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
