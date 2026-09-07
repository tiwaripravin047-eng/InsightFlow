import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeNode } from "@/components/themes/ThemeNode";
import { Theme } from "@/lib/types/api";

const mockTheme: Theme = {
  id: "thm-1",
  label: "Food & Dining",
  volume: 620,
  sentiment_breakdown: { negative: 0.58, neutral: 0.22, positive: 0.2 },
  trend: "rising",
  sub_themes: [
    {
      id: "sub-1",
      label: "Temperature & Freshness",
      volume: 214,
      sentiment_breakdown: { negative: 0.81 },
    },
    {
      id: "sub-2",
      label: "Cafeteria Pricing",
      volume: 140,
      sentiment_breakdown: { negative: 0.4 },
    },
  ],
};

describe("ThemeNode Component", () => {
  it("renders theme label, volume, and sub-theme count", () => {
    render(
      <ThemeNode
        theme={mockTheme}
        onOpenEvidence={vi.fn()}
        onExploreFeedback={vi.fn()}
      />
    );

    expect(screen.getByText("Food & Dining")).toBeInTheDocument();
    expect(screen.getByText("620 total verbatims")).toBeInTheDocument();
    expect(screen.getByText("2 sub-themes")).toBeInTheDocument();
  });

  it("expands sub-themes on click and triggers explore feedback", () => {
    const handleExplore = vi.fn();
    render(
      <ThemeNode
        theme={mockTheme}
        onOpenEvidence={vi.fn()}
        onExploreFeedback={handleExplore}
      />
    );

    // Click header to expand
    const header = screen.getByRole("button", { name: /Food & Dining/i });
    fireEvent.click(header);

    // Sub-themes visible
    expect(screen.getByText("Temperature & Freshness")).toBeInTheDocument();
    expect(screen.getByText("Cafeteria Pricing")).toBeInTheDocument();

    const inspectBtns = screen.getAllByRole("button", { name: /Inspect Feedback/i });
    fireEvent.click(inspectBtns[0]);
    expect(handleExplore).toHaveBeenCalledWith("Temperature & Freshness");
  });
});
