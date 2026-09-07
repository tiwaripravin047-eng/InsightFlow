import React from "react";
import { cn } from "@/lib/utils/cn";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T | ((item: T) => string);
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnKey: string) => void;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  className,
}: DataTableProps<T>): React.ReactElement {
  const getKey = (item: T, idx: number): string => {
    if (typeof keyField === "function") return keyField(item);
    return String(item[keyField] ?? idx);
  };

  return (
    <div className={cn("w-full overflow-x-auto border rounded-lg bg-card shadow-2xs", className)}>
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 border-b">
          <tr>
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={cn("px-4 py-3 select-none", col.className)}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort?.(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded"
                    >
                      <span>{col.header}</span>
                      {isSorted ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-foreground">
          {data.map((item, idx) => {
            const key = getKey(item, idx);
            const isClickable = Boolean(onRowClick);

            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onRowClick?.(item);
                  }
                }}
                tabIndex={isClickable ? 0 : undefined}
                className={cn(
                  "transition-colors",
                  isClickable &&
                    "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 align-middle", col.className)}>
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
