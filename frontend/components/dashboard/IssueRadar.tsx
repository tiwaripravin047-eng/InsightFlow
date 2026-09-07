import React from "react";
import { Insight } from "@/lib/types/api";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { formatPercent } from "@/lib/utils/formatters";
import { ArrowRight } from "lucide-react";

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
    <section
      aria-labelledby="prioritized-issues-title"
      className="rounded-lg border bg-card shadow-2xs overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3 bg-muted/20">
        <div>
          <h2 id="prioritized-issues-title" className="text-sm font-semibold text-foreground">
            Prioritized Issues
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ranked by impact, recurrence rate, and negative sentiment concentration.
          </p>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {sorted.length} issues identified
        </span>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-medium border-b">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-center w-14">Priority</th>
              <th scope="col" className="px-4 py-2.5">Issue & Category</th>
              <th scope="col" className="px-4 py-2.5">Severity</th>
              <th scope="col" className="px-4 py-2.5">Sentiment</th>
              <th scope="col" className="px-4 py-2.5">Trend</th>
              <th scope="col" className="px-4 py-2.5 text-right">Volume</th>
              <th scope="col" className="px-4 py-2.5 text-right">Confidence</th>
              <th scope="col" className="px-4 py-2.5 text-center w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-muted/30 transition-colors"
              >
                {/* Priority Score Column */}
                <td className="px-4 py-3 text-center">
                  <span className="font-mono font-semibold text-xs text-foreground">
                    #{item.priority_score}
                  </span>
                </td>

                {/* Title & Topic & Categories */}
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">
                    {item.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                    <span className="font-normal">{item.topic_label}</span>
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
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
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
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-ring rounded"
                  >
                    <span>Evidence</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
