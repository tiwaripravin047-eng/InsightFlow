import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UploadWizard } from "@/components/upload/UploadWizard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("UploadWizard Component", () => {
  it("renders initial Step 1: Upload CSV file", () => {
    render(<UploadWizard />);
    expect(screen.getByText("Upload File")).toBeInTheDocument();
    expect(screen.getByDisplayValue("College Feedback Q3 2026")).toBeInTheDocument();
    expect(screen.getByText(/Continue to Column Mapping/i)).toBeInTheDocument();
  });

  it("advances from step 1 to step 2 (Column Mapping)", () => {
    render(<UploadWizard />);
    const nextBtn = screen.getByText(/Continue to Column Mapping/i);
    fireEvent.click(nextBtn);

    expect(screen.getByText("Map CSV Columns")).toBeInTheDocument();
    expect(screen.getByText("Feedback Text (Required)")).toBeInTheDocument();
  });

  it("advances from step 2 to step 3 (Validation Report)", () => {
    render(<UploadWizard />);
    fireEvent.click(screen.getByText(/Continue to Column Mapping/i));
    fireEvent.click(screen.getByText(/Validate Dataset/i));

    expect(screen.getByText("Pre-Ingestion Validation Report")).toBeInTheDocument();
    expect(screen.getByText("Clean valid records")).toBeInTheDocument();
  });

  it("initiates processing and completes pipeline in Step 4", async () => {
    render(<UploadWizard />);
    fireEvent.click(screen.getByText(/Continue to Column Mapping/i));
    fireEvent.click(screen.getByText(/Validate Dataset/i));
    fireEvent.click(screen.getByText(/Launch Async ML Pipeline/i));

    await waitFor(() => {
      expect(screen.getByText("Pipeline Complete!")).toBeInTheDocument();
      expect(screen.getByText("Open Executive Dashboard")).toBeInTheDocument();
    });
  });
});
