/**
 * Bulk Launch Distribution — Reports DEMO populator.
 *
 * Builds a stable, seeded launch report (summary + created-ad rows +
 * source-ad groups) from a launchId + the launch's resolved distribution
 * (strategy + target pairs). Used as the fallback whenever the live DB does
 * not yet carry the Slice-3 provenance columns / `fb_pages` table (R39–40),
 * so the report page NEVER breaks before the migration is applied.
 *
 * Determinism: everything is keyed off a hash of the launchId, so the same
 * launch renders identical numbers across reloads. No network, no Date.now().
 *
 * Honors:
 *  - the per-UNIQUE-page 250 active-ad cap (capacity keyed on fb_page_id),
 *  - Duplicate => one shared copy_group_id per source ad (copied into every pair),
 *  - a shared-page-across-accounts scenario (same fb_page_id under two accounts),
 *  - an Active/Paused status split on created ads.
 */
import { MAX_ADS_PER_PAGE, type LaunchStrategy, type TargetPair } from "@/lib/launch-distribution";
import type {
  CreatedAdRow,
  LaunchReportSummary,
  SourceAdGroup,
} from "@/hooks/use-launch-report";

// ── Seeded RNG (same shape as reports-dummy-data) ────────────────────
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Deterministic uuid-ish string from a seed (NOT crypto — demo only).
function seededId(rand: () => number): string {
  const hex = () => Math.floor(rand() * 16).toString(16);
  const block = (n: number) => Array.from({ length: n }, hex).join("");
  return `${block(8)}-${block(4)}-${block(4)}-${block(4)}-${block(12)}`;
}

const SOURCE_AD_NAMES = [
  "UGC Hook — Skin Glow", "Static — Bold Discount", "Carousel — Bestsellers",
  "Video — Founder Story", "Static — Social Proof", "UGC — Before/After",
  "Video — Problem/Solution", "Static — Limited Drop",
];

/**
 * Default demo target pairs when a launch has no distribution config yet.
 * Deliberately includes a SHARED PAGE across two ad accounts: `page_brand`
 * (fb_page_id "fbp_brand_001") appears under both Acme US and Acme EU.
 */
function defaultDemoPairs(): TargetPair[] {
  return [
    { ad_account_id: "acc_us", account_name: "Acme Corp US", page_id: "link_us_brand", fb_page_id: "fbp_brand_001", page_name: "Acme Brand Page" },
    { ad_account_id: "acc_eu", account_name: "Acme Corp EU", page_id: "link_eu_brand", fb_page_id: "fbp_brand_001", page_name: "Acme Brand Page" },
    { ad_account_id: "acc_us", account_name: "Acme Corp US", page_id: "link_us_shop", fb_page_id: "fbp_shop_002", page_name: "ShopMax Storefront" },
  ];
}

const CURRENCY_BY_ACCOUNT: Record<string, string> = {
  acc_us: "USD",
  acc_eu: "EUR",
};

function currencyForPair(pair: TargetPair): string {
  return CURRENCY_BY_ACCOUNT[pair.ad_account_id] ?? "USD";
}

export interface DemoReport {
  summary: LaunchReportSummary;
  createdAds: CreatedAdRow[];
  sourceGroups: SourceAdGroup[];
}

/**
 * Build a full demo report for a launch.
 *
 * @param launchId   the launch uuid (hash-seeded for stable output)
 * @param strategy   resolved LaunchStrategy (defaults to fill_first)
 * @param targetPairs resolved TargetPair[] (defaults to a shared-page demo set)
 */
export function buildDemoLaunchReport(
  launchId: string,
  strategy: LaunchStrategy = "fill_first",
  targetPairs: TargetPair[] = [],
): DemoReport {
  const rand = seededRandom(hashString(launchId || "demo") + 7);
  const pairs = targetPairs.length > 0 ? targetPairs : defaultDemoPairs();

  // ── Source ads: 3–6 selected, deterministic split Active/Paused ──
  const sourceCount = 3 + Math.floor(rand() * 4); // 3..6
  interface SourceSeed {
    id: string;
    name: string;
    status: "Active" | "Paused";
    baseBudget: number;
  }
  const sources: SourceSeed[] = Array.from({ length: sourceCount }, (_, i) => ({
    id: seededId(rand),
    name: SOURCE_AD_NAMES[i % SOURCE_AD_NAMES.length],
    // ~70% active, but always at least one of each when possible.
    status: rand() > 0.3 ? "Active" : "Paused",
    baseBudget: Math.round((rand() * 80 + 20)), // 20..100 per source's parent adset
  }));
  if (sources.length > 1) {
    sources[0].status = "Active";
    sources[sources.length - 1].status = "Paused";
  }

  const multiplier = strategy === "duplicate" ? pairs.length : 1;

  // Live remaining active slots per UNIQUE fb_page_id (shared across pairs).
  const startActive = new Map<string, number>();
  for (const p of pairs) {
    if (!startActive.has(p.fb_page_id)) {
      // Seed an existing load so the 250 cap is meaningful but rarely hit.
      startActive.set(p.fb_page_id, Math.floor(rand() * 30));
    }
  }
  const remaining = new Map<string, number>();
  for (const [fbId, used] of startActive) {
    remaining.set(fbId, Math.max(0, MAX_ADS_PER_PAGE - used));
  }

  const createdAds: CreatedAdRow[] = [];
  const groupsBySource = new Map<string, SourceAdGroup>();

  // Per-source shared copy_group_id (only meaningful for Duplicate, but stable
  // for all strategies so the Source-Ads view can always group by it).
  const copyGroupBySource = new Map<string, string>();
  for (const s of sources) copyGroupBySource.set(s.id, seededId(rand));

  /** Which pairs a given source ad lands on, per strategy. */
  const pairsForSource = (sourceIndex: number): TargetPair[] => {
    if (strategy === "duplicate") return pairs; // every pair gets every ad
    if (strategy === "equal") {
      // round-robin: ad i -> pair (i mod n)
      return [pairs[sourceIndex % pairs.length]];
    }
    // fill_first: land on the first pair whose page still has a slot.
    for (const p of pairs) {
      if ((remaining.get(p.fb_page_id) ?? 0) > 0) return [p];
    }
    return [pairs[0]];
  };

  let activeCount = 0;
  let pausedCount = 0;
  const budgetBeforeByCurrency = new Map<string, number>();
  const budgetAfterByCurrency = new Map<string, number>();

  sources.forEach((src, sIdx) => {
    const group: SourceAdGroup = {
      source_ad_id: src.id,
      source_ad_name: src.name,
      copy_group_id: copyGroupBySource.get(src.id)!,
      status: src.status,
      created_count: 0,
      children: [],
    };

    const landingPairs = pairsForSource(sIdx);
    landingPairs.forEach((pair) => {
      const currency = currencyForPair(pair);
      // Active ad consumes a page slot; if the page is full, it lands Paused.
      let status: "Active" | "Paused" = src.status;
      if (status === "Active") {
        const left = remaining.get(pair.fb_page_id) ?? 0;
        if (left > 0) remaining.set(pair.fb_page_id, left - 1);
        else status = "Paused"; // page cap hit -> spill to paused
      }

      const budgetBefore = src.baseBudget;
      const budgetAfter = Math.round(budgetBefore * multiplier);

      const row: CreatedAdRow = {
        id: seededId(rand),
        created_ad_id: `fbad_${Math.floor(rand() * 9e9 + 1e9)}`,
        source_ad_id: src.id,
        source_ad_name: src.name,
        copy_group_id: group.copy_group_id,
        name: `${src.name} — ${pair.account_name}`,
        status,
        target_pair_id: pair.page_id,
        destination_fb_page_id: pair.fb_page_id,
        destination_page_name: pair.page_name,
        destination_ad_account_id: pair.ad_account_id,
        destination_account_name: pair.account_name,
        currency,
        budget_before: budgetBefore,
        budget_after: budgetAfter,
        budget_multiplier: multiplier,
      };

      createdAds.push(row);
      group.children.push(row);
      group.created_count += 1;

      if (status === "Active") activeCount += 1;
      else pausedCount += 1;

      budgetBeforeByCurrency.set(currency, (budgetBeforeByCurrency.get(currency) ?? 0) + budgetBefore);
      budgetAfterByCurrency.set(currency, (budgetAfterByCurrency.get(currency) ?? 0) + budgetAfter);
    });

    groupsBySource.set(src.id, group);
  });

  const sourceGroups = Array.from(groupsBySource.values());

  const uniquePages = new Set(pairs.map((p) => p.fb_page_id));
  const perCurrencyBudget = Array.from(budgetBeforeByCurrency.keys()).map((cur) => {
    const before = budgetBeforeByCurrency.get(cur) ?? 0;
    const after = budgetAfterByCurrency.get(cur) ?? 0;
    return {
      currency: cur,
      before,
      after,
      multiplier: before > 0 ? +(after / before).toFixed(2) : multiplier,
    };
  });

  const summary: LaunchReportSummary = {
    launchId,
    strategy,
    selectedAdsCount: sources.length,
    createdAdsCount: createdAds.length,
    activeCount,
    pausedCount,
    targetPairsCount: pairs.length,
    uniquePagesCount: uniquePages.size,
    perCurrencyBudget,
    isDemo: true,
  };

  return { summary, createdAds, sourceGroups };
}
