import { Trophy, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * WinnerAdsToggle — A-11.21 (Brand → Product-focused).
 *
 * Maalik's spec: "Winner Ads include krne ka toggle but will filter out on
 * the basis of it's concept and angle, ye user ko show krna hoga also, ki
 * kyu kam hai."
 *
 * UX:
 *   - Off: toggle row + label + 1-line subtext.
 *   - On: thin info strip — `12/47 winners match · 35 excluded — see why`.
 *     Click "see why" → popover lists exclusion buckets:
 *       - Concept mismatch (X)
 *       - Angle mismatch (Y)
 *       - Brand mismatch (Z)
 *
 * Numbers are mock for now. Real filter wires later.
 */

export interface WinnerAdsToggleProps {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  /** Optional — passes selection counts so the explainer reads true. */
  hasFilter?: boolean;
}

// Mock exclusion data — replace with real filter results later.
const MOCK_TOTAL = 47;
const MOCK_QUALIFIED = 12;
const MOCK_EXCLUSIONS = [
  { reason: "Concept mismatch", count: 18 },
  { reason: "Angle mismatch", count: 12 },
  { reason: "Brand mismatch", count: 5 },
];

export function WinnerAdsToggle({
  enabled,
  onToggle,
  hasFilter = false,
}: WinnerAdsToggleProps) {
  return (
    <section className="space-y-2">
      <div className="rounded-xl border border-border bg-card px-3 py-2.5 flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={cn(
            "relative shrink-0 mt-0.5 h-5 w-9 rounded-full transition-colors",
            "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            enabled ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform",
              enabled && "translate-x-4",
            )}
          />
        </button>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Trophy className="h-3 w-3 text-muted-foreground" />
            Include winner ads as references
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            We pull from your brand's recent winners and only attach the ones
            that match the selected concepts and angles.
          </p>
        </div>
      </div>

      {enabled && (
        <FilterExplainer hasFilter={hasFilter} />
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function FilterExplainer({ hasFilter }: { hasFilter: boolean }) {
  if (!hasFilter) {
    return (
      <p className="text-[11px] text-muted-foreground italic px-1">
        Pick at least one concept or angle above to see how winners are filtered.
      </p>
    );
  }
  return (
    <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]">
      <span className="text-foreground">
        <span className="font-mono font-semibold">{MOCK_QUALIFIED}</span>
        <span className="text-muted-foreground"> / {MOCK_TOTAL}</span> winners match ·{" "}
        <span className="font-mono">{MOCK_TOTAL - MOCK_QUALIFIED}</span> excluded
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Info className="h-3 w-3" />
            see why
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-64 space-y-2 p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Why excluded
          </p>
          <ul className="space-y-1.5">
            {MOCK_EXCLUSIONS.map((e) => (
              <li
                key={e.reason}
                className="flex items-center justify-between text-xs text-foreground"
              >
                <span>{e.reason}</span>
                <span className="font-mono text-muted-foreground">{e.count}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground/80 italic pt-1">
            Mock numbers — real filter lands with the winners pipeline.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
