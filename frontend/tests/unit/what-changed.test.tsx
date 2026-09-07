import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WhatChangedCard } from "@/components/dashboard/WhatChangedCard";
import { PeriodCompareResponse } from "@/lib/types/api";

const mockCompare: PeriodCompareResponse = {
  improved: [{ topic: "Digital Library", change_percent: 14.5, evidence_insight_id: "ins-lib" }],
  worsened: [{ topic: "Food Quality", change_percent: 37.0, evidence_insight_id: "ins-food" }],
  emerging: [{ topic: "Parking", first_seen: "2026-09-02", volume: 58, evidence_insight_id: "ins-park" }],
  stable: [{ topic: "Lab Equipment", change_percent: 1.2 }],
};

describe("WhatChangedCard Component", () => {
  it("renders all four period comparison categories", () => {
    render(<WhatChangedCard compareData={mockCompare} onOpenEvidence={vi.fn()} />);

    expect(screen.getByText("What Changed? (Period Comparison)")).toBeInTheDocument();
    expect(screen.getByText("Digital Library")).toBeInTheDocument();
    expect(screen.getByText("Food Quality")).toBeInTheDocument();
    expect(screen.getByText("Parking")).toBeInTheDocument();
    expect(screen.getByText("Lab Equipment")).toBeInTheDocument();
  });

  it("calls onOpenEvidence with evidence ID when button is clicked", () => {
    const handleOpenEvidence = vi.fn();
    render(<WhatChangedCard compareData={mockCompare} onOpenEvidence={handleOpenEvidence} />);

    const button = screen.getByRole("button", { name: /View evidence for Food Quality/i });
    fireEvent.click(button);

    expect(handleOpenEvidence).toHaveBeenCalledWith("ins-food");
  });
});
