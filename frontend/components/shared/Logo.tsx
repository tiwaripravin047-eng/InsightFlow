import React from "react";
import { cn } from "@/lib/utils/cn";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  size = "md",
  showText = true,
  subtitle,
}) => {
  const iconDimensions = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const titleSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      {/* Quiet, professional geometric icon */}
      <div
        className={cn(
          iconDimensions[size],
          "flex items-center justify-center rounded-md bg-foreground text-background shrink-0 font-mono font-bold text-xs"
        )}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path
            d="M3 13.5C5 13.5 6.5 10 9.5 10C12.5 10 14 14 17 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 7.5C5 7.5 6.5 5 9.5 5C12.5 5 14 8.5 17 8.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.6"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(titleSizes[size], "font-semibold tracking-tight text-foreground")}>
            InsightFlow
          </span>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground mt-0.5 font-normal">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
