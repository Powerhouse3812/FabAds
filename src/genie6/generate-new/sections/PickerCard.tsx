import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * PickerCard — first body section on each Type form (A-11.12).
 *
 * Replaces the old sticky "top zone" pattern. Pickers (Brand / Output /
 * Format / Source / Category etc.) live INSIDE this card, scrolling with
 * the rest of the form body.
 *
 * Visual: prominent surface with strong border, rounded chrome, padded.
 * Each row inside gets a mono-cased label + the picker control.
 *
 * Caller passes children — typically one or more <PickerRow>s.
 */

export interface PickerCardProps {
  /** Children — typically <PickerRow>s composed by the form. */
  children: ReactNode;
  /** Optional title shown at the top of the card (mono uppercase). */
  title?: string;
  className?: string;
}

export function PickerCard({ children, title, className }: PickerCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm",
        className,
      )}
    >
      {title && (
        <p className="mb-4 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export interface PickerRowProps {
  label: string;
  /** Optional helper sub-line under the label. */
  sub?: string;
  /** Optional flag to mark this row as REQUIRED — shows a small dot indicator. */
  required?: boolean;
  /** The picker control(s). */
  children: ReactNode;
  /** Optional inline accessory — appears at the right end of the row. */
  accessory?: ReactNode;
}

export function PickerRow({ label, sub, required, children, accessory }: PickerRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] sm:items-center gap-2 sm:gap-4">
      <div className="space-y-0.5">
        <p className="flex items-center gap-1 text-[11px] font-medium text-foreground">
          {label}
          {required && <span className="text-destructive" aria-label="required">·</span>}
        </p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      <div className="min-w-0 flex flex-wrap items-center gap-2">{children}</div>
      {accessory && <div className="shrink-0 sm:justify-self-end">{accessory}</div>}
    </div>
  );
}
