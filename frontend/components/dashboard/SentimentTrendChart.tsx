"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendPoint } from "@/lib/types/api";
import { formatDate, formatPercent } from "@/lib/utils/formatters";
import { TrendingUp, Table, BarChart2 } from "lucide-react";

export interface SentimentTrendChartProps {
  data: TrendPoint[];
  className?: string;
}

export const SentimentTrendChart: React.FC<SentimentTrendChartProps> = ({
  data,
  className,
}) => {
  const [showTableFallback, setShowTableFallback] = useState(false);

  // Format data for chart display
  const formattedData = data.map((d) => ({
    ...d,
    negativePercent: Math.round(d.negative_ratio * 100),
    formattedDate: formatDate(d.date),
  }));

  return (
    <div className="rounded-lg border bg-card p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Feedback Volume & Negative Ratio Trend
          </h2>
        </div>

        {/* Accessible Data Table Toggle */}
        <button
          type="button"
          onClick={() => setShowTableFallback((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded bg-background hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          aria-label={showTableFallback ? "Show interactive chart" : "Show accessible data table"}
        >
          {showTableFallback ? (
            <>
              <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
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
                <th scope="col" className="px-3 py-2">Date</th>
                <th scope="col" className="px-3 py-2 text-right">Volume</th>
                <th scope="col" className="px-3 py-2 text-right">Negative Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row) => (
                <tr key={row.date} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{formatDate(row.date)}</td>
                  <td className="px-3 py-2 text-right font-mono">{row.volume}</td>
                  <td className="px-3 py-2 text-right font-mono text-severity-high-foreground font-semibold">
                    {formatPercent(row.negative_ratio * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                yAxisId="volume"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                yAxisId="ratio"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="volume"
                name="Feedback Volume"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="ratio"
                type="monotone"
                dataKey="negativePercent"
                name="Negative Ratio %"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
