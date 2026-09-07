import React from "react";
import { Issue } from "@/lib/types/api";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowRight } from "lucide-react";

export interface IssueListProps {
  issues: Issue[];
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
  onSelectIssue: (issue: Issue) => void;
  onOpenEvidence: (insightId: string) => void;
  className?: string;
}

const statusOptions = [
  { id: "", label: "All Statuses" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
  { id: "verified", label: "Verified" },
];

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  selectedStatus = "",
  onSelectStatus,
  onSelectIssue,
  onOpenEvidence,
  className,
}) => {
  const filtered = selectedStatus
    ? issues.filter((i) => i.status === selectedStatus)
    : issues;

  return (
    <div className="space-y-3">
      {/* Quiet Status Filter Tabs */}
      {onSelectStatus && (
        <div className="flex flex-wrap items-center gap-1 border-b pb-2 text-xs">
          {statusOptions.map((opt) => {
            const isSelected = selectedStatus === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectStatus(opt.id)}
                aria-pressed={isSelected}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Issues Comparison Table */}
      <div className="w-full border rounded-lg bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider sticky top-0 z-10 border-b">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-center w-14">Priority</th>
                <th scope="col" className="px-4 py-2.5 min-w-[240px]">Issue & Affected Segments</th>
                <th scope="col" className="px-3 py-2.5">Severity</th>
                <th scope="col" className="px-3 py-2.5">Status</th>
                <th scope="col" className="px-3 py-2.5">Trend</th>
                <th scope="col" className="px-3 py-2.5 text-right">Volume</th>
                <th scope="col" className="px-3 py-2.5 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filtered.map((issue) => (
                <tr
                  key={issue.id}
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => onSelectIssue(issue)}
                >
                  {/* Priority Score */}
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-semibold text-xs text-foreground">
                      #{issue.priority_score}
                    </span>
                  </td>

                  {/* Title & Segments */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {issue.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-normal">{issue.topic_label}</span>
                      {issue.affected_segments?.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{issue.affected_segments.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Severity */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <SeverityBadge severity={issue.severity} />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <StatusBadge status={issue.status} />
                  </td>

                  {/* Trend */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <TrendBadge trend={issue.trend} changePercent={issue.change_percent} />
                  </td>

                  {/* Volume */}
                  <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                    {issue.volume}
                  </td>

                  {/* Action Buttons */}
                  <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenEvidence(issue.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-foreground hover:bg-muted border border-border/80 focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                      >
                        <span>Evidence</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectIssue(issue)}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 px-1 py-1"
                      >
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
