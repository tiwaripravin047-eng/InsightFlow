"use client";

import React, { useState, use, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SuggestedQueries } from "@/components/ask/SuggestedQueries";
import { QueryResultCard } from "@/components/ask/QueryResultCard";
import { EvidenceDrawer } from "@/components/shared/EvidenceDrawer";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { apiClient } from "@/lib/api/client";
import { AskFeedbackResponse, EvidenceResponse } from "@/lib/types/api";
import { Sparkles, Send, RotateCw, HelpCircle } from "lucide-react";

export default function AskFeedbackPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = use(params);

  const [prompt, setPrompt] = useState("");
  const [activeQuestion, setActiveQuestion] = useState("What got worse this week?");
  const [queryResult, setQueryResult] = useState<AskFeedbackResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canonical Evidence Drawer State
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceData, setEvidenceData] = useState<EvidenceResponse | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const handleExecuteQuery = useCallback(async (questionText: string) => {
    if (!questionText.trim()) return;
    setIsQuerying(true);
    setError(null);
    setActiveQuestion(questionText);
    try {
      const res = await apiClient.queryFeedback(datasetId, { question: questionText });
      if (res.error) throw new Error(res.error.message);
      setQueryResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to execute analytics query");
    } finally {
      setIsQuerying(false);
    }
  }, [datasetId]);

  // Initial load with default query
  useEffect(() => {
    handleExecuteQuery("What got worse this week?");
  }, [handleExecuteQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      handleExecuteQuery(prompt.trim());
      setPrompt("");
    }
  };

  const handleOpenEvidence = async (insightId: string) => {
    setEvidenceOpen(true);
    setEvidenceLoading(true);
    const res = await apiClient.getEvidence(insightId);
    setEvidenceData(res.data);
    setEvidenceLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Ask Feedback"
        description="Grounded natural-language queries translated into statistical aggregations with cited evidence."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Grounded Engine
          </span>
        }
      />

      {/* Query Submission Box */}
      <form onSubmit={handleSubmit} className="p-4 rounded-lg border bg-card shadow-2xs space-y-3">
        <label htmlFor="nl-query-input" className="text-xs font-bold text-foreground block">
          Ask a question about this feedback dataset:
        </label>
        <div className="flex items-center gap-2">
          <input
            id="nl-query-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. What got worse this week? Why are cafeteria ratings down?"
            className="flex-1 h-10 px-3.5 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={isQuerying || !prompt.trim()}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
          >
            {isQuerying ? (
              <RotateCw className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
            <span>Ask AI</span>
          </button>
        </div>
      </form>

      {/* Suggested Quick Queries */}
      <SuggestedQueries onSelectQuery={(q) => handleExecuteQuery(q)} />

      {/* Query Result Section */}
      {isQuerying ? (
        <div className="space-y-4">
          <LoadingSkeleton variant="card" count={2} />
        </div>
      ) : error ? (
        <ErrorState
          title="Query Processing Failed"
          message={error}
          onRetry={() => handleExecuteQuery(activeQuestion)}
        />
      ) : queryResult ? (
        <QueryResultCard
          question={activeQuestion}
          result={queryResult}
          onOpenEvidence={handleOpenEvidence}
        />
      ) : null}

      {/* Shared Canonical Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        evidence={evidenceData}
        isLoading={evidenceLoading}
        title="Query Cited Evidence Verbatims"
      />
    </div>
  );
}
