import React from "react";
import { AskFeedbackResponse } from "@/lib/types/api";
import { formatPercent } from "@/lib/utils/formatters";
import {
  Sparkles,
  Database,
  FileText,
  Filter,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export interface QueryResultCardProps {
  question: string;
  result: AskFeedbackResponse;
  onOpenEvidence: (insightId: string) => void;
  className?: string;
}

export const QueryResultCard: React.FC<QueryResultCardProps> = ({
  question,
  result,
  onOpenEvidence,
  className,
}) => {
  // If unanswerable, render distinct explanation per PRD §23 / Contract §8
  if (!result.answerable) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>Out-of-Domain / Unanswerable Query</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono italic">
          Query: &ldquo;{question}&rdquo;
        </p>
        <p className="text-xs text-foreground/90 leading-relaxed font-medium">
          {result.answer}
        </p>
      </div>
    );
  }

  const computed = result.computed_data || {};
  const drivers = (computed.top_drivers as string[]) || [];

  return (
    <div className="rounded-lg border bg-card p-5 shadow-2xs space-y-5">
      {/* Question Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span className="text-xs font-semibold text-foreground">
            &ldquo;{question}&rdquo;
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border">
          Grounded Synthesis
        </span>
      </div>

      {/* 1. Answer Narrative */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
          Synthesis
        </span>
        <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
          {result.answer}
        </p>
      </div>

      {/* 2. Supporting Computed Data (Visually Dominant over Narrative Claims) */}
      <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
          <Database className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>Supporting Computed Data</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {computed.change_percent !== undefined && (
            <div className="p-3 rounded-md bg-background border space-y-1">
              <span className="text-[11px] text-muted-foreground block">Volume Shift</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-trend-rising-foreground" aria-hidden="true" />
                <span className="text-lg font-bold text-trend-rising-foreground font-mono">
                  +{formatPercent(computed.change_percent as number)}
                </span>
              </div>
            </div>
          )}

          {computed.total_feedback !== undefined && (
            <div className="p-3 rounded-md bg-background border space-y-1">
              <span className="text-[11px] text-muted-foreground block">Analyzed Feedback</span>
              <span className="text-lg font-bold text-foreground font-mono">
                {String(computed.total_feedback)} rows
              </span>
            </div>
          )}

          {drivers.length > 0 && (
            <div className="p-3 rounded-md bg-background border space-y-1 sm:col-span-2 md:col-span-1">
              <span className="text-[11px] text-muted-foreground block">Primary Correlated Drivers</span>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {drivers.map((d, i) => (
                  <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-muted text-foreground border">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Clickable Evidence References */}
      {result.evidence_insight_ids && result.evidence_insight_ids.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Clickable Grounding Evidence
          </span>
          <div className="flex flex-wrap gap-2">
            {result.evidence_insight_ids.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onOpenEvidence(id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-background hover:bg-muted text-xs font-semibold text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <FileText className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>Verify Evidence [{id}]</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Applied Filters Metadata */}
      {result.filters_applied && Object.keys(result.filters_applied).length > 0 && (
        <div className="text-xs text-muted-foreground pt-2 border-t flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3" aria-hidden="true" />
            <span>Applied Query Filters:</span>
          </div>
          {Object.entries(result.filters_applied).map(([k, v]) => (
            <span key={k} className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded border">
              {k}: {String(v)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
