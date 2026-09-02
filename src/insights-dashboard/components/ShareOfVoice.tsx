/**
 * ShareOfVoice — "Top industries · brand share".
 *
 * Maalik's framing, in his words: "top industry/category — brands share in
 * them … name se samajh aana chahiye, ki top industry and usme brands ki
 * contribution kiski kaisi hai." He is right that we already had this data —
 * the previous version of this file just named it in vocabulary we invented
 * ("share of live creative", "share of voice") and centred it on "your"
 * number instead of the industry. This is the reframe: the block answers
 * "which industry is biggest, and who holds it" — not "what's my share".
 *
 * Reads `useIndustryBrandShare()`, NOT `useShareOfVoice()`. The old hook
 * still exists and still works (other surfaces may use it), but it is the
 * wrong shape for this block now — do not reintroduce it here.
 *
 * THE ONE THING NOT TO GET WRONG: every number is LIVE ADS, never spend. The
 * Meta Ad Library shows creatives, not dollars — treating creative count as a
 * spend proxy is the single most-criticised lie in this product category.
 * `metricLabel` and `basisNote` come straight from the selector and are
 * rendered verbatim; nothing in this file introduces the words "spend",
 * "budget", or "share of voice".
 *
 * COMPACT SHAPE: one row per industry, two lines — industry name paired with
 * the top brand + its share (right-aligned), then a single stacked bar of
 * brand shares underneath. Live-ad count and advertiser count move into the
 * hover breakdown; the header footer line still states the basis in words.
 * The full brand breakdown (every named brand + Others, each with its share)
 * lives in a
 * `HoverCard` on the bar — still keyboard-reachable (`Tab` focuses the bar,
 * which opens the card same as hover; every named brand inside is a real
 * `<Link>`). Nothing is deleted, it moves one level down.
 *
 * Chart discipline: the stacked bar uses exactly one hue (`--primary`) at
 * stepped opacities — solid for "you" (when present), stepping down across
 * the named brands by rank, quietest for "Others" (an unnamed aggregate, not
 * a real advertiser). No categorical rainbow, no new tokens, no colour-only
 * encoding (every segment's identity is also in the hover breakdown as text).
 *
 * DOORWAYS: the industry name opens Discover scoped to `?industry=`; every
 * named brand's `discoverHref` already opens it scoped to `?domain=` — the
 * selector computes this per brand, so this file never builds a domain URL
 * itself. `discoverHref` is `null` on the Others bucket (no single
 * `?domain=` value for "everyone else") AND on your own row (a link to your
 * own domain filter isn't a doorway anywhere new) — both render as plain
 * text, never a dead or lying link.
 */
import { Link } from "react-router-dom";
import { PieChart } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import {
  useIndustryBrandShare,
  type IndustryShareBrand,
  type IndustryShareRow,
} from "@/insights-dashboard/lib/selectors";

/** `/insights/discover?industry=<industry>`. */
function industryHref(industry: string): string {
  return `/insights/discover?industry=${encodeURIComponent(industry)}`;
}

/** Opacity steps for named brands, by rank (1-based, excluding "you"/Others). Floors at the last step. */
const BRAND_ALPHA_STEPS = [0.6, 0.42, 0.28, 0.2] as const;
const OTHERS_ALPHA = 0.12;

const YOU_COLOR = "hsl(var(--primary))";
const OTHERS_COLOR = `hsl(var(--primary) / ${OTHERS_ALPHA})`;

/** One dominant hue (`--primary`) at stepped opacity — never a new colour. */
function brandColor(brand: IndustryShareBrand, rank: number): string {
  if (brand.isYou) return YOU_COLOR;
  if (brand.isOthers) return OTHERS_COLOR;
  const idx = Math.max(0, rank - 1);
  const alpha = BRAND_ALPHA_STEPS[Math.min(idx, BRAND_ALPHA_STEPS.length - 1)];
  return `hsl(var(--primary) / ${alpha})`;
}

/**
 * Every brand's full share breakdown — this used to live permanently on the
 * row; now it opens from the bar via hover or keyboard focus. Named brands
 * stay real `<Link>`s so the click-through survives the demotion.
 */
function IndustryBreakdownCard({ row }: { row: IndustryShareRow }) {
  let namedRank = 0;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">
        {row.liveAds.toLocaleString()} live ads across {row.advertisers.toLocaleString()} advertisers
      </p>
      <ul className="space-y-1">
        {row.brands.map((brand) => {
          if (!brand.isYou && !brand.isOthers) namedRank += 1;
          const color = brandColor(brand, namedRank);
          const label = brand.isYou ? `${brand.name} (you)` : brand.name;
          return (
            <li key={brand.key} className="flex items-center justify-between gap-3 text-xs">
              {brand.discoverHref ? (
                <Link
                  to={brand.discoverHref}
                  className="inline-flex min-w-0 items-center gap-1.5 text-foreground/70 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "inline-flex min-w-0 items-center gap-1.5",
                    brand.isOthers ? "text-foreground/70" : "font-medium text-foreground",
                  )}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </span>
              )}
              <span className="shrink-0 tabular-nums text-foreground/70">{brand.sharePct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IndustryRowView({ row }: { row: IndustryShareRow }) {
  const topBrand = row.topBrand;
  let rank = 0;

  return (
    <div className="border-t border-border/60 py-[3px] first:border-t-0 first:pt-0">
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <Link
          to={industryHref(row.industry)}
          title={row.industry}
          className="min-w-0 truncate text-[11px] font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        >
          {row.industry}
        </Link>
        <span className="flex min-w-0 shrink-0 items-center gap-1 text-[11px]">
          {topBrand ? (
            <>
              {topBrand.discoverHref ? (
                <Link
                  to={topBrand.discoverHref}
                  title={topBrand.name}
                  className="max-w-[92px] truncate text-foreground/70 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                >
                  {topBrand.name}
                </Link>
              ) : (
                <span className="max-w-[92px] truncate text-foreground/70" title={topBrand.name}>
                  {topBrand.isYou ? `${topBrand.name} (you)` : topBrand.name}
                </span>
              )}
              <span className="shrink-0 tabular-nums font-semibold text-foreground">
                {topBrand.sharePct}%
              </span>
            </>
          ) : (
            <span className="italic text-foreground/70">Not yet indexed</span>
          )}
        </span>
      </div>

      <HoverCard openDelay={150}>
        <HoverCardTrigger asChild>
          <div
            tabIndex={0}
            role="img"
            aria-label={`${row.industry}: ${row.brands
              .map((b) => `${b.isYou ? `${b.name} (you)` : b.name} at ${b.sharePct}%`)
              .join(", ")}.`}
            className="flex h-1.5 w-full cursor-help gap-px overflow-hidden rounded-full bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {row.brands
              .filter((brand) => brand.sharePct > 0)
              .map((brand) => {
                if (!brand.isYou && !brand.isOthers) rank += 1;
                return (
                  <div
                    key={brand.key}
                    style={{ width: `${brand.sharePct}%`, backgroundColor: brandColor(brand, rank) }}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                  />
                );
              })}
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="w-72">
          <IndustryBreakdownCard row={row} />
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

export function ShareOfVoice({ className }: { className?: string }): JSX.Element {
  const { industries, isEmpty, isLoading, metricLabel, basisNote, industryCount } =
    useIndustryBrandShare();

  // CHECK isLoading BEFORE `isEmpty`. `industries` is `[]` in both `loading`
  // and a genuinely empty result — bar-row skeletons keep first paint from
  // claiming "no industries followed" while the scan is still running.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2 flex items-center gap-2">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            Top industries · brand share
          </h2>
        </header>
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-t border-border/60 py-1 first:border-t-0 first:pt-0">
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-0.5 flex items-center justify-between gap-2">
        <h2 className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
          Top industries · brand share
        </h2>
        {!isEmpty && (
          <span className="shrink-0 text-[10px] text-foreground/70">
            {industryCount} tracked · {metricLabel.toLowerCase()}
          </span>
        )}
      </header>

      {!isEmpty && (
        <p className="mb-1.5 text-[10px] leading-snug text-foreground/70">{basisNote}</p>
      )}

      {isEmpty ? (
        <InsightsV2EmptyState
          icon={PieChart}
          title="No industries followed yet"
          description="Follow an industry to see who holds it — the top brands running ads there and how big a slice each one has."
        />
      ) : (
        <div>
          {industries.map((row) => (
            <IndustryRowView key={row.industry} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}
