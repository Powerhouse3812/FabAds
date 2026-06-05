import type {
  DispatchRequest,
  DispatchResult,
  DispatchProgress,
  LaunchFlowState,
  MetaLaunchService,
  PreflightIssue,
  PreflightResult,
} from "../types";
import { pages } from "../mocks";
import { checkCaps } from "../lib/capCheck";
import { computeBudget } from "../lib/budget";

/**
 * Simulated Meta Marketing API. Swap this single implementation for the real
 * one behind the same `MetaLaunchService` interface — no caller changes.
 *
 * It honours the reliability spine:
 *   - **Idempotent**: results are cached per `dedupeKey`+item. A repeat dispatch
 *     (double-click / retry / refresh) never re-creates an already-created ad.
 *   - **failed ≠ launched**: a failed item returns `ok:false` and is NOT cached
 *     as created, so it stays retryable and is never counted as live.
 *   - **Batched / throttled**: items dispatch in small batches with a delay,
 *     emitting progress so the UI shows a live counter.
 *   - **retry-failed-only**: `retryFailed` re-runs just the failed items with
 *     the SAME key; success rate is higher on retry (transient failures clear).
 */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// dedupeKey → (itemId → result). Only successful creations are cached.
const ledger = new Map<string, Map<string, DispatchResult>>();
// dedupeKey+itemId → attempt count (drives the falling failure rate).
const attempts = new Map<string, number>();

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const FAILURE_REASONS = [
  "Creative under review — policy check pending",
  "Transient Meta API error (rate limit)",
  "Page restricted at dispatch time",
  "Asset processing not finished",
];

function attemptCreate(dedupeKey: string, itemId: string, name: string): DispatchResult {
  const akey = `${dedupeKey}:${itemId}`;
  const attempt = (attempts.get(akey) ?? 0) + 1;
  attempts.set(akey, attempt);

  // First attempt ~14% fail; subsequent attempts ~4% (transient errors clear).
  const threshold = attempt <= 1 ? 14 : 4;
  const roll = (hash(akey + attempt) % 100);
  if (roll < threshold) {
    return { id: itemId, ok: false, error: FAILURE_REASONS[hash(itemId) % FAILURE_REASONS.length] };
  }
  return { id: itemId, ok: true, metaId: `${120_000_000_000 + (hash(itemId) % 9_999_999)}` };
}

async function run(req: DispatchRequest, onProgress?: DispatchProgress): Promise<DispatchResult[]> {
  const created = ledger.get(req.dedupeKey) ?? new Map<string, DispatchResult>();
  ledger.set(req.dedupeKey, created);

  const results: DispatchResult[] = [];
  const total = req.items.length;
  const BATCH = 5;

  for (let i = 0; i < req.items.length; i++) {
    const item = req.items[i];

    // Idempotency: already created under this key → return cached, no re-create.
    const cached = created.get(item.id);
    let result: DispatchResult;
    if (cached && cached.ok) {
      result = cached;
    } else {
      await sleep(60 + (hash(item.id) % 90));
      result = attemptCreate(req.dedupeKey, item.id, item.name);
      if (result.ok) created.set(item.id, result); // only cache successes
    }

    results.push(result);
    onProgress?.(i + 1, total, result);

    // Throttle between batches.
    if ((i + 1) % BATCH === 0) await sleep(180);
  }

  return results;
}

export const mockMetaLaunchService: MetaLaunchService = {
  async validate(state: LaunchFlowState): Promise<PreflightResult> {
    await sleep(450);
    const issues: PreflightIssue[] = [];
    const budget = computeBudget(state);

    // Cap pre-check (authoritative) — hard block on breach.
    const caps = checkCaps(state.distribution, state.creativesPerAdset, pages);
    for (const p of caps.pages) {
      if (p.breach) {
        issues.push({
          level: "block",
          code: "cap_breach",
          message: `${p.pageName} would exceed the 250-ad cap by ${Math.abs(p.headroom)} (${p.current} live + ${p.added} new).`,
          entityId: p.pageId,
        });
      }
    }

    // Missing-field checks.
    if (state.accountIds.length === 0)
      issues.push({ level: "block", code: "missing_field", message: "No ad account selected." });
    if (state.pageIds.length === 0)
      issues.push({ level: "block", code: "missing_field", message: "No Page selected." });
    if (!state.copy.primaryText.trim() && !state.useCatalogue)
      issues.push({ level: "warn", code: "missing_field", message: "Primary text is empty." });
    if (state.creativeIds.length === 0 && !state.useCatalogue)
      issues.push({ level: "warn", code: "missing_field", message: "No creative attached." });

    // Policy warning (non-blocking) — deterministic sample.
    if (budget.totalAds > 40)
      issues.push({
        level: "warn",
        code: "policy",
        message: "Large first-batch volume on a Page — Meta may stagger delivery. Consider a warm-up.",
      });

    return {
      ok: !issues.some((i) => i.level === "block"),
      issues,
      totalAds: budget.totalAds,
      dailyBudgetTotal: budget.dailyTotal,
    };
  },

  dispatch(req, onProgress) {
    return run(req, onProgress);
  },

  retryFailed(req, onProgress) {
    // Same dedupeKey — only the failed items are passed back in by the caller.
    return run(req, onProgress);
  },
};

/** Test/dev helper — clears the idempotency ledger. */
export function __resetLaunchLedger() {
  ledger.clear();
  attempts.clear();
}
