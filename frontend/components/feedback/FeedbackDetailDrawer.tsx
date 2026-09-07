import React, { useEffect } from "react";
import { FeedbackItem } from "@/lib/types/api";
import { SentimentBadge } from "@/components/shared/SentimentBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { formatDate, formatPercent } from "@/lib/utils/formatters";
import { X, MessageSquare, Layers, AlertTriangle, ExternalLink } from "lucide-react";

export interface FeedbackDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: FeedbackItem | null;
  isLoading?: boolean;
  onNavigateIssue?: (issueId: string) => void;
}

export const FeedbackDetailDrawer: React.FC<FeedbackDetailDrawerProps> = ({
  isOpen,
  onClose,
  feedback,
  isLoading = false,
  onNavigateIssue,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-drawer-title"
    >
      <div className="w-full max-w-lg h-full bg-card border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="feedback-drawer-title" className="text-sm font-semibold text-foreground">
              Feedback Record Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          {isLoading || !feedback ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          ) : (
            <>
              {/* Raw Verbatim Block */}
              <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Original Feedback
                </span>
                <p className="text-foreground leading-relaxed italic text-sm font-normal">
                  &ldquo;{feedback.text}&rdquo;
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Logged: {formatDate(feedback.date)}</span>
                  <span className="font-mono uppercase text-[10px]">
                    Lang: {feedback.language} • Source: {feedback.source}
                  </span>
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-card border rounded-lg">
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">Sentiment</span>
                  <SentimentBadge sentiment={feedback.sentiment} />
                  <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                    {formatPercent(feedback.sentiment_confidence * 100)} model confidence
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">Severity</span>
                  <SeverityBadge severity={feedback.severity} />
                  <span className="text-[10px] text-muted-foreground block mt-0.5 capitalize">
                    Urgency: {feedback.urgency}
                  </span>
                </div>
              </div>

              {/* Classification Layer */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Classification & Intent
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded border bg-background">
                    <span className="text-muted-foreground block text-[11px]">Primary Topic</span>
                    <strong className="text-foreground font-semibold">{feedback.topic}</strong>
                  </div>
                  <div className="p-2.5 rounded border bg-background">
                    <span className="text-muted-foreground block text-[11px]">Category</span>
                    <strong className="text-foreground font-semibold">{feedback.category}</strong>
                  </div>
                  <div className="p-2.5 rounded border bg-background">
                    <span className="text-muted-foreground block text-[11px]">Intent</span>
                    <strong className="text-foreground font-semibold capitalize">{feedback.intent}</strong>
                  </div>
                  <div className="p-2.5 rounded border bg-background">
                    <span className="text-muted-foreground block text-[11px]">Emotion</span>
                    <strong className="text-foreground font-semibold capitalize">{feedback.emotion}</strong>
                  </div>
                </div>
              </div>

              {/* Aspect-Based Sentiments */}
              {feedback.aspects && feedback.aspects.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Extracted Aspect Sentiments</span>
                  </div>
                  <div className="space-y-1.5">
                    {feedback.aspects.map((asp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded border bg-background text-xs"
                      >
                        <span className="font-semibold text-foreground">{asp.aspect}</span>
                        <div className="flex items-center gap-2">
                          <SentimentBadge sentiment={asp.sentiment} />
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {formatPercent(asp.confidence * 100)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Issue Navigation */}
              {feedback.related_issue_id && (
                <div className="p-3 rounded-lg border bg-primary/5 border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" aria-hidden="true" />
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Linked Priority Issue
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {feedback.related_issue_id}
                      </span>
                    </div>
                  </div>
                  {onNavigateIssue && (
                    <button
                      type="button"
                      onClick={() => onNavigateIssue(feedback.related_issue_id!)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded px-1"
                    >
                      <span>View Issue</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}

              {/* Similar / Duplicate Feedback Cluster */}
              {feedback.similar_feedback && feedback.similar_feedback.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Similar / Duplicate Feedback
                  </span>
                  <div className="space-y-1.5">
                    {feedback.similar_feedback.map((sim, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded border bg-background text-xs"
                      >
                        <span className="font-mono text-muted-foreground text-[11px]">
                          ID: {sim.feedback_id}
                        </span>
                        <span className="font-mono text-xs font-bold text-primary">
                          {formatPercent(sim.similarity_score * 100)} cosine match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
