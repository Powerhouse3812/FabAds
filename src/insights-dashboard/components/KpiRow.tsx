/**
 * KpiRow — the honesty strip at the top of the Industry Insights dashboard.
 *
 * Renders the 5 primary KPI tiles (`useKpis().primary`) in a fixed order:
 * live ads · advertisers · new signals · creative lifespan · your share of
 * creative. A bare count is vanity; this row exists to make every count
 * accountable — where it came from, how fresh it is, which way it moved, and
 * (when it's missing) exactly why. Don't reduce it to numbers alone.
 *
 * `value === null` always carries `naReason` and is rendered as that reason,
 * never a dash. A real zero is `value: "0"` with no reason and renders as an
 * ordinary number — the two are visually distinct on purpose.
 *
 * ── REBALANCED FOR WORKING MEMORY (design critique fix) ───────────────────
 * A tile used to be six competing chunks — label, value, delta, caption,
 * source chip, sparkline — times five tiles, i.e. exactly the "~30 chunks
 * in one band" a design critique flagged (Miller's ~4). Two changes:
 *
 *  1. The per-tile source chip is gone. Every tile still discloses its
 *     source, but as ONE sentence in the band footer instead of five
 *     separate tab-stops — built from `PROVENANCE_META` (the same map the
 *     chip itself reads), grouped by tier, so it can't drift from what the
 *     chip would have said. This also removes 5 of the ~40 keyboard tab
 *     stops the page-wide chip critique was about.
 *  2. Caption and sparkline are demoted, not deleted: smaller, lower
 *     contrast, folded onto one footer line per tile, so label → value+delta
 *     reads as the dominant pair and everything else recedes to a glance.
 *
 * ── DOORWAYS ───────────────────────────────────────────────────────────────
 * Only tiles with a genuine destination are links — `live-ads` → Discover,
 * `advertisers` → Competitors. The other three (new signals, creative
 * lifespan, your share of creative) have no page that shows exactly what the
 * tile claims, so they stay plain: a link that doesn't return what the
 * number promised is worse than no link.
 *
 * ── NO VISIBLE HEADING (design critique fix) ────────────────────────────────
 * The "Key metrics" `<h2>` is gone — it was filler occupying the first
 * screen above the block the page was deliberately reordered to lead with,
 * and the tiles already say what they are. The `<section>` carries
 * `aria-label="Key metrics"` instead, so the landmark still has a name for
 * screen readers with nothing rendered for sighted users to skip past.
 */
import { Link } from "react-router-dom";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDelta } from "@/creative-report-v2/lib/format";
import { Sparkline } from "@/creative-report-v2/components/Sparkline";
import { PROVENANCE_META } from "@/insights-dashboard/components/Provenance";
import { useKpis, type KpiTile, type ProvenanceTier } from "@/insights-dashboard/lib/selectors";

/** Only tiles with a destination that genuinely returns what the number
 * claims get a link. Keyed on `KpiTile["key"]`. */
const KPI_TILE_HREF: Readonly<Record<string, string>> = {
  "live-ads": "/insights/discover",
  advertisers: "/insights/competitors",
};

const PROVENANCE_ORDER: readonly ProvenanceTier[] = ["observed", "estimated", "derived"];

/**
 * "Live ads, Advertisers — observed (Meta Ad Library) · New signals this
 * week, … — derived (Computed by FabAds)". Groups the row's own tiles by
 * their real `provenance`, so this can never name a source the tiles
 * themselves don't carry.
 */
function buildSourceFooter(tiles: readonly KpiTile[]): string {
  const groups = PROVENANCE_ORDER.map((tier) => ({
    tier,
    labels: tiles.filter((t) => t.provenance === tier).map((t) => t.label),
  })).filter((g) => g.labels.length > 0);

  if (groups.length === 0) return "";

  return groups
    .map(
      (g) =>
        `${g.labels.join(", ")} — ${PROVENANCE_META[g.tier].label.toLowerCase()} (${PROVENANCE_META[g.tier].source})`,
    )
    .join(" · ");
}

/**
 * Direction-only delta chip. Positive and negative are both just directions,
 * not good/bad — so this NEVER reaches for `text-destructive` on a negative
 * value. The arrow icon (not colour) carries the direction.
 */
function DeltaChip({ pct }: { pct: number }) {
  const delta = fmtDelta(pct);
  const Icon = delta.tone === "up" ? TrendingUp : delta.tone === "down" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5",
        "font-mono text-[10px] font-medium tabular-nums text-muted-foreground",
      )}
    >
      <Icon className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden="true" />
      {delta.label}
    </span>
  );
}

function KpiTileBody({ tile }: { tile: KpiTile }) {
  return (
    <>
      <span className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {tile.label}
      </span>

      {/* The dominant pair — value + delta read as one gestalt, the only
          thing this tile needs to communicate at a glance. */}
      {tile.value !== null ? (
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="text-2xl font-semibold leading-none text-foreground tabular-nums">
            {tile.value}
          </span>
          {typeof tile.deltaPct === "number" && <DeltaChip pct={tile.deltaPct} />}
        </div>
      ) : (
        <span className="text-sm font-medium italic leading-snug text-muted-foreground">
          {tile.naReason ?? "No data"}
        </span>
      )}

      {/* Demoted: caption + sparkline share one low-contrast footer line
          instead of two separate rows fighting for attention. */}
      <div className="flex items-end justify-between gap-2">
        <span
          title={tile.caption}
          className="line-clamp-1 text-[11px] leading-snug text-muted-foreground/75"
        >
          {tile.caption}
        </span>
        {/* Tone is deliberately `neutral`, never up/down. `Sparkline`'s "down"
            tone strokes in `--destructive`, which would paint a falling median
            creative lifespan red — exactly the good/bad judgement `DeltaChip`
            above refuses to make about the same number. One rule per fact. */}
        {tile.series && tile.series.length > 0 && (
          <Sparkline
            data={tile.series}
            tone="neutral"
            width={40}
            height={16}
            className="shrink-0 opacity-70"
          />
        )}
      </div>
    </>
  );
}

/**
 * Skeleton for one tile, shaped like `KpiTileBody` — label / value+delta /
 * caption+sparkline footer — so first paint occupies the exact footprint the
 * resolved tile will, and swapping in the real content never jumps the
 * layout. Loading and "nothing found yet" render identically otherwise
 * (both hand this row empty collections), so this is what tells them apart.
 */
function KpiTileSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-md lg:px-4 lg:first:pl-0 lg:last:pr-0">
      <Skeleton className="h-2.5 w-16" />
      <Skeleton className="h-7 w-14" />
      <div className="flex items-end justify-between gap-2">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  );
}

function KpiTileView({ tile }: { tile: KpiTile }) {
  const href = KPI_TILE_HREF[tile.key];
  const sharedClassName = "flex min-w-0 flex-col gap-1.5 rounded-md lg:px-4 lg:first:pl-0 lg:last:pr-0";

  if (href) {
    return (
      <Link
        to={href}
        title={`Open ${tile.label.toLowerCase()} in ${tile.key === "live-ads" ? "Discover" : "Competitors"}`}
        className={cn(
          sharedClassName,
          "transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <KpiTileBody tile={tile} />
      </Link>
    );
  }

  return (
    <div className={sharedClassName}>
      <KpiTileBody tile={tile} />
    </div>
  );
}

export function KpiRow({ className }: { className?: string }): JSX.Element {
  const kpis = useKpis();

  // CHECK isLoading BEFORE `allUnavailable`. Every primary tile is `null` in
  // BOTH `loading` and a genuinely empty first scan — the difference is
  // "haven't looked yet" vs "looked and found nothing" — so a skeleton is the
  // only render that doesn't quietly lie about which one this is.
  //
  // No visible "Key metrics" heading — design critique: it was filler sitting
  // above the block the page was deliberately reordered to lead with, and the
  // tiles already say what they are. `aria-label` on the `<section>` keeps the
  // landmark named for screen readers without occupying first-screen space.
  if (kpis.isLoading) {
    return (
      <section
        aria-label="Key metrics"
        className={cn("rounded-lg border border-border bg-card p-4", className)}
      >
        <div className="mb-3 flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Loading…</span>
        </div>
        <div
          className={cn(
            "grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3",
            "lg:grid-cols-5 lg:gap-y-0 lg:divide-x lg:divide-border/60",
          )}
        >
          {kpis.primary.map((tile) => (
            <KpiTileSkeleton key={tile.key} />
          ))}
        </div>
      </section>
    );
  }

  const sourceFooter = buildSourceFooter(kpis.primary);

  return (
    <section
      aria-label="Key metrics"
      className={cn("rounded-lg border border-border bg-card p-4", className)}
    >
      {kpis.allUnavailable && (
        <div className="mb-3 flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">
            First scan in progress — every figure below explains why, not just that it's missing
          </span>
        </div>
      )}

      <div
        className={cn(
          "grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3",
          "lg:grid-cols-5 lg:gap-y-0 lg:divide-x lg:divide-border/60",
        )}
      >
        {kpis.primary.map((tile) => (
          <KpiTileView key={tile.key} tile={tile} />
        ))}
      </div>

      {sourceFooter && (
        <p className="mt-3 border-t border-border/60 pt-2 text-[11px] leading-relaxed text-muted-foreground">
          Source: {sourceFooter}
        </p>
      )}
    </section>
  );
}
