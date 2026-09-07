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
import { Table, BarChart2 } from "lucide-react";

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

  // Plain-language takeaway (§11)
  const latestPoint = data[data.length - 1];
  const firstPoint = data[0];
  const deltaNeg = latestPoint && firstPoint
    ? Math.round((latestPoint.negative_ratio - firstPoint.negative_ratio) * 100)
    : 0;

  const takeaway = deltaNeg > 0
    ? `Negative feedback share increased ${deltaNeg}% across the tracked window.`
    : deltaNeg < 0
    ? `Negative feedback share decreased ${Math.abs(deltaNeg)}% across the tracked window.`
    : "Feedback volume and negative sentiment remained steady across the tracked window.";

  return (
    <section
      aria-labelledby="sentiment-trend-title"
      className="rounded-lg border bg-card p-4 space-y-2 text-card-foreground"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="sentiment-trend-title" className="text-sm font-semibold text-foreground">
            Volume & Sentiment Trend
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {takeaway}
          </p>
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
              <span>Chart</span>
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
                <th scope="col" className="px-3 py-2">Date</th>
                <th scope="col" className="px-3 py-2 text-right">Volume</th>
                <th scope="col" className="px-3 py-2 text-right">Negative Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {data.map((row) => (
                <tr key={row.date} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-sans font-medium">{formatDate(row.date)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{row.volume}</td>
                  <td className="px-3 py-2 text-right text-sentiment-negative-foreground font-medium">
                    {formatPercent(row.negative_ratio * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="hsl(var(--border))" />
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
                  borderRadius: "6px",
                  fontSize: "12px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="volume"
                name="Feedback Volume"
                stroke="hsl(var(--foreground))"
                strokeWidth={1.8}
                dot={{ r: 2.5 }}
                activeDot={{ r: 4.5 }}
              />
              <Line
                yAxisId="ratio"
                type="monotone"
                dataKey="negativePercent"
                name="Negative Share %"
                stroke="hsl(var(--sentiment-negative-foreground))"
                strokeWidth={1.8}
                strokeDasharray="3 3"
                dot={{ r: 2.5 }}
                activeDot={{ r: 4.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
