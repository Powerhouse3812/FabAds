/**
 * KpiRow — the flat KPI strip at the top of the Industry Insights dashboard.
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
 * ── SCANNABLE PASS (design critique fix) ───────────────────────────────────
 * Every tile used to carry six competing chunks — label, value, delta,
 * caption, source chip, sparkline — times five tiles. This band is now the
 * flat FabAds-dashboard-style strip: mono-caps LABEL · big VALUE · signed
 * DELTA, hairline dividers between tiles, nothing else on the surface.
 *
 *  - The per-tile caption (source + freshness, e.g. "Meta Ad Library ·
 *    scanned 6h ago") moved to a native `title` tooltip on the tile — still
 *    reachable, not printed.
 *  - The per-tile sparkline is gone. Decoration at this size; the delta
 *    already carries direction.
 *  - ONE exception: the Brands-followed tile prints a second short line under
 *    its value — the inactive count out of `subNote` (see `inactiveSubLine`).
 *    That count used to live tooltip-only; see `tileTitle` for why it moved
 *    onto the surface. No other tile grows a second line.
 *  - The row keeps exactly ONE source line for the whole strip, built from
 *    `PROVENANCE_META` grouped by tier so it can't drift from what the
 *    `Provenance` chip itself would say.
 *
 * ── DOORWAYS ───────────────────────────────────────────────────────────────
 * Only tiles with a genuine destination are links — `total-competitor-ads` →
 * Competitors (the same set the competitors page counts ads for), and
 * `total-saved-ads` → Saved (the boards page those saves live on). The other
 * three (industries followed, brands followed, competitors followed) have no
 * page that shows exactly what the tile claims, so they stay plain: a link
 * that doesn't return what the number promised is worse than no link.
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
import { PROVENANCE_META } from "@/insights-dashboard/components/Provenance";
import { useKpis, type KpiTile, type ProvenanceTier } from "@/insights-dashboard/lib/selectors";

/** Only tiles with a destination that genuinely returns what the number
 * claims get a link. Keyed on `KpiTile["key"]`. */
const KPI_TILE_HREF: Readonly<Record<string, string>> = {
  "total-competitor-ads": "/insights/competitors",
  "total-saved-ads": "/insights/saved",
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
        "font-mono text-[10px] font-medium tabular-nums text-foreground",
      )}
    >
      <Icon className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden="true" />
      {delta.label}
    </span>
  );
}

/**
 * Tile tooltip: caption (source + freshness) only.
 *
 * `subNote` used to be folded in here too, on the theory that the Brands-
 * followed inactive count ("12 followed · 2 inactive") was already visible
 * elsewhere — as this tile's own value, and as the change feed's "2 of 12
 * inactive brands" stat — so a tooltip-only mention wouldn't lose the signal.
 * `DailyBrief` (the component that rendered that change-feed stat) was
 * unmounted from `ChangeFeed` in a later pass and is now mounted nowhere, so
 * that second carrier stopped existing and the count became hover-only. It
 * now prints on the tile's own surface instead — see `inactiveSubLine` and
 * its use in `KpiTileBody` — so the tooltip goes back to just the caption.
 */
function tileTitle(tile: KpiTile): string | undefined {
  return tile.caption || undefined;
}

/**
 * Pulls the "N inactive" clause out of `subNote` verbatim — never recomputes
 * or reformats the count, just returns the fragment of the string that
 * already carries it. `subNote` on this row is only ever set on the
 * Brands-followed tile (`"12 followed · 2 inactive"`), so this only ever
 * produces a line for that one tile; the other four have no `subNote` and
 * fall through to `undefined`.
 */
function inactiveSubLine(tile: KpiTile): string | undefined {
  if (!tile.subNote) return undefined;
  return tile.subNote.split(" · ").find((part) => part.includes("inactive"));
}

function KpiTileBody({ tile }: { tile: KpiTile }) {
  const inactiveLine = tile.value !== null ? inactiveSubLine(tile) : undefined;

  return (
    <>
      <span className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70">
        {tile.label}
      </span>

      {/* label → value+delta (+ Brands-followed's inactive line) is the whole tile now. */}
      {tile.value !== null ? (
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span className="text-2xl font-semibold leading-none text-foreground tabular-nums">
              {tile.value}
            </span>
            {typeof tile.deltaPct === "number" && <DeltaChip pct={tile.deltaPct} />}
          </div>
          {inactiveLine && (
            <span className="truncate text-[10px] leading-none text-foreground/70">{inactiveLine}</span>
          )}
        </div>
      ) : (
        <span className="text-xs font-medium italic leading-snug text-foreground/70">
          {tile.naReason ?? "No data"}
        </span>
      )}
    </>
  );
}

/**
 * Skeleton for one tile, shaped like `KpiTileBody` — label / value+delta,
 * plus a third skeleton line for `brands-followed` — so first paint occupies
 * the exact footprint the resolved tile will, and swapping in the real
 * content never jumps the layout. Loading and "nothing found yet" render
 * identically otherwise (both hand this row empty collections), so this is
 * what tells them apart.
 */
function KpiTileSkeleton({ tileKey }: { tileKey: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 lg:px-4 lg:first:pl-0 lg:last:pr-0">
      <Skeleton className="h-2.5 w-16" />
      <div className="flex flex-col gap-0.5">
        <Skeleton className="h-7 w-14" />
        {tileKey === "brands-followed" && <Skeleton className="h-2.5 w-14" />}
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
        title={tileTitle(tile) ?? `Open ${tile.label.toLowerCase()} in ${tile.key === "total-saved-ads" ? "Saved" : "Competitors"}`}
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
    <div className={sharedClassName} title={tileTitle(tile)}>
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
      <section aria-label="Key metrics" className={cn("py-1", className)}>
        <div
          className={cn(
            "grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3",
            "lg:grid-cols-5 lg:gap-y-0 lg:divide-x lg:divide-border/60",
          )}
        >
          {kpis.primary.map((tile) => (
            <KpiTileSkeleton key={tile.key} tileKey={tile.key} />
          ))}
        </div>
      </section>
    );
  }

  const sourceFooter = buildSourceFooter(kpis.primary);

  return (
    <section aria-label="Key metrics" className={cn("py-1", className)}>
      {kpis.allUnavailable && (
        <p className="mb-1.5 text-[11px] text-foreground/70">
          First scan in progress — figures below explain why, not just that they're missing
        </p>
      )}

      <div
        className={cn(
          "grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3",
          "lg:grid-cols-5 lg:gap-y-0 lg:divide-x lg:divide-border/60",
        )}
      >
        {kpis.primary.map((tile) => (
          <KpiTileView key={tile.key} tile={tile} />
        ))}
      </div>

      {sourceFooter && (
        <p className="mt-1.5 text-[10px] leading-snug text-foreground/70">
          Source: {sourceFooter}
        </p>
      )}
    </section>
  );
}
