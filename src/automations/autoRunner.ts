/**
 * autoRunner.ts — the auto-evaluation pass for canvas workflows.
 *
 * `runEngine.ts` shipped MANUAL RUN ONLY and named its own successor: "the
 * future auto path is a copy of `@/creative-report/automations/runner.ts`'s
 * eligible-rules pass plus its own fire ledger". This is that file. It owns
 * exactly two decisions:
 *
 *   1. WHEN to evaluate — every 20th tick of the shared module-level clock
 *      (~10s at WORKFLOW_TICK_MS = 500), the same cadence v3's runner uses.
 *   2. WHICH graph starts — the first eligible graph in `getWorkflowGraphs()`
 *      order that isn't inside its re-fire gap.
 *
 * It deliberately owns NEITHER of these:
 *   - WHETHER a graph may ARM       -> `analyseWorkflow`/`hasBlockers` from
 *     `@/automations/recommendations`. Every arm switch reads the same two
 *     functions, so there is no second copy of the rule here.
 *     NOTE: the builder's Run button reads NEITHER, on purpose. A manual run of
 *     a blocked graph logs each blocked step as `skipped` with its reason,
 *     which is honest and is the quickest way to see what's wrong. Unattended
 *     repetition is the thing that must be gated, not one deliberate press.
 *     `hasBlockers`' own doc explains the split; the builder states it on
 *     screen.
 *   - WHAT a run actually does      -> `startRunSimulated` builds the step list,
 *     walks the graph, and drives every step off `runsStore`. This file never
 *     touches a node.
 *
 * DIFFERENT UNIT OF WORK FROM v3's RUNNER, on purpose. v3 fires per-creative on
 * a rising edge and needs a fire ledger of creative ids. A canvas workflow is a
 * WHOLE-GRAPH run: the unit is the run, not the creative, so the "don't re-fire
 * forever" guard is a per-graph time gap (`AUTO_RUN_MIN_GAP_MS`) rather than a
 * set of marks. Same disease, different anatomy — copying v3's ledger shape
 * here would have meant a ledger with one entry per graph, which is just a
 * timestamp with extra steps.
 *
 * A THIRD registration on the shared clock, keyed `workflows-canvas-auto`.
 * `registerWorkflowRunner` is a keyed Map, so this coexists with
 * `creative-report-automations` (v3's rules) and `workflows-canvas` (the run
 * engine advancing in-flight runs). This file advances NOTHING itself — the run
 * engine's own registration already does that, and duplicating `advanceRun`
 * here would double-step every run.
 *
 * NEVER `setClockArmed(false)` on unmount. `armed` is a shared global latch;
 * disarming it here would silence the other two domains' runners. The clock
 * clears its own interval once no runners remain (`syncIntervalState`).
 *
 * NO REACT STATE and NO `Math.random`. The gap ledger is a module-level Map so
 * it survives navigation between the module's screens, and every decision is a
 * function of the graphs, the clock, and that ledger.
 */
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import {
  registerWorkflowRunner,
  scheduleState,
  setClockArmed,
  WORKFLOW_TICK_MS,
} from "@/workflows/core";
import { getWorkflowGraphs } from "@/automations/graphStore";
import { analyseWorkflow, hasBlockers } from "@/automations/recommendations";
import { startRunSimulated } from "@/automations/runEngine";
import { getActiveRun } from "@/automations/runsStore";
import type { WorkflowGraph } from "@/automations/model";

/** Distinct from `workflows-canvas` (the run engine) and
 *  `creative-report-automations` (v3's rules). All three live in the clock's
 *  keyed map at once. */
const RUNNER_ID = "workflows-canvas-auto";

/**
 * One evaluation pass per 20 ticks — ~10s, exactly v3's `EVAL_EVERY_N_TICKS`.
 * Slow enough that a demo watcher sees discrete events rather than a blur, fast
 * enough that an armed workflow feels like it reacted on its own.
 */
const EVAL_EVERY_N_TICKS = 20;
export const AUTO_EVALUATION_INTERVAL_MS = EVAL_EVERY_N_TICKS * WORKFLOW_TICK_MS;

/**
 * Minimum gap between two auto-started runs of the SAME workflow.
 *
 * Without this, an eligible graph restarts every ~10s forever: the run history
 * fills with near-identical runs, every one of them honest and every one of
 * them noise. A minute is the smallest gap that still reads as "it re-checks on
 * its own" in a demo while leaving the run log legible.
 *
 * Measured against the graph's own `lastRunAt` — so a MANUAL run also holds
 * auto-run off for a minute, which is what a user who just pressed Run expects.
 */
export const AUTO_RUN_MIN_GAP_MS = 60_000;

/* ------------------------------------------------------------------ */
/*  The armed/idle verdict                                             */
/* ------------------------------------------------------------------ */

export interface AutoRunState {
  armed: boolean;
  /** One sentence, honest about mechanics. UI renders this verbatim. */
  reason: string;
}

/**
 * Whether `graph` would auto-run at instant `now`, and why not when it wouldn't.
 *
 * THE SINGLE SOURCE OF TRUTH for the eligibility rule: the pass below calls
 * this too rather than re-deriving `enabled && inWindow && !blockers`. UI that
 * re-implemented any part of it could show "Armed" on a graph this file skips,
 * and a badge that disagrees with the engine is worse than no badge.
 *
 * `now` is a parameter, never `new Date()` inside — the caller stamps time once
 * (one pass, one timestamp) so every graph in a pass is judged against the same
 * instant. Callers on the render path should `useMemo` this: `analyseWorkflow`
 * walks the edge list a handful of times.
 *
 * COPY RULE: the armed sentence must state that the clock is in the page. There
 * is no server here — closing the tab stops everything — and an "Armed" badge
 * that implies otherwise is the same lie as a switch that does nothing.
 * Register matched to `CreativeReportScreen`'s "evaluated about every 10
 * seconds while the report is open".
 */
export function describeAutoRunState(graph: WorkflowGraph, now: Date): AutoRunState {
  // BLOCKERS ARE COMPUTED FIRST, ON PURPOSE — do not "simplify" this back to an
  // early `!graph.enabled` return.
  //
  // The armed VERDICT is a straight precedence chain (off beats schedule beats
  // blockers, same as v3's `isRuleEligible`), and an early return got that
  // right. But this function's `reason` is also the text every surface attaches
  // to a DISABLED switch, and the disable predicate is `!enabled && blockers` —
  // exactly the state the early return skipped past. An adversarial pass caught
  // it: a blocked-and-off workflow explained its dead switch with
  // "this workflow only runs when you press Run", which never mentions the
  // blockers that are the actual cause. Worse, the blocker sentence was
  // unreachable in a fresh demo, because every template and every new graph
  // ships `enabled: false`.
  //
  // So: verdict keeps its precedence, copy does not. An off graph that ALSO has
  // blockers says both things.
  const recs = analyseWorkflow(graph);
  const blockerCount = recs.filter((r) => r.severity === "blocker").length;
  const blocked = hasBlockers(recs);
  const plural = blockerCount === 1 ? "" : "s";

  if (!graph.enabled) {
    // Deliberately NOT "only runs when you press Run" in the blocked case: for a
    // graph with no trigger or a cycle, `startRunSimulated` refuses outright, so
    // that promise would be false in the one state it was most likely to be read
    // in (a brand-new empty workflow has a no-trigger blocker on creation).
    return {
      armed: false,
      reason: blocked
        ? `Auto-run is off, and ${blockerCount} blocker${plural} would keep it off. Press Run to see what each one does to a run.`
        : "Auto-run is off — this workflow only runs when you press Run.",
    };
  }

  // `scheduleState` is `isWithinSchedule` plus the reason string, so this one
  // call covers both the verdict and the copy. Its `reason` is already
  // human-facing ("Starts 4 Aug" / "Ended 12 Jul").
  const schedule = scheduleState(graph.schedule, now);
  if (!schedule.active) {
    const window = schedule.reason
      ? `${schedule.reason} — outside its date range, so auto-run stays idle.`
      : "Outside its date range, so auto-run stays idle.";
    return {
      armed: false,
      reason: blocked ? `${window} It also has ${blockerCount} blocker${plural} to fix.` : window,
    };
  }

  // The copy deliberately does NOT say a run would be dishonest. It wouldn't:
  // depending on the blocker, a run either refuses to start and says why, logs
  // the blocked step as `skipped` with its reason, or runs and matches nothing.
  // All three are truthful, and pressing Run is the fastest way to find out
  // which one you have — so the sentence points there instead of implying Run
  // is unsafe.
  if (blocked) {
    return {
      armed: false,
      reason: `${blockerCount} blocker${plural} to fix first — auto-run stays off until they're cleared. Press Run to see what each one does to a run.`,
    };
  }

  return {
    armed: true,
    reason:
      "Armed — checked about every 10 seconds while FabAds is open, and started at most once a minute. The clock runs in this page, so nothing happens while the tab is closed.",
  };
}

/* ------------------------------------------------------------------ */
/*  The re-fire guard                                                  */
/* ------------------------------------------------------------------ */

/**
 * Auto-start marks, keyed by graph id. Module scope, not React state — this
 * pass ticks off a module-level interval with no render attached, and a
 * component-owned Map would reset on every navigation, which is precisely the
 * moment a demo would see a workflow restart twice in ten seconds.
 *
 * Belt to `lastRunAt`'s braces. `lastRunAt` alone is nearly enough (the run
 * engine stamps it via `recordWorkflowLastRun`), but it is user-visible
 * persisted data: an edit, an import, or a storage clear can move it backwards,
 * and this Map means the worst that does is forget the gap for this session
 * rather than restart the same workflow every ten seconds.
 */
const lastAutoStartMs = new Map<string, number>();

/** Once-per-graph console warning, so a graph that keeps being refused names
 *  itself without spamming every 10 seconds. Mirrors v3's
 *  `warnedMissingAction`. */
const warnedRefusal = new Set<string>();

/** ISO -> ms, or null for absent/unparseable. `lastRunAt` comes back from
 *  localStorage as an unvalidated string, so a bad value must degrade to "no
 *  mark" rather than to `NaN` comparisons that silently pass the gap check. */
function isoToMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** True while `graph` is inside its cool-down. Takes the LATER of the two
 *  marks: whichever ran more recently — manual or auto — is the one the gap
 *  should be measured from. */
function withinReFireGap(graph: WorkflowGraph, nowMs: number): boolean {
  const persisted = isoToMs(graph.lastRunAt);
  const inMemory = lastAutoStartMs.get(graph.id) ?? null;
  if (persisted === null && inMemory === null) return false; // Never run: fire now.
  const last = Math.max(persisted ?? -Infinity, inMemory ?? -Infinity);
  return nowMs - last < AUTO_RUN_MIN_GAP_MS;
}

/* ------------------------------------------------------------------ */
/*  The evaluation pass                                               */
/* ------------------------------------------------------------------ */

/**
 * ONE run per pass, never a loop over eligible graphs.
 *
 * `runsStore`'s invariant is one active run app-wide, so `startRunSimulated`
 * refuses the second call in the same pass anyway — looping would just burn
 * every other eligible graph's turn on a guaranteed refusal and, worse, would
 * make the refusal look like the graph's fault. Instead the pass starts the
 * first eligible graph and leaves the rest for the next pass ~10s later, so a
 * queue of armed workflows drains one at a time in list order.
 *
 * DETERMINISTIC PICK: first in `getWorkflowGraphs()` order — the store's own
 * creation order. No `Math.random`, no "most stale first" heuristic; a demo run
 * twice from the same localStorage must produce the same sequence (the same
 * reproducibility rule `runEngine`'s `stepDurationMs` states).
 */
function runAutoPass(now: Date): void {
  // A run already in flight: skip the whole pass rather than per-graph. Nothing
  // can start while it runs, and `startRunSimulated`'s refusal string ("X is
  // still running") is written for a human who just clicked, not for a silent
  // pass.
  if (getActiveRun()) return;

  const nowMs = now.getTime();

  // `getWorkflowGraphs()`, not `useWorkflowGraphs()` — this pass has no render
  // attached. It returns the store's own module variable, so a workflow armed
  // microseconds ago is already visible here (a render-driven mirror would be
  // one render stale).
  for (const graph of getWorkflowGraphs()) {
    if (!describeAutoRunState(graph, now).armed) continue;
    if (withinReFireGap(graph, nowMs)) continue;

    const result = startRunSimulated(graph.id);

    if (result.status === "refused") {
      // Reachable despite the checks above — the graph could have been edited
      // between this pass's eligibility read and the call. Deliberately NO
      // toast: a recurring "can't run this" every 10s is pure noise for
      // something the user never asked for. Deliberately no mark either, so the
      // next pass retries and the workflow starts working the moment the graph
      // is fixed.
      if (!warnedRefusal.has(graph.id)) {
        warnedRefusal.add(graph.id);
        console.warn(
          `[automations/autoRunner] auto-run refused for "${graph.name}": ${result.reason}`,
        );
      }
      continue;
    }

    // Marked only AFTER a run actually started. Marking first would silently
    // hold an armed workflow off for a minute on a refusal it had no part in.
    lastAutoStartMs.set(graph.id, nowMs);
    warnedRefusal.delete(graph.id);

    // One toast per auto-started run, and it says "simulated" out loud —
    // `runWorkflowWithFeedback`'s copy, minus its refusal branch (which would
    // spam). A run the user didn't click needs to announce itself, otherwise
    // the run log grows entries nobody saw appear.
    toast({
      title: `${graph.name} — auto-run started (simulated)`,
      description:
        "Steps light up as they complete. Nothing is sent to a real ad account.",
    });

    return; // One per pass.
  }
}

/* ------------------------------------------------------------------ */
/*  The tick                                                          */
/* ------------------------------------------------------------------ */

let tickCount = 0;

function onTick(now: Date): void {
  // Nothing per-tick here on purpose. In-flight runs are advanced by
  // `runEngine`'s own `workflows-canvas` registration and the sync queue by
  // both of the existing runners; a second `advanceRun`/`advanceQueue` from
  // this file would double-step every run. This registration exists solely to
  // count to 20.
  tickCount += 1;
  if (tickCount >= EVAL_EVERY_N_TICKS) {
    tickCount = 0;
    runAutoPass(now);
  }
}

/**
 * Runs a pass immediately instead of waiting up to ~10s — call right after a
 * workflow is armed so the effect lands in the same breath as the click.
 * Resets the tick counter so the next scheduled pass is a full interval away
 * rather than landing a tick later. Mirrors v3's `runEvaluationPassNow`.
 */
export function runAutoPassNow(): void {
  tickCount = 0;
  runAutoPass(new Date());
}

/* ------------------------------------------------------------------ */
/*  Mount                                                             */
/* ------------------------------------------------------------------ */

let refCount = 0;
let unregister: (() => void) | null = null;

function start(): void {
  tickCount = 0;
  unregister = registerWorkflowRunner(RUNNER_ID, onTick);
  setClockArmed(true);
  // Immediate pass on start, so opening the module with an already-armed
  // workflow acts at once instead of showing an idle screen for ten seconds.
  runAutoPassNow();
}

function stop(): void {
  unregister?.();
  unregister = null;
  // Deliberately NOT `setClockArmed(false)`. See the file header: `armed` is a
  // shared latch and disarming it would silence v3's rules runner and the
  // canvas run engine along with this pass.
}

/**
 * Mounted ONCE, from `AutomationsLayout`.
 *
 * REFCOUNTED, because React StrictMode double-mounts every effect in dev:
 * mount -> unmount -> mount. The refcount collapses that to a single
 * registration — first mount takes the count 0 -> 1 and starts, further mounts
 * only increment, the last unmount stops. The second `start()` in StrictMode's
 * sequence would otherwise fire a second immediate pass; harmless even so,
 * since the first pass's mark puts the graph inside its re-fire gap.
 *
 * `registerWorkflowRunner` is itself idempotent per id, so this is belt and
 * braces: the refcount prevents the double *pass*, the clock's keyed map
 * prevents the double *registration*.
 */
export function useCanvasAutoRunner(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    refCount += 1;
    if (refCount === 1) start();
    return () => {
      refCount -= 1;
      if (refCount === 0) stop();
    };
  }, [enabled]);
}
