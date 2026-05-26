/**
 * UpsellCornerPill — single compact upsell chip for the AI-plan dashboard header.
 *
 * Replaces the 3-component upsell stack (UpsellRow + AiDashboardUpsellHero +
 * AiDashboardUpsellSide). Sits inline in the dashboard header bar, to the left
 * of the Refresh button. Linear / Stripe / Notion vibe — quiet at rest, with a
 * subtle lime hairline + lift on hover. Routes to the plans page with the
 * Growth-tier trial view preselected.
 */
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

interface UpsellCornerPillProps {
  className?: string;
}

export function UpsellCornerPill({ className }: UpsellCornerPillProps) {
  return (
    <Link
      to="/plans-v2?tier=growth&view=trial"
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card pl-2.5 pr-3 py-1 text-[12px] transition-all hover:border-primary/40 hover:bg-primary/[0.04] hover:-translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
      <span className="text-foreground/75 transition-colors group-hover:text-foreground">
        Try Full plan
      </span>
      <span className="font-mono text-[9.5px] uppercase tracking-wider text-foreground/45 transition-colors group-hover:text-foreground/65">
        7-day trial
      </span>
      <ArrowRight
        className="h-3 w-3 text-foreground/35 transition-all group-hover:translate-x-[1px] group-hover:text-foreground/75"
        aria-hidden="true"
      />
    </Link>
  );
}
