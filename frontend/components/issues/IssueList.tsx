import React from "react";
import { Issue } from "@/lib/types/api";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FileText, ChevronRight, AlertOctagon } from "lucide-react";

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
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      {onSelectStatus && (
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 border rounded-lg w-fit text-xs">
          {statusOptions.map((opt) => {
            const isSelected = selectedStatus === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectStatus(opt.id)}
                aria-pressed={isSelected}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  isSelected
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Issues Table */}
      <div className="w-full border rounded-lg bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 border-b">
              <tr>
                <th scope="col" className="px-4 py-3 text-center w-12">Score</th>
                <th scope="col" className="px-4 py-3 min-w-[240px]">Issue & Affected Segments</th>
                <th scope="col" className="px-3 py-3">Severity</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3">Trend</th>
                <th scope="col" className="px-3 py-3 text-right">Volume</th>
                <th scope="col" className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filtered.map((issue) => (
                <tr
                  key={issue.id}
                  className="hover:bg-muted/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectIssue(issue)}
                >
                  {/* Priority Score */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-mono font-bold text-xs text-primary border border-primary/20">
                      {issue.priority_score}
                    </div>
                  </td>

                  {/* Title & Segments */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-foreground leading-snug">
                      {issue.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/80">{issue.topic_label}</span>
                      {issue.affected_segments?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="italic">{issue.affected_segments.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Severity */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <SeverityBadge severity={issue.severity} />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <StatusBadge status={issue.status} />
                  </td>

                  {/* Trend */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <TrendBadge trend={issue.trend} changePercent={issue.change_percent} />
                  </td>

                  {/* Volume */}
                  <td className="px-3 py-3.5 text-right font-mono font-medium">
                    {issue.volume}
                  </td>

                  {/* Action Buttons */}
                  <td className="px-3 py-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenEvidence(issue.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Evidence</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectIssue(issue)}
                        className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline px-1 py-1"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" aria-hidden="true" />
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
