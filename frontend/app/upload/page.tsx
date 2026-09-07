"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { UploadWizard } from "@/components/upload/UploadWizard";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b">
        <Link
          href="/dashboard/demo-college-2026/overview"
          className="hover:opacity-90 transition-opacity focus:outline-none focus:ring-1 focus:ring-ring rounded-md"
        >
          <Logo size="md" subtitle="Dataset Ingestion" />
        </Link>
        <Link
          href="/dashboard/demo-college-2026/overview"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <PageHeader
        title="Dataset Ingestion Wizard"
        description="Upload CSV feedback datasets, map schema columns, validate formatting, and monitor async ML processing."
      />

      <UploadWizard />
    </div>
  );
}
