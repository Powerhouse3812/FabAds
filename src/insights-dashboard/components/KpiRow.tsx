/**
 * KpiRow — the flat KPI strip at the top of the Industry Insights dashboard.
 *
 * Renders the 5 primary KPI tiles (`useKpis().primary`, `KPI_PRIMARY_KEYS`)
 * in a fixed order: total saved ads · industries followed · brands followed ·
 * competitors followed · total competitor ads. All five are the user's OWN
 * follow-scoped counts — a bare count is vanity; this row exists to make
 * every count accountable — where it came from, what it means, and (when
 * it's a real zero) what closes the gap. Don't reduce it to numbers alone.
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
 *  - The per-tile sparkline is gone. Decoration at this size; the delta
 *    already carries direction.
 *  - The row keeps exactly ONE source line for the whole strip, built from
 *    `PROVENANCE_META` grouped by tier so it can't drift from what the
 *    `Provenance` chip itself would say. Per-tile provenance is never
 *    restated anywhere else on the tile.
 *
 * ── TOOLTIPS (explain-everything pass) ──────────────────────────────────────
 * Each label carries an `InfoTip` (`kpi.*` keys in `tooltipCopy.ts`) — what
 * the tile is, what it gives you, what to do with it. This REPLACES the
 * native `title=""` this file used to hang off the whole tile for the
 * source/freshness caption — that was a weaker tooltip explaining a
 * narrower thing. Never stack both on one tile; `InfoTip` is meaning +
 * action, `Provenance`'s source chip (and this row's own source line) is
 * origin + freshness, and the two are never allowed to say the same thing.
 *
 * ── NEVER A NAKED ZERO (state consolidation pass) ───────────────────────────
 * All 5 tiles are follow-scoped, so `firstTime`/`empty` render them as
 * honest small numbers or honest zeros — never hidden, never collapsed. A
 * bare "0" under a label is still a fact, but on its own it's not the
 * provocation Maalik asked for, so `secondLine()` prints ONE more line
 * under a zero-valued tile:
 *  - Brands-followed keeps its own exception first — the inactive count out
 *    of `subNote` (see `inactiveSubLine`), unrelated to zero-handling and
 *    present whenever the user actually has followers.
 *  - `total-competitor-ads` at zero pairs with the one real market number
 *    this row has on hand — the market-wide `live-ads` tile computed by
 *    `useKpis()` for exactly this purpose — e.g. "20,515 live across the
 *    market · you track 0". Grounded in a number the fixture actually
 *    produced, never invented.
 *  - The other zero tiles (no honest market counterpart exists for "saved
 *    ads" or a personal follow list) fall back to the tile's own `caption`,
 *    which the fixture already writes as the action that closes the gap
 *    ("Follow a brand and we'll track what it ships") rather than a
 *    provenance note.
 * Every extra line is `truncate` (single line, same treatment as the
 * existing inactive line) so a long caption can never push the strip past
 * the height its tallest cell already reaches elsewhere.
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
import { Info, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDelta } from "@/creative-report-v2/lib/format";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import { PROVENANCE_META } from "@/insights-dashboard/components/Provenance";
import { useKpis, type KpiTile, type ProvenanceTier } from "@/insights-dashboard/lib/selectors";

/** Only tiles with a destination that genuinely returns what the number
 * claims get a link. Keyed on `KpiTile["key"]`. */
const KPI_TILE_HREF: Readonly<Record<string, string>> = {
  "total-competitor-ads": "/insights/competitors",
  "total-saved-ads": "/insights/saved",
};

/**
 * `tooltipCopy.ts` keys, one per primary tile. Kept as an explicit map
 * rather than a string template because the tile's own `key` for the
 * competitors-followed tile is the bare `"competitors"` (see
 * `KPI_PRIMARY_KEYS` in `lib/selectors.ts`), not `"competitors-followed"`.
 */
const KPI_TOOLTIP_KEY: Readonly<Record<string, string>> = {
  "total-saved-ads": "kpi.total-saved-ads",
  "industries-followed": "kpi.industries-followed",
  "brands-followed": "kpi.brands-followed",
  competitors: "kpi.competitors-followed",
  "total-competitor-ads": "kpi.total-competitor-ads",
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

/**
 * The one extra line a tile is allowed under its value. Priority:
 *
 *  1. The Brands-followed inactive count, whenever it's there — unrelated to
 *     zero-handling, present whenever the user actually has followers.
 *  2. Nothing, once the tile has a real nonzero value — the number speaks
 *     for itself, and the label's own `InfoTip` already carries the meaning.
 *  3. For a genuine zero, the provocation Maalik asked for: pair
 *     `total-competitor-ads` with the one real market number this row has on
 *     hand (`marketLiveAdsValue`, the market-wide `live-ads` tile `useKpis()`
 *     already computes for `firstTime`/`empty`) — grounded in a number the
 *     fixture actually produced, never invented.
 *  4. Every other zero tile has no honest market counterpart (there is no
 *     market number for "ads you've saved" or "brands you personally
 *     follow"), so it falls back to the tile's own `caption` — which the
 *     fixture already writes as the action that closes the gap for that
 *     state ("Follow a brand and we'll track what it ships"), not a
 *     provenance note.
 */
function secondLine(tile: KpiTile, marketLiveAdsValue: string | null): string | undefined {
  const inactive = inactiveSubLine(tile);
  if (inactive) return inactive;

  if (tile.value !== "0") return undefined;

  if (tile.key === "total-competitor-ads" && marketLiveAdsValue) {
    return `${marketLiveAdsValue} live across the market · you track 0`;
  }

  return tile.caption || undefined;
}

function KpiTileBody({
  tile,
  marketLiveAdsValue,
  /**
   * The two linked tiles (`total-saved-ads`, `total-competitor-ads`) put the
   * whole tile inside an `<a>`. An `InfoTip` glyph is a `<span tabIndex={0}>`,
   * which makes it INTERACTIVE CONTENT inside a link: an invalid content
   * model, a second tab stop nested inside the first, and — the part a user
   * actually feels — a tap on the info icon navigates instead of explaining,
   * because on touch there is no hover and the click bubbles to the link.
   *
   * So on those tiles the glyph is drawn but is not itself the trigger: the
   * LINK is (`InfoTip asChild` in `KpiTileView`), which is what the tooltip
   * brief prescribes for action controls anyway — "the control ITSELF is the
   * trigger, no added glyph". Keeping the glyph visible costs nothing and
   * stops two of the five tiles looking like they lost their explanation.
   */
  decorativeTip,
}: {
  tile: KpiTile;
  marketLiveAdsValue: string | null;
  decorativeTip?: boolean;
}) {
  const line2 = tile.value !== null ? secondLine(tile, marketLiveAdsValue) : undefined;
  const tooltipKey = KPI_TOOLTIP_KEY[tile.key];

  return (
    <>
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70">
          {tile.label}
        </span>
        {tooltipKey &&
          (decorativeTip ? (
            <Info className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : (
            <InfoTip tip={tooltipKey} />
          ))}
      </span>

      {/* label → value+delta (+ inactive/zero-provocation line) is the whole tile now. */}
      {tile.value !== null ? (
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span className="text-2xl font-semibold leading-none text-foreground tabular-nums">
              {tile.value}
            </span>
            {typeof tile.deltaPct === "number" && <DeltaChip pct={tile.deltaPct} />}
          </div>
          {line2 && (
            <span className="truncate text-[10px] leading-none text-foreground/70">{line2}</span>
          )}
        </div>
      ) : (
        <span className="text-xs font-medium italic leading-snug text-foreground/70">
          {/* "No data" is the one phrase this page's copy rule bans outright —
              an absence has to name its cause. Unreachable today (the type
              requires `naReason` whenever `value` is null), kept honest anyway. */}
          {tile.naReason ?? "not scanned yet"}
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

function KpiTileView({
  tile,
  marketLiveAdsValue,
}: {
  tile: KpiTile;
  marketLiveAdsValue: string | null;
}) {
  const href = KPI_TILE_HREF[tile.key];
  const sharedClassName = "flex min-w-0 flex-col gap-1.5 rounded-md lg:px-4 lg:first:pl-0 lg:last:pr-0";

  // No native `title=""` here any more — the label's own `InfoTip` is this
  // tile's one tooltip. A plain descriptive title stays on the link (a
  // navigation hint, not an explanation) since it's a different purpose than
  // InfoTip's meaning + action and doesn't stack a second tooltip.
  if (href) {
    // The LINK is the tooltip trigger — never a glyph nested inside it. See
    // `KpiTileBody`'s `decorativeTip` note for why.
    const tooltipKey = KPI_TOOLTIP_KEY[tile.key];
    const link = (
      <Link
        to={href}
        title={`Open ${tile.label.toLowerCase()} in ${tile.key === "total-saved-ads" ? "Saved" : "Competitors"}`}
        className={cn(
          sharedClassName,
          "transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <KpiTileBody tile={tile} marketLiveAdsValue={marketLiveAdsValue} decorativeTip />
      </Link>
    );
    return tooltipKey ? (
      <InfoTip tip={tooltipKey} asChild>
        {link}
      </InfoTip>
    ) : (
      link
    );
  }

  return (
    <div className={sharedClassName}>
      <KpiTileBody tile={tile} marketLiveAdsValue={marketLiveAdsValue} />
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
  // The one real market number this row has on hand for the zero-provocation
  // line (see `secondLine`) — the market-wide `live-ads` secondary tile
  // `useKpis()` already computes for every state. `null` only when the
  // fixture genuinely doesn't carry that tile; never fabricated here.
  const marketLiveAdsValue = kpis.byKey["live-ads"]?.value ?? null;

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
          <KpiTileView key={tile.key} tile={tile} marketLiveAdsValue={marketLiveAdsValue} />
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
