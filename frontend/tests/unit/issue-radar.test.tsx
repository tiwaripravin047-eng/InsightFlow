import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IssueRadar } from "@/components/dashboard/IssueRadar";
import { Insight } from "@/lib/types/api";

const mockInsights: Insight[] = [
  {
    id: "ins-1",
    title: "Wi-Fi Disconnections in Library",
    topic_id: "top-1",
    topic_label: "Wi-Fi",
    sentiment: "negative",
    severity: "critical",
    priority_score: 92,
    priority_factors: {
      sentiment_severity: 0.9,
      normalized_frequency: 0.8,
      growth_rate: 0.4,
      recurrence: 0.7,
      urgency_signal: 0.5,
    },
    trend: "rising",
    change_percent: 31,
    volume: 328,
    unique_issue_count: 290,
    affected_categories: ["Library"],
    likely_drivers: [{ topic: "AP Overload", correlation_strength: 0.6 }],
    recommended_actions: ["Inspect AP"],
    confidence: 0.85,
    confidence_factors: { sample_size: 328, topic_coherence: 0.8, duplicate_ratio: 0.1 },
    model_versions: { sentiment: "v1", embedding: "v1", pipeline: "v1" },
    generated_at: "2026-09-06T00:00:00Z",
  },
  {
    id: "ins-2",
    title: "Food Quality Issues",
    topic_id: "top-2",
    topic_label: "Food Quality",
    sentiment: "negative",
    severity: "high",
    priority_score: 87,
    priority_factors: {
      sentiment_severity: 0.8,
      normalized_frequency: 0.5,
      growth_rate: 0.3,
      recurrence: 0.5,
      urgency_signal: 0.3,
    },
    trend: "rising",
    change_percent: 37,
    volume: 214,
    unique_issue_count: 178,
    affected_categories: ["Hostel"],
    likely_drivers: [{ topic: "Serving Temp", correlation_strength: 0.5 }],
    recommended_actions: ["Review heat"],
    confidence: 0.79,
    confidence_factors: { sample_size: 214, topic_coherence: 0.7, duplicate_ratio: 0.1 },
    model_versions: { sentiment: "v1", embedding: "v1", pipeline: "v1" },
    generated_at: "2026-09-06T00:00:00Z",
  },
];

describe("IssueRadar Component", () => {
  it("renders priority issues auto-ranked by score descending", () => {
    render(<IssueRadar insights={mockInsights} onOpenEvidence={vi.fn()} />);

    expect(screen.getByText("Prioritized Issues")).toBeInTheDocument();
    expect(screen.getByText("Wi-Fi Disconnections in Library")).toBeInTheDocument();
    expect(screen.getByText("Food Quality Issues")).toBeInTheDocument();

    // Check priority scores displayed
    expect(screen.getByText("#92")).toBeInTheDocument();
    expect(screen.getByText("#87")).toBeInTheDocument();
  });

  it("calls onOpenEvidence when evidence button is clicked", () => {
    const handleOpenEvidence = vi.fn();
    render(<IssueRadar insights={mockInsights} onOpenEvidence={handleOpenEvidence} />);

    const evidenceButtons = screen.getAllByRole("button", { name: /View evidence/i });
    fireEvent.click(evidenceButtons[0]);

    expect(handleOpenEvidence).toHaveBeenCalledWith("ins-1");
  });
});
