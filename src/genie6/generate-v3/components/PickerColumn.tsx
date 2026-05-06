import { useEffect, type ReactNode } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PickerColumn — Studio v3 Finder-style right column (A-11.25).
 *
 * Replaces the earlier PickerDrawer pattern. Per Maalik's feedback after
 * seeing the first cut: "drawer nahi aayega bro, column aayega, Mac OS ke
 * finder ki trah." Reference patterns: CatalogueFinder.tsx (3-pane
 * Workspace finder), macOS Finder column view, the Edit Columns modal,
 * and the SQL diff editor screenshots Maalik shared.
 *
 * Visual:
 *   - Flat panel — same bg as the form (no glass, no shadow, no card).
 *   - Single 1px `border-l` divider between form and column.
 *   - Header (icon + title + sub + X) at top.
 *   - Body scrolls independently from the form column (Finder-style).
 *   - Optional footer with `Done` CTA.
 *
 * NOT a drawer — no slide animation, no overlay, no elevation. The column
 * is just a structural sibling of the form column when active.
 */

export interface PickerColumnProps {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  /** Hide the footer entirely (e.g. when the column is purely a viewer). */
  hideFooter?: boolean;
  /** Custom done button label. Default "Done". */
  doneLabel?: string;
  /**
   * Custom footer JSX. When provided, replaces the default Done button +
   * hint. Use this for column-specific actions like Cancel + Confirm
   * (Pinterest column).
   */
  footer?: ReactNode;
}

export function PickerColumn({
  open,
  onClose,
  title,
  sub,
  icon: Icon,
  children,
  hideFooter = false,
  doneLabel = "Done",
  footer,
}: PickerColumnProps) {
  // Esc closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <section
      role="region"
      aria-label={title}
      className={cn(
        // Flat panel — no glass, no shadow, no rounded corners. Bg is
        // transparent so the page-level mesh flows through both columns
        // as a single shared background. Only a thin border-l divider.
        "flex flex-col min-w-0 min-h-0 overflow-hidden bg-transparent",
        "border-l border-border",
      )}
    >
      <header className="shrink-0 border-b border-border px-4 py-2.5 flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary mt-0.5">
          {Icon && <Icon className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground leading-tight">
            {title}
          </h3>
          {sub && (
            <p className="text-[10px] text-muted-foreground leading-snug">
              {sub}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close column"
          className={cn(
            "shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md",
            "text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
            "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Independent scroll — Finder-style. The column scrolls separately
          from the form column on the left. */}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>

      {!hideFooter && (
        <footer className="shrink-0 border-t border-border px-4 py-2">
          {footer ?? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground italic">
                Selections persist when you close.
              </p>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground",
                  "hover:opacity-90 transition-opacity",
                  "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                )}
              >
                <Check className="h-3 w-3" />
                {doneLabel}
              </button>
            </div>
          )}
        </footer>
      )}
    </section>
  );
}
