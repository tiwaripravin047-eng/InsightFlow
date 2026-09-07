import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedbackTable } from "@/components/feedback/FeedbackTable";
import { FeedbackItem } from "@/lib/types/api";

const mockFeedback: FeedbackItem[] = [
  {
    id: "fb-1",
    text: "Wi-Fi is terrible on second floor of library.",
    sentiment: "negative",
    sentiment_confidence: 0.95,
    topic: "Wi-Fi Reliability",
    aspects: [{ aspect: "Wi-Fi", sentiment: "negative", confidence: 0.96 }],
    emotion: "frustration",
    intent: "complaint",
    urgency: "high",
    severity: "critical",
    date: "2026-09-02",
    category: "Library",
    source: "qr_code",
    language: "en",
  },
  {
    id: "fb-2",
    text: "Digital catalog is very convenient to access.",
    sentiment: "positive",
    sentiment_confidence: 0.98,
    topic: "Digital Resources",
    aspects: [{ aspect: "Catalog", sentiment: "positive", confidence: 0.99 }],
    emotion: "satisfaction",
    intent: "praise",
    urgency: "low",
    severity: "low",
    date: "2026-09-01",
    category: "Library",
    source: "survey",
    language: "en",
  },
];

describe("FeedbackTable Component", () => {
  it("renders verbatim texts and contract columns correctly", () => {
    render(<FeedbackTable items={mockFeedback} onSelectFeedback={vi.fn()} />);

    expect(screen.getByText(/Wi-Fi is terrible on second floor/i)).toBeInTheDocument();
    expect(screen.getByText(/Digital catalog is very convenient/i)).toBeInTheDocument();
    expect(screen.getByText("Wi-Fi Reliability")).toBeInTheDocument();
    expect(screen.getByText("Digital Resources")).toBeInTheDocument();
  });

  it("calls onSelectFeedback with feedback id on row click", () => {
    const handleSelect = vi.fn();
    render(<FeedbackTable items={mockFeedback} onSelectFeedback={handleSelect} />);

    const row = screen.getByText(/Wi-Fi is terrible/i).closest("tr");
    expect(row).toBeInTheDocument();
    fireEvent.click(row!);

    expect(handleSelect).toHaveBeenCalledWith("fb-1");
  });
});
