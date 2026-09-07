import React from "react";
import { HelpCircle } from "lucide-react";

export interface SuggestedQueriesProps {
  onSelectQuery: (query: string) => void;
  className?: string;
}

const suggestedPrompts = [
  "What got worse this week?",
  "What are the top drivers of negative feedback?",
  "Why is library Wi-Fi being flagged as critical?",
  "What is the average tuition fee? (Unanswerable test)",
];

export const SuggestedQueries: React.FC<SuggestedQueriesProps> = ({
  onSelectQuery,
  className,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Suggested Analytics Queries</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectQuery(prompt)}
            className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-muted text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-left"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
