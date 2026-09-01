/**
 * Industry Insights → Trends: News & Intelligence view (doc §7.6).
 *
 * THIS IS THE CORRECTION-F VIEW. The reference prototype (read-only, never
 * imported from) renders this tab as a card grid/masonry. That is the
 * defect this file fixes: an EDITORIAL LEAD + LIST instead — one prominent
 * lead story up top, then a single vertical list of the remaining items
 * grouped by freshness (Today / This week / Earlier). No grid, no masonry,
 * no column-balancing. Reading order is top-to-bottom by construction: lead
 * first, then freshness groups in that fixed order, each rendered as a
 * plain <ul> (not a flex-wrap/grid track that could reflow item order).
 *
 * Design decisions worth recording:
 *
 *  - Lead selection: the single most recent item (by publishedAt) in the
 *    filtered set becomes the lead; every other item goes into the list
 *    below, grouped by freshness. There is no separate "isLead" flag on
 *    TrendItem — recency is a defensible, data-driven stand-in for
 *    editorial prominence rather than an invented field.
 *
 *  - Format taxonomy: doc §7.6 names a fixed row-format vocabulary
 *    (Article / Platform-Policy / Podcast / Report / Research). The
 *    reference prototype's own mock data never carries a per-item `format`
 *    string for news/podcast/report items (only `type`) — so rather than
 *    inventing an unfounded per-item classifier, `FORMAT_META` maps
 *    directly off TrendItem.type (news→Article, podcast→Podcast,
 *    report→Report). Platform-Policy and Research stay reserved vocabulary
 *    for item types not present in NEWS_ITEMS today; nothing here fabricates
 *    a distinction the data doesn't support.
 *
 *  - Podcast rows show an "Episode" chip (item.readTime, e.g. "38 min
 *    listen" — the only duration-shaped field podcast items actually carry
 *    in this mock set); report rows show a "Report date" chip (the same
 *    publishedAt value as the published/refreshed line, but re-labelled to
 *    read as the report's own date rather than a generic publish stamp,
 *    per doc §7.6). News rows fall back to a plain "Read time" chip when
 *    readTime is present. All three are the same `extraContext()` slot —
 *    doc-mandated per-format lift is nothing more than a smarter label,
 *    not new data.
 *
 *  - Confidence (doc correction A) is never a percentage: every row shows
 *    CONFIDENCE_META's level label + the evidence count + evidence type,
 *    and the published/refreshed line covers last-refreshed. All three
 *    guardrail-required companions are always present together, never the
 *    level alone.
 *
 *  - State coverage (populated / zero-results / loading) per the project
 *    brief — the prototype only implemented states on Overview, which is
 *    the defect this view does not repeat:
 *      · Loading: a skeleton shaped like the eventual lead+list hierarchy
 *        (mock-first — there's no real fetch, so this is a short, honest
 *        "something is happening" delay, same discipline as
 *        TrendsToolbar's refresh spinner).
 *      · Zero-results distinguishes two causes with two different
 *        recoveries: (1) scope is "Your Industries Only" but the user has
 *        followed zero industries yet — recovery is "Follow industries"
 *        (opens the existing OnboardingModal in edit mode — reuse, not a
 *        new preferences UI) or "Switch to Global"; (2) the active
 *        search/facet filters simply don't match anything in this small a
 *        feed — recovery is "Clear filters", plus "Switch to Global" too
 *        when scope is also narrowed.
 *      · Populated: lead + freshness-grouped list, below.
 *
 *  - Stress test note (10x scale): NEWS_ITEMS is a small, curated editorial
 *    feed by design (doc §7.6 is explicitly NOT a firehose grid), so this
 *    renders the full list plainly rather than virtualising. If this feed
 *    ever grows into the thousands, the list (not the lead) is where
 *    windowing would need to go — the lead is always exactly one item.
 *
 * Token vocabulary matches src/insights-trends/lib/trendsDisplay.ts and
 * src/insights-trends/components/TrendCard.tsx: bg-card / bg-muted /
 * text-muted-foreground / text-foreground / border-border / bg-primary /
 * text-primary. No new colour tokens, no platform-brand tinting. Every
 * state/format/confidence pairs colour (if any) with an icon AND a text
 * label — never colour alone.
 *
 * Accessibility contract for list rows copies TrendCard's audited compact
 * variant exactly: the row is a plain container; the headline is a real
 * <button> inside an <h3> and is the deliberate keyboard-reachable "open"
 * control; a separate aria-hidden stretched-link layer sits underneath in
 * stacking order so a mouse click anywhere on the row still opens it,
 * while the headline and the action bar are each promoted above it via
 * position + z-index so they keep receiving clicks/focus directly. The
 * lead card instead follows BreakingCarousel's Slide precedent — a plain
 * heading plus one explicit "Read full story" button as the sole opener —
 * since the lead is analogous to that carousel's large editorial card, not
 * to a dense list row.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  FileText,
  FilterX,
  Globe,
  Newspaper,
  Podcast,
  SearchX,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { OnboardingModal } from "@/components/insights/OnboardingModal";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import type { TrendItem, TrendSourceType } from "@/insights-trends/types";
import { NEWS_ITEMS } from "@/insights-trends/mocks/trendsData";
import { useTrendsFilters, type TrendsFilters } from "@/insights-trends/hooks/useTrendsFilters";
import { CONFIDENCE_META, relativeTime } from "@/insights-trends/lib/trendsDisplay";
import { TrendActionBar } from "@/insights-trends/components/TrendActions";

/* ------------------------------------------------------------------ */
/*  Format taxonomy — see header comment. Only the three TrendSourceType */
/*  values NEWS_ITEMS actually uses are mapped; "Platform-Policy" and     */
/*  "Research" are reserved vocabulary (doc §7.6) for item types this     */
/*  feed doesn't carry today, not fabricated per-item guesses.            */
/* ------------------------------------------------------------------ */
type NewsRowSourceType = "news" | "podcast" | "report";

const FORMAT_META: Record<NewsRowSourceType, { label: string; icon: LucideIcon }> = {
  news: { label: "Article", icon: Newspaper },
  podcast: { label: "Podcast", icon: Podcast },
  report: { label: "Report", icon: FileText },
};

function formatMetaFor(type: TrendSourceType): { label: string; icon: LucideIcon } {
  return FORMAT_META[type as NewsRowSourceType] ?? FORMAT_META.news;
}

/* ------------------------------------------------------------------ */
/*  Small display helpers, local to this view.                        */
/* ------------------------------------------------------------------ */
function absoluteDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function publisherOf(item: TrendItem): string {
  return item.source ?? item.author ?? item.channel ?? formatMetaFor(item.type).label;
}

/** Today / This week / Earlier — same <=1 / <=7 day boundaries the module
 *  already uses in useTrendsFilters' timeRangeMatches, so "Today" and
 *  "This week" mean the same thing here as they do in the toolbar's time
 *  range facet. */
function freshnessBucket(publishedAt: string): "Today" | "This week" | "Earlier" {
  const ageDays = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000;
  if (ageDays <= 1) return "Today";
  if (ageDays <= 7) return "This week";
  return "Earlier";
}

/** The doc-mandated per-format extra context slot: episode/duration for
 *  podcasts, report date for reports, a plain read-time fallback for news.
 *  Never invents a value — renders nothing if the underlying field is
 *  missing. */
function extraContext(item: TrendItem): { label: string; value: string } | null {
  if (item.type === "podcast") {
    return item.readTime ? { label: "Episode", value: item.readTime } : null;
  }
  if (item.type === "report") {
    const abs = absoluteDate(item.publishedAt);
    return abs ? { label: "Report date", value: abs } : null;
  }
  return item.readTime ? { label: "Read time", value: item.readTime } : null;
}

/* ------------------------------------------------------------------ */
/*  Shared row fields — used by both the lead card and list rows.     */
/* ------------------------------------------------------------------ */
function FormatBadge({ item }: { item: TrendItem }) {
  const meta = formatMetaFor(item.type);
  const Icon = meta.icon;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-foreground/80">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

/** Published + refreshed (doc correction A's third required companion,
 *  alongside confidence level and evidence count/type below). */
function PublishedRefreshedLine({ item }: { item: TrendItem }) {
  const pub = absoluteDate(item.publishedAt);
  return (
    <p className="truncate text-[11px] text-muted-foreground">
      Published {pub ?? "—"} ({relativeTime(item.publishedAt)})
      <span aria-hidden="true"> · </span>
      Refreshed {relativeTime(item.intelligence.confidence.refreshedAt)}
    </p>
  );
}

function TopicIndustryLine({ item }: { item: TrendItem }) {
  const industries = item.industries.join(", ");
  const topics = item.topics.slice(0, 3).join(" · ");
  const full = [industries, topics].filter(Boolean).join(" — ");
  if (!full) return null;
  return (
    <p className="truncate text-[11px] text-muted-foreground" title={full}>
      <span className="text-foreground/70">{industries}</span>
      {topics && (
        <>
          <span aria-hidden="true"> — </span>
          {topics}
        </>
      )}
    </p>
  );
}

/** Confidence — NEVER a percentage (doc correction A). Level label is
 *  always paired with evidence count + evidence type in the same line. */
function EvidenceLine({ item }: { item: TrendItem }) {
  const { level, evidenceCount, evidenceType } = item.intelligence.confidence;
  const meta = CONFIDENCE_META[level];
  return (
    <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
      <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-medium", meta.className)}>
        {meta.label}
      </span>
      <span className="shrink-0">
        {evidenceCount} evidence point{evidenceCount === 1 ? "" : "s"}
      </span>
      <span className="min-w-0 truncate text-muted-foreground/80" title={evidenceType}>
        ({evidenceType})
      </span>
    </p>
  );
}

function ExtraContextChip({ item }: { item: TrendItem }) {
  const ctx = extraContext(item);
  if (!ctx) return null;
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
      {ctx.label}: {ctx.value}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Lead — BreakingCarousel Slide precedent: plain heading, one explicit  */
/*  "Read full story" button as the sole opener, TrendActionBar below.    */
/* ------------------------------------------------------------------ */
function LeadStory({ item, onOpen }: { item: TrendItem; onOpen: (id: string) => void }) {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid gap-0 sm:grid-cols-2">
        {/* Absolutely positioned for the same reason as BreakingCarousel's
            slide media: in flow with `h-full`, a portrait thumbnail resolves
            against an auto grid row, falls back to its intrinsic aspect, and
            stretches the lead card to the image's height instead of the
            copy's. */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted sm:aspect-auto sm:min-h-[18rem]">
          <img src={item.thumbnail} alt="" loading="eager" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            <FormatBadge item={item} />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Editorial lead</p>

          <p className="truncate text-xs text-muted-foreground">{publisherOf(item)}</p>

          <h2 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">{item.title}</h2>

          <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{item.excerpt}</p>

          <PublishedRefreshedLine item={item} />
          <TopicIndustryLine item={item} />

          <div className="flex flex-wrap items-center gap-2">
            <EvidenceLine item={item} />
            <ExtraContextChip item={item} />
          </div>

          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              onClick={() => onOpen(item.id)}
            >
              Read full story
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="mt-auto border-t border-border pt-2">
            <TrendActionBar item={item} variant="story" />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  List row — TrendCard "compact" precedent: stretched-link overlay      */
/*  underneath, headline button + action bar each promoted above it.     */
/* ------------------------------------------------------------------ */
function NewsRow({ item, onOpen }: { item: TrendItem; onOpen: (id: string) => void }) {
  return (
    <li className="group relative -mx-3 flex gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/40">
      <span aria-hidden="true" onClick={() => onOpen(item.id)} className="absolute inset-0 z-10 cursor-pointer" />

      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted sm:h-20 sm:w-20">
        <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex min-w-0 items-center gap-2">
          <FormatBadge item={item} />
          <span aria-hidden="true" className="shrink-0 text-muted-foreground">
            ·
          </span>
          <span className="min-w-0 truncate text-[11px] text-muted-foreground">{publisherOf(item)}</span>
        </div>

        {/* h4 — nested one level under the freshness group's h3 ("Today" /
            "This week" / "Earlier"), which itself sits under this view's
            "More stories" h2. Keeps the heading outline honest for screen
            reader users navigating by heading level. */}
        <h4 className="relative z-20 leading-snug">
          <button
            type="button"
            onClick={() => onOpen(item.id)}
            className="line-clamp-2 rounded-sm text-left text-sm font-semibold text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            {item.title}
          </button>
        </h4>

        <p className="line-clamp-2 text-xs text-muted-foreground">{item.excerpt}</p>

        <PublishedRefreshedLine item={item} />
        <TopicIndustryLine item={item} />

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-0.5">
          <EvidenceLine item={item} />
          <ExtraContextChip item={item} />
        </div>
      </div>

      <div className="relative z-20 hidden shrink-0 self-center sm:block">
        <TrendActionBar item={item} variant="card" />
      </div>
    </li>
  );
}

function FreshnessGroup({
  label,
  items,
  onOpen,
}: {
  label: string;
  items: TrendItem[];
  onOpen: (id: string) => void;
}) {
  if (items.length === 0) return null;
  const headingId = `news-group-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <NewsRow key={item.id} item={item} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Populated state                                                    */
/* ------------------------------------------------------------------ */
function PopulatedNews({ items, onOpen }: { items: TrendItem[]; onOpen: (id: string) => void }) {
  const { lead, groups } = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    const [leadItem, ...rest] = sorted;
    const buckets: Record<"Today" | "This week" | "Earlier", TrendItem[]> = {
      Today: [],
      "This week": [],
      Earlier: [],
    };
    rest.forEach((item) => buckets[freshnessBucket(item.publishedAt)].push(item));
    return { lead: leadItem, groups: buckets };
  }, [items]);

  const hasMore = groups.Today.length + groups["This week"].length + groups.Earlier.length > 0;

  return (
    <div className="space-y-6">
      <LeadStory item={lead} onOpen={onOpen} />
      {hasMore && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-foreground">More stories</h2>
          <FreshnessGroup label="Today" items={groups.Today} onOpen={onOpen} />
          <FreshnessGroup label="This week" items={groups["This week"]} onOpen={onOpen} />
          <FreshnessGroup label="Earlier" items={groups.Earlier} onOpen={onOpen} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton — shaped like the lead+list hierarchy above, not     */
/*  a generic grid of boxes. Marked aria-hidden with a single sr-only     */
/*  status announcement, matching the app's usual loading-region pattern. */
/* ------------------------------------------------------------------ */
function NewsSkeleton() {
  return (
    <div role="status" aria-label="Loading News &amp; Intelligence" className="space-y-6">
      <span className="sr-only">Loading News &amp; Intelligence…</span>
      <div aria-hidden="true" className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid gap-0 sm:grid-cols-2">
          <Skeleton className="aspect-[16/9] w-full rounded-none sm:aspect-auto sm:min-h-[18rem]" />
          <div className="space-y-3 p-5 sm:p-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-16 w-16 shrink-0 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Zero-results states — two distinct causes, two distinct recoveries.  */
/* ------------------------------------------------------------------ */
function EmptyNoFollowedIndustries({
  hasOtherFilters,
  onSwitchGlobal,
  onOpenPreferences,
  onClearFilters,
}: {
  hasOtherFilters: boolean;
  onSwitchGlobal: () => void;
  onOpenPreferences: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card py-16 text-center">
      <Users className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-medium text-foreground">You haven't followed any industries yet</h3>
        <p className="text-xs text-muted-foreground">
          "Your Industries Only" can't narrow anything until you follow a few. Follow some industries, or switch to
          Global to see every story.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <Button size="sm" onClick={onOpenPreferences} className="gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          Follow industries
        </Button>
        <Button size="sm" variant="outline" onClick={onSwitchGlobal} className="gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          Switch to Global
        </Button>
      </div>
      {hasOtherFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded"
        >
          Also clear your search and filters
        </button>
      )}
    </div>
  );
}

function EmptyNarrowQuery({
  canSwitchGlobal,
  onClearFilters,
  onSwitchGlobal,
}: {
  canSwitchGlobal: boolean;
  onClearFilters: () => void;
  onSwitchGlobal: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card py-16 text-center">
      <SearchX className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-medium text-foreground">No stories match your filters</h3>
        <p className="text-xs text-muted-foreground">
          News &amp; Intelligence is a small, curated feed — a narrow search or filter combination can hide all of
          it. Try clearing your filters.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <Button size="sm" onClick={onClearFilters} className="gap-1.5">
          <FilterX className="h-3.5 w-3.5" />
          Clear filters
        </Button>
        {canSwitchGlobal && (
          <Button size="sm" variant="outline" onClick={onSwitchGlobal} className="gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Switch to Global
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  View                                                                */
/* ------------------------------------------------------------------ */
export default function TrendsNews({
  filters,
  onOpen,
}: {
  filters: TrendsFilters;
  onOpen: (id: string) => void;
}): JSX.Element {
  const { applyFilters, setFilters, clearFilters } = useTrendsFilters();
  const { preferences, isLoading: preferencesLoading } = useInsightPreferences();
  const [prefsOpen, setPrefsOpen] = useState(false);

  // Mock-first: NEWS_ITEMS is static, so there's no real fetch to await.
  // This is a short, honest "something is happening" delay rather than a
  // fake spinner with nothing behind it — same discipline as
  // TrendsToolbar's refresh control.
  const [settling, setSettling] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setSettling(false), 450);
    return () => window.clearTimeout(t);
  }, []);

  const items = useMemo(() => applyFilters(NEWS_ITEMS), [applyFilters]);

  const followedIndustries = (preferences?.industries ?? []) as string[];
  const followedInterests = (preferences?.interests ?? []) as string[];
  const followedBrands = (preferences?.followed_brands ?? []) as string[];

  const hasOtherActiveFilters = Boolean(filters.search.trim() || filters.facetA || filters.facetB);
  const isIndustriesScope = filters.scope === "industries";
  const hasNoFollowedIndustries = isIndustriesScope && followedIndustries.length === 0;

  // Only the industries-scope branch depends on preferences finishing their
  // own (real, react-query-backed) load; the news list itself never awaits
  // a network call.
  const loading = settling || (isIndustriesScope && preferencesLoading);

  let content: JSX.Element;
  if (loading) {
    content = <NewsSkeleton />;
  } else if (items.length === 0) {
    content = hasNoFollowedIndustries ? (
      <EmptyNoFollowedIndustries
        hasOtherFilters={hasOtherActiveFilters}
        onSwitchGlobal={() => setFilters({ scope: "global" })}
        onOpenPreferences={() => setPrefsOpen(true)}
        onClearFilters={clearFilters}
      />
    ) : (
      <EmptyNarrowQuery
        canSwitchGlobal={isIndustriesScope}
        onClearFilters={clearFilters}
        onSwitchGlobal={() => setFilters({ scope: "global" })}
      />
    );
  } else {
    content = <PopulatedNews items={items} onOpen={onOpen} />;
  }

  return (
    <div className="space-y-6">
      {content}
      <OnboardingModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        initialIndustries={followedIndustries}
        initialInterests={followedInterests}
        initialBrands={followedBrands}
      />
    </div>
  );
}
