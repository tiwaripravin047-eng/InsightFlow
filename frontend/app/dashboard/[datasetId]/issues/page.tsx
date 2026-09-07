"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { IssueList } from "@/components/issues/IssueList";
import { IssueDetailDrawer } from "@/components/issues/IssueDetailDrawer";
import { EvidenceDrawer } from "@/components/shared/EvidenceDrawer";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { apiClient } from "@/lib/api/client";
import { Issue, EvidenceResponse } from "@/lib/types/api";
import { AlertOctagon, Download } from "lucide-react";

export default function IssuesPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = use(params);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Issue Detail Drawer State
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Canonical Evidence Drawer State (reused)
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceData, setEvidenceData] = useState<EvidenceResponse | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getIssues(datasetId);
      if (res.error) throw new Error(res.error.message);
      setIssues(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDetailOpen(true);
  };

  const handleOpenEvidence = async (insightId: string) => {
    setEvidenceOpen(true);
    setEvidenceLoading(true);
    const res = await apiClient.getEvidence(insightId);
    setEvidenceData(res.data);
    setEvidenceLoading(false);
  };

  const activeCount = issues.filter((i) => i.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issue Management"
        description="Prioritized operational issues, driver correlation, and explainable evidence verification."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            {activeCount} Active Issues
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => window.open(`/api/v1/datasets/${datasetId}/export?format=csv`, "_blank")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border bg-background hover:bg-muted text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Export Issues</span>
          </button>
        }
      />

      {/* Async States */}
      {isLoading ? (
        <LoadingSkeleton variant="card" count={4} />
      ) : error ? (
        <ErrorState
          title="Error Loading Issues"
          message={error}
          onRetry={loadIssues}
        />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={AlertOctagon}
          title="No operational issues detected"
          description="All monitored topics are currently within safe sentiment and growth thresholds."
        />
      ) : (
        <IssueList
          issues={issues}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          onSelectIssue={handleSelectIssue}
          onOpenEvidence={handleOpenEvidence}
        />
      )}

      {/* Dedicated Issue Detail Drawer */}
      <IssueDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        issue={selectedIssue}
        onOpenEvidence={handleOpenEvidence}
      />

      {/* Reused Canonical Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        evidence={evidenceData}
        isLoading={evidenceLoading}
        title="Issue Grounding Evidence"
      />
    </div>
  );
}
