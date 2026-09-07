"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionBoard } from "@/components/actions/ActionBoard";
import { CreateActionModal } from "@/components/actions/CreateActionModal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { EvidenceDrawer } from "@/components/shared/EvidenceDrawer";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { apiClient } from "@/lib/api/client";
import { Action, Issue, ActionStatus, EvidenceResponse, SeverityType } from "@/lib/types/api";
import { Plus, CheckSquare } from "lucide-react";

export default function ActionCenterPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = use(params);

  const [actions, setActions] = useState<Action[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceData, setEvidenceData] = useState<EvidenceResponse | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  // Status Change Confirmation
  const [pendingResolve, setPendingResolve] = useState<{ actionId: string; status: ActionStatus } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [actionsRes, issuesRes] = await Promise.all([
        apiClient.getActions(),
        apiClient.getIssues(datasetId),
      ]);
      if (actionsRes.error) throw new Error(actionsRes.error.message);
      if (issuesRes.error) throw new Error(issuesRes.error.message);

      setActions(actionsRes.data || []);
      setIssues(issuesRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load Action Center");
    } finally {
      setIsLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const executeStatusUpdate = async (actionId: string, newStatus: ActionStatus) => {
    setPendingActionIds((prev) => new Set(prev).add(actionId));
    try {
      const res = await apiClient.updateAction(actionId, { status: newStatus });
      if (res.error) throw new Error(res.error.message);

      // Confirmed server update
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? res.data! : a))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update status. Rolled back.");
    } finally {
      setPendingActionIds((prev) => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  const handleUpdateStatus = (actionId: string, newStatus: ActionStatus) => {
    if (newStatus === "resolved") {
      setPendingResolve({ actionId, status: newStatus });
    } else {
      executeStatusUpdate(actionId, newStatus);
    }
  };

  const handleCreateAction = async (
    issueId: string,
    data: { title: string; suggested_owner: string; priority: SeverityType }
  ) => {
    const res = await apiClient.createAction(issueId, data);
    if (res.error) throw new Error(res.error.message);
    if (res.data) {
      setActions((prev) => [res.data!, ...prev]);
    }
  };

  const handleOpenEvidence = async (issueId: string) => {
    setEvidenceOpen(true);
    setEvidenceLoading(true);
    const res = await apiClient.getEvidence(issueId);
    setEvidenceData(res.data);
    setEvidenceLoading(false);
  };

  // View mode
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  const nextStatusMap: Record<ActionStatus, ActionStatus | null> = {
    open: "in_progress",
    in_progress: "resolved",
    resolved: "verified",
    verified: null,
  };

  const totalCount = actions.length;
  const openCount = actions.filter((a) => a.status === "open").length;
  const inProgressCount = actions.filter((a) => a.status === "in_progress").length;
  const resolvedCount = actions.filter((a) => a.status === "resolved" || a.status === "verified").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actions"
        description="Closed-loop operational initiatives linked directly to customer feedback and measured outcomes."
        actions={
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Create Action Item</span>
          </button>
        }
      />

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border bg-card shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            Total Initiatives
          </span>
          <span className="text-xl font-bold font-mono text-foreground mt-0.5 block">
            {totalCount}
          </span>
        </div>
        <div className="p-3.5 rounded-lg border bg-card shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            Open Triage
          </span>
          <span className="text-xl font-bold font-mono text-status-open-foreground mt-0.5 block">
            {openCount}
          </span>
        </div>
        <div className="p-3.5 rounded-lg border bg-card shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            In Progress
          </span>
          <span className="text-xl font-bold font-mono text-status-in-progress-foreground mt-0.5 block">
            {inProgressCount}
          </span>
        </div>
        <div className="p-3.5 rounded-lg border bg-card shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            Resolved / Verified
          </span>
          <span className="text-xl font-bold font-mono text-status-resolved-foreground mt-0.5 block">
            {resolvedCount}
          </span>
        </div>
      </div>

      {/* Toolbar: View Toggle & Counts */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-muted-foreground">
          Showing <strong className="font-semibold text-foreground font-mono">{actions.length}</strong> action items
        </span>
        <div className="inline-flex items-center rounded-md border bg-muted/30 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "board"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Board</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Async Status Handling */}
      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : error ? (
        <ErrorState title="Error Loading Action Center" message={error} onRetry={loadData} />
      ) : actions.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No action items created yet"
          description="Create your first action item linked to a priority issue to begin closed-loop tracking."
          actionLabel="Create Action Item"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : viewMode === "board" ? (
        <ActionBoard
          actions={actions}
          pendingActionIds={pendingActionIds}
          onUpdateStatus={handleUpdateStatus}
          onOpenEvidence={handleOpenEvidence}
        />
      ) : (
        <div className="w-full border rounded-lg bg-card shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Action Title</th>
                  <th scope="col" className="px-3 py-2.5">Priority</th>
                  <th scope="col" className="px-3 py-2.5">Linked Issue</th>
                  <th scope="col" className="px-3 py-2.5">Owner</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5">Measured Outcome</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {actions.map((act) => {
                  const nextStatus = nextStatusMap[act.status];
                  const isPending = pendingActionIds.has(act.id);
                  const hasOutcome =
                    act.outcome_before !== null &&
                    act.outcome_before !== undefined &&
                    act.outcome_after !== null &&
                    act.outcome_after !== undefined;

                  return (
                    <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {act.title}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="capitalize font-medium text-[11px]">
                          {act.priority || "Standard"}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEvidence(act.issue_id)}
                          className="font-mono text-primary hover:underline text-xs"
                        >
                          {act.issue_id}
                        </button>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        {act.suggested_owner || "Unassigned"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-muted border">
                          {act.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-mono text-xs">
                        {hasOutcome ? (
                          <span className="text-foreground">
                            {act.outcome_before} → {act.outcome_after} mentions
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic font-sans text-[11px]">
                            Pending resolution
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEvidence(act.issue_id)}
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          Evidence
                        </button>
                        {nextStatus && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleUpdateStatus(act.id, nextStatus)}
                            className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium transition-colors"
                          >
                            Mark {nextStatus.replace("_", " ")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Action Modal */}
      <CreateActionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        issues={issues}
        onSubmit={handleCreateAction}
      />

      {/* Lightweight Confirmation for Resolving */}
      <ConfirmationDialog
        isOpen={Boolean(pendingResolve)}
        onClose={() => setPendingResolve(null)}
        onConfirm={() => {
          if (pendingResolve) {
            executeStatusUpdate(pendingResolve.actionId, pendingResolve.status);
            setPendingResolve(null);
          }
        }}
        title="Mark Action as Resolved?"
        message="Resolving this item will trigger automatic outcome recomputation upon the next insight regeneration cycle."
        confirmLabel="Mark Resolved"
      />

      {/* Canonical Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        evidence={evidenceData}
        isLoading={evidenceLoading}
        title="Linked Action Evidence"
      />
    </div>
  );
}
