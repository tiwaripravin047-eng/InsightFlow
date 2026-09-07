import React from "react";
import { Action, ActionStatus } from "@/lib/types/api";
import { ActionCard } from "./ActionCard";
import { Disc, Clock, CheckCircle2, ShieldCheck } from "lucide-react";

export interface ActionBoardProps {
  actions: Action[];
  pendingActionIds: Set<string>;
  onUpdateStatus: (actionId: string, newStatus: ActionStatus) => void;
  onOpenEvidence: (issueId: string) => void;
  className?: string;
}

const columns: Array<{
  status: ActionStatus;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  headerColor: string;
}> = [
  { status: "open", label: "Open Triage", icon: Disc, headerColor: "text-status-open-foreground" },
  { status: "in_progress", label: "In Progress", icon: Clock, headerColor: "text-status-in-progress-foreground" },
  { status: "resolved", label: "Resolved", icon: CheckCircle2, headerColor: "text-status-resolved-foreground" },
  { status: "verified", label: "Verified Outcome", icon: ShieldCheck, headerColor: "text-status-verified-foreground" },
];

export const ActionBoard: React.FC<ActionBoardProps> = ({
  actions,
  pendingActionIds,
  onUpdateStatus,
  onOpenEvidence,
  className,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col) => {
        const columnActions = actions.filter((a) => a.status === col.status);
        const Icon = col.icon;

        return (
          <div
            key={col.status}
            className="flex flex-col rounded-lg border bg-muted/25 p-3 space-y-3 min-h-[400px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1 pb-2 border-b">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Icon className={`w-3.5 h-3.5 ${col.headerColor}`} aria-hidden={true} />
                <span className="text-foreground">{col.label}</span>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                {columnActions.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {columnActions.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground italic">
                  No actions in this column
                </div>
              ) : (
                columnActions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    isPending={pendingActionIds.has(action.id)}
                    onUpdateStatus={onUpdateStatus}
                    onOpenEvidence={onOpenEvidence}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
