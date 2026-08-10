import * as React from "react";

import { cn } from "@/lib/utils";
import type { ReadTier } from "@/connector/model";

/**
 * ReadTierControl — the Off / View / View + Export segment control that sits on
 * every one of the 9 module rows in the Connector permission matrix.
 *
 * WHY role="radiogroup" AND NOT role="switch"
 * ReadTier has THREE values. `role="switch"` has exactly two legal states
 * (`aria-checked` true|false). The only third value the spec offers is
 * `aria-checked="mixed"`, and "mixed" is explicitly UNDEFINED for switch — it
 * is a tri-state checkbox concept. Screen readers disagree on it: NVDA reads
 * "partially pressed", JAWS reads "mixed", VoiceOver often reads nothing at
 * all, and none of them convey "View, but not export". A radiogroup with three
 * radios is the only mapping where the user hears the actual choice AND hears
 * how many alternatives exist ("View, 2 of 3"). Do not "simplify" this back
 * into a switch.
 *
 * WHY ROVING TABINDEX
 * A radiogroup is ONE tab stop by contract — the selected radio owns
 * `tabIndex={0}`, every sibling gets `tabIndex={-1}`. With 9 module rows, the
 * naive "every segment is tabbable" alternative costs a keyboard user 27 tab
 * presses to cross the matrix instead of 9. Arrows move *and* select (WAI-ARIA
 * radiogroup pattern), wrapping at the ends, and we call .focus() on the newly
 * selected segment so focus never desynchronises from selection.
 *
 * WHY FIXED EQUAL SEGMENT WIDTHS
 * Load-bearing, not cosmetic. The control is an explicit 3-equal-column grid at
 * a fixed track width, so the selected pill lands at the SAME x-position on
 * every row. That turns the matrix into a single readable shape scanned in one
 * vertical sweep, instead of 9 independently-sized sentences the eye has to
 * parse one at a time.
 *
 * WHY TWO LABEL SPANS INSTEAD OF JS VIEWPORT DETECTION
 * The narrow-screen label ("Download") is a CSS-only swap — `hidden sm:inline`
 * over `sm:hidden`. JS viewport detection would render the wrong label on the
 * server/first paint and re-flow, and would put a resize listener on a control
 * that appears 9 times. The FULL wording always lives in each segment's
 * `aria-label`, so the shortened visual label never reaches assistive tech.
 */

interface ReadTierControlProps {
  value: ReadTier;
  onChange: (t: ReadTier) => void;
  /** id of the module-name element — names the whole group for SR users. */
  moduleLabelId: string;
  describedById?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

interface TierDef {
  id: ReadTier;
  /** Full visual label, shown at >= sm. Also the accessible name. */
  full: string;
  /** Shortened visual label, shown below sm. Never reaches assistive tech. */
  short: string;
}

const TIERS: readonly TierDef[] = [
  { id: "off", full: "Off", short: "Off" },
  { id: "view", full: "View", short: "View" },
  { id: "view_export", full: "View + Export", short: "Download" },
] as const;

const indexOfTier = (t: ReadTier) => {
  const i = TIERS.findIndex((x) => x.id === t);
  return i === -1 ? 0 : i;
};

export function ReadTierControl({
  value,
  onChange,
  moduleLabelId,
  describedById,
  disabled = false,
  size = "md",
  className,
}: ReadTierControlProps) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = indexOfTier(value);

  const select = React.useCallback(
    (index: number, moveFocus: boolean) => {
      if (disabled) return;
      const next = TIERS[index];
      if (!next) return;
      if (next.id !== value) onChange(next.id);
      if (moveFocus) refs.current[index]?.focus();
    },
    [disabled, onChange, value],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return;

    switch (event.key) {
      // Arrows move AND select, wrapping — WAI-ARIA radiogroup pattern.
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        select((index + 1) % TIERS.length, true);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        select((index - 1 + TIERS.length) % TIERS.length, true);
        break;
      case "Home":
        event.preventDefault();
        select(0, true);
        break;
      case "End":
        event.preventDefault();
        select(TIERS.length - 1, true);
        break;
      // preventDefault so the native button activation cannot ALSO fire a
      // click — otherwise Enter/Space would run select() twice.
      case "Enter":
      case " ":
      case "Spacebar":
        event.preventDefault();
        select(index, true);
        break;
      default:
        break;
    }
  };

  const isSm = size === "sm";

  return (
    <div
      role="radiogroup"
      aria-labelledby={moduleLabelId}
      aria-describedby={describedById}
      aria-disabled={disabled || undefined}
      className={cn(
        // Explicit 3-equal-column grid at a fixed track width: the selected
        // pill must land in the same x-position on all 9 rows.
        "grid grid-cols-3 max-w-full rounded-md border border-border bg-muted",
        isSm ? "w-[13rem] gap-0.5 p-0.5" : "w-[16rem] gap-0.5 p-1",
        disabled && "opacity-50",
        className,
      )}
    >
      {TIERS.map((tier, index) => {
        const selected = tier.id === value;
        return (
          <button
            key={tier.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={tier.full}
            // Roving tabindex: exactly ONE tab stop for the whole group.
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => select(index, true)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "flex w-full min-w-0 items-center justify-center rounded-[0.25rem] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed",
              isSm ? "h-6 px-1 text-[11px]" : "h-7 px-2 text-xs",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {/* CSS-only label swap. aria-label above carries the full wording. */}
            <span aria-hidden="true" className="hidden truncate sm:inline">
              {tier.full}
            </span>
            <span aria-hidden="true" className="truncate sm:hidden">
              {tier.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
