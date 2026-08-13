/**
 * URL-backed filter state for the Industry Insights → Trends surface.
 *
 * Follows the house pattern from src/pages/insights-v2/InsightsV2Feed.tsx
 * (?search / ?tag / etc. round-tripped through useSearchParams) with one
 * deliberate difference: nothing here is duplicated into local React
 * state. `tab` and `filters` are derived straight from `searchParams` on
 * every render via useMemo, and setters write directly back into the URL.
 * InsightsV2Feed's lesson (its `prefsModalOpen` alias) is that a *separate*
 * effect that normalises/rewrites the URL from derived state can race the
 * primary state->URL sync effect — whichever runs last on a given commit
 * wins, so the loser's write is silently dropped. Deriving everything at
 * read time and never introducing that second effect sidesteps the race
 * entirely: there is exactly one owner of the truth (the URL) and no
 * shadow copy to fall out of sync with it.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { useTrendActions } from "@/insights-trends/components/TrendActions";
import {
  BREAKING_STORIES,
  META_ADS,
  NEWS_ITEMS,
  OTHER_SOCIAL,
  SEARCH_DEMAND,
  TIKTOK_HOOKS,
} from "@/insights-trends/mocks/trendsData";
import type { TrendItem, TrendSourceType, TrendsTabKey } from "@/insights-trends/types";

/* ------------------------------------------------------------------ */
/*  Facet options are DERIVED from the data wherever the option is a   */
/*  data value rather than a semantic bucket. A hardcoded option list  */
/*  that no record can satisfy is a dead filter: the control looks     */
/*  live, the user picks it, and the tab drops to its zero state with  */
/*  no way to tell "nothing matches" from "this option is broken".     */
/*  Deriving guarantees every option in every listbox returns >= 1     */
/*  result against the current dataset.                               */
/* ------------------------------------------------------------------ */
function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

/** "United States (California, New York, Oregon)" -> "United States".
 *  Keeps the listbox to human-scale labels while still matching the
 *  fully-qualified region string stored on the record. */
function regionRoot(region: string): string {
  return region.split(" (")[0].trim();
}

/** Meta's stored formats are qualified ("Video (15s)", "Carousel (5 cards)").
 *  The facet offers the family and matches by prefix so the qualifier does
 *  not have to be reproduced exactly in the option list. */
const SOCIAL_FORMAT_FAMILIES = ["Video", "Carousel", "Single Image"];

const NEWS_SOURCE_TYPE_LABELS: Record<string, TrendSourceType> = {
  Article: "news",
  Report: "report",
  Podcast: "podcast",
};

/* ------------------------------------------------------------------ */
/*  Filter shape                                                      */
/* ------------------------------------------------------------------ */
export interface TrendsFilters {
  search: string;
  scope: "global" | "industries";
  facetA?: string;
  facetB?: string;
}

const TAB_KEYS: TrendsTabKey[] = ["overview", "news", "social", "search"];
function isTrendsTabKey(v: string | null): v is TrendsTabKey {
  return !!v && (TAB_KEYS as string[]).includes(v);
}

/* ------------------------------------------------------------------ */
/*  Facet -> field matching. Kept tab-scoped and explicit rather than  */
/*  a single generic key/value map, because "platform" and "type"     */
/*  mean different things on different tabs and map to different      */
/*  TrendItem fields.                                                  */
/* ------------------------------------------------------------------ */
const CONTENT_TYPE_GROUPS: Record<string, TrendSourceType[]> = {
  News: ["news"],
  Reports: ["report"],
  Podcasts: ["podcast"],
  Social: ["tiktok", "instagram", "youtube", "linkedin", "x", "meta"],
  Search: ["google_trend"],
};

const PLATFORM_LABEL_TO_TYPE: Record<string, TrendSourceType> = {
  TikTok: "tiktok",
  Instagram: "instagram",
  YouTube: "youtube",
  LinkedIn: "linkedin",
  X: "x",
  Meta: "meta",
};

function timeRangeMatches(publishedAt: string, bucket: string): boolean {
  const ageDays = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000;
  switch (bucket) {
    case "24h":
      return ageDays <= 1;
    case "7d":
    case "Past 7 days":
      return ageDays <= 7;
    case "30d":
    case "Past 30 days":
      return ageDays <= 30;
    case "90d":
    case "Past 90 days":
      return ageDays <= 90;
    case "Past 12 months":
      return ageDays <= 365;
    default:
      return true;
  }
}

function facetSlotMatches(tab: TrendsTabKey, slot: "a" | "b", item: TrendItem, value: string): boolean {
  const key = TAB_FACETS[tab][slot].key;
  // Demo-only values are for show — they never exclude a record. See
  // DEMO_ONLY_FACET_OPTIONS.
  if ((DEMO_ONLY_FACET_OPTIONS[`${tab}:${key}`] ?? []).includes(value)) return true;
  switch (`${tab}:${key}`) {
    case "overview:range":
      return timeRangeMatches(item.publishedAt, value);
    case "overview:type":
      return (CONTENT_TYPE_GROUPS[value] ?? []).includes(item.type);
    // News rows carry no per-item `format` string — the format IS the source
    // type (news→Article, podcast→Podcast, report→Report), exactly the mapping
    // TrendsNews' own FORMAT_META renders. Matching on item.format here would
    // never hit, since only Meta ads carry that field.
    case "news:format":
      return item.type === NEWS_SOURCE_TYPE_LABELS[value];
    // Meta's stored formats are qualified ("Video (15s)", "Carousel (5 cards)")
    // — match the family by prefix so the qualifier doesn't have to be
    // reproduced in the option list.
    case "social:format":
      return (item.format ?? "").toLowerCase().startsWith(value.toLowerCase());
    case "news:topic":
      return item.topics.some((t) => t.toLowerCase() === value.toLowerCase());
    case "social:platform":
      return item.type === PLATFORM_LABEL_TO_TYPE[value];
    // Regions are stored fully qualified ("United States (California, …)");
    // the facet offers the root and matches on it.
    case "search:region":
      return regionRoot(item.region ?? "").toLowerCase() === value.toLowerCase();
    case "search:timeframe":
      return (item.timeframe ?? "").toLowerCase() === value.toLowerCase();
    default:
      return true;
  }
}

/* ------------------------------------------------------------------ */
/*  Per-tab facet definitions (doc §7.3).                              */
/*                                                                     */
/*  Every option below is DERIVED from the data it filters, per the    */
/*  note at the top of this file: a hardcoded option list that no      */
/*  record can satisfy is a dead control — it looks live, the user     */
/*  picks it, and the tab drops to its zero state with no way to tell  */
/*  "nothing matches" from "this option is broken". Deriving           */
/*  guarantees every option in every listbox returns >= 1 result       */
/*  against the current dataset, and it stays true if the mock data    */
/*  changes. Time Range on Overview is the one semantic (non-data)     */
/*  bucket set, so it is filtered for liveness rather than derived.    */
/* ------------------------------------------------------------------ */
const SOCIAL_ITEMS: TrendItem[] = [...META_ADS, ...TIKTOK_HOOKS, ...OTHER_SOCIAL];
const OVERVIEW_ITEMS: TrendItem[] = [
  ...BREAKING_STORIES,
  ...NEWS_ITEMS,
  ...META_ADS,
  ...TIKTOK_HOOKS,
  ...SEARCH_DEMAND,
  ...OTHER_SOCIAL,
];

const OVERVIEW_RANGE_OPTIONS = ["24h", "7d", "30d", "90d"].filter((bucket) =>
  OVERVIEW_ITEMS.some((item) => timeRangeMatches(item.publishedAt, bucket)),
);

const OVERVIEW_TYPE_OPTIONS = Object.keys(CONTENT_TYPE_GROUPS).filter((label) =>
  OVERVIEW_ITEMS.some((item) => CONTENT_TYPE_GROUPS[label].includes(item.type)),
);

const NEWS_FORMAT_OPTIONS = Object.keys(NEWS_SOURCE_TYPE_LABELS).filter((label) =>
  NEWS_ITEMS.some((item) => item.type === NEWS_SOURCE_TYPE_LABELS[label]),
);

const NEWS_TOPIC_OPTIONS = uniqueSorted(NEWS_ITEMS.flatMap((item) => item.topics));

const SOCIAL_PLATFORM_OPTIONS = Object.keys(PLATFORM_LABEL_TO_TYPE).filter((label) =>
  SOCIAL_ITEMS.some((item) => item.type === PLATFORM_LABEL_TO_TYPE[label]),
);

const SOCIAL_FORMAT_OPTIONS = SOCIAL_FORMAT_FAMILIES.filter((family) =>
  SOCIAL_ITEMS.some((item) => (item.format ?? "").toLowerCase().startsWith(family.toLowerCase())),
);

const SEARCH_REGION_OPTIONS = uniqueSorted(SEARCH_DEMAND.map((item) => regionRoot(item.region ?? "")));

const SEARCH_TIMEFRAME_OPTIONS = uniqueSorted(SEARCH_DEMAND.map((item) => item.timeframe ?? ""));

/** Demo-only facet values (Maalik, 2026-08-13): the Search & Demand mock set is
 *  entirely one region over one timeframe, so those two pickers have nothing
 *  real to switch between. He still wants them on screen, so they carry these
 *  extra values for show. Picking one does NOT filter — `facetSlotMatches`
 *  returns every record for a demo value, and the tab labels the scope as
 *  sample data so the numbers underneath are never misread as that selection. */
export const DEMO_ONLY_FACET_OPTIONS: Record<string, string[]> = {
  "search:region": ["Worldwide", "United Kingdom", "India", "Canada", "Australia"],
  "search:timeframe": ["Past 7 days", "Past 90 days", "Past 12 months"],
};

export function isDemoOnlyFacetValue(tab: TrendsTabKey, slot: "a" | "b", value: string): boolean {
  const key = `${tab}:${TAB_FACETS[tab][slot].key}`;
  return (DEMO_ONLY_FACET_OPTIONS[key] ?? []).includes(value);
}

export const TAB_FACETS: Record<
  TrendsTabKey,
  { a: { key: string; label: string; options: string[] }; b: { key: string; label: string; options: string[] } }
> = {
  overview: {
    a: { key: "range", label: "Time Range", options: OVERVIEW_RANGE_OPTIONS },
    b: { key: "type", label: "Content Type", options: OVERVIEW_TYPE_OPTIONS },
  },
  news: {
    a: { key: "format", label: "Format", options: NEWS_FORMAT_OPTIONS },
    b: { key: "topic", label: "Topic", options: NEWS_TOPIC_OPTIONS },
  },
  social: {
    a: { key: "platform", label: "Platform", options: SOCIAL_PLATFORM_OPTIONS },
    b: { key: "format", label: "Creative Format", options: SOCIAL_FORMAT_OPTIONS },
  },
  search: {
    a: {
      key: "region",
      label: "Region",
      options: uniqueSorted([...SEARCH_REGION_OPTIONS, ...DEMO_ONLY_FACET_OPTIONS["search:region"]]),
    },
    b: {
      key: "timeframe",
      label: "Time Range",
      options: uniqueSorted([...SEARCH_TIMEFRAME_OPTIONS, ...DEMO_ONLY_FACET_OPTIONS["search:timeframe"]]),
    },
  },
};

/** Test seam for the "no dead facet option" invariant
 *  (src/insights-trends/trendsFacets.test.ts). Not for component use —
 *  components go through `applyFilters`. */
export const matchesFacetForTest = facetSlotMatches;

/* ------------------------------------------------------------------ */
/*  Search — matches across every free-text-ish field on TrendItem.   */
/* ------------------------------------------------------------------ */
function matchesSearch(item: TrendItem, q: string): boolean {
  const haystack = [
    item.title,
    item.headline,
    item.hook,
    item.term,
    item.excerpt,
    item.source,
    item.creator,
    item.advertiser,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export function useTrendsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = useMemo<TrendsTabKey>(() => {
    const raw = searchParams.get("tab");
    return isTrendsTabKey(raw) ? raw : "overview";
  }, [searchParams]);

  const filters = useMemo<TrendsFilters>(() => {
    const scopeRaw = searchParams.get("scope");
    return {
      search: searchParams.get("q") ?? "",
      scope: scopeRaw === "industries" ? "industries" : "global",
      facetA: searchParams.get("fa") ?? undefined,
      facetB: searchParams.get("fb") ?? undefined,
    };
  }, [searchParams]);

  const setTab = useCallback(
    (next: TrendsTabKey) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("tab", next);
          // Facets are tab-scoped (§7.3) — a facet value picked on the
          // previous tab has no defined meaning under the new tab's facet
          // set, so it's dropped rather than silently mis-filtering.
          sp.delete("fa");
          sp.delete("fb");
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (update: Partial<TrendsFilters> | ((prev: TrendsFilters) => Partial<TrendsFilters>)) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          const current: TrendsFilters = {
            search: sp.get("q") ?? "",
            scope: sp.get("scope") === "industries" ? "industries" : "global",
            facetA: sp.get("fa") ?? undefined,
            facetB: sp.get("fb") ?? undefined,
          };
          const patch = typeof update === "function" ? update(current) : update;
          const next = { ...current, ...patch };

          if (next.search) sp.set("q", next.search);
          else sp.delete("q");

          if (next.scope === "industries") sp.set("scope", "industries");
          else sp.delete("scope");

          if (next.facetA) sp.set("fa", next.facetA);
          else sp.delete("fa");

          if (next.facetB) sp.set("fb", next.facetB);
          else sp.delete("fb");

          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("q");
        sp.delete("scope");
        sp.delete("fa");
        sp.delete("fb");
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const activeCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.scope === "industries" ? 1 : 0) +
    (filters.facetA ? 1 : 0) +
    (filters.facetB ? 1 : 0);

  const { preferences } = useInsightPreferences();
  const followedIndustries = useMemo(() => (preferences?.industries ?? []) as string[], [preferences]);

  // Dismissals are part of "what this user should see", so they belong in the
  // same single narrowing pass every tab already runs — otherwise the Dismiss
  // action's own toast ("It won't show up in this feed again", with an Undo)
  // is a promise the feed never keeps, and the card just sits there.
  const { dismissed } = useTrendActions();

  const applyFilters = useCallback(
    <T extends TrendItem>(items: T[]): T[] => {
      let out = items;

      if (dismissed.size > 0) {
        out = out.filter((it) => !dismissed.has(it.id));
      }

      // Scope: 'industries' narrows to the user's followed industries. If
      // they haven't followed any yet, scoping to an empty set would hide
      // everything for no useful reason, so fall through to unfiltered.
      if (filters.scope === "industries" && followedIndustries.length > 0) {
        out = out.filter((it) => it.industries.some((ind) => followedIndustries.includes(ind)));
      }

      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        out = out.filter((it) => matchesSearch(it, q));
      }

      if (filters.facetA) {
        out = out.filter((it) => facetSlotMatches(tab, "a", it, filters.facetA!));
      }
      if (filters.facetB) {
        out = out.filter((it) => facetSlotMatches(tab, "b", it, filters.facetB!));
      }

      return out;
    },
    [filters, tab, followedIndustries, dismissed],
  );

  return { tab, setTab, filters, setFilters, clearFilters, activeCount, applyFilters };
}
