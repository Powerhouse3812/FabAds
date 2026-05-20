import { useEffect, useRef, useState } from "react";
import { Paperclip, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptDockProps {
  /**
   * The ad currently being "edited" — its config becomes the seed for the
   * next generation. `null` means a fresh prompt with no fork target.
   */
  editingLabel: string | null;
  onClearEditing?: () => void;

  /** Controlled prompt text. */
  value: string;
  onChange: (next: string) => void;

  /** Cost preview shown inside the Generate CTA. */
  creditCost: number;
  /** Submit handler — caller decides whether to add a new queue batch. */
  onSubmit: () => void;
  /** Disable the CTA + textarea (e.g. when the 10-concurrent cap is hit). */
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * PromptDock — sticky bottom prompt bar for the Results Queue screen.
 *
 * Composition (per Figma):
 *   - Top row: 📎 attachment + [Editing - Ad number N ✕] chip (when forked
 *     from a card) + free-text prompt textarea
 *   - Bottom row: spacer + lime "Generate (N credits)" pill CTA
 *
 * The dock auto-grows the textarea between 1-4 lines so a long prompt
 * doesn't clip but also doesn't gobble the page. Cmd/Ctrl + Enter submits
 * from anywhere inside the textarea.
 */
export function PromptDock({
  editingLabel,
  onClearEditing,
  value,
  onChange,
  creditCost,
  onSubmit,
  disabled,
  disabledReason,
}: PromptDockProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Auto-size up to ~4 lines
  const [rows, setRows] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 20; // matches Tailwind leading-5
    const max = lineHeight * 4;
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    setRows(Math.max(1, Math.round(next / lineHeight)));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !disabled && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur">
      <div className="mx-auto max-w-5xl">
        {/* Editing chip row */}
        <div className="mb-2 flex items-center gap-2">
          <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
          {editingLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-[#FEFFF0] px-2.5 py-1">
              <span aria-hidden className="h-3 w-3 rounded-sm bg-destructive/60" />
              <span className="font-sans text-[11px] font-medium text-foreground">
                {editingLabel}
              </span>
              {onClearEditing && (
                <button
                  type="button"
                  onClick={onClearEditing}
                  aria-label="Stop editing this ad"
                  className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ) : (
            <span className="font-sans text-[11px] italic text-muted-foreground">
              New generation — describe what you want
            </span>
          )}
        </div>

        {/* Prompt textarea */}
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={rows}
          disabled={disabled}
          placeholder="Create 3 alternative wireframes for a responsive landing page for a fintech savings app."
          className={cn(
            "block w-full resize-none rounded-md border border-transparent bg-transparent px-0 py-1",
            "font-sans text-[13px] leading-5 text-foreground placeholder:text-muted-foreground/70",
            "focus:outline-none focus:ring-0",
          )}
        />

        {/* CTA row */}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground/70">
            {disabled && disabledReason
              ? disabledReason
              : "⌘ + Enter to generate"}
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5",
              "font-sans text-[12.5px] font-semibold text-primary-foreground",
              "shadow-md shadow-primary/20 transition-opacity",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate ({creditCost} credits)
          </button>
        </div>
      </div>
    </div>
  );
}
