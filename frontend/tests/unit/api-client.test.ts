import { describe, it, expect } from "vitest";
import { apiClient } from "@/lib/api/client";

describe("Central ApiClient", () => {
  it("runs in mock mode by default", () => {
    expect(apiClient.isMockMode()).toBe(true);
  });

  it("retrieves datasets successfully with standard envelope format", async () => {
    const res = await apiClient.getDatasets();
    expect(res.error).toBeNull();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data!.length).toBeGreaterThan(0);
    expect(res.data![0]).toHaveProperty("id");
    expect(res.data![0]).toHaveProperty("name");
  });

  it("retrieves insights matching API_CONTRACTS.md specification", async () => {
    const res = await apiClient.getInsights("demo-college-2026");
    expect(res.error).toBeNull();
    expect(res.data).toBeDefined();
    expect(res.data!.length).toBeGreaterThan(0);

    const first = res.data![0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("sentiment");
    expect(first).toHaveProperty("severity");
    expect(first).toHaveProperty("priority_score");
    expect(first).toHaveProperty("priority_factors");
    expect(first).toHaveProperty("confidence");
    expect(first).toHaveProperty("likely_drivers");
    expect(first).toHaveProperty("recommended_actions");
  });

  it("retrieves structured evidence for an insight", async () => {
    const res = await apiClient.getEvidence("ins-food-quality-001");
    expect(res.error).toBeNull();
    expect(res.data).toBeDefined();
    expect(res.data!.insight_id).toBe("ins-food-quality-001");
    expect(res.data!.evidence_count).toBe(214);
    expect(res.data!.representative_samples.length).toBeGreaterThan(0);
    expect(res.data!.sentiment_distribution.negative).toBeGreaterThan(0);
  });

  it("filters feedback explorer queries", async () => {
    const res = await apiClient.getFeedback("demo-college-2026", {
      search: "wifi",
    });
    expect(res.error).toBeNull();
    expect(res.data).toBeDefined();
    expect(res.data!.length).toBeGreaterThan(0);
    expect(res.data![0].topic).toBe("Wi-Fi Reliability");
  });

  it("mutates actions through state machine", async () => {
    const createRes = await apiClient.createAction("iss-001", {
      title: "Test Unit Action",
      suggested_owner: "QA Team",
      priority: "high",
    });
    expect(createRes.error).toBeNull();
    expect(createRes.data!.status).toBe("open");

    const updateRes = await apiClient.updateAction(createRes.data!.id, {
      status: "resolved",
    });
    expect(updateRes.error).toBeNull();
    expect(updateRes.data!.status).toBe("resolved");
    expect(updateRes.data!.resolved_at).toBeDefined();
  });
});
