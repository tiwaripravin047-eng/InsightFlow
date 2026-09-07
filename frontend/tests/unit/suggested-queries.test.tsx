import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SuggestedQueries } from "@/components/ask/SuggestedQueries";

describe("SuggestedQueries Component", () => {
  it("renders suggested prompt buttons and calls onSelectQuery", () => {
    const handleSelect = vi.fn();
    render(<SuggestedQueries onSelectQuery={handleSelect} />);

    expect(screen.getByText("Suggested Analytics Queries")).toBeInTheDocument();
    const promptBtn = screen.getByRole("button", { name: "What got worse this week?" });
    fireEvent.click(promptBtn);

    expect(handleSelect).toHaveBeenCalledWith("What got worse this week?");
  });
});
