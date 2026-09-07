import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IssueDetailDrawer } from "@/components/issues/IssueDetailDrawer";
import { Issue } from "@/lib/types/api";

const mockIssue: Issue = {
  id: "iss-1",
  title: "Mess Food Freshness",
  topic_id: "top-1",
  topic_label: "Food Quality",
  sentiment: "negative",
  severity: "high",
  priority_score: 87,
  priority_factors: {
    sentiment_severity: 0.81,
    normalized_frequency: 0.42,
    growth_rate: 0.37,
    recurrence: 0.55,
    urgency_signal: 0.3,
  },
  trend: "rising",
  change_percent: 37,
  volume: 214,
  unique_issue_count: 178,
  affected_categories: ["Hostel"],
  affected_segments: ["Mess B"],
  likely_drivers: [{ topic: "Serving Temp", correlation_strength: 0.58 }],
  recommended_actions: ["Check warmer temperatures in Dining Hall B"],
  confidence: 0.79,
  confidence_factors: { sample_size: 214, topic_coherence: 0.71, duplicate_ratio: 0.17 },
  model_versions: { sentiment: "roberta-v1", embedding: "minilm-v2", pipeline: "v1.2" },
  generated_at: "2026-09-06T00:00:00Z",
  description: "Consistent student feedback regarding cold food during evening shifts.",
  owner: "Mess Committee",
  status: "in_progress",
  linked_actions: ["act-1"],
};

describe("IssueDetailDrawer Component", () => {
  it("renders priority breakdown, description, and drivers", () => {
    render(
      <IssueDetailDrawer
        isOpen={true}
        onClose={vi.fn()}
        issue={mockIssue}
        onOpenEvidence={vi.fn()}
      />
    );

    expect(screen.getByText("Mess Food Freshness")).toBeInTheDocument();
    expect(screen.getByText(/Consistent student feedback regarding cold food/i)).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("Serving Temp")).toBeInTheDocument();
    expect(screen.getByText(/58.0% correlation/i)).toBeInTheDocument();
    expect(screen.getByText(/Check warmer temperatures in Dining Hall B/i)).toBeInTheDocument();
  });

  it("calls onOpenEvidence when bottom button is clicked", () => {
    const handleOpenEvidence = vi.fn();
    render(
      <IssueDetailDrawer
        isOpen={true}
        onClose={vi.fn()}
        issue={mockIssue}
        onOpenEvidence={handleOpenEvidence}
      />
    );

    const viewEvidenceBtn = screen.getByRole("button", { name: /View Supporting Evidence Verbatims/i });
    fireEvent.click(viewEvidenceBtn);

    expect(handleOpenEvidence).toHaveBeenCalledWith("iss-1");
  });
});
