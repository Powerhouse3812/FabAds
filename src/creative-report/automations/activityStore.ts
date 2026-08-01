/**
 * Creative Report 3.0 — automation run activity log.
 *
 * `rulesStore.ts` already tracks aggregate bookkeeping per rule
 * (`lastRunAt`/`lastMatchCount`), but there's no per-creative record of what
 * a rule actually did. This store is that record: one entry per (rule run,
 * creative acted on), across every rule, so RuleList's per-rule detail and
 * Automations' Activity tab can both show "what actually happened" instead
 * of just "rules exist."
 *
 * localStorage-backed useSyncExternalStore, same discipline as
 * fireLedger.ts/boards.ts: module-cached `state`, `snapshot()` returns it
 * directly with no construction, `persist()` builds the new reference then
 * writes localStorage then emits, `sanitize()` never throws on corrupt JSON.
 * `setItem` is guarded in a try/catch regardless (mirrors fireLedger.ts) —
 * an uncapped append-only log would eventually blow a quota and wedge the
 * store, so this one is capped at `MAX_ENTRIES` on every write as well as
 * on read, belt and braces.
 *
 * `ruleName` and `creativeName` are denormalised onto every entry: a
 * deleted rule or a creative that's since dropped out of the current
 * dataset must still explain its own history, never fall back to a raw id.
 *
 * WRITE PATH: exactly one shared function, `recordRuleActivity`, is the
 * single place both "Run now" (engine.ts's `runRule`) and the auto pass
 * (runner.ts's `evaluateOneRule`) go through — neither caller has to know
 * this log's shape, they just hand over the matched creatives + the action
 * registry's outcome and this module turns that into rows.
 */
import { useSyncExternalStore } from "react";
import type { AutomationRule } from "@/creative-report/automations/model";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export interface ActivityEntry {
  id: string;
  ruleId: string;
  /** Denormalised — a deleted rule's history must still explain itself. */
  ruleName: string;
  creativeId: string;
  /** Denormalised — same reason, for a creative that's left the dataset. */
  creativeName: string;
  /** e.g. "addToFolder" — never surfaced raw to the user without a label. */
  actionType: string;
  outcome: "applied" | "skipped";
  /** Honest, human-readable — e.g. `filed into "Winners"`, or why it was skipped. */
  detail: string;
  /** ISO. */
  at: string;
  source: "auto" | "manual";
  simulated: true;
}

interface ActivityState {
  entries: ActivityEntry[];
}

const KEY = "creative-report-automation-activity";

/** ~300 newest, per the brief — an uncapped append-only array in
 *  localStorage will eventually throw on setItem and wedge the store. */
const MAX_ENTRIES = 300;

const DEFAULT_STATE: ActivityState = { entries: [] };

function isValidEntry(e: unknown): e is ActivityEntry {
  if (!e || typeof e !== "object") return false;
  const entry = e as ActivityEntry;
  return (
    typeof entry.id === "string" &&
    typeof entry.ruleId === "string" &&
    typeof entry.ruleName === "string" &&
    typeof entry.creativeId === "string" &&
    typeof entry.creativeName === "string" &&
    typeof entry.actionType === "string" &&
    (entry.outcome === "applied" || entry.outcome === "skipped") &&
    typeof entry.detail === "string" &&
    typeof entry.at === "string" &&
    (entry.source === "auto" || entry.source === "manual")
  );
}

/** Validate localStorage payloads defensively — corrupt/hand-edited JSON
 *  must degrade to the default state, never crash the Automations screen. */
function sanitize(raw: unknown): ActivityState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_STATE;
  const { entries } = raw as Partial<ActivityState>;
  if (!Array.isArray(entries)) return DEFAULT_STATE;
  const valid = entries.filter(isValidEntry).map((e) => ({ ...e, simulated: true as const }));
  return { entries: valid.slice(0, MAX_ENTRIES) };
}

function readInitial(): ActivityState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: ActivityState = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded or storage unavailable — keep the in-memory state and
      // don't let a write failure wedge the store.
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): ActivityState {
  return state;
}

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `activity-${Date.now()}-${idCounter}`;
}

interface RecordActivityInput {
  ruleId: string;
  ruleName: string;
  creativeId: string;
  creativeName: string;
  actionType: string;
  outcome: "applied" | "skipped";
  detail: string;
  at: string;
  source: "auto" | "manual";
}

/** Appends entries newest-first, capped at MAX_ENTRIES (drops the oldest).
 *  Not exported — callers go through `recordRuleActivity` below so the
 *  per-creative fan-out lives in one place. */
function appendEntries(inputs: RecordActivityInput[]): void {
  if (inputs.length === 0) return;
  const newEntries: ActivityEntry[] = inputs.map((input) => ({ ...input, id: makeId(), simulated: true }));
  state = { entries: [...newEntries, ...state.entries].slice(0, MAX_ENTRIES) };
  persist();
}

/** One registry result, carrying the action it came from. `actionType` is
 *  threaded through rather than inferred, because a rule may now hold more
 *  than one action (addToFolder AND syncToAccounts) — attributing every row
 *  to `actions[0]` would mislabel a sync row as a folder-filing. */
export interface RuleRunOutcomeItem {
  actionType: string;
  text: string;
}

export interface RuleRunOutcome {
  /** Past-tense applied labels straight from the registry, e.g. `filed into "Winners"`. */
  labels: RuleRunOutcomeItem[];
  /** Honest reasons an action applied nothing, straight from the registry. */
  skipReasons: RuleRunOutcomeItem[];
}

/**
 * THE shared write path — called from engine.ts's `runRule` (manual "Run
 * now", `source: "manual"`) and runner.ts's `evaluateOneRule` (the auto
 * pass, `source: "auto"`) with the SAME shape of information: the rule, the
 * creatives the action(s) actually ran against, and the registry's outcome.
 * Neither caller loops over creatives itself — this is the one place that
 * turns "N creatives, M outcomes" into per-creative rows.
 *
 * Each outcome item carries its OWN `actionType` (see RuleRunOutcomeItem).
 * This used to read `rule.actions[0]`, which was correct only while the
 * RuleAction union had a single member; a rule that both files into a folder
 * AND syncs to an ad account would have logged every row as the first
 * action's type.
 *
 * Logs nothing when nothing matched — a run over zero creatives has no
 * per-creative story to tell; the aggregate "Last run … 0 matched" line
 * (rulesStore.ts) already covers that case honestly.
 */
export function recordRuleActivity(params: {
  rule: Pick<AutomationRule, "id" | "name" | "actions">;
  matched: CreativeRollup[];
  outcome: RuleRunOutcome;
  source: "auto" | "manual";
  at: string;
}): void {
  const { rule, matched, outcome, source, at } = params;
  if (matched.length === 0) return;

  const entries: RecordActivityInput[] = [];
  for (const item of outcome.labels) {
    for (const rollup of matched) {
      entries.push({
        ruleId: rule.id,
        ruleName: rule.name,
        creativeId: rollup.creative.id,
        creativeName: rollup.creative.name,
        actionType: item.actionType,
        outcome: "applied",
        detail: item.text,
        at,
        source,
      });
    }
  }
  for (const item of outcome.skipReasons) {
    for (const rollup of matched) {
      entries.push({
        ruleId: rule.id,
        ruleName: rule.name,
        creativeId: rollup.creative.id,
        creativeName: rollup.creative.name,
        actionType: item.actionType,
        outcome: "skipped",
        detail: item.text,
        at,
        source,
      });
    }
  }
  appendEntries(entries);
}

/** Local demo reset — labelled as such everywhere it's surfaced in the UI.
 *  Never a stand-in for a real audit-log deletion (there's no real audit
 *  log; nothing here ever reached a real system). */
export function clearActivity(): void {
  if (state.entries.length === 0) return;
  state = DEFAULT_STATE;
  persist();
}

/** THE ONLY HOOK — if you ever add a second, you've reintroduced the
 *  getSnapshot-constructs-a-new-object bug that already white-screened this
 *  repo once (see boards.ts's own comment on it). Consumers call this once
 *  and derive (filter/group/slice) with `useMemo`, never a second store hook. */
export function useActivityLog(): ActivityState {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}
