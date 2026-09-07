import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EvidenceDrawer } from "@/components/shared/EvidenceDrawer";
import { EvidenceResponse } from "@/lib/types/api";

const mockEvidence: EvidenceResponse = {
  insight_id: "ins-001",
  evidence_count: 214,
  representative_samples: [
    {
      feedback_id: "fb-1",
      text: "Food was served completely cold at 7pm.",
      sentiment: "negative",
      date: "2026-09-01",
    },
  ],
  sentiment_distribution: {
    negative: 0.81,
    neutral: 0.14,
    positive: 0.05,
  },
  date_range: {
    from: "2026-08-01",
    to: "2026-09-06",
  },
  filters_used: { topic_id: "top-food-01" },
};

describe("EvidenceDrawer Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <EvidenceDrawer isOpen={false} onClose={vi.fn()} evidence={mockEvidence} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders evidence data when isOpen is true", () => {
    render(
      <EvidenceDrawer isOpen={true} onClose={vi.fn()} evidence={mockEvidence} />
    );
    expect(screen.getByText("214 records")).toBeInTheDocument();
    expect(
      screen.getByText(/Food was served completely cold/i)
    ).toBeInTheDocument();
  });

  it("triggers onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <EvidenceDrawer isOpen={true} onClose={handleClose} evidence={mockEvidence} />
    );
    const closeBtn = screen.getByRole("button", { name: /Close drawer/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape key press", () => {
    const handleClose = vi.fn();
    render(
      <EvidenceDrawer isOpen={true} onClose={handleClose} evidence={mockEvidence} />
    );
    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
