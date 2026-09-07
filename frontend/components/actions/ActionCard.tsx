import React from "react";
import { Action, ActionStatus } from "@/lib/types/api";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatPercent } from "@/lib/utils/formatters";
import { User, Calendar, FileText, TrendingDown, ArrowRight, RotateCw } from "lucide-react";

export interface ActionCardProps {
  action: Action;
  isPending?: boolean;
  onUpdateStatus: (actionId: string, newStatus: ActionStatus) => void;
  onOpenEvidence: (issueId: string) => void;
  className?: string;
}

const nextStatusMap: Record<ActionStatus, ActionStatus | null> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: "verified",
  verified: null,
};

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  isPending = false,
  onUpdateStatus,
  onOpenEvidence,
  className,
}) => {
  const nextStatus = nextStatusMap[action.status];

  // Outcome comparison calculation
  const hasOutcome =
    action.outcome_before !== null &&
    action.outcome_before !== undefined &&
    action.outcome_after !== null &&
    action.outcome_after !== undefined;

  let outcomeDelta = 0;
  if (hasOutcome && action.outcome_before! > 0) {
    outcomeDelta =
      ((action.outcome_after! - action.outcome_before!) / action.outcome_before!) * 100;
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-3 transition-all hover:shadow-xs relative">
      {/* Card Header: Priority & Status */}
      <div className="flex items-center justify-between gap-2">
        {action.priority ? (
          <SeverityBadge severity={action.priority} />
        ) : (
          <span className="text-[10px] text-muted-foreground font-mono">Standard</span>
        )}
        <StatusBadge status={action.status} />
      </div>

      {/* Title */}
      <div>
        <h3 className="text-xs font-bold text-foreground leading-snug">
          {action.title}
        </h3>
        <div className="text-[11px] font-mono text-muted-foreground mt-1 flex items-center gap-1.5">
          <span>Linked:</span>
          <button
            type="button"
            onClick={() => onOpenEvidence(action.issue_id)}
            className="text-primary hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-ring rounded px-0.5"
          >
            {action.issue_id}
          </button>
        </div>
      </div>

      {/* Owner & Date Meta */}
      <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/60">
        {action.suggested_owner && (
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{action.suggested_owner}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>Created: {formatDate(action.created_at)}</span>
        </div>
      </div>

      {/* Outcome Snapshot */}
      <div className="p-2.5 rounded-md bg-muted/40 border text-xs space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
          Measured Outcome
        </span>
        {hasOutcome ? (
          <div className="flex items-center justify-between font-mono">
            <span className="text-foreground">
              {action.outcome_before} → {action.outcome_after} mentions
            </span>
            <span className="inline-flex items-center gap-0.5 text-sentiment-positive-foreground font-bold">
              <TrendingDown className="w-3 h-3" aria-hidden="true" />
              <span>{formatPercent(outcomeDelta)}</span>
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">
            Outcome not available yet (measured post-resolution)
          </span>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onOpenEvidence(action.issue_id)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 py-0.5"
        >
          <FileText className="w-3 h-3" aria-hidden="true" />
          <span>Evidence</span>
        </button>

        {nextStatus && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => onUpdateStatus(action.id, nextStatus)}
            aria-label={`Advance status to ${nextStatus}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground disabled:opacity-50 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {isPending ? (
              <RotateCw className="w-3 h-3 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            )}
            <span className="capitalize">Mark {nextStatus.replace("_", " ")}</span>
          </button>
        )}
      </div>
    </div>
  );
};
