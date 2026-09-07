import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export interface AppShellProps {
  datasetId: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ datasetId, children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar datasetId={datasetId} />

      {/* Main Column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar currentDatasetId={datasetId} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
