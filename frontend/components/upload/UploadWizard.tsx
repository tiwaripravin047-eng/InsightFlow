"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { ColumnMapping, DatasetStatusResponse } from "@/lib/types/api";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  Sparkles,
} from "lucide-react";

export const UploadWizard: React.FC = () => {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [datasetName, setDatasetName] = useState("College Feedback Q3 2026");
  const [domain, setDomain] = useState("college");
  const [fileName, setFileName] = useState("demo_feedback.csv");

  // Step 2: Column mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    text: "feedback_text",
    timestamp: "created_at",
    category: "department",
    source: "channel",
    rating: "score",
  });

  // Step 4: Async Processing
  const [jobId, setJobId] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState<string>("demo-college-2026");
  const [status, setStatus] = useState<DatasetStatusResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const sampleColumns = ["feedback_text", "created_at", "department", "channel", "score", "user_id"];

  const handleStartProcessing = async () => {
    setStep(4);
    setIsProcessing(true);

    const uploadRes = await apiClient.uploadDataset({
      name: datasetName,
      domain,
      column_mapping: mapping,
    });

    if (uploadRes.data) {
      setDatasetId(uploadRes.data.dataset_id);
      setJobId(uploadRes.data.job_id);

      // Fetch status
      const statusRes = await apiClient.getDatasetStatus(uploadRes.data.dataset_id);
      setStatus(statusRes.data);
    }
    setIsProcessing(false);
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-2xs space-y-6">
      {/* Wizard Steps Indicator */}
      <div className="flex items-center justify-between border-b pb-4 text-xs font-semibold">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
          <span className="w-5 h-5 rounded-full border flex items-center justify-center font-mono">1</span>
          <span>Upload File</span>
        </div>
        <div className="h-0.5 w-8 bg-border" />
        <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
          <span className="w-5 h-5 rounded-full border flex items-center justify-center font-mono">2</span>
          <span>Map Columns</span>
        </div>
        <div className="h-0.5 w-8 bg-border" />
        <div className={`flex items-center gap-1.5 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
          <span className="w-5 h-5 rounded-full border flex items-center justify-center font-mono">3</span>
          <span>Validation Report</span>
        </div>
        <div className="h-0.5 w-8 bg-border" />
        <div className={`flex items-center gap-1.5 ${step >= 4 ? "text-primary" : "text-muted-foreground"}`}>
          <span className="w-5 h-5 rounded-full border flex items-center justify-center font-mono">4</span>
          <span>Pipeline Progress</span>
        </div>
      </div>

      {/* STEP 1: Upload File & Domain */}
      {step === 1 && (
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Dataset Name</label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full h-9 px-3 bg-background border rounded-md text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Domain Context</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full h-9 px-3 bg-background border rounded-md text-foreground cursor-pointer"
            >
              <option value="college">Higher Education / Campus</option>
              <option value="hospital">Healthcare / Hospital Operations</option>
              <option value="retail">Retail / Customer Experience</option>
              <option value="saas">Product / Software Feedback</option>
            </select>
          </div>

          <div className="p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-muted/20 space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-primary" aria-hidden="true" />
            <div>
              <span className="font-semibold text-foreground block">{fileName}</span>
              <span className="text-muted-foreground text-[11px]">CSV format (~5,000 rows, 1.4 MB)</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <span>Continue to Column Mapping</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 2 && (
        <div className="space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">Map CSV Columns</h3>
            <p className="text-muted-foreground text-[11px]">
              Align detected CSV column headers with the canonical pipeline schema.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 border rounded bg-background space-y-1">
              <span className="font-semibold block text-foreground">Feedback Text (Required)</span>
              <select
                value={mapping.text}
                onChange={(e) => setMapping((m) => ({ ...m, text: e.target.value }))}
                className="w-full h-8 px-2 bg-background border rounded cursor-pointer"
              >
                {sampleColumns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>

            <div className="p-3 border rounded bg-background space-y-1">
              <span className="font-semibold block text-foreground">Timestamp (Required)</span>
              <select
                value={mapping.timestamp}
                onChange={(e) => setMapping((m) => ({ ...m, timestamp: e.target.value }))}
                className="w-full h-8 px-2 bg-background border rounded cursor-pointer"
              >
                {sampleColumns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>

            <div className="p-3 border rounded bg-background space-y-1">
              <span className="font-semibold block text-foreground">Category (Optional)</span>
              <select
                value={mapping.category}
                onChange={(e) => setMapping((m) => ({ ...m, category: e.target.value }))}
                className="w-full h-8 px-2 bg-background border rounded cursor-pointer"
              >
                {sampleColumns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>

            <div className="p-3 border rounded bg-background space-y-1">
              <span className="font-semibold block text-foreground">Source Channel (Optional)</span>
              <select
                value={mapping.source}
                onChange={(e) => setMapping((m) => ({ ...m, source: e.target.value }))}
                className="w-full h-8 px-2 bg-background border rounded cursor-pointer"
              >
                {sampleColumns.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-3 py-1.5 rounded border hover:bg-muted font-medium"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <span>Validate Dataset</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Validation Report */}
      {step === 3 && (
        <div className="space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">Pre-Ingestion Validation Report</h3>
            <p className="text-muted-foreground text-[11px]">
              Summary of automated sanitation, empty row filtering, and duplicate detection.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200">
              <span className="font-mono block text-lg font-bold">4,984</span>
              <span>Clean valid records</span>
            </div>
            <div className="p-3 border rounded bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200">
              <span className="font-mono block text-lg font-bold">12</span>
              <span>Duplicate rows removed</span>
            </div>
            <div className="p-3 border rounded bg-muted">
              <span className="font-mono block text-lg font-bold">4</span>
              <span>Empty text rows skipped</span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-3 py-1.5 rounded border hover:bg-muted font-medium"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStartProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Launch Async ML Pipeline</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Processing Progress & Dashboard Launch */}
      {step === 4 && (
        <div className="space-y-5 text-xs text-center py-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            {isProcessing ? (
              <RotateCw className="w-6 h-6 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-sentiment-positive-foreground" aria-hidden="true" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">
              {isProcessing ? "Processing Feedback Pipeline..." : "Pipeline Complete!"}
            </h3>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Stage: <strong className="font-mono uppercase text-foreground">{status?.current_stage || "insight_generation"}</strong>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-1">
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden border">
              <div
                style={{ width: `${status?.progress_percent || 100}%` }}
                className="h-full bg-primary transition-all duration-300"
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>{status?.rows_processed || 5000} / {status?.rows_total || 5000} rows</span>
              <span className="font-bold text-primary">{status?.progress_percent || 100}%</span>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${datasetId}/overview`)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs transition-colors"
            >
              <span>Open Executive Dashboard</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
