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
  subtitle = "Feedback Intelligence OS",
}) => {
  const iconDimensions = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const titleSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Modern InsightFlow Vector Icon */}
      <div
        className={cn(
          iconDimensions[size],
          "relative flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-primary to-violet-600 text-white shadow-xs shrink-0 overflow-hidden ring-1 ring-primary/20"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
          aria-hidden="true"
        >
          {/* Wave/Flow Stream lines */}
          <path
            d="M3 14.5C5.5 14.5 7 11 10.5 11C14 11 15.5 15.5 19 15.5C20.5 15.5 21.5 14.5 22 13.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />
          <path
            d="M2 9.5C4.5 9.5 6 6 9.5 6C13 6 15 10.5 18.5 10.5C20.2 10.5 21.2 9.8 22 8.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          />
          {/* Sparkle/Insight focal dot */}
          <circle cx="10.5" cy="11" r="1.8" fill="white" />
          <circle cx="18.5" cy="10.5" r="1.4" fill="white" className="opacity-90" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn(titleSizes[size], "font-bold tracking-tight text-foreground flex items-center gap-1")}>
            Insight<span className="text-primary font-extrabold">Flow</span>
          </span>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
