import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryResultCard } from "@/components/ask/QueryResultCard";
import { AskFeedbackResponse } from "@/lib/types/api";

const mockAnswerableResult: AskFeedbackResponse = {
  answer: "Negative feedback increased 18% this week, primarily driven by Wi-Fi disconnections.",
  computed_data: {
    change_percent: 18.0,
    top_drivers: ["Wi-Fi Reliability", "Mess Food"],
    total_feedback: 5000,
  },
  evidence_insight_ids: ["ins-wifi-1", "ins-food-2"],
  filters_applied: { date_from: "2026-08-31", date_to: "2026-09-06" },
  answerable: true,
};

const mockUnanswerableResult: AskFeedbackResponse = {
  answer: "The current dataset contains hostel and library surveys, but no financial tuition records.",
  computed_data: {},
  evidence_insight_ids: [],
  filters_applied: {},
  answerable: false,
};

describe("QueryResultCard Component", () => {
  it("renders in strict order: answer, computed data, evidence, filters", () => {
    render(
      <QueryResultCard
        question="What got worse this week?"
        result={mockAnswerableResult}
        onOpenEvidence={vi.fn()}
      />
    );

    // 1. Answer narrative
    expect(screen.getByText(/Negative feedback increased 18% this week/i)).toBeInTheDocument();

    // 2. Supporting computed data (dominant)
    expect(screen.getByText("Supporting Computed Data")).toBeInTheDocument();
    expect(screen.getByText("+18.0%")).toBeInTheDocument();
    expect(screen.getByText("Wi-Fi Reliability")).toBeInTheDocument();

    // 3. Evidence links
    expect(screen.getByText(/Verify Evidence \[ins-wifi-1\]/i)).toBeInTheDocument();
    expect(screen.getByText(/Verify Evidence \[ins-food-2\]/i)).toBeInTheDocument();

    // 4. Applied query filters
    expect(screen.getByText(/date_from: 2026-08-31/i)).toBeInTheDocument();
  });

  it("calls onOpenEvidence when citation button is clicked", () => {
    const handleOpenEvidence = vi.fn();
    render(
      <QueryResultCard
        question="What got worse?"
        result={mockAnswerableResult}
        onOpenEvidence={handleOpenEvidence}
      />
    );

    const citationBtn = screen.getByRole("button", { name: /Verify Evidence \[ins-wifi-1\]/i });
    fireEvent.click(citationBtn);

    expect(handleOpenEvidence).toHaveBeenCalledWith("ins-wifi-1");
  });

  it("renders distinct unanswerable explanation when answerable is false", () => {
    render(
      <QueryResultCard
        question="What is tuition?"
        result={mockUnanswerableResult}
        onOpenEvidence={vi.fn()}
      />
    );

    expect(screen.getByText("Out-of-Domain / Unanswerable Query")).toBeInTheDocument();
    expect(screen.getByText(/no financial tuition records/i)).toBeInTheDocument();
  });
});
