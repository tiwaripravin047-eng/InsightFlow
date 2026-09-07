import React, { useState, useEffect } from "react";
import { Issue, SeverityType } from "@/lib/types/api";
import { X, CheckSquare, RotateCw } from "lucide-react";

export interface CreateActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: Issue[];
  onSubmit: (issueId: string, data: { title: string; suggested_owner: string; priority: SeverityType }) => Promise<void>;
}

export const CreateActionModal: React.FC<CreateActionModalProps> = ({
  isOpen,
  onClose,
  issues,
  onSubmit,
}) => {
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [suggestedOwner, setSuggestedOwner] = useState("");
  const [priority, setPriority] = useState<SeverityType>("high");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (issues.length > 0 && !selectedIssueId) {
      setSelectedIssueId(issues[0].id);
    }
  }, [issues, selectedIssueId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError("Action title is required.");
      return;
    }
    if (!selectedIssueId) {
      setValidationError("Please select a target issue.");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(selectedIssueId, {
        title: title.trim(),
        suggested_owner: suggestedOwner.trim() || "Operations",
        priority,
      });
      setTitle("");
      setSuggestedOwner("");
      onClose();
    } catch {
      setValidationError("Failed to create action. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-action-title"
    >
      <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="create-action-title" className="text-sm font-bold text-foreground">
              Create New Action Item
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {validationError && (
            <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive">
              {validationError}
            </div>
          )}

          {/* Issue Selector */}
          <div className="space-y-1">
            <label htmlFor="issue-select" className="font-semibold text-foreground block">
              Target Issue (Grounding Reference)
            </label>
            <select
              id="issue-select"
              value={selectedIssueId}
              onChange={(e) => setSelectedIssueId(e.target.value)}
              className="w-full h-8 px-2.5 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {issues.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.priority_score} pts] {i.title}
                </option>
              ))}
            </select>
          </div>

          {/* Action Title */}
          <div className="space-y-1">
            <label htmlFor="action-title" className="font-semibold text-foreground block">
              Action Title
            </label>
            <input
              id="action-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inspect AP signal coverage in 2F quiet study area"
              className="w-full h-8 px-2.5 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Suggested Owner */}
          <div className="space-y-1">
            <label htmlFor="action-owner" className="font-semibold text-foreground block">
              Suggested Owner (Team / Department)
            </label>
            <input
              id="action-owner"
              type="text"
              value={suggestedOwner}
              onChange={(e) => setSuggestedOwner(e.target.value)}
              placeholder="e.g. IT Infrastructure Team"
              className="w-full h-8 px-2.5 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label htmlFor="action-priority" className="font-semibold text-foreground block">
              Priority
            </label>
            <select
              id="action-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as SeverityType)}
              className="w-full h-8 px-2.5 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50"
            >
              {isSubmitting && <RotateCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              <span>Create Action</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
