import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedbackDetailDrawer } from "@/components/feedback/FeedbackDetailDrawer";
import { FeedbackItem } from "@/lib/types/api";

const mockItem: FeedbackItem = {
  id: "fb-1",
  text: "The soup was cold and cutlery was greasy.",
  sentiment: "negative",
  sentiment_confidence: 0.94,
  topic: "Food Quality",
  aspects: [
    { aspect: "Soup Temperature", sentiment: "negative", confidence: 0.95 },
    { aspect: "Cutlery Hygiene", sentiment: "negative", confidence: 0.88 },
  ],
  emotion: "disgust",
  intent: "complaint",
  urgency: "medium",
  severity: "high",
  date: "2026-09-03",
  category: "Hostel",
  source: "mobile_app",
  language: "en",
  similar_feedback: [{ feedback_id: "fb-102", similarity_score: 0.89 }],
  related_issue_id: "iss-001",
};

describe("FeedbackDetailDrawer Component", () => {
  it("renders verbatim, aspect extraction, and similar feedback", () => {
    render(<FeedbackDetailDrawer isOpen={true} onClose={vi.fn()} feedback={mockItem} />);

    expect(screen.getByText(/The soup was cold and cutlery was greasy/i)).toBeInTheDocument();
    expect(screen.getByText("Soup Temperature")).toBeInTheDocument();
    expect(screen.getByText("Cutlery Hygiene")).toBeInTheDocument();
    expect(screen.getByText(/89.0% cosine match/i)).toBeInTheDocument();
    expect(screen.getByText("iss-001")).toBeInTheDocument();
  });

  it("calls onClose on Escape key press", () => {
    const handleClose = vi.fn();
    render(<FeedbackDetailDrawer isOpen={true} onClose={handleClose} feedback={mockItem} />);

    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
