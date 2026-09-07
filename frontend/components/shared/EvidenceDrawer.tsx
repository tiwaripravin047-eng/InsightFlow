"use client";

import React, { useEffect } from "react";
import { EvidenceResponse } from "@/lib/types/api";
import { SentimentBadge } from "./SentimentBadge";
import { formatPercent, formatDate } from "@/lib/utils/formatters";
import { X, FileText, Calendar, Filter, ExternalLink, Download } from "lucide-react";

export interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  evidence: EvidenceResponse | null;
  isLoading?: boolean;
  onViewAllFeedback?: (filters: Record<string, string>) => void;
  datasetId?: string;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  title = "Supporting Evidence",
  evidence,
  isLoading = false,
  onViewAllFeedback,
  datasetId,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dist = evidence?.sentiment_distribution;

  const handleViewAllFeedback = () => {
    if (!evidence) return;
    if (onViewAllFeedback) {
      onViewAllFeedback(evidence.filters_used || {});
      return;
    }
    if (datasetId && typeof window !== "undefined") {
      const qp = new URLSearchParams(evidence.filters_used || {});
      window.location.href = `/dashboard/${datasetId}/feedback?${qp.toString()}`;
      onClose();
    }
  };

  const handleExportEvidence = () => {
    if (!evidence) return;
    const rows = [
      ["Feedback ID", "Sentiment", "Date", "Verbatim"],
      ...evidence.representative_samples.map((s) => [
        s.feedback_id,
        s.sentiment,
        s.date,
        `"${s.text.replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `evidence_${evidence.insight_id || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-drawer-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-card border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <h2 id="evidence-drawer-title" className="text-sm font-semibold text-foreground truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          ) : !evidence ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No evidence records found for this insight.
            </div>
          ) : (
            <>
              {/* Evidence Metrics Summary */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border">
                <div>
                  <span className="text-xs text-muted-foreground block">Evidence Sample</span>
                  <span className="text-lg font-bold text-foreground">
                    {evidence.evidence_count} records
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Time Window</span>
                  <span className="text-xs font-medium text-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                    {formatDate(evidence.date_range.from)} – {formatDate(evidence.date_range.to)}
                  </span>
                </div>
              </div>

              {/* Sentiment Distribution Breakdown */}
              {dist && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">Sentiment Breakdown</span>
                    <span className="font-mono text-[11px]">
                      {formatPercent(dist.negative * 100)} negative
                    </span>
                  </div>
                  <div className="h-2 w-full flex rounded-full overflow-hidden bg-muted">
                    <div
                      style={{ width: `${dist.negative * 100}%` }}
                      className="bg-sentiment-negative"
                      title={`Negative: ${formatPercent(dist.negative * 100)}`}
                    />
                    <div
                      style={{ width: `${dist.neutral * 100}%` }}
                      className="bg-sentiment-neutral"
                      title={`Neutral: ${formatPercent(dist.neutral * 100)}`}
                    />
                    <div
                      style={{ width: `${dist.positive * 100}%` }}
                      className="bg-sentiment-positive"
                      title={`Positive: ${formatPercent(dist.positive * 100)}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span className="text-sentiment-negative-foreground font-medium">
                      Neg: {formatPercent(dist.negative * 100)}
                    </span>
                    <span>Neut: {formatPercent(dist.neutral * 100)}</span>
                    <span className="text-sentiment-positive-foreground font-medium">
                      Pos: {formatPercent(dist.positive * 100)}
                    </span>
                  </div>
                </div>
              )}

              {/* Representative Customer Verbatims */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Representative Customer Verbatims
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {evidence.representative_samples.length} samples
                  </span>
                </div>

                <div className="space-y-2.5">
                  {evidence.representative_samples.map((sample) => (
                    <div
                      key={sample.feedback_id}
                      className="p-3 rounded-lg border bg-background text-xs space-y-2"
                    >
                      <p className="text-foreground leading-relaxed italic">
                        &ldquo;{sample.text}&rdquo;
                      </p>
                      <div className="flex items-center justify-between text-muted-foreground pt-2 border-t border-border/50 text-[11px]">
                        <div className="flex items-center gap-2">
                          <SentimentBadge sentiment={sample.sentiment} />
                          <span className="font-mono text-muted-foreground">
                            {sample.feedback_id}
                          </span>
                        </div>
                        <span>{formatDate(sample.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Query Filters Used */}
              {evidence.filters_used && Object.keys(evidence.filters_used).length > 0 && (
                <div className="text-xs text-muted-foreground pt-2 border-t flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Grounding Filters: </span>
                  <span className="font-mono text-xs truncate">
                    {Object.entries(evidence.filters_used)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {evidence && (
          <div className="p-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={handleViewAllFeedback}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            >
              <span>Explore All {evidence.evidence_count} Matching Records</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleExportEvidence}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border bg-background hover:bg-muted text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring transition-colors shrink-0"
              title="Export representative evidence as CSV"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
