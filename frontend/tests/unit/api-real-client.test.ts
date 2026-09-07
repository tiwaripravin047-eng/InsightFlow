import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "@/lib/api/client";

describe("ApiClient Real Network Dispatch and Error Envelope handling", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Force mock switch to false using reflection
    (apiClient as unknown as { useMocks: boolean }).useMocks = false;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (apiClient as unknown as { useMocks: boolean }).useMocks = true;
  });

  it("dispatches real fetch request when useMocks is false", async () => {
    const mockResponse = {
      data: [{ id: "dataset-real-1", name: "Production Feed", row_count: 1000 }],
      meta: { generated_at: "2026-09-07T12:00:00Z" },
      error: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const res = await apiClient.getDatasets();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/datasets"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
      })
    );
    expect(res.data).toEqual(mockResponse.data);
    expect(res.error).toBeNull();
  });

  it("handles HTTP error status codes correctly and standardizes error envelope", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({
        data: null,
        error: { code: "NOT_FOUND", message: "Resource was not found" },
      }),
    });

    const res = await apiClient.getInsights("nonexistent");
    expect(res.data).toBeNull();
    expect(res.error).toBeDefined();
    expect(res.error?.message).toBe("Resource was not found");
  });

  it("handles network failure or abort gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    const res = await apiClient.getThemes("any-id");
    expect(res.data).toBeNull();
    expect(res.error).toBeDefined();
    expect(res.error?.code).toBe("NETWORK_ERROR");
  });
});
