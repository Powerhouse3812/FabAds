/**
 * Table frame shared by the Advertiser and LP & Offers lists.
 *
 * - Header is sticky inside the frame (the frame scrolls both ways, so a wide
 *   table scrolls inside its own container and never widens the page).
 * - Rows are keyboard-focusable and Enter / Space opens them.
 * - "Show more" appends a page at a time (lists can reach 1000+ rows).
 */
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fmtInt } from "../shared";

export interface Column {
  key: string;
  label: ReactNode;
  className?: string;
  /** Sticky-left first column. */
  sticky?: boolean;
}

export function TableFrame({
  label,
  columns,
  minWidth,
  children,
  footer,
}: {
  label: string;
  columns: Column[];
  /** Below this the frame scrolls horizontally. */
  minWidth: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="relative max-h-[72dvh] min-h-[160px] overflow-auto rounded-xl border border-border bg-card">
        <table aria-label={label} style={{ minWidth }} className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "sticky top-0 whitespace-nowrap border-b border-border bg-muted px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
                    c.sticky ? "left-0 z-[3]" : "z-[2]",
                    c.className,
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

/** One keyboard-focusable, clickable row. Ignores key presses that come from inner controls. */
export function ClickableRow({
  onOpen,
  label,
  children,
}: {
  onOpen: () => void;
  /** Accessible name, e.g. "Open Napchief". */
  label: string;
  children: ReactNode;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };
  return (
    <tr
      tabIndex={0}
      aria-label={label}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className="group cursor-pointer outline-none transition-colors hover:bg-primary/5 focus-visible:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </tr>
  );
}

export function Cell({
  children,
  className,
  sticky,
}: {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <td
      className={cn(
        "border-b border-border px-3 py-2.5 align-top",
        sticky && "sticky left-0 z-[1] bg-card group-hover:bg-muted group-focus-visible:bg-muted",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function ShowMore({ remaining, onMore, noun }: { remaining: number; onMore: () => void; noun: string }) {
  if (remaining <= 0) return null;
  return (
    <div className="mt-3 flex justify-center">
      <button
        type="button"
        onClick={onMore}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 text-sm font-medium text-primary-text hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Show more {noun}
        <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[11px] leading-5 tabular-nums">{fmtInt(remaining)} left</span>
      </button>
    </div>
  );
}
