/**
 * API Contract Types for Feedback Intelligence OS (FIOS)
 * Strictly adhering to API_CONTRACTS.md and ARCHITECTURE.md §21
 */

// -----------------------------------------------------------------------------
// Envelope Definitions
// -----------------------------------------------------------------------------

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
}

export interface ApiMeta {
  pagination?: PaginationMeta;
  generated_at?: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T | null;
  meta?: ApiMeta | null;
  error: ApiError | null;
}

// -----------------------------------------------------------------------------
// Core Domain Primitive Enums & Literals
// -----------------------------------------------------------------------------

export type SentimentType = "positive" | "negative" | "neutral" | "mixed";
export type SeverityType = "low" | "medium" | "high" | "critical";
export type TrendType = "rising" | "declining" | "stable" | "emerging" | "resolved";
export type ActionStatus = "open" | "in_progress" | "resolved" | "verified";
export type JobStatus = "queued" | "processing" | "complete" | "failed";

// -----------------------------------------------------------------------------
// 1. Datasets & Ingestion
// -----------------------------------------------------------------------------

export interface ColumnMapping {
  text: string;
  timestamp: string;
  category?: string;
  source?: string;
  rating?: string;
}

export interface DatasetUploadRequest {
  file?: File | null;
  column_mapping: ColumnMapping;
  name: string;
  domain: string;
}

export interface DatasetUploadResponse {
  dataset_id: string;
  job_id: string;
  status: JobStatus;
}

export interface DatasetValidationSummary {
  empty_text_rows: number;
  duplicate_rows: number;
  invalid_dates: number;
}

export interface DatasetStatusResponse {
  status: JobStatus;
  progress_percent: number;
  current_stage: string;
  rows_processed: number;
  rows_total: number;
  validation_summary: DatasetValidationSummary;
  error: string | null;
}

export interface Dataset {
  id: string;
  name: string;
  domain: string;
  uploaded_at: string;
  column_mapping: ColumnMapping;
  total_feedback?: number;
}

// -----------------------------------------------------------------------------
// 2. Insights & Issue Radar
// -----------------------------------------------------------------------------

export interface PriorityFactors {
  sentiment_severity: number;
  normalized_frequency: number;
  growth_rate: number;
  recurrence: number;
  urgency_signal: number;
}

export interface LikelyDriver {
  topic: string;
  correlation_strength: number;
}

export interface ConfidenceFactors {
  sample_size: number;
  topic_coherence: number;
  duplicate_ratio: number;
}

export interface ModelVersions {
  sentiment: string;
  embedding: string;
  pipeline: string;
}

export interface Insight {
  id: string;
  dataset_id?: string;
  title: string;
  topic_id: string;
  topic_label: string;
  sentiment: SentimentType;
  severity: SeverityType;
  priority_score: number;
  priority_factors: PriorityFactors;
  trend: TrendType;
  change_percent: number;
  volume: number;
  unique_issue_count: number;
  affected_categories: string[];
  likely_drivers: LikelyDriver[];
  recommended_actions: string[];
  confidence: number;
  confidence_factors: ConfidenceFactors;
  model_versions: ModelVersions;
  generated_at: string;
}

export interface RepresentativeFeedbackSample {
  feedback_id: string;
  text: string;
  sentiment: SentimentType;
  date: string;
}

export interface SentimentDistribution {
  negative: number;
  neutral: number;
  positive: number;
}

export interface EvidenceResponse {
  insight_id: string;
  evidence_count: number;
  representative_samples: RepresentativeFeedbackSample[];
  sentiment_distribution: SentimentDistribution;
  date_range: {
    from: string;
    to: string;
  };
  filters_used: Record<string, string>;
}

// -----------------------------------------------------------------------------
// 3. Issues (Management View)
// -----------------------------------------------------------------------------

export interface Issue extends Insight {
  description: string;
  affected_segments: string[];
  owner: string | null;
  status: ActionStatus;
  linked_actions: string[];
}

// -----------------------------------------------------------------------------
// 4. Themes
// -----------------------------------------------------------------------------

export interface SubTheme {
  id: string;
  label: string;
  volume: number;
  sentiment_breakdown: {
    negative?: number;
    neutral?: number;
    positive?: number;
  };
}

export interface Theme {
  id: string;
  label: string;
  volume: number;
  sentiment_breakdown: {
    negative: number;
    neutral: number;
    positive: number;
  };
  trend: TrendType;
  sub_themes: SubTheme[];
}

// -----------------------------------------------------------------------------
// 5. Feedback Explorer
// -----------------------------------------------------------------------------

export interface FeedbackAspect {
  aspect: string;
  sentiment: SentimentType;
  confidence: number;
}

export interface SimilarFeedback {
  feedback_id: string;
  similarity_score: number;
}

export interface FeedbackItem {
  id: string;
  text: string;
  sentiment: SentimentType;
  sentiment_confidence: number;
  topic: string;
  aspects: FeedbackAspect[];
  emotion: string;
  intent: string;
  urgency: "low" | "medium" | "high" | "critical" | string;
  severity: SeverityType;
  date: string;
  category: string;
  source: string;
  language: string;
  similar_feedback?: SimilarFeedback[];
  related_issue_id?: string | null;
}

// -----------------------------------------------------------------------------
// 6. Trends & Period Comparison ("What Changed?")
// -----------------------------------------------------------------------------

export interface TrendPoint {
  date: string;
  volume: number;
  negative_ratio: number;
}

export interface TrendResponse {
  series: TrendPoint[];
}

export interface CompareTopicItem {
  topic: string;
  change_percent?: number;
  first_seen?: string;
  volume?: number;
  evidence_insight_id?: string;
}

export interface PeriodCompareResponse {
  improved: CompareTopicItem[];
  worsened: CompareTopicItem[];
  emerging: CompareTopicItem[];
  stable: CompareTopicItem[];
}

// -----------------------------------------------------------------------------
// 7. Actions (Action Center)
// -----------------------------------------------------------------------------

export interface CreateActionRequest {
  title: string;
  suggested_owner?: string;
  priority?: SeverityType | string;
}

export interface UpdateActionRequest {
  status: ActionStatus;
}

export interface Action {
  id: string;
  issue_id: string;
  title: string;
  status: ActionStatus;
  suggested_owner?: string;
  priority?: SeverityType | string;
  outcome_before?: number | null;
  outcome_after?: number | null;
  created_at: string;
  resolved_at?: string | null;
}

// -----------------------------------------------------------------------------
// 8. Ask Feedback (NL Query)
// -----------------------------------------------------------------------------

export interface AskFeedbackRequest {
  question: string;
}

export interface AskFeedbackResponse {
  answer: string;
  computed_data: {
    change_percent?: number;
    top_drivers?: string[];
    [key: string]: unknown;
  };
  evidence_insight_ids: string[];
  filters_applied: {
    date_from?: string;
    date_to?: string;
    [key: string]: unknown;
  };
  answerable: boolean;
}

// -----------------------------------------------------------------------------
// Query Filters
// -----------------------------------------------------------------------------

export interface FilterParams {
  category?: string;
  sentiment?: SentimentType | string;
  severity?: SeverityType | string;
  trend?: TrendType | string;
  topic_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}
