/**
 * Genie run store — the single source of truth for every batch Genie produces
 * (Genie 2.0 §8, §10, §18, §21.3).
 *
 * Module-level external store (`useSyncExternalStore`), same shape as
 * `src/lib/ad-entity-write-store.ts`: in-memory, resets on reload, no API to
 * fail against. Studio, every Other Flow, and every Other App all call
 * `startBatch()` and land here — §8: "All app output goes to the central
 * Genie Library. Per-app history is a view, not a separate store." So
 * `useRunsForApp()` is a FILTER over this same array, never a second store.
 *
 * WHY PROGRESS HAS NO FIXED ETA (§18)
 * A fixed estimate set once at start becomes a promise, and a missed promise
 * costs more trust than no estimate at all. So `etaSeconds` is RECOMPUTED
 * every tick from this item's own OBSERVED per-stage timing — the first
 * stage's estimate is necessarily a guess (nothing has been observed yet),
 * but every stage after that replaces the guess with real data. See `tick()`.
 *
 * WHY A FAILED ITEM NEVER LEAVES THE LIST (§18)
 * `"failed"` is a terminal `RunItemStatus`, not a side-channel toast. The
 * item stays in `batch.items` forever (or until retried), carrying a
 * `FailureReason` that a `FailureNotice`/`RunItemTile` renders inline.
 *
 * THE useSyncExternalStore GOTCHA THIS FILE HAS TO GET RIGHT
 * `getSnapshot` must return a REFERENTIALLY STABLE value between real changes
 * or React re-renders forever (the classic infra bug with this hook — see
 * the React docs' own "getSnapshot should be cached" warning). The fix here:
 * the module keeps ONE `snapshot` object that is only ever REPLACED (never
 * mutated) on a real `commit()`, and every hook below reads through that one
 * object. `useBatches()`/`useRunsForApp()` need SORTED/FILTERED derivations,
 * which `.sort()`/`.filter()` would otherwise reallocate on every call even
 * when nothing changed — so those are cached, keyed by referential identity
 * of the underlying `snap.batches` array, and only recomputed when a real
 * commit produced a new one. `useBatch(id)` needs no such cache: `.find()`
 * returns an EXISTING element reference, never a new one, so it's already
 * stable for free as long as `snap.batches` hasn't changed.
 */
import { useSyncExternalStore } from "react";
import type { AppKey } from "../apps/appTypes";
import type {
  RunOrigin,
  Provenance,
  RunItem,
  RunItemStatus,
  RunBatch,
  FailureReason,
  RetryScope,
} from "./genieRunTypes";
import { sampleOutputs } from "../mocks/sample-outputs";
import { MODE_LABELS } from "../types/output";
import type { OutputData } from "../types/output";
import { angles } from "../mocks";
import { MODEL_CREDIT_MULTIPLIER, MODEL_LABEL, MODEL_PRICING } from "../studio-v4/data/modelPricing";
import { computeBreakdown, type CreditLine } from "./credits";

/* ─────────────────────────────── public API types ─────────────────────────────── */

export interface StartBatchInput {
  origin: RunOrigin;
  label: string;
  stages: string[];
  count: number;
  creditsPerItem: number;
  /**
   * The EXACT total quoted on the Generate button (computeBreakdown().total).
   * When present it is distributed across the items (remainder to the first
   * few) so the batch can never charge a rounded-up figure — 6 quoted for 4
   * items must never become round(1.5) × 4 = 8. `creditsPerItem` stays the
   * nominal rate used for retry-with-a-different-model pricing.
   */
  creditsTotal?: number;
  config?: RunBatch["config"];
  /** Force a deterministic outcome for demo walkthroughs — see `computeFailureSet`. */
  outcome?: "all-done" | "one-failed" | "all-failed" | "partial";
  /**
   * Per-item cosmetic overrides (title/summary/tags/thumbnail/outputId…),
   * applied on top of the defaults this store creates. NOT a lifecycle
   * override — status/progress/stageIndex are owned by the tick engine, so
   * seeding one here will be stomped on the very next tick.
   */
  itemSeed?: (i: number) => Partial<RunItem>;
}

/**
 * A GAP IN THE LOCKED CONTRACT, FLAGGED LOUDLY: `retry`'s scope union
 * includes `"this-item"`, but neither `retry()` nor `creditsForRetry()` take
 * an item id — only a `batchId`. There is no way to say WHICH item without
 * one. Rather than silently guessing, this file adds an OPTIONAL `itemId` to
 * `retry`'s `opts` bag (additive, so every existing call site — which only
 * ever passed `{ modelId }` — still compiles unchanged) and documents the
 * fallback behaviour below. If another agent's UI needs to disambiguate,
 * wire `opts.itemId` through; if genieRunTypes.ts grows an official field for
 * this later, this is the one place that needs to change.
 */
export interface RetryOpts {
  modelId?: string;
  itemId?: string;
}

/* ─────────────────────────────── tuning constants ─────────────────────────────── */

/** How many items in a batch generate at once. Mirrors real queueing systems
 *  (and `MAX_CONCURRENT_GENERATING` in studio-v4/types/queue.ts) — it's also
 *  what makes "pending" a state you can actually see, not just a value that
 *  exists in the type and nothing else. */
const MAX_CONCURRENT = 4;

/** Progress tick cadence. */
const TICK_MS = 700;

/** How long an item sits in "cancelling" before it settles to "cancelled" —
 *  long enough to read as a real transition, short enough not to feel stuck. */
const CANCEL_SETTLE_MS = 900;

const FAILURE_REASONS: FailureReason[] = [
  "model-unavailable",
  "content-policy",
  "timeout",
  "credits-exhausted",
  "brand-guideline-conflict",
  "render-error",
];

/* ─────────────────────────────── module state ─────────────────────────────── */

interface RunStoreSnapshot {
  batches: RunBatch[];
}

/** The ONE object every hook reads through. Replaced wholesale on commit,
 *  never mutated in place — see the file-header gotcha note. */
let snapshot: RunStoreSnapshot = { batches: [] };

const listeners = new Set<() => void>();

/**
 * Per-item timing bookkeeping, keyed by `RunItem.id` (globally unique —
 * `${batchId}-item-${index}`). Deliberately kept OFF the RunItem itself:
 * the contract type is what four other agents render against, and none of
 * them need "how long has this stage been running" — only the tick engine
 * does. Entries are created when an item starts running (initial ramp-up,
 * concurrency promotion, or retry) and deleted the moment it stops running.
 */
interface ItemTiming {
  stageStartedAt: number;
  /** Planned ms for the CURRENT stage — a guess until stages complete, then
   *  superseded by the observed average below. Re-rolled every stage. */
  currentStageTargetMs: number;
  /** Observed durations of stages this item has already completed — the
   *  ground truth etaSeconds is computed from, per the file-header note. */
  doneStageDurationsMs: number[];
  /** Decided once, when the item starts running. `null` = will resolve to
   *  "done". Retries always set this to `null` — see `retry()`. */
  willFail: FailureReason | null;
}
const timing = new Map<string, ItemTiming>();

/**
 * creditsPerItem isn't part of the public RunBatch contract — genieRunTypes.ts
 * only keeps the CHARGED total on `RunBatch.credits` (sum of item credits,
 * which starts near zero and grows as items resolve). But retry pricing needs
 * the per-item RATE to quote "N more credits" honestly, so it's kept here as
 * an internal side-table instead of extending the shared type. Flagging this
 * for whoever owns genieRunTypes.ts in case another consumer wants it directly.
 */
const creditsPerItemByBatch = new Map<string, number>();

/** Exact planned charge per item — see `StartBatchInput.creditsTotal`. */
const plannedCreditsByItem = new Map<string, number>();

/** Splits an integer total across `count` items, remainder to the first few,
 *  so Σ item.credits === the quoted total exactly. */
function distributeCredits(total: number, count: number): number[] {
  if (count <= 0) return [];
  const whole = Math.max(0, Math.round(total));
  const base = Math.floor(whole / count);
  const remainder = whole - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** What THIS item costs (charged when done, quoted by Retry when failed). */
function rateFor(batchId: string, item: RunItem): number {
  return plannedCreditsByItem.get(item.id) ?? creditsPerItemByBatch.get(batchId) ?? item.credits;
}

/** The deterministic failure assignment computed once at batch start, so a
 *  pending item PROMOTED into a running slot later (see `tick()`'s second
 *  pass) still resolves the way `outcome` said it would. */
const failingIndexByBatch = new Map<string, Map<number, FailureReason>>();

/** Every batch id ever issued, so `newBatchId()` can guarantee no collision
 *  regardless of commit timing (seeding builds several ids before the first
 *  commit ever lands in `snapshot`). */
const issuedBatchIds = new Set<string>();

let tickHandle: ReturnType<typeof setInterval> | null = null;

/* ─────────────────────────────── derived-view caches ─────────────────────────────── */
/* See the file-header gotcha note: these exist ONLY so useBatches()/
 * useRunsForApp() don't hand out a freshly-allocated array on every render
 * when nothing changed. Cache key is referential identity of the batches
 * array itself — cheap, correct, and self-invalidating on every real commit. */

let sortedCache: { source: RunBatch[]; data: RunBatch[] } | null = null;

function getSortedBatches(batches: RunBatch[]): RunBatch[] {
  if (sortedCache && sortedCache.source === batches) return sortedCache.data;
  const data = [...batches].sort((a, b) => b.createdAt - a.createdAt);
  sortedCache = { source: batches, data };
  return data;
}

const perAppCache = new Map<AppKey, { source: RunBatch[]; data: RunBatch[] }>();

function getRunsForApp(batches: RunBatch[], app: AppKey): RunBatch[] {
  const cached = perAppCache.get(app);
  if (cached && cached.source === batches) return cached.data;
  const data = getSortedBatches(batches).filter(
    (b) => b.origin.kind === "app" && b.origin.app === app,
  );
  perAppCache.set(app, { source: batches, data });
  return data;
}

/* ─────────────────────────────── store plumbing ─────────────────────────────── */

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): RunStoreSnapshot {
  return snapshot;
}

/** Replaces `snapshot` with a NEW object so useSyncExternalStore sees a
 *  change. Between commits the reference is stable — that's what stops the
 *  render loop described in the file header. */
function commit(nextBatches: RunBatch[]): void {
  snapshot = { batches: nextBatches };
  for (const l of listeners) l();
}

/** Swaps ONE batch by id, keeping every other batch's object reference
 *  untouched — important so `useBatch()` on an UNRELATED batch id doesn't
 *  see a "change" and re-render on somebody else's tick. */
function replaceBatch(batchId: string, next: RunBatch): RunBatch[] {
  return snapshot.batches.map((b) => (b.batchId === batchId ? next : b));
}

/** §21.2/§21.3 — RunBatch.credits is what was CHARGED: done items only.
 *  Failed and cancelled items carry their RATE (so RunItemTile's "Retry this
 *  ad (N credits)" quotes the real cost instead of 0), but nothing was
 *  produced for them, so nothing is charged. */
function chargedTotal(items: RunItem[]): number {
  return items.reduce((sum, i) => (i.status === "done" ? sum + i.credits : sum), 0);
}

const BATCH_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — avoids ambiguity when read aloud

/** §10 — Batch ID = Job ID, one identifier, e.g. "BATCH-8F2K41". Collision
 *  checked against every id ever issued (not just committed ones — seeding
 *  mints several ids before the first commit lands). */
export function newBatchId(): string {
  let id: string;
  do {
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += BATCH_ID_ALPHABET[Math.floor(Math.random() * BATCH_ID_ALPHABET.length)];
    }
    id = `BATCH-${suffix}`;
  } while (issuedBatchIds.has(id));
  issuedBatchIds.add(id);
  return id;
}

/* ─────────────────────────────── deterministic outcomes ─────────────────────────────── */

/**
 * §21.3 — forces a deterministic outcome so a demo walkthrough repeats
 * identically. Purely a function of (outcome, count): no randomness, so
 * calling `startBatch` twice with the same inputs fails the same items every
 * time. Each forced failure gets a DIFFERENT `FailureReason` (cycling through
 * all six) so the failure matrix is visible across a batch, not just one
 * reason repeated.
 */
function computeFailureSet(
  outcome: StartBatchInput["outcome"],
  count: number,
): Map<number, FailureReason> {
  const map = new Map<number, FailureReason>();
  if (!outcome || outcome === "all-done" || count <= 0) return map;

  if (outcome === "all-failed") {
    for (let i = 0; i < count; i++) map.set(i, FAILURE_REASONS[i % FAILURE_REASONS.length]);
    return map;
  }

  if (outcome === "one-failed") {
    // §21.3 "single ad failed inside a good batch" — a middle index, not the
    // first or last, so it doesn't read as "the setup" or "the cleanup" item.
    const idx = Math.min(count - 1, Math.floor(count / 2));
    map.set(idx, FAILURE_REASONS[idx % FAILURE_REASONS.length]);
    return map;
  }

  // "partial" — ~10%, at least one, spread evenly across the batch (never
  // clustered at the end, or it reads as "the last one broke" rather than
  // "one of these broke"). The spec's own example is "19/20"; at prototype
  // batch sizes (3-20 items) this is the same shape at a smaller scale.
  const failCount = Math.max(1, Math.round(count * 0.1));
  for (let k = 0; k < failCount; k++) {
    const idx = Math.min(count - 1, Math.floor(((k + 1) * count) / (failCount + 1)));
    map.set(idx, FAILURE_REASONS[idx % FAILURE_REASONS.length]);
  }
  return map;
}

/* ─────────────────────────────── tick engine ─────────────────────────────── */

function rollStageDuration(): number {
  // 2.1s-6.3s per stage: enough 700ms ticks to see real intermediate
  // progress, short enough that a demo batch resolves in well under a minute.
  return 2100 + Math.random() * 4200;
}

function ensureTicking(): void {
  if (tickHandle !== null) return;
  tickHandle = setInterval(tick, TICK_MS);
}

/** Never leave a timer running on an idle store — checked after every tick
 *  and after a cancel settles. */
function stopTickingIfIdle(): void {
  const anyLive = snapshot.batches.some((b) =>
    b.items.some(
      (i) => i.status === "running" || i.status === "pending" || i.status === "cancelling",
    ),
  );
  if (!anyLive && tickHandle !== null) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

function tick(): void {
  const now = Date.now();
  let anyItemChanged = false;

  const nextBatches = snapshot.batches.map((batch) => {
    let batchChanged = false;
    const stageCount = Math.max(1, batch.stages.length);
    const stageSpan = 100 / stageCount;

    // Pass 1 — advance every currently-running item.
    const advanced = batch.items.map((item): RunItem => {
      if (item.status !== "running") return item;
      const t = timing.get(item.id);
      if (!t) return item; // defensive — every running item should have a timing entry

      const elapsed = now - t.stageStartedAt;
      const frac = Math.min(1, elapsed / t.currentStageTargetMs);

      if (frac < 1) {
        // Mid-stage: interpolate progress, recompute etaSeconds from
        // observed stage durations so far (falling back to the current
        // stage's own planned duration only when nothing has been observed
        // yet — see the file-header note on why there's no fixed ETA).
        const avgStageMs =
          t.doneStageDurationsMs.length > 0
            ? t.doneStageDurationsMs.reduce((a, b) => a + b, 0) / t.doneStageDurationsMs.length
            : t.currentStageTargetMs;
        const stagesLeftAfterThis = stageCount - item.stageIndex - 1;
        const etaMs = Math.max(0, t.currentStageTargetMs - elapsed) + stagesLeftAfterThis * avgStageMs;
        batchChanged = true;
        anyItemChanged = true;
        return {
          ...item,
          progress: item.stageIndex * stageSpan + frac * stageSpan,
          etaSeconds: Math.round(etaMs / 1000),
        };
      }

      // Stage complete.
      t.doneStageDurationsMs.push(elapsed);
      batchChanged = true;
      anyItemChanged = true;
      const isLastStage = item.stageIndex >= stageCount - 1;

      if (!isLastStage) {
        t.stageStartedAt = now;
        t.currentStageTargetMs = rollStageDuration();
        const avgStageMs =
          t.doneStageDurationsMs.reduce((a, b) => a + b, 0) / t.doneStageDurationsMs.length;
        const stagesLeft = stageCount - (item.stageIndex + 1);
        return {
          ...item,
          stageIndex: item.stageIndex + 1,
          progress: (item.stageIndex + 1) * stageSpan,
          etaSeconds: Math.round((stagesLeft * avgStageMs) / 1000),
        };
      }

      // Finished — resolve to the pre-decided outcome. §18: a failure stays
      // in the list as a terminal status, never a toast.
      timing.delete(item.id);
      if (t.willFail) {
        // Fails visibly short of the finish line — "100% then error" reads
        // less true than "got most of the way and didn't make it".
        const failedProgress = 55 + ((item.index * 7) % 40);
        return {
          ...item,
          status: "failed" as RunItemStatus,
          failure: t.willFail,
          progress: failedProgress,
          etaSeconds: undefined,
          // The RATE, not a charge — chargedTotal() skips failed items. This is
          // what "Retry this ad (N credits)" honestly costs.
          credits: rateFor(batch.batchId, item),
        };
      }
      return {
        ...item,
        status: "done" as RunItemStatus,
        progress: 100,
        etaSeconds: undefined,
        credits: rateFor(batch.batchId, item),
      };
    });

    // Pass 2 — promote pending items into any concurrency slot freed up by
    // pass 1. A pending item's eventual outcome was already decided at batch
    // start (`failingIndexByBatch`), so promotion here just starts its clock.
    const runningCount = advanced.filter((i) => i.status === "running").length;
    let freeSlots = MAX_CONCURRENT - runningCount;
    const failingIndexes = failingIndexByBatch.get(batch.batchId);
    const promoted = advanced.map((item): RunItem => {
      if (freeSlots <= 0 || item.status !== "pending") return item;
      freeSlots -= 1;
      batchChanged = true;
      anyItemChanged = true;
      timing.set(item.id, {
        stageStartedAt: now,
        currentStageTargetMs: rollStageDuration(),
        doneStageDurationsMs: [],
        willFail: failingIndexes?.get(item.index) ?? null,
      });
      return { ...item, status: "running" };
    });

    if (!batchChanged) return batch;
    return {
      ...batch,
      items: promoted,
      credits: chargedTotal(promoted),
    };
  });

  if (anyItemChanged) commit(nextBatches);
  stopTickingIfIdle();
}

/* ─────────────────────────────── public API ─────────────────────────────── */

export function startBatch(input: StartBatchInput): string {
  const batchId = newBatchId();
  const failingIndexes = computeFailureSet(input.outcome, input.count);
  const now = Date.now();

  const items: RunItem[] = [];
  for (let i = 0; i < input.count; i++) {
    const id = `${batchId}-item-${i}`;
    const running = i < MAX_CONCURRENT;
    const base: RunItem = {
      id,
      status: running ? "running" : "pending",
      progress: 0,
      stageIndex: 0,
      title: `Output ${i + 1}`,
      credits: 0, // uncharged until the item resolves — see tick()
      index: i,
    };
    const seeded = input.itemSeed ? { ...base, ...input.itemSeed(i) } : base;
    items.push(seeded);
    if (running) {
      timing.set(id, {
        stageStartedAt: now,
        currentStageTargetMs: rollStageDuration(),
        doneStageDurationsMs: [],
        willFail: failingIndexes.get(i) ?? null,
      });
    }
  }

  creditsPerItemByBatch.set(batchId, input.creditsPerItem);
  const planned = distributeCredits(input.creditsTotal ?? input.creditsPerItem * input.count, input.count);
  items.forEach((it, i) => plannedCreditsByItem.set(it.id, planned[i] ?? input.creditsPerItem));
  failingIndexByBatch.set(batchId, failingIndexes);

  const batch: RunBatch = {
    batchId,
    createdAt: now,
    origin: input.origin,
    provenance: "client-created", // a batch the user just started is always theirs — see §21.2
    createdBy: CURRENT_USER,
    label: input.label,
    stages: input.stages,
    items,
    credits: chargedTotal(items),
    config: input.config,
  };

  commit([...snapshot.batches, batch]);
  ensureTicking();
  return batchId;
}

/**
 * §21.3 retry granularity. Retries always resolve to "done" — the point of a
 * demo retry is to prove the flow works, not to re-simulate the same failure
 * forever. (If a "retry can fail again" story is ever wanted, this is the one
 * place — flip `willFail: null` below to something derived instead.)
 *
 * See the `RetryOpts` doc comment above for why `opts.itemId` exists — it is
 * an additive fix for a gap in the locked `retry(batchId, scope, opts?)`
 * signature, which cannot otherwise say WHICH item "this-item" means.
 */
export function retry(batchId: string, scope: RetryScope, opts?: RetryOpts): void {
  const batch = snapshot.batches.find((b) => b.batchId === batchId);
  if (!batch) return;

  const targetIds = new Set<string>();
  for (const item of batch.items) {
    if (scope === "whole-batch") {
      targetIds.add(item.id);
      continue;
    }
    if (item.status !== "failed") continue;
    if (scope === "all-failed" || scope === "different-model") {
      targetIds.add(item.id);
      continue;
    }
    if (scope === "this-item") {
      if (!opts?.itemId) {
        // Fallback, loudly logged: without an item id this can only mean
        // "every failed item" — the caller almost certainly meant to scope
        // to the one tile it was clicked on. See RetryOpts above.
        console.warn(
          '[genieRunStore] retry("this-item") called without opts.itemId — retrying every failed item in the batch as a fallback.',
        );
        targetIds.add(item.id);
      } else if (item.id === opts.itemId) {
        targetIds.add(item.id);
      }
    }
  }
  if (targetIds.size === 0) return;

  const priorRate = creditsPerItemByBatch.get(batchId) ?? 0;
  const mult = scope === "different-model" ? modelMultiplier(opts?.modelId) : 1;
  const nextRate = Math.ceil(priorRate * mult);

  const now = Date.now();
  const items = batch.items.map((item): RunItem => {
    if (!targetIds.has(item.id)) return item;
    if (mult !== 1) plannedCreditsByItem.set(item.id, Math.ceil(rateFor(batchId, item) * mult));
    timing.set(item.id, {
      stageStartedAt: now,
      currentStageTargetMs: rollStageDuration(),
      doneStageDurationsMs: [],
      willFail: null,
    });
    return {
      ...item,
      status: "running",
      progress: 0,
      stageIndex: 0,
      failure: undefined,
      etaSeconds: undefined,
      credits: 0, // re-charged once it resolves, at whatever rate is current
    };
  });

  if (scope === "different-model" && opts?.modelId) {
    // The new rate sticks for the batch going forward — switching model
    // changes the ongoing cost basis, not just this one retry.
    creditsPerItemByBatch.set(batchId, nextRate);
  }

  const nextConfig =
    scope === "different-model" && opts?.modelId ? { ...batch.config, model: opts.modelId } : batch.config;

  commit(
    replaceBatch(batchId, {
      ...batch,
      items,
      config: nextConfig,
      credits: chargedTotal(items),
    }),
  );
  ensureTicking();
}

export function cancelBatch(batchId: string): void {
  const batch = snapshot.batches.find((b) => b.batchId === batchId);
  if (!batch) return;

  let anyChanged = false;
  const items = batch.items.map((item): RunItem => {
    if (item.status === "running") {
      anyChanged = true;
      timing.delete(item.id);
      return { ...item, status: "cancelling" };
    }
    if (item.status === "pending") {
      anyChanged = true;
      return { ...item, status: "cancelled", credits: rateFor(batchId, item) };
    }
    return item; // done / failed / already cancelled(-ling) — untouched; you
    // cannot un-produce an output, and a settle already in flight stays put.
  });
  if (!anyChanged) return;

  commit(replaceBatch(batchId, { ...batch, items }));

  setTimeout(() => {
    const current = snapshot.batches.find((b) => b.batchId === batchId);
    if (!current) return;
    let settled = false;
    const finalItems = current.items.map((item): RunItem => {
      if (item.status === "cancelling") {
        settled = true;
        return { ...item, status: "cancelled", credits: rateFor(batchId, item) };
      }
      return item;
    });
    if (settled) commit(replaceBatch(batchId, { ...current, items: finalItems }));
    stopTickingIfIdle();
  }, CANCEL_SETTLE_MS);
}

/**
 * Retrying on a different model changes the rate — a demo table, not
 * exhaustive, just enough that the button's stated cost varies sensibly: a
 * faster/cheaper fallback model costs less, a higher-fidelity flagship costs
 * more.
 */
// One id space: the picker (RetryModelPicker / PromptReferenceBar) offers
// `genie-*` ids, so the multiplier table must be keyed by them too. The old
// local table ("fast-draft" / "standard" / "pro" / "ultra-hq") matched no id
// the UI could ever send, so every "different model" retry silently ran at ×1.
const DEFAULT_RETRY_MODEL = "genie-1.0";

function modelMultiplier(modelId?: string): number {
  if (!modelId) return 1;
  return MODEL_CREDIT_MULTIPLIER[modelId] ?? 1;
}

export function creditsForRetry(batchId: string, scope: RetryScope, opts?: { modelId?: string }): number {
  const batch = snapshot.batches.find((b) => b.batchId === batchId);
  if (!batch) return 0;
  const rate = creditsPerItemByBatch.get(batchId) ?? 0;
  const failed = batch.items.filter((i) => i.status === "failed");
  // Sum the items' own planned rates — never rate × count, which re-rounds.
  const sum = (items: RunItem[]) => items.reduce((acc, i) => acc + rateFor(batchId, i), 0);

  switch (scope) {
    case "this-item":
      return rate;
    case "all-failed":
      return sum(failed);
    case "whole-batch":
      return sum(batch.items);
    case "different-model":
      // `creditsForRetry(batchId, scope)` has no modelId parameter (same gap
      // noted on RetryOpts above), so this previews the DEFAULT fallback
      // model's rate. If the caller later retries with a specific
      // opts.modelId, the actual charge in retry() may differ — acceptable
      // for a preview, called out here so it isn't mistaken for a bug.
      return Math.ceil(sum(failed) * modelMultiplier(opts?.modelId ?? DEFAULT_RETRY_MODEL));
    default:
      return 0;
  }
}

/* ─────────────────────────────── hooks ─────────────────────────────── */

export function useBatches(): RunBatch[] {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return getSortedBatches(snap.batches);
}

export function useBatch(batchId: string): RunBatch | undefined {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  // `.find()` returns an EXISTING element reference — no cache needed, see
  // the file-header gotcha note.
  return snap.batches.find((b) => b.batchId === batchId);
}

export function useRunsForApp(app: AppKey): RunBatch[] {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return getRunsForApp(snap.batches, app);
}

/* ─────────────────────────────── seeding ─────────────────────────────── */
/*
 * Everything below builds the ~14 historical batches the Library needs the
 * moment it loads, by CONSUMING (never forking) `sampleOutputs` — 15+ other
 * files import that array by reference, so it is read-only here.
 */

/** §17 — a small realistic team, so the admin user-filter has something to
 *  filter. Rahul is both the demo's current user AND appears in the
 *  historical spread, since it's plausible he generated some of these too. */
const CURRENT_USER = "Rahul Saini";
const TEAM = [
  "Rahul Saini",
  "Priya Nair",
  "Aditya Verma",
  "Sana Sheikh",
  "Karan Mehta",
  "Neha Iyer",
  "Rohit Malhotra",
  "Ananya Rao",
];

const LANG_CODES = ["en-IN", "hi", "ta", "en-US", "mr", "bn", "gu", "en-GB"];
const ASPECT_RATIOS = ["4:5", "1:1", "9:16", "16:9"];

const ANGLE_LABEL: Record<string, string> = Object.fromEntries(angles.map((a) => [a.id, a.label]));

/** §8's live-app cost table, straight from the spec (appRegistry.ts doesn't
 *  exist yet — see BRIEF.md §8). Only the 7 live apps are ever used as an
 *  origin below, but keyed loosely so a future app added here doesn't need
 *  an exhaustive Record. */
const APP_RATE: Partial<Record<AppKey, number>> = {
  "translate-videos": 6,
  "avatar-shots": 9,
  "ppt-pdf-to-video": 4,
  "upscale-video": 11,
  "product-placement": 16,
  "face-swap": 13,
  "speech-cleanup": 2,
};

/**
 * DEFECT FIX (adversarial review): seeded historical batches used to quote a
 * hand-picked flat rate (6/12/3 credits per item by mediaType — the old
 * `mediaTypeRate` this replaces) while a freshly-started IDENTICAL Studio run
 * quotes 1-2 credits/item via `computeBreakdown()` — same shape, ~6× the
 * price, no explanation (exactly §21.2's complaint). Root cause: seeded
 * batches never ran through the one formula every live Studio/Results screen
 * already uses (`buildCreditLines` in studio-v4/state/useWizard.ts —
 * Outputs × Concepts × Model × Quality). This builds the SAME `CreditLine[]`
 * shape for a seeded chunk so it can never quote a different number again.
 * Concepts is fixed at 1 — a seeded chunk is one output per generation, not a
 * concept multi-select fan-out. Model is passed in per batch (seedStore
 * cycles it across `MODEL_PRICING` so the Library shows more than one rate).
 * Quality only applies to video (the wizard's own "1080p" default, ×2) —
 * seeded batches carry no distinct resolution field to read instead.
 */
function seedCreditLines(origin: RunOrigin, chunk: OutputData[], modelId: string): CreditLine[] {
  const count = Math.max(chunk.length, 1);
  if (origin.kind === "app") {
    const rate = APP_RATE[origin.app] ?? 6;
    return [
      { label: "Rate", factor: rate, op: "base" },
      { label: "Items", factor: count, op: "multiply", note: `${count} item${count === 1 ? "" : "s"}` },
    ];
  }
  const modelMultiplier = MODEL_CREDIT_MULTIPLIER[modelId] ?? 1;
  const modelName = MODEL_LABEL[modelId] ?? modelId;
  const lines: CreditLine[] = [
    { label: "Outputs", factor: count, op: "base" },
    { label: "Concepts", factor: 1, op: "multiply", note: "1 concept" },
    { label: "Model", factor: modelMultiplier, op: "multiply", note: modelName },
  ];
  if ((chunk[0]?.mediaType ?? "image") === "video") {
    lines.push({ label: "Quality", factor: 2, op: "multiply", note: "1080p" });
  }
  return lines;
}

/** Runs `seedCreditLines` through the SAME `computeBreakdown()` a live run
 *  uses, then splits the total across items with the SAME `distributeCredits`
 *  a live batch uses — so Σ item.credits === the quoted total exactly, no
 *  rounding drift, for a seeded batch exactly as for a real one. `rate` is
 *  the nominal per-item figure `creditsPerItemByBatch`/retry pricing reads —
 *  same `Math.max(1, Math.round(total / count))` shape Step5ResultsQueue
 *  uses for a live batch's `creditsPerItem`. */
function seedCredits(
  origin: RunOrigin,
  chunk: OutputData[],
  modelId: string,
): { total: number; perItem: number[]; rate: number } {
  const total = computeBreakdown(seedCreditLines(origin, chunk, modelId)).total;
  const count = Math.max(chunk.length, 1);
  return {
    total,
    perItem: distributeCredits(total, chunk.length),
    rate: Math.max(1, Math.round(total / count)),
  };
}

const STAGE_SETS: Record<string, string[]> = {
  image: ["Brief", "Draft", "Render", "Polish"],
  video: ["Script", "Storyboard", "Render", "Sound mix", "Finalize"],
  "text-only": ["Draft", "Refine", "Finalize"],
  app: ["Queue", "Process", "Finalize"],
};

function stagesFor(origin: RunOrigin, chunk: OutputData[]): string[] {
  if (origin.kind === "app") return STAGE_SETS.app;
  return STAGE_SETS[chunk[0]?.mediaType ?? "image"] ?? STAGE_SETS.image;
}

function batchLabel(chunk: OutputData[]): string {
  const first = chunk[0];
  if (!first) return "Untitled batch";
  const subject = [first.brand?.name, first.product?.name].filter(Boolean).join(" ");
  const approach = MODE_LABELS[first.mode];
  return subject ? `${subject} · ${approach}` : approach;
}

/**
 * `config.model` MUST be a Genie model id ("genie-1.0" etc, `MODEL_PRICING`'s
 * id space) — that's what `modelLabel()` (batchDisplay.ts) resolves against
 * for the Library detail's "Model" row, and what `BatchActionsBar` reads as
 * `excludeModelId` for the retry-with-different-model picker. This used to
 * read `first.aiModel` ("GPT 5.5" / "Claude Sonnet 4.5" / …) instead — a
 * DIFFERENT id space (OutputData.aiModel names which foundation model
 * rendered that one specific asset, shown separately in HowThisWasMade's own
 * "AI model" field). Passing it through here as `config.model` meant
 * `modelLabel()` could never resolve it, AND it was never the value
 * `seedCredits()`/`computeBreakdown()` priced against — so it takes the same
 * `modelId` the credit calc used instead, closing both gaps in one fix. */
function configFor(
  chunk: OutputData[],
  languageCode: string,
  aspectRatio: string,
  modelId: string,
): RunBatch["config"] {
  const first = chunk[0];
  if (!first) return undefined;
  const angleLabel = first.angleId ? ANGLE_LABEL[first.angleId] ?? first.angleId : undefined;
  return {
    format:
      first.format ?? (first.mediaType === "video" ? "Video" : first.mediaType === "text-only" ? "Adcopy" : "Image"),
    approach: MODE_LABELS[first.mode],
    model: modelId,
    angle: angleLabel,
    language: languageCode,
    aspectRatio,
    promptSnippet:
      first.priorConfig?.promptSnippet ??
      (first.headline ? `${first.headline} — ${first.body ?? ""}`.slice(0, 110).trim() : undefined),
    brandName: first.brand?.name || undefined,
    productName: first.product?.name,
  };
}

function makeDoneItem(batchId: string, idx: number, out: OutputData, creditsPerItem: number, stagesLength: number): RunItem {
  return {
    id: `${batchId}-item-${idx}`,
    status: "done",
    progress: 100,
    stageIndex: Math.max(0, stagesLength - 1),
    title: out.headline || `${out.brand?.name ?? "Untitled"} ${idx + 1}`,
    summary: out.body || undefined,
    tags: out.angleTags ?? (out.angleId ? [ANGLE_LABEL[out.angleId] ?? out.angleId] : undefined),
    thumbnail: out.thumbnail,
    credits: creditsPerItem,
    index: idx,
    outputId: out.id,
  };
}

function makeFailedItem(
  batchId: string,
  idx: number,
  out: OutputData,
  reason: FailureReason,
  stagesLength: number,
  creditsPerItem: number,
): RunItem {
  return {
    id: `${batchId}-item-${idx}`,
    status: "failed",
    // Same "55-94%" band the live tick engine uses for a failure — a seeded
    // failure and a freshly-failed live item look consistent.
    progress: 55 + ((idx * 7) % 40),
    stageIndex: Math.max(0, stagesLength - 1),
    title: out.headline || `${out.brand?.name ?? "Untitled"} ${idx + 1}`,
    summary: out.body || undefined,
    tags: out.angleTags,
    failure: reason,
    credits: creditsPerItem, // the RATE a retry costs — not charged (chargedTotal skips failed)
    index: idx,
    // deliberately no outputId/thumbnail — nothing was produced to join to
  };
}

function makeCancelledItem(
  batchId: string,
  idx: number,
  out: OutputData,
  stagesLength: number,
  creditsPerItem: number,
): RunItem {
  return {
    id: `${batchId}-item-${idx}`,
    status: "cancelled",
    progress: Math.min(95, 15 + idx * 17), // frozen mid-flight, varied per item
    stageIndex: idx % stagesLength,
    title: out.headline || `${out.brand?.name ?? "Untitled"} ${idx + 1}`,
    summary: out.body || undefined,
    tags: out.angleTags,
    credits: creditsPerItem, // rate quoted by "Retry this ad" — never charged
    index: idx,
  };
}

function buildResolvedBatch(params: {
  chunk: OutputData[];
  origin: RunOrigin;
  provenance: Provenance;
  createdBy: string;
  createdAt: number;
  languageCode: string;
  aspectRatio: string;
  modelId: string;
  /** Empty map = every item done. */
  failing: Map<number, FailureReason>;
}): RunBatch {
  const { chunk, origin, provenance, createdBy, createdAt, languageCode, aspectRatio, modelId, failing } = params;
  const batchId = newBatchId();
  const stages = stagesFor(origin, chunk);
  const { perItem, rate } = seedCredits(origin, chunk, modelId);
  const items = chunk.map((out, idx) => {
    const reason = failing.get(idx);
    const credits = perItem[idx] ?? rate;
    return reason
      ? makeFailedItem(batchId, idx, out, reason, stages.length, credits)
      : makeDoneItem(batchId, idx, out, credits, stages.length);
  });
  creditsPerItemByBatch.set(batchId, rate);
  return {
    batchId,
    createdAt,
    origin,
    provenance,
    createdBy,
    label: batchLabel(chunk),
    stages,
    items,
    // DEFECT FIX (adversarial review, follow-through): this used to sum
    // EVERY item's `credits` unconditionally — for a partial/all-failed
    // seeded batch that double-counts a failed item's RATE as if it were
    // charged, which is exactly what this file's own header says
    // `RunBatch.credits` must never do ("done items only... nothing was
    // produced [for failed/cancelled], so nothing is charged" — see
    // `chargedTotal()` above). A live batch already goes through
    // `chargedTotal()` on every tick; a seeded partial/failed batch needs the
    // same function or it quotes a different, inflated number for the same
    // shape — the exact class of drift defect 1 was about.
    credits: chargedTotal(items),
    config: configFor(chunk, languageCode, aspectRatio, modelId),
  };
}

function buildCancelledBatch(params: {
  chunk: OutputData[];
  origin: RunOrigin;
  provenance: Provenance;
  createdBy: string;
  createdAt: number;
  languageCode: string;
  aspectRatio: string;
  modelId: string;
}): RunBatch {
  const { chunk, origin, provenance, createdBy, createdAt, languageCode, aspectRatio, modelId } = params;
  const batchId = newBatchId();
  const stages = stagesFor(origin, chunk);
  const { perItem, rate } = seedCredits(origin, chunk, modelId);
  const items = chunk.map((out, idx) => makeCancelledItem(batchId, idx, out, stages.length, perItem[idx] ?? rate));
  creditsPerItemByBatch.set(batchId, rate);
  return {
    batchId,
    createdAt,
    origin,
    provenance,
    createdBy,
    label: batchLabel(chunk),
    stages,
    items,
    credits: 0, // cancelled work is never charged
    config: configFor(chunk, languageCode, aspectRatio, modelId),
  };
}

let seeded = false;

function seedStore(): void {
  if (seeded) return;
  seeded = true;

  const DAY = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const pool = sampleOutputs; // read-only reference — never forked/mutated (15+ importers depend on it)

  /**
   * DEFECT FIX (adversarial review): chunks used to be built by SLICING
   * `pool` POSITIONALLY (`pool.slice(cursor, cursor + size)`), which pays no
   * attention to which brand an output belongs to — a chunk labelled
   * "Mamaearth Onion shampoo · Product Ad" (batchLabel() reads chunk[0]) ended
   * up containing a Noise smartwatch ad and a boAt earbuds ad purely because
   * they sat next to each other in the array. "A batch is one generation run
   * for one brand/product" (the bug report's own words) — so every chunk
   * below is hand-picked BY id, one brand per chunk, and where the label
   * would name a specific product every item in that chunk shares that
   * product too (e.g. both Mamaearth chunks below are single-product).
   *
   * Sizes vary 1-3 instead of the old fixed 3-5: of the 30 distinct brands in
   * `sampleOutputs`, only Mamaearth, Noise and boAt have enough entries (5
   * each) to fill more than one same-brand chunk — most brands have 1-3. This
   * no longer touches every row in `pool` (the old "sums to exactly 50"
   * property) — that was never a real requirement, just an artifact of
   * positional slicing; using every one of 30 brands isn't necessary for 14
   * demo batches with real state variety, and grouping by brand makes an
   * exact 50-row partition impossible to hit at sizes 3-5 anyway.
   */
  const byId = (id: string): OutputData => {
    const out = pool.find((o) => o.id === id);
    if (!out) throw new Error(`[genieRunStore] seed id not found in sampleOutputs: ${id}`);
    return out;
  };

  const chunks: OutputData[][] = [
    [byId("var_4a2k7q9"), byId("var_mama_3")], // Mamaearth · Onion shampoo (product-ad + ugc-video)
    [byId("var_mama_2"), byId("var_mama_5")], // Mamaearth · VC face wash (product-ad + image-to-ad)
    [byId("var_boat_3")], // boAt · Rockerz 450
    [byId("var_sleep_2")], // Sleepyhead · Original mattress
    [byId("var_wake_1"), byId("var_wake_2")], // Wakefit · Orthopedic mattress
    [byId("var_plum_2")], // Plum · Niacinamide serum
    [byId("var_sugar_1")], // SUGAR · Matte As Hell
    [byId("var_mg_1")], // MyGlamm · LIT kajal
    [byId("var_lk_1")], // Lenskart · Vincent Chase aviators
    [byId("var_bd_1")], // Beardo · Beard oil
    // 10 — partial
    [byId("var_n9k3v1m"), byId("var_noise_2"), byId("var_noise_5")], // Noise · ColorFit Pro 5
    // 11 — wholly failed
    [byId("var_boat_2"), byId("var_boat_4"), byId("var_boat_5")], // boAt · Airdopes 141
    // 12 — cancelled
    [byId("var_bsc_1")], // Bombay Shaving Co. · Sensiblade
  ];

  // Origins spread across studio / several flow modules (real FlowModuleKey +
  // ref titles from RECON.md) / several app keys — §10 requires every asset
  // to show which module it came from.
  const ORIGINS: RunOrigin[] = [
    { kind: "studio" },
    {
      kind: "flow",
      module: "video-sage",
      action: "vary-script",
      refTitle: "FitPro Max — Recovery That Matches Your Hustle",
    },
    { kind: "app", app: "avatar-shots" },
    {
      kind: "flow",
      module: "trends",
      action: "generate-against-trend",
      refTitle: 'Nike Air Max "Move Louder"',
    },
    { kind: "studio" },
    { kind: "app", app: "translate-videos" },
    {
      kind: "flow",
      module: "industry-insights",
      action: "reference-for-new-ad",
      refTitle: '"Trusted by 100K+ teams" — TechPulse',
    },
    { kind: "studio" },
    {
      kind: "flow",
      module: "reports",
      action: "top-performer-as-reference",
      refTitle: "Video — Founder Story",
    },
    { kind: "app", app: "product-placement" },
    // 10 — partial
    {
      kind: "flow",
      module: "campaign-urls",
      action: "generate-from-url",
      refTitle: "mamaearth.in/onion-hair-fall — Winter Offer",
    },
    // 11 — wholly failed
    { kind: "app", app: "face-swap" },
    // 12 — cancelled
    { kind: "studio" },
  ];

  const PROVENANCE: Provenance[] = [
    "fabfunnel-seeded",
    "client-created",
    "client-created",
    "fabfunnel-seeded",
    "client-created",
    "client-created",
    "fabfunnel-seeded",
    "client-created",
    "client-created",
    "client-created",
    "client-created", // partial
    "client-created", // failed
    "client-created", // cancelled
  ];

  // ~3 weeks of spread (oldest = cancelled batch), so "latest batch first"
  // actually sorts to something interesting. The live batch (index 13) isn't
  // in this list — it's created via the real startBatch() below, createdAt
  // = now.
  const OFFSET_DAYS = [0.4, 1.1, 2.3, 3, 4.2, 5, 6.6, 8, 9.4, 11, 13.5, 16, 20];

  const resolved: RunBatch[] = [];

  // Model cycled per batch through MODEL_PRICING (genie-1.0 / genie-2.0-pro /
  // genie-flash / genie-video / genie-labs) so the Library shows more than
  // one rate — same id space `seedCredits()`/`configFor()` price and display
  // against, never a hand-picked number (see the DEFECT FIX note above).
  const modelIdFor = (i: number): string => MODEL_PRICING[i % MODEL_PRICING.length].id;

  for (let i = 0; i < 10; i++) {
    resolved.push(
      buildResolvedBatch({
        chunk: chunks[i],
        origin: ORIGINS[i],
        provenance: PROVENANCE[i],
        createdBy: TEAM[i % TEAM.length],
        createdAt: nowMs - OFFSET_DAYS[i] * DAY,
        languageCode: LANG_CODES[i % LANG_CODES.length],
        aspectRatio: ASPECT_RATIOS[i % ASPECT_RATIOS.length],
        modelId: modelIdFor(i),
        failing: new Map(),
      }),
    );
  }

  // 10 — partial ("19/20"-style at prototype scale: mostly done, one
  // specific FailureReason).
  resolved.push(
    buildResolvedBatch({
      chunk: chunks[10],
      origin: ORIGINS[10],
      provenance: PROVENANCE[10],
      createdBy: TEAM[10 % TEAM.length],
      createdAt: nowMs - OFFSET_DAYS[10] * DAY,
      languageCode: LANG_CODES[10 % LANG_CODES.length],
      aspectRatio: ASPECT_RATIOS[10 % ASPECT_RATIOS.length],
      modelId: modelIdFor(10),
      failing: computeFailureSet("partial", chunks[10].length),
    }),
  );

  // 11 — wholly failed, cycling a DIFFERENT reason per item so the failure
  // matrix is visible on one card.
  resolved.push(
    buildResolvedBatch({
      chunk: chunks[11],
      origin: ORIGINS[11],
      provenance: PROVENANCE[11],
      createdBy: TEAM[11 % TEAM.length],
      createdAt: nowMs - OFFSET_DAYS[11] * DAY,
      languageCode: LANG_CODES[11 % LANG_CODES.length],
      aspectRatio: ASPECT_RATIOS[11 % ASPECT_RATIOS.length],
      modelId: modelIdFor(11),
      failing: computeFailureSet("all-failed", chunks[11].length),
    }),
  );

  // 12 — cancelled mid-flight. EVERY item must be "cancelled" — batchStatus()
  // in genieRunTypes.ts only reports "cancelled" when every item is; a mixed
  // done/cancelled batch would misreport as "done".
  resolved.push(
    buildCancelledBatch({
      chunk: chunks[12],
      origin: ORIGINS[12],
      provenance: PROVENANCE[12],
      createdBy: TEAM[12 % TEAM.length],
      createdAt: nowMs - OFFSET_DAYS[12] * DAY,
      languageCode: LANG_CODES[12 % LANG_CODES.length],
      aspectRatio: ASPECT_RATIOS[12 % ASPECT_RATIOS.length],
      modelId: modelIdFor(12),
    }),
  );

  commit(resolved);

  // 13 — genuinely live. Goes through the real startBatch()/tick() path (not
  // the resolved-snapshot helpers above), so the Library's "in progress"
  // strip shows an ACTUALLY-ticking batch the moment the app loads, not a
  // static mock of one. Brand fix: this used to be a positional slice of
  // whatever was left over in `pool` — now it's the one remaining Mamaearth
  // output (the other 4 seed chunks[0]/chunks[1] above), so it stays the same
  // brand the origin's own refTitle ("Mamaearth · Hero 1") names.
  const liveChunk = [byId("var_mama_4")]; // Mamaearth · brand-ad (no product)
  const liveOrigin: RunOrigin = {
    kind: "flow",
    module: "creative-library",
    action: "use-concept",
    refTitle: "Mamaearth · Hero 1",
  };
  const liveModelId = modelIdFor(13);
  const liveCredits = seedCredits(liveOrigin, liveChunk, liveModelId);
  startBatch({
    origin: liveOrigin,
    label: batchLabel(liveChunk),
    stages: stagesFor(liveOrigin, liveChunk),
    count: liveChunk.length,
    creditsPerItem: liveCredits.rate,
    creditsTotal: liveCredits.total, // exact quoted figure — never re-rounded, same as a real Studio run
    config: configFor(liveChunk, "en-IN", "4:5", liveModelId),
    itemSeed: (i) => {
      const out = liveChunk[i];
      return out ? { title: out.headline || `Output ${i + 1}`, summary: out.body || undefined, tags: out.angleTags } : {};
    },
  });
}

seedStore();
