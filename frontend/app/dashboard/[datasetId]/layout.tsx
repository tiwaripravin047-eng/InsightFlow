import React from "react";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = await params;

  return <AppShell datasetId={datasetId}>{children}</AppShell>;
}
