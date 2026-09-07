"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Insight } from "@/lib/types/api";
import { Table, BarChart2 } from "lucide-react";

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
    Math.max(14, Math.min(30, item.volume / 10)),
    item.title,
    item.id,
    item.severity,
  ]);

  const option = {
    grid: {
      left: "10%",
      right: "8%",
      top: "14%",
      bottom: "14%",
    },
    tooltip: {
      formatter: (param: any) => {
        const val = param.data;
        return `<div style="font-size:12px;font-family:sans-serif;">
          <strong>${val[3]}</strong><br/>
          Volume: ${val[0]} mentions<br/>
          Priority Score: ${val[1]} / 100<br/>
          Severity: ${val[5]}<br/>
          <span style="color:#64748b;font-size:11px;">Click bubble to inspect evidence</span>
        </div>`;
      },
    },
    xAxis: {
      name: "Volume (Mentions)",
      nameLocation: "middle",
      nameGap: 24,
      splitLine: { lineStyle: { type: "dashed", color: "rgba(148, 163, 184, 0.2)" } },
      axisLine: { lineStyle: { color: "#94a3b8" } },
    },
    yAxis: {
      name: "Priority Score",
      nameLocation: "middle",
      nameGap: 26,
      min: 0,
      max: 100,
      splitLine: { lineStyle: { type: "dashed", color: "rgba(148, 163, 184, 0.2)" } },
      axisLine: { lineStyle: { color: "#94a3b8" } },
    },
    // Subtle quadrant visual markings
    graphic: [
      {
        type: "text",
        left: "58%",
        top: "16%",
        style: {
          text: "Critical Priority\n(High Volume × High Score)",
          fill: "#991b1b",
          font: "500 10px sans-serif",
        },
      },
      {
        type: "text",
        left: "12%",
        top: "16%",
        style: {
          text: "Emerging Risk\n(Low Volume × High Score)",
          fill: "#9a3412",
          font: "500 10px sans-serif",
        },
      },
      {
        type: "text",
        left: "58%",
        bottom: "16%",
        style: {
          text: "Recurring Minor\n(High Volume × Low Score)",
          fill: "#64748b",
          font: "500 10px sans-serif",
        },
      },
      {
        type: "text",
        left: "12%",
        bottom: "16%",
        style: {
          text: "Low Priority\n(Low Volume × Low Score)",
          fill: "#94a3b8",
          font: "500 10px sans-serif",
        },
      },
    ],
    series: [
      {
        type: "scatter",
        symbolSize: (dataItem: any) => dataItem[2],
        data: data,
        itemStyle: {
          color: (param: any) => {
            const severity = param.data[5];
            if (severity === "critical") return "rgba(220, 38, 38, 0.75)";
            if (severity === "high") return "rgba(234, 88, 12, 0.75)";
            return "rgba(59, 130, 246, 0.7)";
          },
          borderColor: "#fff",
          borderWidth: 1,
        },
      },
    ],
  };

  const onChartClick = (param: any) => {
    if (param.data && param.data[4]) {
      onOpenEvidence(param.data[4]);
    }
  };

  return (
    <section
      aria-labelledby="issue-matrix-title"
      className="rounded-lg border bg-card p-4 space-y-2 text-card-foreground"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="issue-matrix-title" className="text-sm font-semibold text-foreground">
            Issue Matrix (Volume × Priority)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            4-quadrant scatter mapping complaint frequency against priority score.
          </p>
        </div>

        {/* Accessible Data Table Toggle */}
        <button
          type="button"
          onClick={() => setShowTableFallback((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          aria-label={showTableFallback ? "Show interactive matrix" : "Show accessible data table"}
        >
          {showTableFallback ? (
            <>
              <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Matrix</span>
            </>
          ) : (
            <>
              <Table className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Table</span>
            </>
          )}
        </button>
      </div>

      {showTableFallback ? (
        <div className="overflow-x-auto border rounded max-h-64 mt-2">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted text-muted-foreground uppercase font-medium">
              <tr>
                <th scope="col" className="px-3 py-2">Issue Title</th>
                <th scope="col" className="px-3 py-2 text-right">Volume</th>
                <th scope="col" className="px-3 py-2 text-right">Priority Score</th>
                <th scope="col" className="px-3 py-2">Severity</th>
                <th scope="col" className="px-3 py-2 text-center">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {insights.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{item.title}</td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">{item.volume}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">#{item.priority_score}</td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">{item.severity}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(item.id)}
                      className="text-xs text-foreground hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 w-full pt-1">
          {isMounted && (
            <ReactECharts
              option={option}
              style={{ height: "100%", width: "100%" }}
              onEvents={{ click: onChartClick }}
            />
          )}
        </div>
      )}
    </section>
  );
};
