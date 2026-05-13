import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange: (next: string) => void;
  /** Render as a multiline textarea instead of a single-line input. */
  multiline?: boolean;
  /** Apply font-mono styling — used for URLs / hex codes / etc. */
  mono?: boolean;
  /** Optional className applied to the wrapper. */
  className?: string;
  /** Optional input placeholder when value is empty. */
  placeholder?: string;
  /** Accessibility label for the editable field. */
  ariaLabel?: string;
}

/**
 * Click-to-edit text. Read-mode shows the value + a small pencil icon on
 * hover. Click the value OR the pencil to enter edit mode — input
 * auto-focuses, Enter / blur saves, Escape cancels (reverts to previous
 * value). Multiline variant uses a textarea + Cmd/Ctrl+Enter to save.
 *
 * No explicit Save / Cancel buttons — Linear / Notion-style ambient edit.
 */
export function EditableText({
  value,
  onChange,
  multiline = false,
  mono = false,
  className,
  placeholder,
  ariaLabel,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep draft in sync if the parent value changes while not editing.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Autofocus + select on entering edit mode.
  useEffect(() => {
    if (!editing) return;
    const el = multiline ? textareaRef.current : inputRef.current;
    if (el) {
      el.focus();
      if ("select" in el) el.select();
    }
  }, [editing, multiline]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next !== value) onChange(next);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    const sharedClasses = cn(
      "w-full bg-background border border-primary/60 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background text-[13px]",
      mono && "font-mono",
      multiline && "resize-none min-h-[64px] leading-relaxed",
    );
    return multiline ? (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        rows={3}
        className={sharedClasses}
      />
    ) : (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={sharedClasses}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={ariaLabel ?? "Edit field"}
      className={cn(
        "group inline-flex items-start gap-1.5 max-w-full text-left",
        "rounded-md px-1 -mx-1 py-0.5 -my-0.5",
        "hover:bg-muted/60 transition-colors cursor-text",
        className,
      )}
    >
      <span
        className={cn(
          "text-[13px] text-foreground",
          mono && "font-mono break-all",
          multiline && "leading-relaxed",
          !value && "text-muted-foreground italic",
        )}
      >
        {value || placeholder || "—"}
      </span>
      <Pencil
        className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-1"
        aria-hidden
      />
    </button>
  );
}
