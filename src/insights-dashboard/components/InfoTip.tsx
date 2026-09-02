/**
 * InfoTip — the one tooltip primitive for the "explain everything" pass on
 * `/insights/overview`.
 *
 * Modelled directly on `Provenance.tsx`'s trigger: same `TooltipProvider
 * delayDuration={200}`, same `max-w-[240px]` content box, same `cursor-help`
 * + `tabIndex={0}` + `focus-visible:ring-ring` treatment on the glyph. Do not
 * drift from that pattern — consistency with `Provenance` matters more than
 * any local improvement.
 *
 * InfoTip answers three questions, always in this order (Maalik's own
 * framing): what it is, what it gives you, what to do with it. `Provenance`
 * already owns "where did this number come from and how fresh is it" — never
 * restate that here. Copy lives in `lib/tooltipCopy.ts`, keyed by a flat,
 * namespaced string (`kpi.*`, `block.*`, `metric.*`, `column.*`, `action.*`,
 * `chart.*`) so the same concept is never explained two different ways by
 * two different blocks.
 *
 * ── Two ways to use it ──────────────────────────────────────────────────
 *
 * 1. Glyph mode (default) — sits beside a heading or metric LABEL, never
 *    beside the number itself. Renders a small `Info` glyph as its own
 *    focusable trigger.
 *
 *      <h2>Top competitors</h2>
 *      <InfoTip tip="block.top-competitors" />
 *
 * 2. Wrap mode (`asChild`) — the element itself IS the trigger, no glyph
 *    added. This is how action buttons/links/chips get explained; it never
 *    grows a control's footprint.
 *
 *      <InfoTip tip="action.brief-it" asChild>
 *        <Button ...>Brief it</Button>
 *      </InfoTip>
 *
 *    `asChild` hands `children` straight to Radix's `TooltipTrigger asChild`,
 *    which clones it and needs a single element that forwards a ref. Most
 *    things already used as tooltip triggers on this page qualify (`Button`,
 *    `Link`, a plain `<span tabIndex={0}>`) — `Badge` from
 *    `components/ui/badge` does NOT forward a ref; wrap it in
 *    `<span tabIndex={0}>` before handing it to `asChild`, exactly as
 *    `InsightsOverview.tsx`'s own source-count badge already does with a raw
 *    Radix `TooltipTrigger`.
 *
 * A key that isn't in the registry never crashes and never renders a blank
 * tooltip — `getTooltipCopy` logs a dev-only warning and hands back a
 * visibly neutral fallback. See `lib/tooltipCopy.ts`.
 */
import type { ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTooltipCopy, type TooltipCopy } from "@/insights-dashboard/lib/tooltipCopy";

export type { TooltipCopy };

export interface InfoTipProps {
  /**
   * A registry key from `TOOLTIP_COPY` (preferred — keeps copy centralised
   * and greppable), or an inline `TooltipCopy` object for a genuinely
   * one-off tip that doesn't belong in the shared registry.
   */
  tip: string | TooltipCopy;
  /** Tooltip placement. Defaults to "top", matching `Provenance`. */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * Wrap mode: `children` becomes the trigger itself, no glyph is rendered.
   * Requires exactly one ref-forwarding child (see file header).
   */
  asChild?: boolean;
  /** Required when `asChild` is true; ignored otherwise. */
  children?: ReactNode;
  /** Extra classes on the glyph trigger. Ignored in `asChild` mode. */
  className?: string;
}

/**
 * The three-part body every InfoTip renders, regardless of trigger shape:
 * bold label, then what / gives / (optional) action as separate lines.
 * `action` is genuinely omitted (not a filler sentence) when the copy has
 * no real next step to name.
 */
function InfoTipBody({ copy }: { copy: TooltipCopy }) {
  return (
    <>
      <p className="text-xs font-medium text-foreground">{copy.label}</p>
      <p className="mt-0.5 text-xs leading-snug text-foreground/70">{copy.what}</p>
      <p className="text-xs leading-snug text-foreground/70">{copy.gives}</p>
      {copy.action && (
        <p className="text-xs leading-snug text-foreground/70">{copy.action}</p>
      )}
    </>
  );
}

export function InfoTip({ tip, side = "top", asChild = false, children, className }: InfoTipProps): JSX.Element {
  const copy = typeof tip === "string" ? getTooltipCopy(tip) : tip;

  if (asChild) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipPrimitive.Portal>
            <TooltipContent side={side} className="max-w-[240px]">
              <InfoTipBody copy={copy} />
            </TooltipContent>
          </TooltipPrimitive.Portal>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* span wrapper, not a bare `<svg>` — a raw icon has no tabIndex,
              so Radix's tooltip never opens for keyboard users. Same pattern
              as `Provenance.tsx`. `shrink-0` + `items-center` so this never
              disturbs the baseline of the label it sits beside. */}
          <span
            tabIndex={0}
            aria-label={copy.label}
            className={cn(
              "inline-flex shrink-0 items-center cursor-help rounded-sm text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              className,
            )}
          >
            <Info className="h-3 w-3" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipPrimitive.Portal>
          <TooltipContent side={side} className="max-w-[240px]">
            <InfoTipBody copy={copy} />
          </TooltipContent>
        </TooltipPrimitive.Portal>
      </Tooltip>
    </TooltipProvider>
  );
}
