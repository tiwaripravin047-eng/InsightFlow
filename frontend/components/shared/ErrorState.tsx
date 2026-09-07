import React from "react";
import { cn } from "@/lib/utils/cn";
import { AlertTriangle } from "lucide-react";
import { RetryButton } from "./RetryButton";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to load data",
  message = "Something went wrong while retrieving this information. Please try again.",
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center border border-destructive/20 rounded-lg bg-destructive/5 my-4",
        className
      )}
      role="alert"
    >
      <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5" aria-hidden={true} />
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-md mb-4 leading-relaxed">
        {message}
      </p>

      {onRetry && <RetryButton onRetry={onRetry} />}
    </div>
  );
};
