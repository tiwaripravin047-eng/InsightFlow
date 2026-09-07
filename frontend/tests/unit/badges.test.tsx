import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";

describe("Shared Badge System (Accessible Indicators)", () => {
  it("renders SeverityBadge with accessible text and role", () => {
    render(<SeverityBadge severity="critical" />);
    const badge = screen.getByRole("status", { name: /Severity: Critical/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Critical");
  });

  it("renders SentimentBadge with text and icon", () => {
    render(<SentimentBadge sentiment="positive" />);
    const badge = screen.getByRole("status", { name: /Sentiment: Positive/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Positive");
  });

  it("renders TrendBadge with direction and percentage change", () => {
    render(<TrendBadge trend="rising" changePercent={37} />);
    const badge = screen.getByRole("status", { name: /Trend: Rising/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Rising (+37.0%)");
  });

  it("renders StatusBadge with action center state", () => {
    render(<StatusBadge status="in_progress" />);
    const badge = screen.getByRole("status", { name: /Status: In Progress/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("In Progress");
  });
});
