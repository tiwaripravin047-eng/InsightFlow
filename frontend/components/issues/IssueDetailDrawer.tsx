import React, { useState, useEffect } from "react";
import { Issue } from "@/lib/types/api";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { formatPercent } from "@/lib/utils/formatters";
import {
  X,
  FileText,
  AlertTriangle,
  Lightbulb,
  Cpu,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";

export interface IssueDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  onOpenEvidence: (insightId: string) => void;
}

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  isOpen,
  onClose,
  issue,
  onOpenEvidence,
}) => {
  const [showTechInternals, setShowTechInternals] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !issue) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-detail-title"
    >
      <div className="w-full max-w-lg h-full bg-card border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b flex items-start justify-between bg-muted/30">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={issue.severity} />
              <StatusBadge status={issue.status} />
              <TrendBadge trend={issue.trend} changePercent={issue.change_percent} />
            </div>
            <h2 id="issue-detail-title" className="text-sm font-bold text-foreground leading-snug pt-1">
              {issue.title}
            </h2>
            <div className="text-[11px] text-muted-foreground">
              Topic: <strong className="text-foreground">{issue.topic_label}</strong>
              {issue.owner && <> • Owner: <span className="font-semibold">{issue.owner}</span></>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          {/* Grounded Narrative Description */}
          <div className="p-3.5 rounded-lg bg-muted/30 border space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Operational Impact Description
            </span>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {issue.description}
            </p>
          </div>

          {/* Priority Score & Factor Breakdown */}
          <div className="p-3.5 rounded-lg border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Priority Score Formula
                </span>
                <span className="text-xl font-extrabold text-foreground">
                  {issue.priority_score} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
                </span>
              </div>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                Volume: {issue.volume} mentions ({issue.unique_issue_count} unique)
              </span>
            </div>

            {issue.priority_factors && (
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                <div>
                  <span className="text-muted-foreground text-[11px] block">Sentiment Severity</span>
                  <strong className="font-mono text-foreground">{issue.priority_factors.sentiment_severity}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Recent Growth Rate</span>
                  <strong className="font-mono text-foreground">{issue.priority_factors.growth_rate}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Recurrence Factor</span>
                  <strong className="font-mono text-foreground">{issue.priority_factors.recurrence}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Urgency Signal</span>
                  <strong className="font-mono text-foreground">{issue.priority_factors.urgency_signal}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Correlated Drivers (Never Causal per RULES.md §7) */}
          {issue.likely_drivers?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Correlated Signals (Likely Drivers)</span>
              </div>
              <div className="space-y-1.5">
                {issue.likely_drivers.map((driver, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded border bg-background text-xs">
                    <span className="font-medium text-foreground">{driver.topic}</span>
                    <span className="font-mono text-xs font-bold text-primary">
                      {formatPercent(driver.correlation_strength * 100)} correlation
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * Statistical association signal only; causal direction is not inferred.
              </p>
            </div>
          )}

          {/* Recommended Actions */}
          {issue.recommended_actions?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                <span>AI Recommended Actions</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-4 text-xs text-foreground/90">
                {issue.recommended_actions.map((act, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible Technical Model Internals */}
          <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
            <button
              type="button"
              onClick={() => setShowTechInternals((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Model Internals & Confidence Factors</span>
              </div>
              {showTechInternals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTechInternals && (
              <div className="pt-2 border-t space-y-2 text-xs font-mono text-muted-foreground">
                <div className="flex justify-between">
                  <span>Overall Confidence:</span>
                  <strong className="text-foreground">{formatPercent(issue.confidence * 100)}</strong>
                </div>
                {issue.confidence_factors && (
                  <>
                    <div className="flex justify-between">
                      <span>Topic Coherence:</span>
                      <span>{issue.confidence_factors.topic_coherence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duplicate Ratio:</span>
                      <span>{issue.confidence_factors.duplicate_ratio}</span>
                    </div>
                  </>
                )}
                {issue.model_versions && (
                  <div className="text-[10px] text-muted-foreground pt-1 border-t">
                    Versions: {issue.model_versions.sentiment} • {issue.model_versions.embedding} • {issue.model_versions.pipeline}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Prominent View Evidence Button */}
        <div className="p-4 border-t bg-muted/20">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenEvidence(issue.id);
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>View Supporting Evidence Verbatims ({issue.volume} records)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
