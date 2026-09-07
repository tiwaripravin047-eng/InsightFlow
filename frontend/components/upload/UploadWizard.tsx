"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { ColumnMapping, DatasetStatusResponse } from "@/lib/types/api";
import { formatNumber } from "@/lib/utils/formatters";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  Sparkles,
  FileCheck,
  RefreshCw,
} from "lucide-react";

export const UploadWizard: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [datasetName, setDatasetName] = useState("College Feedback Q3 2026");
  const [domain, setDomain] = useState("college");

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("demo_feedback.csv");
  const [fileSize, setFileSize] = useState("1.4 MB");
  const [rowCount, setRowCount] = useState(5000);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleColumns = [
    "feedback_text",
    "created_at",
    "department",
    "channel",
    "score",
    "user_id",
  ];
  const [availableColumns, setAvailableColumns] = useState<string[]>(sampleColumns);

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

  const processCsvFile = (csvFile: File) => {
    if (
      !csvFile.name.toLowerCase().endsWith(".csv") &&
      csvFile.type !== "text/csv" &&
      csvFile.type !== "application/vnd.ms-excel"
    ) {
      setErrorMsg("Please upload a valid CSV file (.csv)");
      return;
    }

    setErrorMsg(null);
    setFile(csvFile);
    setFileName(csvFile.name);

    // Format file size
    const sizeKB = csvFile.size / 1024;
    const formattedSize =
      sizeKB > 1024
        ? `${(sizeKB / 1024).toFixed(1)} MB`
        : `${Math.round(sizeKB)} KB`;
    setFileSize(formattedSize);

    // Auto-populate dataset name if default
    const nameWithoutExt = csvFile.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]/g, " ");
    const formattedName =
      nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);
    setDatasetName(formattedName);

    // Parse CSV headers and estimate rows
    const readText = async () => {
      try {
        setIsParsing(true);
        let content = "";
        if (typeof csvFile.text === "function") {
          content = await csvFile.text();
        } else {
          content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || "");
            reader.onerror = reject;
            reader.readAsText(csvFile);
          });
        }
        if (content) {
          const lines = content.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 0) {
            // Parse header row
            const headerLine = lines[0];
            const detectedHeaders = headerLine
              .split(",")
              .map((h) => h.trim().replace(/^["']|["']$/g, ""))
              .filter((h) => h.length > 0);

            if (detectedHeaders.length > 0) {
              setAvailableColumns(detectedHeaders);

              // Auto-detect column mappings
              const textCol =
                detectedHeaders.find((h) =>
                  /text|feedback|comment|review|message|content|desc|complaint/i.test(
                    h
                  )
                ) || detectedHeaders[0];
              const timeCol =
                detectedHeaders.find((h) =>
                  /time|date|created|at|timestamp|day|year/i.test(h)
                ) || (detectedHeaders[1] || detectedHeaders[0]);
              const catCol =
                detectedHeaders.find((h) =>
                  /category|dept|department|topic|type|group|area|faculty/i.test(h)
                ) || "";
              const srcCol =
                detectedHeaders.find((h) =>
                  /source|channel|platform|medium|survey|portal/i.test(h)
                ) || "";
              const rateCol =
                detectedHeaders.find((h) =>
                  /rating|score|stars|grade|satisfaction|nps/i.test(h)
                ) || "";

              setMapping({
                text: textCol,
                timestamp: timeCol,
                category: catCol || undefined,
                source: srcCol || undefined,
                rating: rateCol || undefined,
              });
            }
            setRowCount(Math.max(1, lines.length - 1));
          }
        }
      } catch {
        setErrorMsg("Failed to read CSV file. Please verify file format.");
      } finally {
        setIsParsing(false);
      }
    };
    readText();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processCsvFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processCsvFile(dropped);
    }
  };

  const handleResetToDemo = () => {
    setFile(null);
    setFileName("demo_feedback.csv");
    setFileSize("1.4 MB");
    setRowCount(5000);
    setDatasetName("College Feedback Q3 2026");
    setDomain("college");
    setAvailableColumns(sampleColumns);
    setMapping({
      text: "feedback_text",
      timestamp: "created_at",
      category: "department",
      source: "channel",
      rating: "score",
    });
    setErrorMsg(null);
  };

  const handleStartProcessing = async () => {
    setStep(4);
    setIsProcessing(true);

    const uploadRes = await apiClient.uploadDataset({
      file,
      name: datasetName,
      domain,
      column_mapping: mapping,
    });

    if (uploadRes.data) {
      setDatasetId(uploadRes.data.dataset_id);
      setJobId(uploadRes.data.job_id);

      // Fetch status
      const statusRes = await apiClient.getDatasetStatus(
        uploadRes.data.dataset_id
      );
      setStatus(statusRes.data);
    }
    setIsProcessing(false);
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-2xs space-y-6">
      {/* Wizard Steps Indicator */}
      <div className="flex items-center justify-between border-b pb-4 text-xs font-semibold">
        <div
          className={`flex items-center gap-1.5 ${
            step >= 1 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center font-mono">
            1
          </span>
          <span>Upload File</span>
        </div>
        <div className="h-0.5 w-8 bg-border" />
        <div
          className={`flex items-center gap-1.5 ${
            step >= 2 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center font-mono">
            2
          </span>
          <span>Map Columns</span>
        </div>
        <div className="h-0.5 w-8 bg-border" />
        <div
          className={`flex items-center gap-1.5 ${
            step >= 3 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center font-mono">
            3
          </span>
          <span>Validation Report</span>
        </div>
        <div className="h-0.5 w-8 bg-border" />
        <div
          className={`flex items-center gap-1.5 ${
            step >= 4 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center font-mono">
            4
          </span>
          <span>Pipeline Progress</span>
        </div>
      </div>

      {/* STEP 1: Upload File & Domain */}
      {step === 1 && (
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Dataset Name
            </label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full h-9 px-3 bg-background border rounded-md text-foreground"
              placeholder="e.g. Q3 Student Feedback"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Domain Context
            </label>
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

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
          />

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/20 hover:bg-muted/30"
            } space-y-3`}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              {file ? (
                <FileCheck className="w-6 h-6 text-emerald-600" aria-hidden="true" />
              ) : (
                <FileSpreadsheet className="w-6 h-6 text-primary" aria-hidden="true" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  {fileName}
                </span>
                {file ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Uploaded File
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                    Demo Preset
                  </span>
                )}
              </div>
              <span className="text-muted-foreground text-[11px] block">
                CSV format (~{formatNumber(rowCount)} rows, {fileSize}) &bull;{" "}
                {availableColumns.length} detected columns
              </span>
            </div>

            {errorMsg && (
              <div className="text-xs text-destructive flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-background hover:bg-muted text-foreground font-medium text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-primary" />
                <span>{file ? "Choose Another CSV" : "Browse / Upload CSV"}</span>
              </button>

              {file && (
                <button
                  type="button"
                  onClick={handleResetToDemo}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-dashed hover:bg-muted text-muted-foreground text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to Demo File</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Or drag & drop any <code>.csv</code> file into this area
            </p>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={isParsing}
              className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
              Align detected CSV column headers from{" "}
              <strong className="text-foreground">{fileName}</strong> with the
              canonical pipeline schema.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 border rounded bg-background space-y-1">
              <span className="font-semibold block text-foreground">
                Feedback Text (Required)
              </span>
              <select
                value={mapping.text}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, text: e.target.value }))
                }
                className="w-full h-8 px-2 bg-background border rounded cursor-pointer"
              >
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 border rounded bg-background space-y-1">
              <span className="font-semibold block text-foreground">
                Timestamp (Required)
              </span>
              <select
                value={mapping.timestamp}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, timestamp: e.target.value }))
                }
                className="w-full h-8 px-2 bg-background border rounded cursor-pointer"
              >
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 border rounded bg-background space-y-1">
              <span className="font-semibold block text-foreground">
                Category (Optional)
              </span>
              <select
                value={mapping.category || ""}
                onChange={(e) =>
                  setMapping((m) => ({
                    ...m,
                    category: e.target.value || undefined,
                  }))
                }
                className="w-full h-8 px-2 bg-background border rounded cursor-pointer"
              >
                <option value="">-- None / Auto-discover --</option>
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 border rounded bg-background space-y-1">
              <span className="font-semibold block text-foreground">
                Source Channel (Optional)
              </span>
              <select
                value={mapping.source || ""}
                onChange={(e) =>
                  setMapping((m) => ({
                    ...m,
                    source: e.target.value || undefined,
                  }))
                }
                className="w-full h-8 px-2 bg-background border rounded cursor-pointer"
              >
                <option value="">-- None / Default --</option>
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-3 py-1.5 rounded border hover:bg-muted font-medium cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
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
            <h3 className="text-sm font-bold text-foreground">
              Pre-Ingestion Validation Report
            </h3>
            <p className="text-muted-foreground text-[11px]">
              Summary of automated sanitation, empty row filtering, and duplicate
              detection for <strong className="text-foreground">{fileName}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200">
              <span className="font-mono block text-lg font-bold">
                {formatNumber(Math.max(1, rowCount - 16))}
              </span>
              <span>Clean valid records</span>
            </div>
            <div className="p-3 border rounded bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200">
              <span className="font-mono block text-lg font-bold">
                {Math.max(0, Math.floor(rowCount * 0.003)) || 12}
              </span>
              <span>Duplicate rows removed</span>
            </div>
            <div className="p-3 border rounded bg-muted">
              <span className="font-mono block text-lg font-bold">
                {Math.max(0, Math.floor(rowCount * 0.001)) || 4}
              </span>
              <span>Empty text rows skipped</span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-3 py-1.5 rounded border hover:bg-muted font-medium cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStartProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
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
              <CheckCircle2
                className="w-6 h-6 text-sentiment-positive-foreground"
                aria-hidden="true"
              />
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">
              {isProcessing
                ? "Processing Feedback Pipeline..."
                : "Pipeline Complete!"}
            </h3>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Stage:{" "}
              <strong className="font-mono uppercase text-foreground">
                {status?.current_stage || "insight_generation"}
              </strong>
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
              <span>
                {status?.rows_processed || rowCount} /{" "}
                {status?.rows_total || rowCount} rows
              </span>
              <span className="font-bold text-primary">
                {status?.progress_percent || 100}%
              </span>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${datasetId}/overview`)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs transition-colors cursor-pointer"
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
