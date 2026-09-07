"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeedbackFilters } from "@/components/feedback/FeedbackFilters";
import { FeedbackTable } from "@/components/feedback/FeedbackTable";
import { FeedbackDetailDrawer } from "@/components/feedback/FeedbackDetailDrawer";
import { EvidenceDrawer } from "@/components/shared/EvidenceDrawer";
import { Pagination } from "@/components/shared/Pagination";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { apiClient } from "@/lib/api/client";
import { FeedbackItem, EvidenceResponse } from "@/lib/types/api";
import { MessageSquareText, Download } from "lucide-react";

export default function FeedbackExplorerPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Drawer State
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Canonical Evidence Drawer for Linked Issue
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceData, setEvidenceData] = useState<EvidenceResponse | null>(null);

  const limit = 50;
  const offset = Number(searchParams.get("offset") || "0");

  const loadFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters = {
        category: searchParams.get("category") || undefined,
        sentiment: searchParams.get("sentiment") || undefined,
        severity: searchParams.get("severity") || undefined,
        search: searchParams.get("search") || undefined,
        limit,
        offset,
      };

      const res = await apiClient.getFeedback(datasetId, filters);
      if (res.error) throw new Error(res.error.message);

      setItems(res.data || []);
      setTotalCount(res.meta?.pagination?.total ?? res.data?.length ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load feedback records");
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, searchParams, offset]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const handleSelectFeedback = async (id: string) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    const res = await apiClient.getFeedbackDetail(id);
    setSelectedFeedback(res.data);
    setDetailLoading(false);
  };

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("offset", String(newOffset));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleNavigateIssue = async (issueId: string) => {
    setIsDetailOpen(false);
    setEvidenceOpen(true);
    const res = await apiClient.getEvidence("ins-food-quality-001");
    setEvidenceData(res.data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback Explorer"
        description="Filterable verbatim repository with semantic classifications, emotions, and aspect sentiments."
        actions={
          <button
            type="button"
            onClick={() => window.open(`/api/v1/datasets/${datasetId}/export?format=csv`, "_blank")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border bg-background hover:bg-muted text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Composable Filters */}
      <FeedbackFilters totalCount={totalCount} />

      {/* Async Content States */}
      {isLoading ? (
        <LoadingSkeleton variant="table-row" count={8} />
      ) : error ? (
        <ErrorState
          title="Error Loading Feedback Records"
          message={error}
          onRetry={loadFeedback}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No feedback records match your filter criteria"
          description="Try modifying search keywords or clearing sentiment and category filters to view verbatims."
          actionLabel="Reset All Filters"
          onAction={() => router.push(pathname)}
        />
      ) : (
        <div className="space-y-2">
          <FeedbackTable items={items} onSelectFeedback={handleSelectFeedback} />
          <Pagination
            total={totalCount}
            limit={limit}
            offset={offset}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Feedback Detail Drawer */}
      <FeedbackDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        feedback={selectedFeedback}
        isLoading={detailLoading}
        onNavigateIssue={handleNavigateIssue}
      />

      {/* Reused Canonical Evidence Drawer for Linked Issue */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        evidence={evidenceData}
        title="Linked Issue Evidence"
      />
    </div>
  );
}
