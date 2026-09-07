"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/shared/Logo";
import {
  LayoutDashboard,
  AlertCircle,
  FolderTree,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  Search,
  Upload,
  Database,
  X,
} from "lucide-react";

export interface SidebarProps {
  datasetId: string;
  className?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  datasetId,
  className,
  mobileOpen = false,
  onCloseMobile,
}) => {
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
      icon: AlertCircle,
    },
    {
      label: "Themes",
      href: `/dashboard/${datasetId}/themes`,
      icon: FolderTree,
    },
    {
      label: "Trends",
      href: `/dashboard/${datasetId}/trends`,
      icon: TrendingUp,
    },
    {
      label: "Feedback",
      href: `/dashboard/${datasetId}/feedback`,
      icon: MessageSquare,
    },
    {
      label: "Actions",
      href: `/dashboard/${datasetId}/actions`,
      icon: CheckCircle2,
    },
    {
      label: "Query",
      href: `/dashboard/${datasetId}/ask`,
      icon: Search,
    },
    {
      label: "Import Data",
      href: "/upload",
      icon: Upload,
    },
  ];

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              isActive
                ? "bg-secondary text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex w-60 flex-col border-r bg-card text-card-foreground shrink-0 select-none",
          className
        )}
        aria-label="Main Navigation"
      >
        {/* Brand Header */}
        <div className="h-13 px-4 flex items-center border-b">
          <Link
            href={`/dashboard/${datasetId}/overview`}
            className="hover:opacity-85 transition-opacity focus:outline-none focus:ring-1 focus:ring-ring rounded"
          >
            <Logo size="md" subtitle="Feedback Intelligence" />
          </Link>
        </div>

        {/* Dataset Context Bar */}
        <div className="px-3 py-2.5 border-b bg-muted/20">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">
            <Database className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span>Dataset</span>
          </div>
          <div className="text-xs font-medium text-foreground truncate font-mono" title={datasetId}>
            {datasetId}
          </div>
        </div>

        {/* Navigation List */}
        {renderNavLinks()}

        {/* Quiet Status Bar */}
        <div className="px-3 py-2 border-t bg-muted/10 text-[11px] text-muted-foreground flex items-center justify-between">
          <span className="font-mono text-[10px]">Track B</span>
          <span className="text-[10px] text-muted-foreground font-mono">Demo mode</span>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden bg-black/50 backdrop-blur-xs transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          onClick={onCloseMobile}
        >
          <aside
            className="w-64 h-full bg-card text-card-foreground flex flex-col shadow-2xl border-r animate-in slide-in-from-left duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Brand Header with Close */}
            <div className="h-13 px-4 flex items-center justify-between border-b">
              <Link
                href={`/dashboard/${datasetId}/overview`}
                onClick={onCloseMobile}
                className="hover:opacity-85 transition-opacity focus:outline-none focus:ring-1 focus:ring-ring rounded"
              >
                <Logo size="md" subtitle="Feedback Intelligence" />
              </Link>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Dataset Context Bar */}
            <div className="px-3 py-2.5 border-b bg-muted/20">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">
                <Database className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                <span>Dataset</span>
              </div>
              <div className="text-xs font-medium text-foreground truncate font-mono" title={datasetId}>
                {datasetId}
              </div>
            </div>

            {/* Navigation List */}
            {renderNavLinks(onCloseMobile)}

            {/* Quiet Status Bar */}
            <div className="px-3 py-2 border-t bg-muted/10 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="font-mono text-[10px]">Track B</span>
              <span className="text-[10px] text-muted-foreground font-mono">Demo mode</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
