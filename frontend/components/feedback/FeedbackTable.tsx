import React from "react";
import { FeedbackItem } from "@/lib/types/api";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { formatDate, formatPercent } from "@/lib/utils/formatters";
import { MessageSquare, ChevronRight } from "lucide-react";

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
  return (
    <div className="w-full border rounded-lg bg-card shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 border-b">
            <tr>
              <th scope="col" className="px-4 py-3 min-w-[280px]">Feedback Verbatim</th>
              <th scope="col" className="px-3 py-3">Topic / Category</th>
              <th scope="col" className="px-3 py-3">Sentiment</th>
              <th scope="col" className="px-3 py-3">Severity</th>
              <th scope="col" className="px-3 py-3">Intent / Emotion</th>
              <th scope="col" className="px-3 py-3">Urgency</th>
              <th scope="col" className="px-3 py-3">Date</th>
              <th scope="col" className="px-3 py-3">Source</th>
              <th scope="col" className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {items.map((item) => (
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
                className="hover:bg-muted/40 transition-colors cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none group"
              >
                {/* Feedback Verbatim */}
                <td className="px-4 py-3.5 align-top">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-foreground leading-relaxed font-normal line-clamp-2">
                      &ldquo;{item.text}&rdquo;
                    </p>
                  </div>
                </td>

                {/* Topic / Category */}
                <td className="px-3 py-3.5 align-top whitespace-nowrap">
                  <div className="font-semibold text-foreground">{item.topic}</div>
                  <div className="text-[11px] text-muted-foreground">{item.category}</div>
                </td>

                {/* Sentiment & Confidence */}
                <td className="px-3 py-3.5 align-top whitespace-nowrap">
                  <SentimentBadge sentiment={item.sentiment} />
                  <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                    {formatPercent(item.sentiment_confidence * 100)} conf
                  </span>
                </td>

                {/* Severity */}
                <td className="px-3 py-3.5 align-top whitespace-nowrap">
                  <SeverityBadge severity={item.severity} />
                </td>

                {/* Intent & Emotion */}
                <td className="px-3 py-3.5 align-top whitespace-nowrap">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted border">
                    {item.intent}
                  </span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5 capitalize">
                    {item.emotion}
                  </span>
                </td>

                {/* Urgency */}
                <td className="px-3 py-3.5 align-top whitespace-nowrap">
                  <span className="capitalize text-xs font-medium text-foreground">
                    {item.urgency}
                  </span>
                </td>

                {/* Date */}
                <td className="px-3 py-3.5 align-top whitespace-nowrap text-muted-foreground">
                  {formatDate(item.date)}
                </td>

                {/* Source & Language */}
                <td className="px-3 py-3.5 align-top whitespace-nowrap">
                  <span className="capitalize text-muted-foreground">{item.source}</span>
                  <span className="block text-[10px] font-mono text-muted-foreground uppercase">
                    {item.language}
                  </span>
                </td>

                {/* Inspect Action */}
                <td className="px-3 py-3.5 align-top text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-0.5 text-xs text-primary font-medium group-hover:underline">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
