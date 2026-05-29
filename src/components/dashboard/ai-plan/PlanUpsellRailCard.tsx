/**
 * PlanUpsellRailCard — right-rail upsell surface for the AI Plan dashboard.
 *
 * Occupies col 5 of AnalyticsHero, spanning the full hero height (row-span-4).
 * Pure inventory + one CTA: shows active modules (check), locked modules
 * (lock + 1-line description), then a single Growth trial button.
 *
 * Locked decisions (do not reopen):
 *   - Tier umbrella: Growth
 *   - Trial: 14-day
 *   - Locked modules: Reports / Launch / Automation / RRM
 *   - Free modules: Genie / Industry Insights / Catalogue
 */
import { Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PlanUpsellRailCardProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_MODULES = [
  { name: "Genie" },
  { name: "Industry Insights" },
  { name: "Catalogue" },
];

const LOCKED_MODULES = [
  { name: "Reports", description: "Multi-account ROAS, one view." },
  { name: "Launch", description: "50 ads, 12 accounts, one click." },
  { name: "Automation", description: "Rules-based spend rotation." },
  { name: "RRM", description: "1:1:250 retention patterns." },
];

const TOTAL_MODULES = ACTIVE_MODULES.length + LOCKED_MODULES.length; // 7
const ACTIVE_COUNT = ACTIVE_MODULES.length; // 3
const FILL_PCT = (ACTIVE_COUNT / TOTAL_MODULES) * 100;

// ─────────────────────────────────────────────────────────────────────────────
// Section divider
// ─────────────────────────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 h-px bg-border/40" />
      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground/60 shrink-0">
        {label}
      </span>
      <span className="flex-1 h-px bg-border/40" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function PlanUpsellRailCard({ className }: PlanUpsellRailCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 flex flex-col h-full",
        className,
      )}
    >
      {/* ── Header: plan name + status indicator ── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
            Your Plan
          </span>
          <span className="text-[18px] font-semibold leading-tight text-foreground">
            AI Plan
          </span>
        </div>
        {/* Lime status dot */}
        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-primary">
            Active
          </span>
        </span>
      </div>

      {/* ── Hero fraction + progress bar ── */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-[28px] font-bold leading-none text-foreground tabular-nums">
            {ACTIVE_COUNT}
          </span>
          <span className="text-[12px] text-muted-foreground leading-none">
            / {TOTAL_MODULES} modules active
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-[1.5px] rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${FILL_PCT}%` }}
          />
        </div>
      </div>

      {/* ── Active modules ── */}
      <div className="mb-2">
        <SectionDivider label="Active" />
        <ul className="mt-2 flex flex-col gap-1.5">
          {ACTIVE_MODULES.map((mod) => (
            <li key={mod.name} className="flex items-center gap-2">
              <Check
                className="h-3 w-3 shrink-0 text-primary"
                strokeWidth={2.5}
              />
              <span className="text-[12px] text-foreground/70 leading-none">
                {mod.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Locked modules ── */}
      <div className="mb-auto">
        <SectionDivider label="Locked · Growth" />
        <ul className="mt-2 flex flex-col gap-2">
          {LOCKED_MODULES.map((mod) => (
            <li key={mod.name} className="flex items-start gap-2">
              <Lock
                className="h-3.5 w-3.5 shrink-0 mt-[1px] text-foreground/35"
                strokeWidth={2}
              />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[12px] text-foreground leading-none">
                  {mod.name}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {mod.description}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ── CTA ── */}
      <div className="mt-4">
        <Button asChild size="sm" className="w-full">
          <Link to="/plans-v2?tier=growth&view=trial">
            Try Growth · 14-day trial
          </Link>
        </Button>
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground text-center mt-1.5">
          Cancel any time · No card required
        </p>
      </div>
    </section>
  );
}

export default PlanUpsellRailCard;
