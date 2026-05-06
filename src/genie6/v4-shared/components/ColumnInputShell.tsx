import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ColumnInputShell — chassis any picker UI drops into when it's the
 * active right-column input. Header (icon + title + sub) → scrollable
 * body → footer (Cancel + Save).
 *
 * Same `flex flex-col h-full min-h-0 overflow-hidden` shape as
 * RightColumn so it nests cleanly. Save is disabled when `dirty` is
 * false — we treat undefined as "always enabled" for backwards
 * compatibility with simple pickers.
 */

export interface ColumnInputShellProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub?: string;
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  dirty?: boolean;
}

export function ColumnInputShell({
  icon: Icon,
  title,
  sub,
  children,
  onCancel,
  onSave,
  saveLabel = "Save",
  dirty,
}: ColumnInputShellProps) {
  const saveEnabled = dirty === undefined ? true : dirty;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border px-4 py-2.5 flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary mt-0.5">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-tight text-foreground">
            {title}
          </h3>
          {sub && (
            <p className="text-[10px] leading-snug text-muted-foreground">
              {sub}
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">{children}</div>

      <footer className="shrink-0 border-t border-border px-4 py-2">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "inline-flex h-7 items-center rounded-md border border-border px-2.5 text-[11px] font-medium text-foreground",
              "hover:bg-muted/60 transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!saveEnabled}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-bold text-primary-foreground",
              "hover:opacity-90 transition-opacity",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              !saveEnabled && "opacity-50 cursor-not-allowed hover:opacity-50",
            )}
          >
            <Check className="h-3 w-3" />
            {saveLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
