import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DetailKit — reusable presentational primitives for a single-page asset
 * detail view ("Genie Brain 2" Figma CSS dump). Pure presentation only:
 * no data fetching, no react-router, no stores. A consuming screen owns
 * all content, state, and empty/partial/populated data decisions.
 *
 * Token mapping notes (see report for the full breakdown):
 * - Card surface / borders / body text all ride the app's existing
 *   `card` / `border` / `foreground` / `muted-foreground` HSL tokens
 *   rather than the spec's literal hex, since those tokens already
 *   resolve to near-identical values in light mode and additionally
 *   give correct dark-mode parity for free (the g6-* bare-hex tokens do
 *   NOT do this, which is why this file avoids them entirely).
 * - `rounded-md` in this app's Tailwind config resolves to
 *   `calc(var(--radius) - 2px)` = 16px exactly (root --radius is
 *   1.125rem), which is a lucky, precise match for the spec's 16px
 *   SectionCard corner — used instead of an arbitrary `rounded-[16px]`.
 * - Two of the three icon-tile tints (purple / teal) have no existing
 *   token family in tailwind.config.ts (only the lime/primary hue is
 *   registered), so those two stay as arbitrary literal hex per the
 *   "only arbitrary where no token matches" rule. The lime tint reuses
 *   `bg-primary/10` + `text-primary-text`, which also satisfies the
 *   "accent must appear at rest" rule — it is not hover/active-gated.
 */

// ---------------------------------------------------------------------------
// Shared icon-tile tint set
// ---------------------------------------------------------------------------

/**
 * Small named tint set for the 28×28 (SectionCard header) and 30×30
 * (StatStrip item) icon tiles. Deliberately closed — callers pick a name,
 * never a raw hex, so this file stays the single place new tints get added.
 *
 * - "lime"   → maps onto the existing `primary` / `primary-text` tokens
 *              (the app's real accent hue). Prefer this for anything that
 *              should read as "the accent", since it is theme-aware.
 * - "purple" / "teal" → no equivalent token family exists yet in
 *              tailwind.config.ts, so these keep the spec's literal light-
 *              mode hex values (arbitrary values, cited in the report).
 *              They have no calibrated dark-mode counterpart.
 */
export type IconTint = "lime" | "purple" | "teal";

const TINT_CLASSES: Record<IconTint, { tile: string; icon: string }> = {
  lime: { tile: "bg-primary/10", icon: "text-primary-text" },
  purple: { tile: "bg-[#F0ECFB]", icon: "text-[#8B6FC7]" },
  teal: { tile: "bg-[#E6F5F0]", icon: "text-[#3FB3A3]" },
};

// ---------------------------------------------------------------------------
// SectionCard
// ---------------------------------------------------------------------------

export interface SectionCardProps {
  /** Header title. Omit together with `icon`/`actions` to render the
   *  plain, headerless card variant (12px padding, 12px gap). */
  title?: string;
  /** Header icon. Rendered bare at 16px unless `tint` is also given, in
   *  which case it renders inside a 28×28 tinted tile at 13px. */
  icon?: LucideIcon;
  tint?: IconTint;
  /** Right-aligned header actions (buttons, menus, etc). */
  actions?: React.ReactNode;
  className?: string;
  /** Extra classes for the body wrapper (the `px-4 py-3` region). */
  bodyClassName?: string;
  children?: React.ReactNode;
}

/**
 * White card section. Two variants:
 * - with header: title/icon/actions row (`px-4 py-2.5`, bottom hairline)
 *   above a `px-4 py-3` body.
 * - headerless (no title/icon/actions passed): a single `p-3` region with
 *   `gap-3` for stacked children — his "plain card" variant.
 */
export function SectionCard({
  title,
  icon: Icon,
  tint,
  actions,
  className,
  bodyClassName,
  children,
}: SectionCardProps) {
  const hasHeader = Boolean(title || Icon || actions);

  if (!hasHeader) {
    return (
      <div className={cn("flex flex-col gap-3 rounded-md border border-border bg-card p-3", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border border-border bg-card", className)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        {Icon && tint ? (
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]",
              TINT_CLASSES[tint].tile,
            )}
          >
            <Icon className={cn("h-[13px] w-[13px]", TINT_CLASSES[tint].icon)} />
          </span>
        ) : Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-foreground" />
        ) : null}

        {title ? (
          <span
            className="min-w-0 flex-1 truncate text-[13px] font-medium leading-5 tracking-[-0.076px] text-foreground"
            title={title}
          >
            {title}
          </span>
        ) : (
          <span className="min-w-0 flex-1" />
        )}

        {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
      </div>
      <div className={cn("px-4 py-3", bodyClassName)}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldRow / FieldList — the "Label: value" two-column row
// ---------------------------------------------------------------------------

export interface FieldRowProps {
  label: React.ReactNode;
  /** Renders `emptyLabel` in the muted "no data" style when this is
   *  `undefined`, `null`, or an empty string. */
  value?: React.ReactNode;
  emptyLabel?: string;
  className?: string;
}

/**
 * A single Label / value row. Long values wrap (never clip); a `title`
 * attribute is added for string values as a redundant affordance. Use
 * inside `FieldList` to get the spec's "divider between rows, none after
 * the last row" behavior for free via `divide-y`.
 */
export function FieldRow({ label, value, emptyLabel = "No data", className }: FieldRowProps) {
  const isEmpty = value === undefined || value === null || value === "";
  const stringValue = typeof value === "string" ? value : undefined;
  const stringLabel = typeof label === "string" ? label : undefined;

  return (
    <div className={cn("flex items-start gap-2 py-2", className)}>
      <span
        className="w-[100px] shrink-0 font-mono text-[11px] font-medium leading-4 text-muted-foreground"
        title={stringLabel}
      >
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 break-words text-[11px] leading-4 text-foreground",
          // Empty values stay on `text-muted-foreground`, NOT a lower-opacity
          // foreground. At 11px, `text-foreground/25` measured ~1.7:1 on
          // white — below AA and lighter than the `text-sm
          // text-muted-foreground` this replaced. A zero-data state has to
          // be readable; that is the whole point of printing it.
          isEmpty && "text-muted-foreground",
        )}
        title={isEmpty ? undefined : stringValue}
      >
        {isEmpty ? emptyLabel : value}
      </span>
    </div>
  );
}

export interface FieldListProps {
  children: React.ReactNode;
  className?: string;
}

/** Vertical stack of `FieldRow`s with a hairline divider between rows and
 *  none after the last — via `divide-y`, so no per-row `isLast` bookkeeping
 *  is needed at the call site. */
export function FieldList({ children, className }: FieldListProps) {
  return <div className={cn("flex flex-col divide-y divide-border", className)}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Chip / ChipList — "Tag / Basic"
// ---------------------------------------------------------------------------

/* Chip / ChipList / StatStrip / StatStripItem were drafted from the same
 * Figma spec and removed before landing: nothing imported them. Script has
 * no tag-like multi-value field and no stat strip, so they were API built
 * for a caller that does not exist. Re-add them from the spec when a screen
 * actually needs them — an unused export is a maintenance cost and a false
 * signal that the design language is wider than what ships. */
