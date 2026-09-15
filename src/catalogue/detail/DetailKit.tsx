import * as React from "react";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
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
 * - Chip / StatStripItem / CollapsibleCard / PillButton (added for Script's
 *   richer detail page) extend the same mapping: `#7D817A` (StatStrip
 *   arrow) and `#8B8893` (CollapsibleCard leading icon) both map onto
 *   `text-muted-foreground` — no dedicated token exists for either literal
 *   hex, and both are already the "muted decorative icon" role elsewhere in
 *   this file. `#E7E5DC` (PillButton border) maps onto `border-border` for
 *   the same reason every other border in this file does. Chip's
 *   `rgba(0,0,0,0.04)` fill maps onto `bg-foreground/5`, an opacity
 *   modifier already used for this exact "subtle neutral fill" role in
 *   `Step0Entity.tsx` / `AlphaStep1Format.tsx`. Chip's `rgba(15,15,12,0.7)`
 *   text has no single matching token, so it's `text-foreground/70` — an
 *   opacity modifier on the real `foreground` token (which, unlike `g6-*`,
 *   supports one), not a new raw hex; the same `text-foreground/NN` pattern
 *   already appears in a dozen+ other files. StatStripItem's 30×30 tile
 *   reuses the exact `rounded-[8px]` arbitrary value SectionCard's icon
 *   tile already established (no 8px token exists post radius-scale
 *   override). StatStripItem's outer `rounded-[10px]` and the `gap-[11px]`
 *   tile gap stay arbitrary: the radius scale (sm/md/lg = 14/16/18px, plus
 *   the default 4px) has no 10px step, and the spacing scale has no 11px
 *   step (2.75 isn't a real Tailwind step, unlike 2.5 = 10px or 3.5 = 14px,
 *   both of which ARE used below via `py-3`/`px-3.5`).
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

export interface ChipProps {
  /** Route this chip names. Present ⇒ the chip renders as a real link. */
  to?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * "Tag / Basic" — a single small mono-text tag. Background is
 * `bg-foreground/5` (an opacity modifier on the real `foreground` HSL
 * token, NOT a bare hex): the spec's `rgba(0,0,0,0.04)` is near-identical
 * to the 0.05 tint already used for this exact "subtle neutral fill"
 * role in `Step0Entity.tsx` / `AlphaStep1Format.tsx`, so this reuses that
 * established pattern instead of inventing a new literal.
 */
/**
 * A chip is a LABEL by default and a LINK when given `to`.
 *
 * The link variant exists because a Script's Brand / Category / Avatar /
 * Voice / Angle chips each name a real record with its own page. Rendered as
 * bare spans they left the whole detail view with zero anchors — every route
 * out of a script, gone, while the rows still looked like the old linked
 * ones. A chip that names another entity should be able to reach it, and the
 * accent + underline-on-hover is what tells the two variants apart.
 */
export function Chip({ className, children, to }: ChipProps) {
  const stringChildren = typeof children === "string" ? children : undefined;
  const base =
    "inline-flex max-w-full items-center rounded bg-foreground/5 px-2 py-px font-mono text-[11px] font-medium leading-4";

  if (to) {
    return (
      <Link
        to={to}
        className={cn(base, "fab-focus text-primary-text hover:underline", className)}
        title={stringChildren}
      >
        <span className="truncate">{children}</span>
      </Link>
    );
  }

  return (
    <span className={cn(base, "text-foreground/70", className)} title={stringChildren}>
      <span className="truncate">{children}</span>
    </span>
  );
}

export interface ChipListProps {
  children?: React.ReactNode;
  emptyLabel?: string;
  className?: string;
}

/** Wrapping row of `Chip`s. Renders `emptyLabel` in the muted "no data"
 *  style when there are no children (mirrors `FieldRow`'s empty handling). */
export function ChipList({ children, emptyLabel = "No tags", className }: ChipListProps) {
  const hasChildren = React.Children.count(children) > 0;

  if (!hasChildren) {
    return <span className={cn("text-[11px] leading-4 text-muted-foreground", className)}>{emptyLabel}</span>;
  }

  return <div className={cn("flex flex-wrap gap-x-2 gap-y-1", className)}>{children}</div>;
}

// ---------------------------------------------------------------------------
// StatStripItem / StatStrip
// ---------------------------------------------------------------------------

export interface StatStripItemProps {
  icon: LucideIcon;
  tint?: IconTint;
  caption: React.ReactNode;
  /** Renders `emptyLabel` in the muted "no data" style when this is
   *  `undefined`, `null`, or an empty string. */
  value?: React.ReactNode;
  emptyLabel?: string;
  className?: string;
}

/**
 * A single stat tile: 30×30 tinted icon tile + caption/value two-line
 * block. `border-border` gives it a visible edge against the identical
 * `card`/`background` white (see file header) exactly like `SectionCard`.
 */
export function StatStripItem({
  icon: Icon,
  tint = "lime",
  caption,
  value,
  emptyLabel = "—",
  className,
}: StatStripItemProps) {
  const isEmpty = value === undefined || value === null || value === "";
  const stringValue = typeof value === "string" ? value : undefined;
  const stringCaption = typeof caption === "string" ? caption : undefined;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-[11px] rounded-[10px] border border-border bg-card px-3.5 py-3",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px]",
          TINT_CLASSES[tint].tile,
        )}
      >
        <Icon className={cn("h-[14px] w-[14px]", TINT_CLASSES[tint].icon)} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[11px] leading-[15px] text-muted-foreground" title={stringCaption}>
          {caption}
        </span>
        <span
          className={cn(
            "truncate text-[11px] font-semibold leading-4 text-foreground",
            isEmpty && "font-normal text-muted-foreground",
          )}
          title={isEmpty ? undefined : stringValue}
        >
          {isEmpty ? emptyLabel : value}
        </span>
      </span>
    </div>
  );
}

export interface StatStripProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * A row of `StatStripItem`s with a right-pointing chevron between items
 * (never after the last) — injected via `React.Children`, so callers get
 * the same "no per-item isLast bookkeeping" ergonomics as `FieldList`.
 *
 * Narrow-width behavior: horizontal SCROLL, not wrap. The chevrons encode a
 * left-to-right sequence (e.g. "Duration → Format → Aspect"); wrapping would
 * strand an arrow at the end of one line pointing at nothing, which reads as
 * broken. The per-item floor (an inferred number — the spec gave none) is
 * what makes that scroll actually happen.
 *
 * It is 220px, not 110px. An item's own chrome eats 69px (30px tile + 11px
 * gap + 28px padding), so a 110px floor left 41px for text: the row always
 * fitted, never scrolled, and every value truncated instead — at 1024 even
 * the caption "Wants them to" was clipped. The longest seeded value measures
 * 144px, so the floor has to clear 144 + 69 = 213; 200 still clipped two of
 * the three by a few px, 220 clears all of them with room to spare.
 */
export function StatStrip({ children, className }: StatStripProps) {
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <div className={cn("flex items-stretch gap-0.5 overflow-x-auto", className)}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          <div className="min-w-[220px] flex-1 basis-0">{child}</div>
          {index < items.length - 1 ? (
            <ChevronRight className="h-[18px] w-[18px] shrink-0 self-center text-muted-foreground" aria-hidden />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CollapsibleCard
// ---------------------------------------------------------------------------

export interface CollapsibleCardProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  /** Uncontrolled initial state. Ignored once `open` is passed. */
  defaultOpen?: boolean;
  /** Pass together with `onOpenChange` to fully control the open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}

/**
 * White card with a collapsible body. Controlled/uncontrolled dual contract
 * (same shape as a Radix primitive): pass nothing for a self-managed toggle
 * seeded by `defaultOpen`, or pass `open` + `onOpenChange` to drive it from
 * outside — `open` presence alone flips it into controlled mode.
 *
 * The head's chevron + rotate-on-open is the exact pattern already used by
 * `AnglePlaybookPanel.tsx` in this same directory (`ChevronRight` +
 * `rotate-90`), reused rather than re-invented.
 */
export function CollapsibleCard({
  title,
  icon: Icon,
  actions,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className,
  bodyClassName,
  children,
}: CollapsibleCardProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const toggle = () => {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={cn("rounded-md border border-border bg-card", className)}>
      <div className="flex h-11 items-center gap-2 px-3">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="fab-focus flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left"
        >
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
            aria-hidden
          />
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
          <span
            className="min-w-0 flex-1 truncate text-[13px] font-medium leading-5 tracking-[-0.076px] text-foreground"
            title={title}
          >
            {title}
          </span>
        </button>
        {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
      </div>
      {open ? (
        <div className="border-t border-border">
          <div className={cn("p-3", bodyClassName)}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PillButton
// ---------------------------------------------------------------------------

export interface PillButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  icon?: LucideIcon;
  children?: React.ReactNode;
}

/**
 * Small outline pill button. `border-border` stands in for the spec's
 * literal `#E7E5DC` (same "map the hex onto the app's real border token"
 * call already made for every other border in this file). No background
 * was specified in the spec, so this defaults to transparent with a muted
 * hover fill — an inferred affordance, not a spec value.
 */
export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(function PillButton(
  { icon: Icon, children, className, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        "fab-focus inline-flex h-7 shrink-0 items-center gap-2 rounded-full border border-border bg-transparent px-3 text-[11px] font-medium leading-4 text-foreground transition-colors",
        "hover:bg-muted/40",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="h-[13px] w-[13px] shrink-0" aria-hidden /> : null}
      {children}
    </button>
  );
});
