/**
 * WhereToGo — "what you can do here", scannable.
 *
 * A table of contents for the module's six surfaces (My Feeds, Discover,
 * Saved Ads, Competitor, Domain, Trends), each as one row: label ·
 * description · count · link. Every count here is a figure another block on
 * this page already shows — this is navigation, not a second data source.
 *
 * Descriptions come from `NavSurfaceCount.description` (fixture
 * `NAV_SURFACE_META`) — Maalik's own words, one source of truth. Don't
 * hardcode a parallel copy map here; edit the fixture instead.
 *
 * `/insights/saved` is a `ComingSoonPage` stub in this repo today. Its count
 * is real (ads people have actually saved), so the row is not hidden or
 * faked — the link just currently lands on a placeholder page.
 *
 * ── Trends row: an ordinary count, same as every other row ───────────────
 * This row used to hide its number. The fixture that fed it was not the same
 * metric in every state — `POPULATED_NEW_SIGNALS` ("changes detected this
 * week", a scan-derived figure with its own KPI tile) in `populated` and
 * `TRENDS_TOTAL_UPDATES` (the newsroom's own total) in `firstTime`/`empty` —
 * so it read 34 or 41 depending on state, inches from a `TrendsSummary` card
 * whose own headline number meant something related but distinct. That was
 * fixed at the source: `fixtures.ts` now feeds `TRENDS_TOTAL_UPDATES` in
 * every state and the row's `unitLabel` names it ("updates in the
 * newsroom"), so this row and `TrendsSummary` print the SAME metric and the
 * same number. The presentation-layer workaround that hid the badge is gone
 * with it — do not reintroduce it; if the two numbers ever disagree again,
 * the bug is in the fixture, not here.
 *
 * ── Zero rows: words, not a second number in the count column ───────────
 * `my-feeds`, `saved-ads`, and `competitor` are the three follow-scoped
 * counts (per CONTRACT.md) — the only ones that can honestly be a real 0. A
 * bare "0" next to "your personalized stream" is the blank-card feeling this
 * pass exists to remove. The first attempt paired it INSIDE the count column
 * as "0 · 20,515", which is exactly the unlabelled-number-pair Maalik
 * rejected on the angle-mix block ("ek % samajh ati, why 2"). So the count
 * column keeps ONE number — the user's honest 0 — and what the market
 * already has moves into the row's own prose with its unit attached
 * ("· 20,515 live ads already indexed"). One number per position, each with
 * words beside it. The market figure is drawn from a sibling market row
 * (Discover for My Feeds/Saved Ads, Domain for Competitor — both real market
 * totals in every state), so nothing here is invented: every paired number is
 * a count this same block already renders on another row.
 */
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import { useNavOverview } from "@/insights-dashboard/lib/selectors";
import type { NavSurfaceKey } from "@/insights-dashboard/lib/types";

const SECTION_LABEL =
  "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70";

/** Surfaces whose count is scoped to what the user personally follows/saved —
 * the only rows where `count === 0` is "nothing set up yet" rather than a
 * market fact. Mapped to the sibling market row that shows what's waiting. */
const ZERO_PAIR_MARKET_KEY: Partial<Record<NavSurfaceKey, NavSurfaceKey>> = {
  "my-feeds": "discover",
  "saved-ads": "discover",
  competitor: "domain",
};

/**
 * `self-start` opts this card out of the grid row's default `stretch`, the
 * same way `BoardHygiene` and `TrendsSummary` already do. Its six rows are a
 * fixed ~239px in every state, but in `firstTime`/`empty` the 4-col column
 * beside it carries BOTH `SetupChecklist` and `TrendsSummary` and resolves
 * near 382px — stretching left ~143px of blank card under the last row,
 * which reads as a block that failed to load. No-op in `populated` (where
 * this is the tallest thing in its row) and below `lg`.
 */
export function WhereToGo({ className }: { className?: string }): JSX.Element {
  const { surfaces, byKey, isLoading } = useNavOverview();

  // CHECK isLoading BEFORE reading counts — every surface's `count` reads
  // `null` while nothing has resolved yet, which is indistinguishable from a
  // real "we haven't scanned this yet" naReason. A skeleton keeps a cold load
  // from asserting six unearned "—" rows.
  if (isLoading) {
    return (
      <section className={cn("self-start rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2">
          <h2 className={cn(SECTION_LABEL, "flex items-center gap-1")}>
            Where to go
            <InfoTip tip="block.where-to-go" />
          </h2>
        </header>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-1.5">
              <Skeleton className="h-3.5 w-64" />
              <Skeleton className="h-3.5 w-10 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("self-start rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-2">
        <h2 className={cn(SECTION_LABEL, "flex items-center gap-1")}>
          Where to go
          <InfoTip tip="block.where-to-go" />
        </h2>
      </header>

      <div className="divide-y divide-border/60">
        {surfaces.map((surface) => {
          const description = surface.description;
          const marketKey = ZERO_PAIR_MARKET_KEY[surface.key];
          const marketSurface = marketKey ? byKey[marketKey] : undefined;
          const waiting =
            surface.count === 0 && marketSurface && marketSurface.count !== null
              ? `${marketSurface.countLabel} ${marketSurface.unitLabel} already indexed`
              : null;

          const title = waiting
            ? `${description} — you: 0 ${surface.unitLabel} · ${waiting}`
            : `${description} — ${surface.count === null ? surface.naReason ?? surface.countLabel : `${surface.countLabel} ${surface.unitLabel}`}`;

          return (
            <Link
              key={surface.key}
              to={surface.href}
              title={title}
              className="group flex items-center justify-between gap-3 rounded-sm py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <p className="min-w-0 truncate text-sm leading-tight">
                <span className="font-medium text-foreground">{surface.label}</span>
                <span className="text-foreground/70"> · {description}</span>
                {/* What the market already has, in words, with its unit
                    attached — never a second bare number in the count
                    column beside it. */}
                {waiting && <span className="text-foreground/70"> · {waiting}</span>}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums leading-tight",
                    surface.count === null ? "text-foreground/70" : "text-foreground",
                  )}
                >
                  {surface.countLabel}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
