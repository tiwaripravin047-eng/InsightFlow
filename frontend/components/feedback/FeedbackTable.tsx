import React, { useState } from "react";
import { FeedbackItem } from "@/lib/types/api";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { formatDate, formatPercent } from "@/lib/utils/formatters";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

export interface FeedbackTableProps {
  items: FeedbackItem[];
  onSelectFeedback: (id: string) => void;
  className?: string;
}

export const FeedbackTable: React.FC<FeedbackTableProps> = ({
  items,
  onSelectFeedback,
  className,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full border rounded-lg bg-card shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider sticky top-0 z-10 border-b">
            <tr>
              <th scope="col" className="px-4 py-2.5 min-w-[320px]">Feedback Text (Verbatim)</th>
              <th scope="col" className="px-3 py-2.5">Topic & Category</th>
              <th scope="col" className="px-3 py-2.5">Sentiment</th>
              <th scope="col" className="px-3 py-2.5">Severity</th>
              <th scope="col" className="px-3 py-2.5">Intent / Emotion</th>
              <th scope="col" className="px-3 py-2.5">Urgency</th>
              <th scope="col" className="px-3 py-2.5">Date</th>
              <th scope="col" className="px-3 py-2.5">Source</th>
              <th scope="col" className="px-3 py-2.5 text-right w-20">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {items.map((item) => {
              const isExpanded = Boolean(expandedRows[item.id]);
              const isLongText = item.text.length > 140;

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectFeedback(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectFeedback(item.id);
                    }
                  }}
                  tabIndex={0}
                  className="hover:bg-muted/30 transition-colors cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none group"
                >
                  {/* Feedback Verbatim: Source of Truth Prominent */}
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1">
                      <p className={`text-foreground leading-relaxed font-normal ${!isExpanded ? "line-clamp-2" : ""}`}>
                        &ldquo;{item.text}&rdquo;
                      </p>
                      {isLongText && (
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(item.id, e)}
                          className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground font-medium focus:outline-none"
                        >
                          <span>{isExpanded ? "Show less" : "Read full verbatim"}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Topic / Category */}
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    <div className="font-medium text-foreground">{item.topic}</div>
                    <div className="text-[11px] text-muted-foreground">{item.category}</div>
                  </td>

                  {/* Sentiment & Confidence */}
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    <SentimentBadge sentiment={item.sentiment} />
                    <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                      {formatPercent(item.sentiment_confidence * 100)} conf
                    </span>
                  </td>

                  {/* Severity */}
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    <SeverityBadge severity={item.severity} />
                  </td>

                  {/* Intent & Emotion */}
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted border">
                      {item.intent}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5 capitalize">
                      {item.emotion}
                    </span>
                  </td>

                  {/* Urgency */}
                  <td className="px-3 py-3 align-top whitespace-nowrap">
                    <span className="capitalize text-xs text-foreground">
                      {item.urgency}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-3 py-3 align-top whitespace-nowrap text-muted-foreground text-xs">
                    {formatDate(item.date)}
                  </td>

                  {/* Source */}
                  <td className="px-3 py-3 align-top whitespace-nowrap text-xs text-muted-foreground capitalize">
                    {item.source}
                  </td>

                  {/* Inspect Trigger */}
                  <td className="px-3 py-3 align-top text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectFeedback(item.id)}
                      className="inline-flex items-center gap-0.5 text-xs text-muted-foreground group-hover:text-foreground underline underline-offset-2"
                      aria-label={`Inspect feedback ${item.id}`}
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
