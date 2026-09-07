"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ThemeOverviewMetrics } from "@/components/themes/ThemeOverviewMetrics";
import { ThemeNode } from "@/components/themes/ThemeNode";
import { EvidenceDrawer } from "@/components/shared/EvidenceDrawer";
import { SearchInput } from "@/components/shared/SearchInput";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { apiClient } from "@/lib/api/client";
import { Theme, EvidenceResponse } from "@/lib/types/api";
import { Layers, ChevronsUpDown, Download } from "lucide-react";

export default function ThemesPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = use(params);
  const router = useRouter();

  const [themes, setThemes] = useState<Theme[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandAll, setExpandAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evidence Drawer State
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceData, setEvidenceData] = useState<EvidenceResponse | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const loadThemes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getThemes(datasetId);
      if (res.error) throw new Error(res.error.message);
      setThemes(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load themes");
    } finally {
      setIsLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const handleOpenEvidence = async (insightId: string) => {
    setEvidenceOpen(true);
    setEvidenceLoading(true);
    const res = await apiClient.getEvidence(insightId);
    setEvidenceData(res.data);
    setEvidenceLoading(false);
  };

  const handleExploreFeedback = (keyword: string) => {
    router.push(`/dashboard/${datasetId}/feedback?search=${encodeURIComponent(keyword)}`);
  };

  const filteredThemes = searchQuery
    ? themes.filter((t) =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sub_themes?.some((st) => st.label.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : themes;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Themes"
        description="Recurring feedback themes organized into high-level categories and sub-topics."
        actions={
          <button
            type="button"
            onClick={() => window.open(`/api/v1/datasets/${datasetId}/export?format=csv`, "_blank")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border bg-background hover:bg-muted text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Export Themes</span>
          </button>
        }
      />

      {/* Top Overview Metrics */}
      <ThemeOverviewMetrics themes={themes} />

      {/* Controls Bar: Search & Expand All */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card border rounded-lg shadow-2xs">
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search themes and sub-topics..."
          />
        </div>

        <button
          type="button"
          onClick={() => setExpandAll((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium bg-background hover:bg-muted text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          <span>{expandAll ? "Collapse All Nodes" : "Expand All Nodes"}</span>
        </button>
      </div>

      {/* Themes Content */}
      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : error ? (
        <ErrorState
          title="Error Loading Theme Hierarchy"
          message={error}
          onRetry={loadThemes}
        />
      ) : filteredThemes.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No themes found matching your search"
          description="Try modifying search query to explore other discovered topic branches."
          actionLabel="Clear Search"
          onAction={() => setSearchQuery("")}
        />
      ) : (
        <div className="space-y-3">
          {filteredThemes.map((theme) => (
            <ThemeNode
              key={theme.id}
              theme={theme}
              defaultExpanded={expandAll}
              onOpenEvidence={handleOpenEvidence}
              onExploreFeedback={handleExploreFeedback}
            />
          ))}
        </div>
      )}

      {/* Canonical Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        evidence={evidenceData}
        isLoading={evidenceLoading}
        title="Theme Grounding Evidence"
      />
    </div>
  );
}
