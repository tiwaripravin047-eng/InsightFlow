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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Action Center"
        description="Convert prioritized issues into verified operational actions with measured before/after outcomes."
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
      ) : (
        <ActionBoard
          actions={actions}
          pendingActionIds={pendingActionIds}
          onUpdateStatus={handleUpdateStatus}
          onOpenEvidence={handleOpenEvidence}
        />
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
