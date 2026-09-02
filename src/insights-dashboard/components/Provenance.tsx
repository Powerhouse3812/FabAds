/**
 * Provenance — the credibility chip.
 *
 * The single most-cited complaint against ad-intelligence tools (Foreplay,
 * Motion, Atria, AdSpy, BigSpy, Sensor Tower, SimilarWeb, Meta Ad Library and
 * others) is that modelled numbers get shown in the same typography as
 * measured ones — a "$1.24M/mo estimated sales" sitting next to "412 live
 * ads" with no visual distinction, until users stop trusting either. Every
 * number on this dashboard must declare where it came from. This is how.
 *
 * DESIGN RULE — read before touching this file: the three tiers are NOT
 * colour-coded (no red/amber/green, no hue-only distinction anywhere). A
 * traffic-light treatment here would be both an accessibility failure and
 * exactly the "trust theatre" this chip exists to avoid. The tiers are
 * carried by label text + icon shape only; every tier uses the same neutral
 * semantic tokens (`bg-muted`, `text-muted-foreground`, `border-border`).
 *
 * Icons are chosen to be honest about what they represent, not decorative:
 *   - observed  → Eye                 (seen directly, nothing inferred)
 *   - estimated → EqualApproximately  (≈ — modelled, explicitly not exact)
 *   - derived   → Calculator          (we computed it from observed data)
 */
import type { LucideIcon } from "lucide-react";
import { Calculator, Eye, EqualApproximately } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ProvenanceTier } from "@/insights-dashboard/lib/types";

export const PROVENANCE_META: Record<
  ProvenanceTier,
  { label: string; source: string; description: string }
> = {
  observed: {
    label: "Observed",
    source: "Meta Ad Library",
    description:
      "Seen directly in the Meta Ad Library — the ad exists, and its start date, format and status are directly observed, not modelled. Highest confidence: we're reporting what we saw.",
  },
  estimated: {
    label: "Estimated",
    source: "StoreLeads",
    description:
      "Modelled by StoreLeads, not measured. Directional, not exact — useful for sizing a market, not for setting your own budget against.",
  },
  derived: {
    label: "Derived",
    source: "Computed by FabAds",
    description:
      "Calculated by us from observed data — changes, launch cadence, brand share. Only as reliable as our last scan.",
  },
};

const PROVENANCE_ICON: Record<ProvenanceTier, LucideIcon> = {
  observed: Eye,
  estimated: EqualApproximately,
  derived: Calculator,
};

export function Provenance({
  tier,
  compact = false,
  label,
  className,
}: {
  tier: ProvenanceTier;
  /** Hide the text and show only the marker — for dense rows. Default false. */
  compact?: boolean;
  /** Override the default label, e.g. "Observed · Meta Ad Library". */
  label?: string;
  className?: string;
}) {
  const meta = PROVENANCE_META[tier];
  const Icon = PROVENANCE_ICON[tier];
  const displayLabel = label ?? meta.label;
  const accessibleName = `${meta.label} · ${meta.source}`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            aria-label={compact ? accessibleName : undefined}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-1.5 py-0.5",
              "font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70",
              "cursor-help select-none",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              compact && "px-1",
              className,
            )}
          >
            <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            {!compact && <span>{displayLabel}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[240px] normal-case tracking-normal"
        >
          <p className="text-xs font-medium text-foreground">
            {meta.label} · {meta.source}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-foreground/70">
            {meta.description}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
