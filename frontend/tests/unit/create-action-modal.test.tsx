import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateActionModal } from "@/components/actions/CreateActionModal";
import { Issue } from "@/lib/types/api";

const mockIssues: Issue[] = [
  {
    id: "iss-1",
    title: "Mess Food Freshness",
    topic_id: "top-1",
    topic_label: "Food",
    sentiment: "negative",
    severity: "high",
    priority_score: 87,
    priority_factors: { sentiment_severity: 0.8, normalized_frequency: 0.4, growth_rate: 0.3, recurrence: 0.5, urgency_signal: 0.3 },
    trend: "rising",
    change_percent: 37,
    volume: 214,
    unique_issue_count: 178,
    affected_categories: ["Hostel"],
    affected_segments: [],
    likely_drivers: [],
    recommended_actions: [],
    confidence: 0.8,
    confidence_factors: { sample_size: 214, topic_coherence: 0.8, duplicate_ratio: 0.1 },
    model_versions: { sentiment: "v1", embedding: "v1", pipeline: "v1" },
    generated_at: "2026-09-06T00:00:00Z",
    description: "Cold food in mess.",
    owner: "Mess Committee",
    status: "open",
    linked_actions: [],
  },
];

describe("CreateActionModal Component", () => {
  it("renders form fields strictly matching contract", () => {
    render(
      <CreateActionModal
        isOpen={true}
        onClose={vi.fn()}
        issues={mockIssues}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Create New Action Item")).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Issue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Action Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Suggested Owner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument();
  });

  it("submits valid form data", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateActionModal
        isOpen={true}
        onClose={vi.fn()}
        issues={mockIssues}
        onSubmit={handleSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Action Title/i);
    fireEvent.change(titleInput, { target: { value: "Repair warmer unit 2" } });

    const ownerInput = screen.getByLabelText(/Suggested Owner/i);
    fireEvent.change(ownerInput, { target: { value: "Kitchen Staff" } });

    await React.act(async () => {
      const submitBtn = screen.getByRole("button", { name: "Create Action" });
      fireEvent.click(submitBtn);
    });

    expect(handleSubmit).toHaveBeenCalledWith("iss-1", {
      title: "Repair warmer unit 2",
      suggested_owner: "Kitchen Staff",
      priority: "high",
    });
  });
});
