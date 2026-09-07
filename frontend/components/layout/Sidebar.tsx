"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/shared/Logo";
import {
  LayoutDashboard,
  AlertOctagon,
  Layers,
  TrendingUp,
  MessageSquareText,
  CheckSquare,
  Sparkles,
  UploadCloud,
  Database,
} from "lucide-react";

export interface SidebarProps {
  datasetId: string;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ datasetId, className }) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
      href: `/dashboard/${datasetId}/overview`,
      icon: LayoutDashboard,
    },
    {
      label: "Issues",
      href: `/dashboard/${datasetId}/issues`,
      icon: AlertOctagon,
    },
    {
      label: "Themes",
      href: `/dashboard/${datasetId}/themes`,
      icon: Layers,
    },
    {
      label: "Trends",
      href: `/dashboard/${datasetId}/trends`,
      icon: TrendingUp,
    },
    {
      label: "Feedback",
      href: `/dashboard/${datasetId}/feedback`,
      icon: MessageSquareText,
    },
    {
      label: "Action Center",
      href: `/dashboard/${datasetId}/actions`,
      icon: CheckSquare,
    },
    {
      label: "Ask AI",
      href: `/dashboard/${datasetId}/ask`,
      icon: Sparkles,
    },
    {
      label: "Upload Data",
      href: "/upload",
      icon: UploadCloud,
    },
  ];

  return (
    <aside
      className={cn(
        "w-64 flex flex-col border-r bg-card text-card-foreground shrink-0 select-none",
        className
      )}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center border-b">
        <Link
          href={`/dashboard/${datasetId}/overview`}
          className="hover:opacity-90 transition-opacity focus:outline-none focus:ring-1 focus:ring-ring rounded-md"
        >
          <Logo size="md" subtitle="Feedback OS" />
        </Link>
      </div>

      {/* Dataset Context */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
          <Database className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
          <span>Active Dataset</span>
        </div>
        <div className="text-xs font-semibold text-foreground truncate" title={datasetId}>
          {datasetId}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="font-mono">v1.0 (Track B)</span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted border">
          MOCK
        </span>
      </div>
    </aside>
  );
};
