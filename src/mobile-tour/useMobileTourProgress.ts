import { useSyncExternalStore } from "react";

/**
 * useMobileTourProgress — persistent state for Flow B ("Mobile tour").
 *
 * WHY PERSISTENT
 * Flow B's payload is a getting-started CHECKLIST, not a one-shot carousel. A
 * checklist that forgets what you ticked is worse than no checklist: it asks the
 * user to re-derive their own progress on every visit, which is exactly the
 * memory load NN/g #6 (recognition over recall) says to remove. So tick state
 * lives in localStorage and survives reloads, tab switches and route changes.
 *
 * PATTERN
 * Same shape as `src/components/shell/useSubNavCollapsed.ts`: module-level
 * state + a listener Set + `useSyncExternalStore`, so the home card, the tour
 * sheet and the More menu all render from one source of truth without a
 * provider. Two additions on top of that file:
 *   - the snapshot is a cached object, recomputed only on write, because
 *     `useSyncExternalStore` requires a referentially stable snapshot;
 *   - a `storage` listener, so a second tab (or a reset triggered elsewhere)
 *     does not leave this tab showing stale ticks.
 *
 * ON AUTO-TICKING — READ BEFORE "IMPROVING" THIS
 * `done` is MANUAL ONLY. There is deliberately no completion detection.
 * Following a brand, saving to a board and creating a generation all live behind
 * Supabase-backed react-query hooks keyed on auth + workspace
 * (`use-insight-follows.ts`, `use-insight-boards.ts`, `use-genie-generations.ts`),
 * and the only cheap signal available from them is "count > 0" — which is true
 * for every existing user who has done nothing in this tour, so it would tick
 * items the user never touched and quietly turn the checklist into a lie.
 *
 * What IS detected, because it is genuinely observable and free: `opened` —
 * the user tapped the deep link out of the checklist. That is a fact about
 * navigation, not a claim about completion, and the UI labels it as such
 * ("Opened — mark it done?"). Do not promote `opened` to `done` automatically.
 */

/** Namespaced per the house convention (`fabads.*`). `v1` so a shape change can be ignored rather than crash. */
export const MOBILE_TOUR_STORAGE_KEY = "fabads.mobileTour.v1";

/** Order is display order: the checklist and the card both iterate this. */
export const MOBILE_TOUR_STEP_IDS = [
  "follow-brand",
  "save-ad",
  "check-report",
  "try-genie",
] as const;

export type MobileTourStepId = (typeof MOBILE_TOUR_STEP_IDS)[number];

/**
 * `todo`   — untouched.
 * `opened` — the user tapped the deep link (auto-detected; NOT completion).
 * `done`   — the user said it is done (manual only, see header).
 */
export type MobileTourStepStatus = "todo" | "opened" | "done";

export interface MobileTourProgress {
  /** Every step id is always present, so consumers never handle `undefined`. */
  readonly statuses: Readonly<Record<MobileTourStepId, MobileTourStepStatus>>;
  /** Count of `done` — the number in "1 of 4 done". */
  readonly doneCount: number;
  /** Always `MOBILE_TOUR_STEP_IDS.length`. Exposed so callers don't hardcode 4. */
  readonly total: number;
  readonly allDone: boolean;
  /** 0–100, for `<Progress value>`. */
  readonly percent: number;
  /** True once the user has seen the welcome screens or touched any step — drives Replay vs Start fresh. */
  readonly started: boolean;
  readonly welcomeSeen: boolean;
  /** The user closed the home card. Card stays hidden until a reset or an explicit restore. */
  readonly cardDismissed: boolean;
}

interface PersistedState {
  statuses: Record<MobileTourStepId, MobileTourStepStatus>;
  welcomeSeen: boolean;
  cardDismissed: boolean;
}

function blankStatuses(): Record<MobileTourStepId, MobileTourStepStatus> {
  return {
    "follow-brand": "todo",
    "save-ad": "todo",
    "check-report": "todo",
    "try-genie": "todo",
  };
}

function blankState(): PersistedState {
  return { statuses: blankStatuses(), welcomeSeen: false, cardDismissed: false };
}

function isStepId(value: string): value is MobileTourStepId {
  return (MOBILE_TOUR_STEP_IDS as readonly string[]).includes(value);
}

function isStatus(value: unknown): value is MobileTourStepStatus {
  return value === "todo" || value === "opened" || value === "done";
}

/**
 * Reads localStorage defensively: a hand-edited value, a half-written string or
 * a state from a future shape must degrade to "fresh tour", never throw. Any
 * unrecognised key or status is dropped rather than trusted.
 */
function readPersisted(): PersistedState {
  if (typeof window === "undefined") return blankState();
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(MOBILE_TOUR_STORAGE_KEY);
  } catch {
    return blankState();
  }
  if (!raw) return blankState();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return blankState();
  }
  if (typeof parsed !== "object" || parsed === null) return blankState();

  const record = parsed as Record<string, unknown>;
  const next = blankState();

  const statuses = record.statuses;
  if (typeof statuses === "object" && statuses !== null) {
    for (const [key, value] of Object.entries(statuses as Record<string, unknown>)) {
      if (isStepId(key) && isStatus(value)) next.statuses[key] = value;
    }
  }
  next.welcomeSeen = record.welcomeSeen === true;
  next.cardDismissed = record.cardDismissed === true;
  return next;
}

function writePersisted(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      MOBILE_TOUR_STORAGE_KEY,
      JSON.stringify({ v: 1, ...state }),
    );
  } catch {
    // Private mode / quota. In-memory state still works for this session.
  }
}

function derive(state: PersistedState): MobileTourProgress {
  const total = MOBILE_TOUR_STEP_IDS.length;
  const doneCount = MOBILE_TOUR_STEP_IDS.filter(
    (id) => state.statuses[id] === "done",
  ).length;
  const touched = MOBILE_TOUR_STEP_IDS.some((id) => state.statuses[id] !== "todo");
  return {
    statuses: state.statuses,
    doneCount,
    total,
    allDone: doneCount === total,
    percent: Math.round((doneCount / total) * 100),
    started: state.welcomeSeen || touched,
    welcomeSeen: state.welcomeSeen,
    cardDismissed: state.cardDismissed,
  };
}

let state: PersistedState = readPersisted();
let snapshot: MobileTourProgress = derive(state);

const listeners = new Set<() => void>();

function emit(): void {
  snapshot = derive(state);
  for (const fn of listeners) fn();
}

function commit(next: PersistedState): void {
  state = next;
  writePersisted(state);
  emit();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): MobileTourProgress {
  return snapshot;
}

/** SSR/first-paint snapshot. Must be a stable reference, hence the module const. */
const SERVER_SNAPSHOT: MobileTourProgress = derive(blankState());
function getServerSnapshot(): MobileTourProgress {
  return SERVER_SNAPSHOT;
}

// Cross-tab (and cross-mount) sync. `key === null` means the whole store was
// cleared, which also invalidates us.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== MOBILE_TOUR_STORAGE_KEY) return;
    state = readPersisted();
    emit();
  });
}

/** Subscribe to tour progress. Safe to call from any number of components. */
export function useMobileTourProgress(): MobileTourProgress {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Non-reactive read, for event handlers that need the current value. */
export function getMobileTourProgress(): MobileTourProgress {
  return snapshot;
}

/** Lowest-level setter. Prefer the named helpers below. */
export function setMobileTourStepStatus(
  id: MobileTourStepId,
  status: MobileTourStepStatus,
): void {
  if (state.statuses[id] === status) return;
  commit({ ...state, statuses: { ...state.statuses, [id]: status } });
}

/**
 * The user tapped the step's deep link. Never overwrites `done` — re-opening a
 * finished step must not un-finish it.
 */
export function markMobileTourStepOpened(id: MobileTourStepId): void {
  if (state.statuses[id] === "done") return;
  setMobileTourStepStatus(id, "opened");
}

/** Manual tick. The ONLY route to `done` — see the header note on auto-ticking. */
export function markMobileTourStepDone(id: MobileTourStepId): void {
  setMobileTourStepStatus(id, "done");
}

/** Checkbox behaviour: `done` ⇄ back to whatever it was before (`opened` if the link was tapped). */
export function toggleMobileTourStepDone(id: MobileTourStepId): void {
  setMobileTourStepStatus(id, state.statuses[id] === "done" ? "opened" : "done");
}

/** Called when the last welcome screen is passed, so "Replay" can skip straight to the checklist. */
export function markMobileTourWelcomeSeen(): void {
  if (state.welcomeSeen) return;
  commit({ ...state, welcomeSeen: true });
}

/** Show/hide the home checklist card without touching tick state. */
export function setMobileTourCardDismissed(dismissed: boolean): void {
  if (state.cardDismissed === dismissed) return;
  commit({ ...state, cardDismissed: dismissed });
}

/**
 * Wipes everything — ticks, welcome-seen and card dismissal — and removes the
 * key. This is the "Start fresh" branch of the launch prompt.
 */
export function resetMobileTour(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(MOBILE_TOUR_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  state = blankState();
  emit();
}
