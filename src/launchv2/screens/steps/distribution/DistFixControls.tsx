/**
 * DistFixControls — shared fix-button renderer for a single `DistError`
 * (STEP3_ERROR_MODEL.md §5.1 / §6.2). Used by BOTH the per-control inline
 * cards on Step 3 and the `CapMeterWithFixes` mirror so the fix UI (label,
 * styling, picker behaviour) only exists once.
 *
 * Two fix shapes:
 *  - Picker fixes (`fix.picker === "add_page" | "swap_page"`) — the button
 *    expands into a page-candidate dropdown (`availablePages(plan)`); for
 *    `swap_page` the page at `fix.swapFrom` is excluded. Selecting a page
 *    re-invokes `applyDistFix` with `pageId` (+ `swapFrom` passthrough) set,
 *    then collapses. Nielsen #9 — if there are no candidates, show a muted
 *    "No other pages available" note instead of a dead dropdown.
 *  - Plain fixes — label is the button; click applies immediately.
 *
 * Visual language matches the existing fix pills in `CapMeterWithFixes`
 * (rounded-lg outline pill, tier-tinted border/text, dark+light parity).
 */
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { applyDistFix, availablePages, type DistError, type DistFix } from "../../../distributionErrors";
import type { PlanV2 } from "../../../types";

/* ------------------------------------------------------------------ *
 * Tier → pill styling (mirrors CapMeterWithFixes' fix-button classes).
 * ------------------------------------------------------------------ */

const TIER_PILL: Record<DistError["tier"], string> = {
  error:
    "border-[#ffa39e] dark:border-[#5c2223] text-[#cf1322] dark:text-[#ff7875] dark:bg-[#2a1215]/50",
  warning:
    "border-amber-300 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 dark:bg-amber-950/50",
  info: "border-sky-300 dark:border-sky-800/50 text-sky-800 dark:text-sky-300 dark:bg-sky-950/50",
};

const PILL_BASE =
  "inline-flex items-center gap-1 rounded-lg border bg-white dark:bg-transparent px-2.5 py-1 text-[11px] font-medium transition-colors hover:brightness-95 dark:hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

export function DistFixControls({
  error,
  plan,
  onApply,
}: {
  error: DistError;
  plan: PlanV2;
  onApply: (patch: Partial<PlanV2>) => void;
}) {
  if (error.fixes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {error.fixes.map((fix, i) => (
        <DistFixButton
          key={`${error.id}:${fix.kind}:${fix.picker ?? "plain"}:${i}`}
          tier={error.tier}
          fix={fix}
          plan={plan}
          onApply={onApply}
        />
      ))}
    </div>
  );
}

function DistFixButton({
  tier,
  fix,
  plan,
  onApply,
}: {
  tier: DistError["tier"];
  fix: DistFix;
  plan: PlanV2;
  onApply: (patch: Partial<PlanV2>) => void;
}) {
  const [open, setOpen] = useState(false);
  const pillClass = cn(PILL_BASE, TIER_PILL[tier]);

  const isPicker = fix.picker === "add_page" || fix.picker === "swap_page";

  const candidates = useMemo(() => {
    if (!isPicker) return [];
    const all = availablePages(plan);
    return fix.picker === "swap_page" && fix.swapFrom
      ? all.filter((c) => c.fbPageId !== fix.swapFrom)
      : all;
  }, [isPicker, fix.picker, fix.swapFrom, plan]);

  if (!isPicker) {
    return (
      <button type="button" onClick={() => onApply(applyDistFix(plan, fix))} className={pillClass}>
        {fix.label}
      </button>
    );
  }

  const choosePage = (pageId: string) => {
    onApply(applyDistFix(plan, { ...fix, pageId }));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(pillClass, "gap-1")} aria-haspopup="listbox" aria-expanded={open}>
          {fix.label}
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1">
        {candidates.length === 0 ? (
          <p className="px-2 py-2 text-[11px] text-muted-foreground">No other pages available</p>
        ) : (
          <ul role="listbox" className="max-h-64 overflow-y-auto">
            {candidates.map((c) => (
              <li key={`${c.accountId}:${c.pageId}`}>
                <button
                  type="button"
                  role="option"
                  onClick={() => choosePage(c.pageId)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <span className="min-w-0 truncate">
                    {c.accountName} · {c.pageName}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[11px] tabular-nums",
                      c.free > 0 ? "text-[#237804] dark:text-[#52c41a]" : "text-muted-foreground"
                    )}
                  >
                    {c.free} free
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
