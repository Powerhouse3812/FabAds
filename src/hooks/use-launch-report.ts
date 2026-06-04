/**
 * Bulk Launch Distribution — Reports data hook.
 *
 * Resolves a launch's distribution report (summary + created-ad rows +
 * source-ad groups) for the `/launch/:id/report` page and the analytics
 * provenance filters.
 *
 * ─── Pre-migration write safety (R39–R41) ───────────────────────────────────
 * The Slice-3 provenance columns (launch_ads.source_ad_id, copy_group_id,
 * destination_fb_page_id, …) and the `fb_pages` table DO NOT EXIST in the live
 * DB until the migration is applied manually. So:
 *   - Every query that touches a NEW column / `fb_pages` is wrapped in try/catch.
 *   - On ANY failure (missing column, missing table, RLS, no rows) we fall back
 *     to the seeded demo populator, so the report page NEVER breaks.
 *   - We NEVER INSERT/UPDATE the new columns here (that write path is owned by
 *     the launch-execute slice and stays a stub). This hook is READ-ONLY.
 *
 * Strategy + target pairs are read from `launch_config.distribution` (the frozen
 * v1 JSON Step 1 writes) — that field already exists, so it is safe to read.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  type LaunchStrategy,
  type TargetPair,
  targetPairsCount,
  uniquePagesCount,
} from "@/lib/launch-distribution";
import { buildDemoLaunchReport } from "@/lib/launch-report-demo";

// ── Domain types ─────────────────────────────────────────────────────────────

export interface PerCurrencyBudget {
  currency: string;
  before: number;
  after: number;
  multiplier: number;
}

export interface LaunchReportSummary {
  launchId: string;
  strategy: LaunchStrategy;
  selectedAdsCount: number;
  createdAdsCount: number;
  activeCount: number;
  /** Created ads scheduled to go live later. Consume a Page slot like Active. */
  scheduledCount: number;
  pausedCount: number;
  /** Count of (account -> page) target pairs. Shown SEPARATELY from pages. */
  targetPairsCount: number;
  /** Count of DISTINCT Facebook Pages across pairs. Shown SEPARATELY. */
  uniquePagesCount: number;
  perCurrencyBudget: PerCurrencyBudget[];
  /** True when the data came from the demo populator (pre-migration fallback). */
  isDemo: boolean;
}

/** Status of a created ad. Active + Scheduled both consume a Page slot. */
export type CreatedAdStatus = "Active" | "Scheduled" | "Paused";

/** One created ad (flat "Created Ads" view + leaf of a Source-Ads group). */
export interface CreatedAdRow {
  id: string;
  created_ad_id: string | null;
  source_ad_id: string;
  source_ad_name: string;
  copy_group_id: string | null;
  name: string;
  status: CreatedAdStatus;
  /** Absolute go-live instant (ISO) when status is Scheduled; else null. */
  scheduled_at: string | null;
  /** IANA timezone the schedule was picked in; null when not scheduled. */
  timezone: string | null;
  target_pair_id: string | null;
  destination_fb_page_id: string | null;
  destination_page_name: string;
  destination_ad_account_id: string | null;
  destination_account_name: string;
  currency: string;
  budget_before: number | null;
  budget_after: number | null;
  budget_multiplier: number;
}

/** Created ads grouped under their source ad (Duplicate => keyed by copy_group_id). */
export interface SourceAdGroup {
  source_ad_id: string;
  source_ad_name: string;
  copy_group_id: string | null;
  status: CreatedAdStatus;
  created_count: number;
  children: CreatedAdRow[];
}

export interface LaunchReportData {
  summary: LaunchReportSummary;
  createdAds: CreatedAdRow[];
  sourceGroups: SourceAdGroup[];
}

// ── Distribution config resolution (safe — field already exists) ──────────────

const VALID_STRATEGIES: LaunchStrategy[] = ["fill_first", "equal", "duplicate"];

function coercePair(raw: unknown): TargetPair | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const fb_page_id = typeof p.fb_page_id === "string" ? p.fb_page_id : "";
  if (!fb_page_id) return null;
  const ad_account_id = typeof p.ad_account_id === "string" ? p.ad_account_id : "";
  const page_id = typeof p.page_id === "string" ? p.page_id : "";
  return {
    ad_account_id,
    account_name: typeof p.account_name === "string" ? p.account_name : ad_account_id || "Ad account",
    page_id: page_id || fb_page_id,
    fb_page_id,
    page_name: typeof p.page_name === "string" ? p.page_name : "Page",
  };
}

interface ResolvedConfig {
  strategy: LaunchStrategy;
  targetPairs: TargetPair[];
}

function resolveDistribution(launchConfig: unknown): ResolvedConfig {
  const dist = (launchConfig as Record<string, unknown> | null)?.distribution as
    | Record<string, unknown>
    | undefined;
  const rawStrategy = dist?.strategy;
  const strategy: LaunchStrategy = VALID_STRATEGIES.includes(rawStrategy as LaunchStrategy)
    ? (rawStrategy as LaunchStrategy)
    : "fill_first";
  const rawPairs = Array.isArray(dist?.target_pairs) ? (dist!.target_pairs as unknown[]) : [];
  const targetPairs = rawPairs.map(coercePair).filter((p): p is TargetPair => p !== null);
  return { strategy, targetPairs };
}

// ── Live read of created ads (NEW columns — guarded) ──────────────────────────

/**
 * Attempt to read created-ad provenance from the live DB. Returns null on ANY
 * failure OR when no provenance rows exist yet, so the caller falls back to the
 * demo populator. NEVER throws.
 */
async function tryReadLiveReport(
  launchId: string,
  resolved: ResolvedConfig,
): Promise<LaunchReportData | null> {
  try {
    // Touches NEW columns (source_ad_id, copy_group_id, destination_fb_page_id,
    // …). If they don't exist yet, Supabase returns an error -> we bail to demo.
    const { data, error } = await (supabase as any)
      .from("launch_ads")
      .select(
        "id, name, status, scheduled_at, ad_timezone, source_ad_id, created_ad_id, copy_group_id, target_pair_id, destination_fb_page_id, destination_ad_account_id, budget_before, budget_after, budget_multiplier",
      )
      .eq("launch_id", launchId);

    if (error) return null;
    const rows = (data ?? []) as Array<Record<string, any>>;
    // Only treat as "live" once provenance has actually been written.
    const provenanced = rows.filter((r) => r.source_ad_id);
    if (provenanced.length === 0) return null;

    // Best-effort page-name enrichment from fb_pages (also a NEW table).
    const pageNames = new Map<string, string>();
    try {
      const pageIds = Array.from(
        new Set(provenanced.map((r) => r.destination_fb_page_id).filter(Boolean)),
      );
      if (pageIds.length > 0) {
        const { data: pages } = await (supabase as any)
          .from("fb_pages")
          .select("fb_page_id, name")
          .in("fb_page_id", pageIds);
        for (const pg of pages ?? []) pageNames.set(pg.fb_page_id, pg.name ?? "");
      }
    } catch {
      // fb_pages missing pre-migration — page names stay blank, no throw.
    }

    return assembleReport(launchId, resolved, provenanced, pageNames);
  } catch {
    return null;
  }
}

/** Map a raw launch_ads.status string to the report's 3-way status. */
function normalizeStatus(raw: unknown): CreatedAdStatus {
  const s = String(raw ?? "").toLowerCase();
  if (s === "active") return "Active";
  if (s === "scheduled") return "Scheduled";
  return "Paused";
}

/** Shape live rows into the report domain types. */
function assembleReport(
  launchId: string,
  resolved: ResolvedConfig,
  rows: Array<Record<string, any>>,
  pageNames: Map<string, string>,
): LaunchReportData {
  const accountName = new Map<string, string>();
  for (const pair of resolved.targetPairs) accountName.set(pair.ad_account_id, pair.account_name);
  const pairPageName = new Map<string, string>();
  for (const pair of resolved.targetPairs) pairPageName.set(pair.fb_page_id, pair.page_name);

  const createdAds: CreatedAdRow[] = rows.map((r) => {
    const status = normalizeStatus(r.status);
    const fbPageId = r.destination_fb_page_id ?? null;
    return {
      id: String(r.id),
      created_ad_id: r.created_ad_id ?? null,
      source_ad_id: String(r.source_ad_id),
      source_ad_name: r.name ?? "Source ad",
      copy_group_id: r.copy_group_id ?? null,
      name: r.name ?? "Ad",
      status,
      scheduled_at: status === "Scheduled" ? (r.scheduled_at ?? null) : null,
      timezone: status === "Scheduled" ? (r.ad_timezone ?? null) : null,
      target_pair_id: r.target_pair_id ?? null,
      destination_fb_page_id: fbPageId,
      destination_page_name: (fbPageId && (pageNames.get(fbPageId) || pairPageName.get(fbPageId))) || "—",
      destination_ad_account_id: r.destination_ad_account_id ?? null,
      destination_account_name:
        (r.destination_ad_account_id && accountName.get(r.destination_ad_account_id)) || "—",
      currency: "USD",
      budget_before: r.budget_before ?? null,
      budget_after: r.budget_after ?? null,
      budget_multiplier: typeof r.budget_multiplier === "number" ? r.budget_multiplier : 1,
    };
  });

  // Group by source ad (Duplicate => copy_group_id maps 1:1 with source ad).
  const groups = new Map<string, SourceAdGroup>();
  for (const row of createdAds) {
    const key = resolved.strategy === "duplicate" && row.copy_group_id ? row.copy_group_id : row.source_ad_id;
    let g = groups.get(key);
    if (!g) {
      g = {
        source_ad_id: row.source_ad_id,
        source_ad_name: row.source_ad_name,
        copy_group_id: row.copy_group_id,
        status: row.status,
        created_count: 0,
        children: [],
      };
      groups.set(key, g);
    }
    g.children.push(row);
    g.created_count += 1;
  }
  const sourceGroups = Array.from(groups.values());

  const activeCount = createdAds.filter((a) => a.status === "Active").length;
  const scheduledCount = createdAds.filter((a) => a.status === "Scheduled").length;
  const pausedCount = createdAds.length - activeCount - scheduledCount;

  const beforeByCur = new Map<string, number>();
  const afterByCur = new Map<string, number>();
  for (const a of createdAds) {
    beforeByCur.set(a.currency, (beforeByCur.get(a.currency) ?? 0) + (a.budget_before ?? 0));
    afterByCur.set(a.currency, (afterByCur.get(a.currency) ?? 0) + (a.budget_after ?? 0));
  }
  const perCurrencyBudget: PerCurrencyBudget[] = Array.from(beforeByCur.keys()).map((cur) => {
    const before = beforeByCur.get(cur) ?? 0;
    const after = afterByCur.get(cur) ?? 0;
    return { currency: cur, before, after, multiplier: before > 0 ? +(after / before).toFixed(2) : 1 };
  });

  const summary: LaunchReportSummary = {
    launchId,
    strategy: resolved.strategy,
    selectedAdsCount: sourceGroups.length,
    createdAdsCount: createdAds.length,
    activeCount,
    scheduledCount,
    pausedCount,
    targetPairsCount: targetPairsCount(resolved.targetPairs),
    uniquePagesCount: uniquePagesCount(resolved.targetPairs),
    perCurrencyBudget,
    isDemo: false,
  };

  return { summary, createdAds, sourceGroups };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Load the distribution report for a launch.
 *
 * Reads `launch_config.distribution` (safe — exists today), then tries the live
 * provenance read. On ANY failure / no-provenance, falls back to the seeded
 * demo populator. Always resolves to a usable {@link LaunchReportData}.
 */
export function useLaunchReport(launchId: string | undefined) {
  return useQuery({
    queryKey: ["launch-report", launchId],
    enabled: !!launchId,
    queryFn: async (): Promise<LaunchReportData> => {
      const id = launchId!;

      // 1. Read the launch row for its distribution config. Guard the strategy
      //    columns (launch_strategy etc.) — they may not exist pre-migration —
      //    by selecting launch_config (always present) and tolerating failure.
      let resolved: ResolvedConfig = { strategy: "fill_first", targetPairs: [] };
      try {
        const { data: launch, error } = await (supabase as any)
          .from("launches")
          .select("id, launch_config")
          .eq("id", id)
          .single();
        if (!error && launch) resolved = resolveDistribution(launch.launch_config);
      } catch {
        // ignore — fall through to demo with defaults
      }

      // 2. Try the live provenance read (NEW columns / fb_pages, guarded).
      const live = await tryReadLiveReport(id, resolved);
      if (live) return live;

      // 3. Fallback: seeded demo populator (stable across reloads).
      const demo = buildDemoLaunchReport(id, resolved.strategy, resolved.targetPairs);
      return { summary: demo.summary, createdAds: demo.createdAds, sourceGroups: demo.sourceGroups };
    },
  });
}
