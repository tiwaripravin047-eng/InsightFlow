import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionCard } from "@/components/actions/ActionCard";
import { Action } from "@/lib/types/api";

const mockActionWithOutcome: Action = {
  id: "act-1",
  issue_id: "iss-1",
  title: "Open overflow lot gate 4",
  status: "resolved",
  suggested_owner: "Campus Security",
  priority: "high",
  outcome_before: 58,
  outcome_after: 14,
  created_at: "2026-09-02T10:00:00Z",
  resolved_at: "2026-09-05T10:00:00Z",
};

const mockActionPending: Action = {
  id: "act-2",
  issue_id: "iss-2",
  title: "Inspect library AP channels",
  status: "open",
  suggested_owner: "IT",
  priority: "critical",
  outcome_before: null,
  outcome_after: null,
  created_at: "2026-09-02T10:00:00Z",
};

describe("ActionCard Component", () => {
  it("renders measured before/after outcome reduction", () => {
    render(
      <ActionCard
        action={mockActionWithOutcome}
        onUpdateStatus={vi.fn()}
        onOpenEvidence={vi.fn()}
      />
    );

    expect(screen.getByText("Open overflow lot gate 4")).toBeInTheDocument();
    expect(screen.getByText("Campus Security")).toBeInTheDocument();
    expect(screen.getByText(/58 → 14 mentions/i)).toBeInTheDocument();
    expect(screen.getByText(/-75.9%/i)).toBeInTheDocument();
  });

  it("shows outcome not available yet when outcome is null", () => {
    render(
      <ActionCard
        action={mockActionPending}
        onUpdateStatus={vi.fn()}
        onOpenEvidence={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Outcome not available yet \(measured post-resolution\)/i)
    ).toBeInTheDocument();
  });

  it("calls onUpdateStatus with next status on button click", () => {
    const handleUpdate = vi.fn();
    render(
      <ActionCard
        action={mockActionPending}
        onUpdateStatus={handleUpdate}
        onOpenEvidence={vi.fn()}
      />
    );

    const advanceBtn = screen.getByRole("button", { name: /Advance status to in_progress/i });
    fireEvent.click(advanceBtn);
    expect(handleUpdate).toHaveBeenCalledWith("act-2", "in_progress");
  });
});
