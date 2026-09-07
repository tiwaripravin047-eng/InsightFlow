import React from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  limit,
  offset,
  onPageChange,
  className,
}) => {
  if (total <= 0) return null;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const startItem = offset + 1;
  const endItem = Math.min(offset + limit, total);

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-card border-t text-xs text-muted-foreground",
        className
      )}
    >
      <div>
        Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
        <span className="font-semibold text-foreground">{endItem}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          aria-label="Previous page"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border bg-background text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Previous</span>
        </button>

        <span className="px-2 font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(offset + limit)}
          aria-label="Next page"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border bg-background text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
