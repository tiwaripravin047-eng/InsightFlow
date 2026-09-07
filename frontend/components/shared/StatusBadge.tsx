import React from "react";
import { ActionStatus } from "@/lib/types/api";
import { cn } from "@/lib/utils/cn";
import { CheckCircle, Clock, Disc, ShieldCheck } from "lucide-react";

export interface StatusBadgeProps {
  status: ActionStatus | string;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }> }
> = {
  open: {
    label: "Open",
    bg: "bg-status-open-bg",
    text: "text-status-open-foreground",
    border: "border-status-open-border",
    icon: Disc,
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-status-in-progress-bg",
    text: "text-status-in-progress-foreground",
    border: "border-status-in-progress-border",
    icon: Clock,
  },
  "in-progress": {
    label: "In Progress",
    bg: "bg-status-in-progress-bg",
    text: "text-status-in-progress-foreground",
    border: "border-status-in-progress-border",
    icon: Clock,
  },
  resolved: {
    label: "Resolved",
    bg: "bg-status-resolved-bg",
    text: "text-status-resolved-foreground",
    border: "border-status-resolved-border",
    icon: CheckCircle,
  },
  verified: {
    label: "Verified",
    bg: "bg-status-verified-bg",
    text: "text-status-verified-foreground",
    border: "border-status-verified-border",
    icon: ShieldCheck,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const normKey = (status?.toLowerCase() || "open");
  const config = statusConfig[normKey] || statusConfig.open;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.bg,
        config.text,
        config.border,
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden={true} />}
      <span>{config.label}</span>
    </span>
  );
};
