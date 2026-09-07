import React from "react";
import { SeverityType } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";
import { AlertCircle, AlertOctagon, AlertTriangle, ShieldCheck } from "lucide-react";

export interface SeverityBadgeProps {
  severity: SeverityType | string;
  className?: string;
  showIcon?: boolean;
}

const severityConfig: Record<
  SeverityType,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }> }
> = {
  low: {
    label: "Low",
    bg: "bg-severity-low-bg",
    text: "text-severity-low-foreground",
    border: "border-severity-low-border",
    icon: ShieldCheck,
  },
  medium: {
    label: "Medium",
    bg: "bg-severity-medium-bg",
    text: "text-severity-medium-foreground",
    border: "border-severity-medium-border",
    icon: AlertCircle,
  },
  high: {
    label: "High",
    bg: "bg-severity-high-bg",
    text: "text-severity-high-foreground",
    border: "border-severity-high-border",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    bg: "bg-severity-critical-bg",
    text: "text-severity-critical-foreground",
    border: "border-severity-critical-border",
    icon: AlertOctagon,
  },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className,
  showIcon = true,
}) => {
  const normKey = (severity?.toLowerCase() || "low") as SeverityType;
  const config = severityConfig[normKey] || severityConfig.low;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border",
        config.bg,
        config.text,
        config.border,
        className
      )}
      role="status"
      aria-label={`Severity: ${config.label}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden={true} />}
      <span>{config.label}</span>
    </span>
  );
};
