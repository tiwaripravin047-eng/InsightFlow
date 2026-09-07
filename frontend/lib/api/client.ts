/**
 * Central Typed API Client for Feedback Intelligence OS (Track B)
 * Handles base URL, envelope parsing ({ data, meta, error }), timeouts,
 * error normalization, and transparent mock/real backend switching.
 */

import {
  ApiResponse,
  Dataset,
  DatasetStatusResponse,
  DatasetUploadRequest,
  DatasetUploadResponse,
  Insight,
  EvidenceResponse,
  Issue,
  Theme,
  FeedbackItem,
  TrendResponse,
  PeriodCompareResponse,
  Action,
  CreateActionRequest,
  UpdateActionRequest,
  AskFeedbackRequest,
  AskFeedbackResponse,
  FilterParams,
} from "@/lib/types/api";

import datasetsMock from "@/lib/mocks/datasets.json";
import statusMock from "@/lib/mocks/status.json";
import insightsMock from "@/lib/mocks/insights.json";
import evidenceMock from "@/lib/mocks/evidence.json";
import issuesMock from "@/lib/mocks/issues.json";
import themesMock from "@/lib/mocks/themes.json";
import feedbackMock from "@/lib/mocks/feedback.json";
import trendsMock from "@/lib/mocks/trends.json";
import actionsMock from "@/lib/mocks/actions.json";
import queryMock from "@/lib/mocks/query.json";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// In-memory clone of mutable mock actions so UI updates persist during session
const mutableMockActions: Action[] = JSON.parse(JSON.stringify(actionsMock));

class ApiClient {
  private baseUrl: string;
  private useMocks: boolean;

  constructor() {
    this.baseUrl = BASE_URL;
    this.useMocks = USE_MOCKS;
  }

  public isMockMode(): boolean {
    return this.useMocks;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options?.headers,
        },
      });
      clearTimeout(timeoutId);

      const json: ApiResponse<T> = await response.json();
      if (!response.ok && !json.error) {
        return {
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText || "Request failed",
          },
        };
      }
      return json;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Network error occurred";
      return {
        data: null,
        error: {
          code: "NETWORK_ERROR",
          message:
            message.includes("abort")
              ? "Request timed out. Please try again."
              : "Unable to reach the server. Please check your connection.",
        },
      };
    }
  }

  // 1. Datasets
  async getDatasets(): Promise<ApiResponse<Dataset[]>> {
    if (this.useMocks) {
      return {
        data: datasetsMock as Dataset[],
        meta: { generated_at: new Date().toISOString() },
        error: null,
      };
    }
    return this.request<Dataset[]>("/api/v1/datasets");
  }

  async uploadDataset(
    req: DatasetUploadRequest
  ): Promise<ApiResponse<DatasetUploadResponse>> {
    if (this.useMocks) {
      return {
        data: {
          dataset_id: "demo-college-2026",
          job_id: "job-upload-mock-001",
          status: "queued",
        },
        error: null,
      };
    }

    if (req.file) {
      const formData = new FormData();
      formData.append("file", req.file);
      formData.append("name", req.name);
      formData.append("domain", req.domain);
      formData.append("column_mapping", JSON.stringify(req.column_mapping));

      const url = `${this.baseUrl}/api/v1/datasets`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });
        clearTimeout(timeoutId);

        const json: ApiResponse<DatasetUploadResponse> = await response.json();
        if (!response.ok && !json.error) {
          return {
            data: null,
            error: {
              code: `HTTP_${response.status}`,
              message: response.statusText || "Upload failed",
            },
          };
        }
        return json;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Network error occurred";
        return {
          data: null,
          error: {
            code: "NETWORK_ERROR",
            message: message.includes("abort")
              ? "Request timed out. Please try again."
              : "Unable to reach the server. Please check your connection.",
          },
        };
      }
    }

    return this.request<DatasetUploadResponse>("/api/v1/datasets", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  async getDatasetStatus(id: string): Promise<ApiResponse<DatasetStatusResponse>> {
    if (this.useMocks) {
      return {
        data: statusMock as DatasetStatusResponse,
        error: null,
      };
    }
    return this.request<DatasetStatusResponse>(`/api/v1/datasets/${id}/status`);
  }

  // 2. Insights
  async getInsights(
    datasetId: string,
    filters?: FilterParams
  ): Promise<ApiResponse<Insight[]>> {
    if (this.useMocks) {
      let filtered = insightsMock as Insight[];
      if (filters?.sentiment) {
        filtered = filtered.filter((i) => i.sentiment === filters.sentiment);
      }
      if (filters?.severity) {
        filtered = filtered.filter((i) => i.severity === filters.severity);
      }
      if (filters?.trend) {
        filtered = filtered.filter((i) => i.trend === filters.trend);
      }
      return {
        data: filtered,
        meta: {
          pagination: { limit: 20, offset: 0, total: filtered.length },
          generated_at: "2026-09-06T00:00:00Z",
        },
        error: null,
      };
    }
    const searchParams = new URLSearchParams();
    if (filters?.sentiment) searchParams.set("sentiment", filters.sentiment);
    if (filters?.severity) searchParams.set("severity", filters.severity);
    if (filters?.trend) searchParams.set("trend", filters.trend);
    if (filters?.limit) searchParams.set("limit", String(filters.limit));
    if (filters?.offset) searchParams.set("offset", String(filters.offset));

    const qs = searchParams.toString();
    return this.request<Insight[]>(
      `/api/v1/datasets/${datasetId}/insights${qs ? `?${qs}` : ""}`
    );
  }

  async getEvidence(insightId: string): Promise<ApiResponse<EvidenceResponse>> {
    if (this.useMocks) {
      const record = (evidenceMock as Record<string, EvidenceResponse>)[
        insightId
      ];
      if (record) {
        return { data: record, error: null };
      }
      // fallback generic evidence
      return {
        data: {
          insight_id: insightId,
          evidence_count: 12,
          representative_samples: [
            {
              feedback_id: "fb-fallback-1",
              text: "General representative feedback item for this insight.",
              sentiment: "negative",
              date: "2026-09-04",
            },
          ],
          sentiment_distribution: { negative: 0.8, neutral: 0.15, positive: 0.05 },
          date_range: { from: "2026-08-01", to: "2026-09-06" },
          filters_used: { insight_id: insightId },
        },
        error: null,
      };
    }
    return this.request<EvidenceResponse>(
      `/api/v1/insights/${insightId}/evidence`
    );
  }

  // 3. Issues
  async getIssues(datasetId: string): Promise<ApiResponse<Issue[]>> {
    if (this.useMocks) {
      return {
        data: issuesMock as Issue[],
        meta: {
          pagination: { limit: 20, offset: 0, total: issuesMock.length },
          generated_at: "2026-09-06T00:00:00Z",
        },
        error: null,
      };
    }
    return this.request<Issue[]>(`/api/v1/datasets/${datasetId}/issues`);
  }

  async getIssue(
    datasetId: string,
    issueId: string
  ): Promise<ApiResponse<Issue>> {
    if (this.useMocks) {
      const found = (issuesMock as Issue[]).find((i) => i.id === issueId);
      if (found) {
        return { data: found, error: null };
      }
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "Issue not found" },
      };
    }
    return this.request<Issue>(`/api/v1/datasets/${datasetId}/issues/${issueId}`);
  }

  // 4. Themes
  async getThemes(datasetId: string): Promise<ApiResponse<Theme[]>> {
    if (this.useMocks) {
      return {
        data: themesMock as Theme[],
        meta: {
          pagination: { limit: 50, offset: 0, total: themesMock.length },
          generated_at: "2026-09-06T00:00:00Z",
        },
        error: null,
      };
    }
    return this.request<Theme[]>(`/api/v1/datasets/${datasetId}/themes`);
  }

  // 5. Feedback Explorer
  async getFeedback(
    datasetId: string,
    filters?: FilterParams
  ): Promise<ApiResponse<FeedbackItem[]>> {
    if (this.useMocks) {
      let results = feedbackMock as FeedbackItem[];
      if (filters?.sentiment) {
        results = results.filter((f) => f.sentiment === filters.sentiment);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (f) =>
            f.text.toLowerCase().includes(q) || f.topic.toLowerCase().includes(q)
        );
      }
      return {
        data: results,
        meta: {
          pagination: { limit: 50, offset: 0, total: results.length },
          generated_at: "2026-09-06T00:00:00Z",
        },
        error: null,
      };
    }
    const searchParams = new URLSearchParams();
    if (filters?.sentiment) searchParams.set("sentiment", filters.sentiment);
    if (filters?.search) searchParams.set("search", filters.search);
    if (filters?.topic_id) searchParams.set("topic_id", filters.topic_id);
    if (filters?.limit) searchParams.set("limit", String(filters.limit));
    if (filters?.offset) searchParams.set("offset", String(filters.offset));

    const qs = searchParams.toString();
    return this.request<FeedbackItem[]>(
      `/api/v1/datasets/${datasetId}/feedback${qs ? `?${qs}` : ""}`
    );
  }

  async getFeedbackDetail(id: string): Promise<ApiResponse<FeedbackItem>> {
    if (this.useMocks) {
      const item = (feedbackMock as FeedbackItem[]).find((f) => f.id === id);
      if (item) {
        return { data: item, error: null };
      }
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "Feedback not found" },
      };
    }
    return this.request<FeedbackItem>(`/api/v1/feedback/${id}`);
  }

  // 6. Trends & Compare
  async getTrends(
    datasetId: string,
    topicId?: string,
    windowDays: number = 30
  ): Promise<ApiResponse<TrendResponse>> {
    if (this.useMocks) {
      return {
        data: { series: trendsMock.series },
        error: null,
      };
    }
    return this.request<TrendResponse>(
      `/api/v1/datasets/${datasetId}/trend?window_days=${windowDays}${
        topicId ? `&topic_id=${topicId}` : ""
      }`
    );
  }

  async getCompare(
    datasetId: string,
    periodAStart?: string,
    periodBEnd?: string
  ): Promise<ApiResponse<PeriodCompareResponse>> {
    if (this.useMocks) {
      return {
        data: trendsMock.compare as PeriodCompareResponse,
        error: null,
      };
    }
    return this.request<PeriodCompareResponse>(
      `/api/v1/datasets/${datasetId}/compare?period_a_start=${
        periodAStart || "2026-08-01"
      }&period_b_end=${periodBEnd || "2026-09-06"}`
    );
  }

  // 7. Actions
  async getActions(): Promise<ApiResponse<Action[]>> {
    if (this.useMocks) {
      return {
        data: mutableMockActions,
        error: null,
      };
    }
    return this.request<Action[]>("/api/v1/actions");
  }

  async createAction(
    issueId: string,
    req: CreateActionRequest
  ): Promise<ApiResponse<Action>> {
    if (this.useMocks) {
      const newAction: Action = {
        id: `act-${Date.now()}`,
        issue_id: issueId,
        title: req.title,
        status: "open",
        suggested_owner: req.suggested_owner,
        priority: req.priority,
        created_at: new Date().toISOString(),
      };
      mutableMockActions.unshift(newAction);
      return { data: newAction, error: null };
    }
    return this.request<Action>(`/api/v1/issues/${issueId}/actions`, {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  async updateAction(
    actionId: string,
    req: UpdateActionRequest
  ): Promise<ApiResponse<Action>> {
    if (this.useMocks) {
      const idx = mutableMockActions.findIndex((a) => a.id === actionId);
      if (idx !== -1) {
        mutableMockActions[idx] = {
          ...mutableMockActions[idx],
          status: req.status,
          resolved_at:
            req.status === "resolved" ? new Date().toISOString() : null,
        };
        return { data: mutableMockActions[idx], error: null };
      }
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "Action not found" },
      };
    }
    return this.request<Action>(`/api/v1/actions/${actionId}`, {
      method: "PATCH",
      body: JSON.stringify(req),
    });
  }

  // 8. Ask Feedback (NL Query)
  async queryFeedback(
    datasetId: string,
    req: AskFeedbackRequest
  ): Promise<ApiResponse<AskFeedbackResponse>> {
    if (this.useMocks) {
      const q = req.question.trim();
      const mockQueries = queryMock as Record<string, AskFeedbackResponse>;
      const matched = mockQueries[q] || mockQueries["default"];
      return {
        data: matched,
        error: null,
      };
    }
    return this.request<AskFeedbackResponse>(
      `/api/v1/datasets/${datasetId}/query`,
      {
        method: "POST",
        body: JSON.stringify(req),
      }
    );
  }
}

export const apiClient = new ApiClient();
