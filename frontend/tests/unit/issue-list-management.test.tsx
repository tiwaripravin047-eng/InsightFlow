import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IssueList } from "@/components/issues/IssueList";
import { Issue } from "@/lib/types/api";

const mockIssues: Issue[] = [
  {
    id: "iss-1",
    title: "Mess Food Freshness",
    topic_id: "top-1",
    topic_label: "Food Quality",
    sentiment: "negative",
    severity: "high",
    priority_score: 87,
    priority_factors: {
      sentiment_severity: 0.8,
      normalized_frequency: 0.4,
      growth_rate: 0.3,
      recurrence: 0.5,
      urgency_signal: 0.3,
    },
    trend: "rising",
    change_percent: 37,
    volume: 214,
    unique_issue_count: 178,
    affected_categories: ["Hostel"],
    affected_segments: ["Mess B"],
    likely_drivers: [{ topic: "Serving Temp", correlation_strength: 0.58 }],
    recommended_actions: ["Check warmers"],
    confidence: 0.79,
    confidence_factors: { sample_size: 214, topic_coherence: 0.7, duplicate_ratio: 0.1 },
    model_versions: { sentiment: "v1", embedding: "v1", pipeline: "v1" },
    generated_at: "2026-09-06T00:00:00Z",
    description: "Food is served cold in Dining Hall B.",
    owner: "Mess Committee",
    status: "in_progress",
    linked_actions: ["act-1"],
  },
  {
    id: "iss-2",
    title: "Library AP Outage",
    topic_id: "top-2",
    topic_label: "Wi-Fi",
    sentiment: "negative",
    severity: "critical",
    priority_score: 92,
    priority_factors: {
      sentiment_severity: 0.9,
      normalized_frequency: 0.6,
      growth_rate: 0.3,
      recurrence: 0.7,
      urgency_signal: 0.4,
    },
    trend: "rising",
    change_percent: 31,
    volume: 328,
    unique_issue_count: 290,
    affected_categories: ["Library"],
    affected_segments: ["2nd Floor"],
    likely_drivers: [{ topic: "Congestion", correlation_strength: 0.64 }],
    recommended_actions: ["Add AP"],
    confidence: 0.85,
    confidence_factors: { sample_size: 328, topic_coherence: 0.8, duplicate_ratio: 0.1 },
    model_versions: { sentiment: "v1", embedding: "v1", pipeline: "v1" },
    generated_at: "2026-09-06T00:00:00Z",
    description: "Disconnections in quiet study room.",
    owner: "IT",
    status: "open",
    linked_actions: [],
  },
];

describe("IssueList Component", () => {
  it("renders issues and filters by status tab", () => {
    const handleSelectStatus = vi.fn();
    render(
      <IssueList
        issues={mockIssues}
        selectedStatus="in_progress"
        onSelectStatus={handleSelectStatus}
        onSelectIssue={vi.fn()}
        onOpenEvidence={vi.fn()}
      />
    );

    // Only in_progress issue is displayed
    expect(screen.getByText("Mess Food Freshness")).toBeInTheDocument();
    expect(screen.queryByText("Library AP Outage")).not.toBeInTheDocument();

    const openFilterBtn = screen.getByRole("button", { name: "Open" });
    fireEvent.click(openFilterBtn);
    expect(handleSelectStatus).toHaveBeenCalledWith("open");
  });

  it("calls onOpenEvidence when evidence button is clicked", () => {
    const handleOpenEvidence = vi.fn();
    render(
      <IssueList
        issues={mockIssues}
        onSelectIssue={vi.fn()}
        onOpenEvidence={handleOpenEvidence}
      />
    );

    const evidenceBtns = screen.getAllByRole("button", { name: /Evidence/i });
    fireEvent.click(evidenceBtns[0]);
    expect(handleOpenEvidence).toHaveBeenCalledWith("iss-1");
  });
});
