"use client";

import React, { useEffect, useState, use } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { apiClient } from "@/lib/api/client";
import { TrendPoint, PeriodCompareResponse, Insight, EvidenceResponse } from "@/lib/types/api";
import { SentimentTrendChart } from "@/components/dashboard/SentimentTrendChart";
import { IssueTrendMatrix } from "@/components/dashboard/IssueTrendMatrix";
import { WhatChangedCard } from "@/components/dashboard/WhatChangedCard";
import { EvidenceDrawer } from "@/components/shared/EvidenceDrawer";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";

interface TrendsPageProps {
  params: Promise<{ datasetId: string }>;
}

export default function TrendsPage({ params }: TrendsPageProps) {
  const resolvedParams = use(params);
  const datasetId = resolvedParams.datasetId;

  const [trendSeries, setTrendSeries] = useState<TrendPoint[]>([]);
  const [compareData, setCompareData] = useState<PeriodCompareResponse | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Canonical Evidence Drawer State
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceResponse | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const handleOpenEvidence = async (insightId: string) => {
    setEvidenceOpen(true);
    setEvidenceLoading(true);
    const res = await apiClient.getEvidence(insightId);
    setSelectedEvidence(res.data);
    setEvidenceLoading(false);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    const [trendsRes, compareRes, insightsRes] = await Promise.all([
      apiClient.getTrends(datasetId),
      apiClient.getCompare(datasetId),
      apiClient.getInsights(datasetId),
    ]);

    if (trendsRes.error || compareRes.error || insightsRes.error) {
      setError(
        trendsRes.error?.message ||
        compareRes.error?.message ||
        insightsRes.error?.message ||
        "Failed to load trends data"
      );
    } else {
      setTrendSeries(trendsRes.data?.series || []);
      setCompareData(compareRes.data || null);
      setInsights(insightsRes.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [datasetId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trends & Matrix Analysis"
        description="Sentiment over time, 4-quadrant Issue Matrix (Frequency × Severity), and Period-over-Period shifts."
      />

      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : isLoading ? (
        <div className="space-y-6">
          <LoadingSkeleton variant="card" count={2} />
        </div>
      ) : (
        <div className="space-y-6">
          <WhatChangedCard
            compareData={compareData}
            onOpenEvidence={handleOpenEvidence}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SentimentTrendChart data={trendSeries} />
            <IssueTrendMatrix
              insights={insights}
              onOpenEvidence={handleOpenEvidence}
            />
          </div>
        </div>
      )}

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
