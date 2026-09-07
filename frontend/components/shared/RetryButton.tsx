import React from "react";
import { cn } from "@/lib/utils/cn";
import { RotateCw } from "lucide-react";

export interface RetryButtonProps {
  onRetry: () => void;
  isLoading?: boolean;
  label?: string;
  className?: string;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  isLoading = false,
  label = "Retry",
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onRetry}
      disabled={isLoading}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors disabled:opacity-50",
        className
      )}
    >
      <RotateCw
        className={cn("w-3.5 h-3.5", isLoading && "animate-spin")}
        aria-hidden={true}
      />
      <span>{label}</span>
    </button>
  );
};
