import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeOverviewMetrics } from "@/components/themes/ThemeOverviewMetrics";
import { Theme } from "@/lib/types/api";

const mockThemes: Theme[] = [
  {
    id: "thm-1",
    label: "Food",
    volume: 620,
    sentiment_breakdown: { negative: 0.58, neutral: 0.22, positive: 0.2 },
    trend: "rising",
    sub_themes: [
      { id: "sub-1", label: "Temp", volume: 214, sentiment_breakdown: { negative: 0.81 } },
      { id: "sub-2", label: "Price", volume: 90, sentiment_breakdown: { negative: 0.4 } },
    ],
  },
  {
    id: "thm-2",
    label: "Wi-Fi",
    volume: 840,
    sentiment_breakdown: { negative: 0.72, neutral: 0.18, positive: 0.1 },
    trend: "rising",
    sub_themes: [
      { id: "sub-3", label: "Library AP", volume: 328, sentiment_breakdown: { negative: 0.88 } },
    ],
  },
];

describe("ThemeOverviewMetrics Component", () => {
  it("computes and displays aggregated theme and branch counts", () => {
    render(<ThemeOverviewMetrics themes={mockThemes} />);

    // 2 themes
    expect(screen.getByText("2")).toBeInTheDocument();
    // 3 sub-themes
    expect(screen.getByText("3")).toBeInTheDocument();
    // Dominant category is Wi-Fi (840 mentions)
    const wifiElements = screen.getAllByText("Wi-Fi");
    expect(wifiElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("840 mentions")).toBeInTheDocument();
  });
});
