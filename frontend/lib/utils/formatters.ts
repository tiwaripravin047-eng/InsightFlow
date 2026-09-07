/**
 * Safe formatting utilities for numbers, percentages, dates, and badges.
 * Frontend ONLY formats numbers returned by the server, per RULES.md §6.
 */

export function formatPercent(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDelta(changePercent: number | null | undefined): { text: string; isPositive: boolean; isNegative: boolean } {
  if (changePercent === null || changePercent === undefined || isNaN(changePercent)) {
    return { text: "—", isPositive: false, isNegative: false };
  }
  const prefix = changePercent > 0 ? "+" : "";
  return {
    text: `${prefix}${changePercent.toFixed(1)}%`,
    isPositive: changePercent > 0,
    isNegative: changePercent < 0,
  };
}
