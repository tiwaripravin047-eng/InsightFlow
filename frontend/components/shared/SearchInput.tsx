import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Search, X } from "lucide-react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value: controlledValue,
  onChange,
  placeholder = "Search feedback, topics, issues...",
  debounceMs = 300,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue);

  useEffect(() => {
    setInternalValue(controlledValue);
  }, [controlledValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== controlledValue) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onChange, controlledValue]);

  const handleClear = () => {
    setInternalValue("");
    onChange("");
  };

  return (
    <div className={cn("relative flex items-center w-full max-w-sm", className)}>
      <Search
        className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        suppressHydrationWarning
        className="w-full h-9 pl-9 pr-8 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 p-0.5 text-muted-foreground hover:text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
