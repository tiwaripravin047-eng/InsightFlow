"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Insight } from "@/lib/types/api";
import { Table, ScatterChart } from "lucide-react";

// Dynamic import for ECharts to avoid SSR hydration issues
const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-muted/20 animate-pulse rounded" />,
});

export interface IssueTrendMatrixProps {
  insights: Insight[];
  onOpenEvidence: (insightId: string) => void;
  className?: string;
}

export const IssueTrendMatrix: React.FC<IssueTrendMatrixProps> = ({
  insights,
  onOpenEvidence,
  className,
}) => {
  const [showTableFallback, setShowTableFallback] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Format data: [volume, priority_score, bubble_size, title, id, severity]
  const data = insights.map((item) => [
    item.volume,
    item.priority_score,
    Math.max(16, Math.min(36, item.volume / 8)),
    item.title,
    item.id,
    item.severity,
  ]);

  const option = {
    grid: {
      left: "8%",
      right: "10%",
      top: "12%",
      bottom: "12%",
    },
    tooltip: {
      formatter: (param: any) => {
        const val = param.data;
        return `<div style="font-size:12px;font-family:sans-serif;">
          <strong>${val[3]}</strong><br/>
          Volume: ${val[0]} mentions<br/>
          Priority Score: ${val[1]} / 100<br/>
          Severity: ${val[5]}<br/>
          <em>Click bubble to inspect evidence</em>
        </div>`;
      },
    },
    xAxis: {
      name: "Volume (Frequency)",
      nameLocation: "middle",
      nameGap: 24,
      splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      axisLine: { lineStyle: { color: "#94a3b8" } },
    },
    yAxis: {
      name: "Priority / Negative Severity",
      nameLocation: "middle",
      nameGap: 30,
      min: 0,
      max: 100,
      splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      axisLine: { lineStyle: { color: "#94a3b8" } },
    },
    // Quadrant visual markings
    graphic: [
      {
        type: "text",
        left: "55%",
        top: "16%",
        style: {
          text: "Critical Priority\n(High Frequency × High Severity)",
          fill: "#b91c1c",
          font: "bold 11px sans-serif",
        },
      },
      {
        type: "text",
        left: "12%",
        top: "16%",
        style: {
          text: "Emerging Risk\n(Low Volume × High Severity)",
          fill: "#c2410c",
          font: "bold 11px sans-serif",
        },
      },
      {
        type: "text",
        left: "55%",
        bottom: "16%",
        style: {
          text: "High Volume Moderate\n(Frequent Inconvenience)",
          fill: "#475569",
          font: "11px sans-serif",
        },
      },
      {
        type: "text",
        left: "12%",
        bottom: "16%",
        style: {
          text: "Low Impact\n(Routine Monitoring)",
          fill: "#64748b",
          font: "11px sans-serif",
        },
      },
    ],
    series: [
      {
        name: "Issues",
        type: "scatter",
        data: data,
        symbolSize: (val: any) => val[2],
        itemStyle: {
          color: (param: any) => {
            const sev = param.data[5];
            if (sev === "critical") return "#ef4444";
            if (sev === "high") return "#f97316";
            if (sev === "medium") return "#eab308";
            return "#10b981";
          },
          opacity: 0.85,
        },
      },
    ],
  };

  const onEvents = {
    click: (params: any) => {
      if (params.data && params.data[4]) {
        onOpenEvidence(params.data[4]);
      }
    },
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Issue Trend Matrix
          </h2>
          <p className="text-xs text-muted-foreground">
            Quadrant distribution: Frequency vs Severity (Bubble size = Impact)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTableFallback((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          aria-label={showTableFallback ? "Show scatter chart" : "Show accessible data table"}
        >
          {showTableFallback ? (
            <>
              <ScatterChart className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Chart View</span>
            </>
          ) : (
            <>
              <Table className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Table View</span>
            </>
          )}
        </button>
      </div>

      {showTableFallback ? (
        <div className="overflow-x-auto border rounded-md max-h-64">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted text-muted-foreground uppercase font-semibold">
              <tr>
                <th scope="col" className="px-3 py-2">Issue</th>
                <th scope="col" className="px-3 py-2 text-right">Volume</th>
                <th scope="col" className="px-3 py-2 text-right">Priority Score</th>
                <th scope="col" className="px-3 py-2">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {insights.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onOpenEvidence(item.id)}
                  className="hover:bg-muted/40 cursor-pointer"
                >
                  <td className="px-3 py-2 font-medium">{item.title}</td>
                  <td className="px-3 py-2 text-right font-mono">{item.volume}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-primary">{item.priority_score}</td>
                  <td className="px-3 py-2 uppercase font-semibold text-[10px]">{item.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isMounted ? (
        <div className="h-72 w-full">
          <ReactECharts option={option} style={{ height: "100%", width: "100%" }} onEvents={onEvents} />
        </div>
      ) : (
        <div className="h-72 w-full bg-muted/20 animate-pulse rounded" />
      )}
    </div>
  );
};
