/**
 * clock.ts — Single module-level tick loop shared by every workflow runner.
 *
 * Part of `src/workflows/core/`, the domain-agnostic workflow seam. NO-IMPORTS
 * RULE: nothing here may import `@/creative-report/*`, `@/data/*`,
 * `@/components/*`, or `react`.
 *
 * There is exactly ONE `setInterval` for the whole app, owned by this module
 * — not by any component — so it survives navigation (that's what "uploaded
 * in the background" requires). Do not copy Genie's setTimeout-chain-inside-
 * useEffect pattern; that dies on unmount.
 */

export const WORKFLOW_TICK_MS = 500;

type TickFn = (now: Date) => void;

let armed = false;
let intervalHandle: ReturnType<typeof setInterval> | null = null;
const runners = new Map<string, TickFn>();
const warnedIds = new Set<string>();

function runAllRunners(): void {
  const now = new Date();
  for (const [id, fn] of runners) {
    try {
      fn(now);
    } catch (err) {
      // A throwing runner must not kill the interval or block other runners.
      // Log once per id so a persistently-broken runner doesn't spam the console.
      if (!warnedIds.has(id)) {
        warnedIds.add(id);
        console.error(`[workflows/clock] runner "${id}" threw; further errors from it will be suppressed.`, err);
      }
    }
  }
}

/** Starts or stops the shared interval so it exists only while armed AND at least one runner is registered. */
function syncIntervalState(): void {
  const shouldRun = armed && runners.size > 0;
  if (shouldRun && intervalHandle === null) {
    intervalHandle = setInterval(runAllRunners, WORKFLOW_TICK_MS);
  } else if (!shouldRun && intervalHandle !== null) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

/**
 * Registers a runner under `id`. Idempotent per id — re-registering the same
 * id replaces the previous function rather than duplicating it (React
 * StrictMode double-mounts call this twice; two intervals would double every
 * upload). Returns an unregister function; unregistering only removes the
 * entry if it still points at this exact registration, so a stale cleanup
 * from an earlier mount can't delete a fresher one.
 */
export function registerWorkflowRunner(id: string, fn: TickFn): () => void {
  runners.set(id, fn);
  syncIntervalState();
  return () => {
    if (runners.get(id) === fn) {
      runners.delete(id);
      syncIntervalState();
    }
  };
}

/** Arms or disarms the shared clock. Disarming stops the interval even if runners remain registered. */
export function setClockArmed(armedValue: boolean): void {
  armed = armedValue;
  syncIntervalState();
}

export function isClockArmed(): boolean {
  return armed;
}

/** Runs every registered runner immediately — used right after a rule is created so a demo doesn't wait for the next tick. */
export function tickNow(): void {
  runAllRunners();
}
