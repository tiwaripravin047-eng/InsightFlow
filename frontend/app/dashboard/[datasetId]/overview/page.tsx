"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { OverviewFilters } from "@/components/dashboard/OverviewFilters";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { IssueRadar } from "@/components/dashboard/IssueRadar";
import { SentimentTrendChart } from "@/components/dashboard/SentimentTrendChart";
import { IssueTrendMatrix } from "@/components/dashboard/IssueTrendMatrix";
import { WhatChangedCard } from "@/components/dashboard/WhatChangedCard";
import { EvidenceDrawer } from "@/components/shared/EvidenceDrawer";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { apiClient } from "@/lib/api/client";
import {
  Insight,
  TrendPoint,
  PeriodCompareResponse,
  EvidenceResponse,
} from "@/lib/types/api";
import { Sparkles, Download } from "lucide-react";

export default function OverviewPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = use(params);
  const searchParams = useSearchParams();

  const [insights, setInsights] = useState<Insight[]>([]);
  const [trendSeries, setTrendSeries] = useState<TrendPoint[]>([]);
  const [compareData, setCompareData] = useState<PeriodCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Canonical Evidence Drawer State
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceResponse | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters = {
        category: searchParams.get("category") || undefined,
        sentiment: searchParams.get("sentiment") || undefined,
        severity: searchParams.get("severity") || undefined,
        search: searchParams.get("search") || undefined,
      };

      const [insightsRes, trendRes, compareRes] = await Promise.all([
        apiClient.getInsights(datasetId, filters),
        apiClient.getTrends(datasetId),
        apiClient.getCompare(datasetId),
      ]);

      if (insightsRes.error) throw new Error(insightsRes.error.message);
      if (trendRes.error) throw new Error(trendRes.error.message);
      if (compareRes.error) throw new Error(compareRes.error.message);

      setInsights(insightsRes.data || []);
      setTrendSeries(trendRes.data?.series || []);
      setCompareData(compareRes.data || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, searchParams]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleOpenEvidence = async (insightId: string) => {
    setEvidenceOpen(true);
    setEvidenceLoading(true);
    const res = await apiClient.getEvidence(insightId);
    setSelectedEvidence(res.data);
    setEvidenceLoading(false);
  };

  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const emergingCount = insights.filter((i) => i.trend === "emerging").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Executive Overview"
        description="Executive pulse, ranked operational risks, and explainable evidence layer."
        badge={
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Active
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => window.open(`/api/v1/datasets/${datasetId}/export?format=csv`, "_blank")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border bg-background hover:bg-muted text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Export View</span>
          </button>
        }
      />

      {/* Global Filter Bar */}
      <OverviewFilters />

      {/* Async Status Handling */}
      {isLoading ? (
        <div className="space-y-6">
          <LoadingSkeleton variant="kpi" count={4} />
          <LoadingSkeleton variant="card" count={2} />
        </div>
      ) : error ? (
        <ErrorState
          title="Error Loading Dashboard Data"
          message={error}
          onRetry={loadDashboardData}
        />
      ) : (
        <>
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Feedback"
              value="5,000"
              subValue="Analyzed records"
              delta={{ value: 12.4, label: "vs prior 30d" }}
            />
            <KpiCard
              label="Negative Sentiment"
              value="34.2%"
              subValue="1,710 negative comments"
              delta={{ value: 4.8, isInverse: true, label: "worsening trend" }}
              onClick={() => handleOpenEvidence("ins-food-quality-001")}
            />
            <KpiCard
              label="Critical Issues"
              value={criticalCount}
              subValue="Urgent operational risks"
              onClick={() => handleOpenEvidence("ins-wifi-reliability-002")}
            />
            <KpiCard
              label="Emerging Issues"
              value={emergingCount}
              subValue="Statistically gated spike"
              delta={{ value: 85.0, isInverse: true, label: "recent surge" }}
              onClick={() => handleOpenEvidence("ins-parking-emerging-003")}
            />
          </div>

          {/* AI Executive Digest */}
          <ExecutiveSummary onOpenEvidence={handleOpenEvidence} />

          {/* Issue Radar */}
          {insights.length === 0 ? (
            <EmptyState
              title="No issues match your current filters"
              description="Adjust or reset your category, sentiment, or severity filters to view more issues."
            />
          ) : (
            <IssueRadar insights={insights} onOpenEvidence={handleOpenEvidence} />
          )}

          {/* Analytics Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SentimentTrendChart data={trendSeries} />
            <IssueTrendMatrix insights={insights} onOpenEvidence={handleOpenEvidence} />
          </div>

          {/* What Changed? Period Comparison */}
          <WhatChangedCard compareData={compareData} onOpenEvidence={handleOpenEvidence} />
        </>
      )}

      {/* Canonical Evidence Drawer (Reused app-wide) */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        evidence={selectedEvidence}
        isLoading={evidenceLoading}
        title="Supporting Verbatim Evidence"
      />
    </div>
  );
}
