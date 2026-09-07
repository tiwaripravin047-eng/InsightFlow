import React from "react";
import { cn } from "@/lib/utils/cn";

export interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  variant?: "line" | "card" | "table-row" | "kpi";
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  count = 1,
  variant = "line",
}) => {
  const items = Array.from({ length: count });

  if (variant === "kpi") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {items.map((_, i) => (
          <div
            key={i}
            className={cn("h-28 rounded-lg border bg-card p-5 animate-pulse flex flex-col justify-between", className)}
          >
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table-row") {
    return (
      <div className="w-full space-y-2 animate-pulse py-2">
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-4 h-12 px-4 bg-muted/40 rounded">
            <div className="h-4 w-1/4 bg-muted rounded" />
            <div className="h-4 w-1/4 bg-muted rounded" />
            <div className="h-4 w-1/6 bg-muted rounded" />
            <div className="h-4 w-1/6 bg-muted rounded ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="space-y-4 w-full">
        {items.map((_, i) => (
          <div
            key={i}
            className={cn("p-5 rounded-lg border bg-card animate-pulse space-y-3", className)}
          >
            <div className="h-4 w-1/3 bg-muted rounded" />
            <div className="h-3 w-full bg-muted/70 rounded" />
            <div className="h-3 w-4/5 bg-muted/50 rounded" />
            <div className="flex gap-2 pt-2">
              <div className="h-5 w-16 bg-muted rounded" />
              <div className="h-5 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full animate-pulse">
      {items.map((_, i) => (
        <div key={i} className={cn("h-4 bg-muted rounded w-full", className)} />
      ))}
    </div>
  );
};
