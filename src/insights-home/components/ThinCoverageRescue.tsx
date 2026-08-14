import { useMemo, useState } from "react";
import { Filter, Plus, Store, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { INSIGHT_INDUSTRIES } from "@/lib/insights-dummy-data";
import { useThinCoverage, statsForIndustry } from "@/insights-home/lib/homeSelectors";

/**
 * ThinCoverageRescue — Maalik's #2 pick for the Industry Insights Home page
 * (src/pages/insights/InsightsOverview.tsx). This is the zero/thin-data
 * experience: when the industries a user follows have little or no indexed
 * inventory, this block is meant to REPLACE the ad gallery + charts on Home
 * (that swap is a parent/wiring decision — this component only decides
 * whether it has anything honest to say, and renders null when it doesn't,
 * so it can be mounted unconditionally if a wiring pass chooses to).
 *
 * Card chrome matches the other Home page cards (Card > CardContent
 * space-y-3 p-4, text-sm font-semibold h2, border-border/60 rounded-md
 * rows) — see ModuleRouterCard.tsx / DomainsTeaserCard.tsx / InsightsOverview.tsx.
 * No design tokens invented: every className below is an existing
 * Tailwind/shadcn token already used elsewhere in src/pages/insights/.
 *
 * Structure:
 *   1. An honest statement naming the coverage gap on OUR side — never
 *      "this market has no ads", always "we haven't indexed it yet".
 *   2. "Start here" — four adjacent industries (deterministic from
 *      INSIGHT_INDUSTRIES + DUMMY_ADS, see ADJACENCY_MAP below) with real
 *      ad/advertiser counts and a one-click Follow that writes through
 *      useInsightPreferences().upsert so it takes effect immediately —
 *      no separate "save" step, no modal.
 *   3. "What unlocks once an industry has data" — three quiet, muted
 *      preview rows naming what appears later (store economics, funnel
 *      intel, top movers). These never claim to have live numbers; they
 *      are explicitly a preview of shape, not a promise of a date.
 *
 * State coverage:
 *   - loading   → skeleton (preferences still resolving)
 *   - zero      → user follows nothing yet (0 industries)
 *   - partial   → user follows some industries; a subset (or all) of them
 *                 have thin/no indexed inventory
 *   - healthy   → every followed industry clears the coverage bar → null
 *     (nothing dishonest to say, so this component gets out of the way)
 *
 * The threshold/coverage computation itself lives in useThinCoverage()
 * (src/insights-home/lib/homeSelectors.ts) — InsightsOverview.tsx reads the
 * SAME hook to decide whether to mount this component in place of the
 * gallery/ActNow/charts row at all, so the two surfaces can never disagree
 * about what counts as "thin". This file only owns the suggestion list
 * (ADJACENCY_MAP) and the copy.
 */

/* ------------------------------------------------------------------ */
/*  Adjacency — hand-curated, not random. Each of the 15 INSIGHT_       */
/*  INDUSTRIES maps to 4 sensible neighbours (shared audience, shared    */
/*  intent, shared category tree, or shared advertisers). The array      */
/*  POSITION of a neighbour decides which of the 4 fixed reason strings   */
/*  it's shown with — position 0 is always the closest match, position   */
/*  3 is always "shared advertisers", etc.                               */
/* ------------------------------------------------------------------ */
const ADJACENCY_MAP: Record<string, string[]> = {
  "E-commerce": ["Fashion", "Beauty", "Food & Beverage", "Technology"],
  "SaaS": ["Technology", "Finance", "Education", "Real Estate"],
  "Gaming": ["Entertainment", "Technology", "Sports", "Education"],
  "Health & Wellness": ["Beauty", "Sports", "Food & Beverage", "Education"],
  "Finance": ["SaaS", "Real Estate", "Automotive", "Technology"],
  "Fashion": ["E-commerce", "Beauty", "Sports", "Entertainment"],
  "Food & Beverage": ["E-commerce", "Health & Wellness", "Travel", "Entertainment"],
  "Education": ["SaaS", "Technology", "Gaming", "Finance"],
  "Travel": ["Real Estate", "Food & Beverage", "Entertainment", "Automotive"],
  "Real Estate": ["Finance", "Travel", "Automotive", "Technology"],
  "Automotive": ["Finance", "Technology", "Travel", "Real Estate"],
  "Entertainment": ["Gaming", "Fashion", "Sports", "Technology"],
  "Beauty": ["Fashion", "Health & Wellness", "E-commerce", "Entertainment"],
  "Sports": ["Health & Wellness", "Fashion", "Entertainment", "Gaming"],
  "Technology": ["SaaS", "Gaming", "Automotive", "Finance"],
};

const ADJACENCY_REASONS = [
  "closest match · same audience",
  "adjacent intent",
  "same category tree",
  "shared advertisers",
] as const;

function formatOxfordList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

interface Suggestion {
  industry: string;
  reason: string;
  adCount: number;
  advertiserCount: number;
}

export function ThinCoverageRescue(): JSX.Element | null {
  const { preferences, upsert } = useInsightPreferences();
  const { followed, thinFollowed, isThin: isThinCoverage, loading: isLoading } = useThinCoverage();

  const suggestions: Suggestion[] = useMemo(() => {
    const followedSet = new Set(followed);
    const seen = new Set<string>();
    const picked: Suggestion[] = [];

    // Prefer neighbours of the specific thin industries; if the user
    // follows nothing at all yet, seed from every known industry so the
    // "start here" list still means something.
    const sourceIndustries =
      thinFollowed.length > 0
        ? thinFollowed.map((f) => f.industry)
        : followed.length > 0
          ? followed
          : [...INSIGHT_INDUSTRIES];

    for (const source of sourceIndustries) {
      const neighbors = ADJACENCY_MAP[source] ?? [];
      neighbors.forEach((neighbor, idx) => {
        if (picked.length >= 4 || followedSet.has(neighbor) || seen.has(neighbor)) return;
        seen.add(neighbor);
        picked.push({ industry: neighbor, reason: ADJACENCY_REASONS[idx], ...statsForIndustry(neighbor) });
      });
      if (picked.length >= 4) break;
    }

    // Backfill with the highest-coverage remaining industries if adjacency
    // ran dry (e.g. the user already follows most of a neighbour cluster).
    if (picked.length < 4) {
      const byCoverage = [...INSIGHT_INDUSTRIES]
        .filter((ind) => !followedSet.has(ind) && !seen.has(ind))
        .map((ind) => ({ industry: ind, ...statsForIndustry(ind) }))
        .sort((a, b) => b.adCount - a.adCount);
      for (const cand of byCoverage) {
        if (picked.length >= 4) break;
        picked.push({ ...cand, reason: ADJACENCY_REASONS[picked.length] ?? "shared advertisers" });
      }
    }

    return picked.slice(0, 4);
  }, [followed, thinFollowed]);

  const gapStatement = useMemo(() => buildGapStatement(followed, thinFollowed), [followed, thinFollowed]);

  const [pendingIndustry, setPendingIndustry] = useState<string | null>(null);

  if (isLoading) return <ThinCoverageRescueSkeleton />;
  if (!isThinCoverage) return null;

  function handleFollow(industry: string) {
    const current: string[] = preferences?.industries ?? [];
    if (current.includes(industry)) return;
    setPendingIndustry(industry);
    upsert.mutate(
      {
        industries: [...current, industry],
        interests: preferences?.interests ?? [],
        followed_brands: preferences?.followed_brands ?? [],
        followed_tags: preferences?.followed_tags ?? [],
        onboarded: preferences?.onboarded ?? true,
      },
      { onSettled: () => setPendingIndustry(null) },
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-4">
        {/* 1. Honest gap statement */}
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">Thin coverage right now</h2>
          <p className="text-sm text-muted-foreground">{gapStatement}</p>
        </div>

        {/* 2. Start here — adjacent industries with real data.
            Guarded: a user who already follows EVERY industry has no
            neighbour left to suggest, and adjacency + the coverage backfill
            both come back empty. Without this guard that case rendered the
            section heading above an empty grid — a label promising four
            cards that never arrive. */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Start here — industries with live data today
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.industry}
                  suggestion={s}
                  pending={pendingIndustry === s.industry && upsert.isPending}
                  onFollow={() => handleFollow(s.industry)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 3. What unlocks once an industry has data */}
        <div className="space-y-2">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            What unlocks once an industry has data
          </h3>
          <ul className="flex flex-col gap-1.5">
            <PreviewRow
              icon={Store}
              title="Store economics"
              description="Estimated monthly sales, visits, and product counts per domain."
            />
            <PreviewRow
              icon={Filter}
              title="Funnel intel"
              description="Where the ad funnel bottlenecks — landing page and checkout signals."
            />
            <PreviewRow
              icon={TrendingUp}
              title="Top movers"
              description="Which advertisers are spiking or pulling back, week over week."
            />
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function buildGapStatement(
  followed: string[],
  thin: { industry: string; adCount: number }[],
): string {
  if (followed.length === 0) {
    return "You're not following any industries yet, so nothing is indexed against your account. That's a setup gap on our side, not an empty market — follow one below to get started.";
  }

  if (thin.length === 0) {
    return "Your followed industries have thin coverage right now.";
  }

  const names = formatOxfordList(thin.map((t) => t.industry));
  const totalAds = thin.reduce((sum, t) => sum + t.adCount, 0);

  if (followed.length === thin.length && followed.length === 1) {
    return `You're following 1 industry and we have ${totalAds} ad${totalAds === 1 ? "" : "s"} indexed for it so far. That's a coverage gap on our side, not an empty market.`;
  }

  if (followed.length === thin.length) {
    return `You're following ${followed.length} industries — ${names} — and we have ${totalAds} ad${totalAds === 1 ? "" : "s"} indexed across all of them so far. That's a coverage gap on our side, not an empty market.`;
  }

  return `${names} ${thin.length === 1 ? "has" : "have"} little to no indexed inventory yet (${totalAds} ad${totalAds === 1 ? "" : "s"} total) out of the ${followed.length} industries you follow. That's a coverage gap on our side, not an empty market.`;
}

function SuggestionCard({
  suggestion,
  pending,
  onFollow,
}: {
  suggestion: Suggestion;
  pending: boolean;
  onFollow: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-foreground" title={suggestion.industry}>
          {suggestion.industry}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 shrink-0 text-xs"
          disabled={pending}
          onClick={onFollow}
          aria-label={`Follow ${suggestion.industry}`}
        >
          {pending ? (
            "Following…"
          ) : (
            <>
              <Plus className="mr-1 h-3 w-3" aria-hidden />
              Follow
            </>
          )}
        </Button>
      </div>
      <p className="truncate text-xs text-muted-foreground" title={suggestion.reason}>
        {suggestion.reason}
      </p>
      <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
        <span>{suggestion.adCount} ads</span>
        <span>{suggestion.advertiserCount} advertisers</span>
      </div>
    </div>
  );
}

function PreviewRow({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-dashed border-border/60 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground/70">{description}</p>
      </div>
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
        Preview
      </span>
    </li>
  );
}

function ThinCoverageRescueSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-5 p-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3.5 w-full max-w-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-56" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-7 w-16 rounded" />
                </div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-64" />
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-dashed border-border/60 px-3 py-2.5">
                <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ThinCoverageRescue;
