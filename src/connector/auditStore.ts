/**
 * Connector (AI access) — the agent audit log.
 *
 * Every read and write an agent makes against FabAds lands here, plus the
 * lifecycle events (connected, revoked, token issued) that explain how a
 * connection got the access it has.
 *
 * WHY THIS IS A SEPARATE STORE FROM `connectionsStore.ts`
 *
 * 1. Survivability, and this is the decisive one. Entries denormalise
 *    `connectionName`, `agentKind` and `moduleLabel` onto every row precisely
 *    so a REVOKED or DELETED connection's history still explains itself. If
 *    the log lived as a field on ConnectorConnection, `deleteConnection()`
 *    would destroy the evidence — the same failure `rulesStore.deleteRule`
 *    already guards against elsewhere in this repo ("the upload genuinely
 *    happened").
 * 2. Opposite write cadences. This log is append-only and capped; connections
 *    are a small mutable set. Sharing storage would mean every permission
 *    toggle rewrites hundreds of log rows, and every agent call rewrites the
 *    whole permission tree. Both are quota-risky, and both would wake every
 *    subscriber on the other side.
 * 3. Disjoint subscribers. The global roll-up must not re-render when someone
 *    flips a toggle in a drawer, and the permission editor must not re-render
 *    on every agent call.
 *
 * The cost of the split is that a meter consumption (connections) and its
 * audit row (here) are two `persist()` calls. `recorder.ts` is THE only write
 * path for agent activity so the two always happen together in one readable
 * function — no component calls `appendAuditEntry` directly.
 *
 * Storage discipline is copied verbatim from
 * `src/creative-report/automations/activityStore.ts`: module-cached `state`,
 * `snapshot()` returns it with zero construction, `sanitize()` never throws on
 * corrupt JSON, `persist()` is guarded, and the cap is applied on read AND
 * write — an uncapped append-only array in localStorage eventually throws on
 * setItem and wedges the store.
 */
import { useSyncExternalStore } from "react";
import type {
  AgentKind,
  AuditKind,
  AuditOutcome,
  ConnectorAuditEntry,
  ConnectorModuleId,
  LimitMeterId,
} from "@/connector/model";
import { isConnectorModuleId, isMeterId } from "@/connector/catalogue";

const KEY = "fabads:connector:audit:v1";

/**
 * The UI must say "the most recent 400", never imply completeness — a busy
 * connection WILL evict its old blocked rows, and that is exactly the
 * evidence this feature exists to produce.
 */
export const MAX_AUDIT_ENTRIES = 400;

interface AuditState {
  entries: ConnectorAuditEntry[];
}

const DEFAULT_STATE: AuditState = { entries: [] };

const AUDIT_KINDS: AuditKind[] = ["read", "write", "auth", "config"];
const AUDIT_OUTCOMES: AuditOutcome[] = [
  "allowed",
  "blocked_permission",
  "blocked_limit",
  "error",
];

function isValidEntry(e: unknown): e is ConnectorAuditEntry {
  if (!e || typeof e !== "object") return false;
  const x = e as ConnectorAuditEntry;
  return (
    typeof x.id === "string" &&
    typeof x.connectionId === "string" &&
    typeof x.connectionName === "string" &&
    typeof x.agentKind === "string" &&
    (x.moduleId === null || isConnectorModuleId(x.moduleId)) &&
    (x.moduleLabel === null || typeof x.moduleLabel === "string") &&
    AUDIT_KINDS.includes(x.kind) &&
    typeof x.actionId === "string" &&
    typeof x.actionLabel === "string" &&
    AUDIT_OUTCOMES.includes(x.outcome) &&
    typeof x.detail === "string" &&
    // Accepts `undefined` as well as null: rows persisted before `blockMessage`
    // existed simply don't carry the key, and dropping a user's whole history
    // over a field that was added later is a far worse outcome than a row with
    // no quoted refusal. sanitize() backfills it to null immediately below.
    (x.blockMessage === null || x.blockMessage === undefined || typeof x.blockMessage === "string") &&
    (x.meter === null || isMeterId(x.meter)) &&
    typeof x.at === "string"
  );
}

/** Corrupt or hand-edited JSON must degrade to the default state, never crash
 *  the Settings tab. */
function sanitize(raw: unknown): AuditState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_STATE;
  const { entries } = raw as Partial<AuditState>;
  if (!Array.isArray(entries)) return DEFAULT_STATE;
  const valid = entries
    .filter(isValidEntry)
    // `blockMessage ?? null` is the forward-compat backfill for payloads
    // written before the field existed — see isValidEntry above.
    .map((e) => ({ ...e, blockMessage: e.blockMessage ?? null, simulated: true as const }));
  return { entries: valid.slice(0, MAX_AUDIT_ENTRIES) };
}

/**
 * Tracks whether the key was ABSENT at boot, not whether the array was empty.
 *
 * This is what makes "clear all" a real, persistent zero state: clearing
 * writes an empty array, so the key exists, so the seed never comes back on
 * reload. Seeding on `entries.length === 0` would silently undo the user's
 * reset — the same distinction `seedRunsIfEmpty` makes in
 * `src/launchv2/services/runsService.ts`.
 */
let keyWasAbsent = false;

function readInitial(): AuditState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) {
      keyWasAbsent = true;
      return DEFAULT_STATE;
    }
    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULT_STATE;
  }
}

let state: AuditState = readInitial();
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
  return () => {
    listeners.delete(cb);
  };
}

/** Returns the cached reference with ZERO construction. Building a new object
 *  here is the getSnapshot bug that already white-screened this repo once. */
function snapshot(): AuditState {
  return state;
}

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `audit-${Date.now()}-${idCounter}`;
}

/* ------------------------------------------------------------------ */
/*  Reads                                                              */
/* ------------------------------------------------------------------ */

/** Non-hook read, for `recorder.ts` and other non-React callers. */
export function getAuditEntries(): ConnectorAuditEntry[] {
  return state.entries;
}

/**
 * THE ONLY HOOK. If a second one is ever added — `useAuditForConnection`,
 * `useAuditRollup`, anything that constructs its return value — it
 * reintroduces the getSnapshot-constructs-a-new-object infinite loop.
 * Consumers call this once and derive with `useMemo` via the pure helpers in
 * `selectors.ts`.
 */
export function useConnectorAudit(): AuditState {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}

/* ------------------------------------------------------------------ */
/*  Writes                                                             */
/* ------------------------------------------------------------------ */

export type NewAuditEntry = Omit<ConnectorAuditEntry, "id" | "simulated">;

/**
 * Appends newest-first, capped. Intended caller is `recorder.ts` — going
 * through one shared write path is what keeps a meter consumption and its
 * evidence from drifting apart.
 */
export function appendAuditEntry(input: NewAuditEntry): void {
  const entry: ConnectorAuditEntry = { ...input, id: makeId(), simulated: true };
  state = { entries: [entry, ...state.entries].slice(0, MAX_AUDIT_ENTRIES) };
  persist();
}

/** Batch variant — same cap, one persist. Used by the seed. */
export function appendAuditEntries(inputs: NewAuditEntry[]): void {
  if (inputs.length === 0) return;
  const entries: ConnectorAuditEntry[] = inputs.map((i) => ({
    ...i,
    id: makeId(),
    simulated: true,
  }));
  state = { entries: [...entries, ...state.entries].slice(0, MAX_AUDIT_ENTRIES) };
  persist();
}

/**
 * Seeds ONLY when the storage key was absent at boot. `build` is a thunk so
 * the (non-trivial) seed construction is skipped entirely on every subsequent
 * load rather than being built and thrown away.
 */
export function seedAuditIfEmpty(build: () => ConnectorAuditEntry[]): void {
  if (!keyWasAbsent) return;
  keyWasAbsent = false;
  const seeded = build().filter(isValidEntry).slice(0, MAX_AUDIT_ENTRIES);
  state = { entries: seeded };
  persist();
}

/**
 * Local demo reset, and labelled as such everywhere it is surfaced.
 *
 * This is NEVER a stand-in for deleting a real audit trail — there is no real
 * audit trail, nothing here ever reached a live system, and every row carries
 * `simulated: true` to say so. Deliberately NOT called from
 * `deleteConnection()`: a removed connection's history is the whole reason
 * this store is separate.
 *
 * There is exactly one legitimate caller of the no-argument form:
 * `ConnectorPanel`'s "Reset demo data" footer button, which clears
 * `connectionsStore` AND this store together. That is a reset of the whole
 * demo surface, not the removal of one record whose history has to outlive
 * it — a different intent from `deleteConnection()`, not a reversal of the
 * principle above. See that call site for why it's allowed to wipe the log
 * when a single delete deliberately isn't.
 */
export function clearAudit(connectionId?: string): void {
  const next = connectionId
    ? state.entries.filter((e) => e.connectionId !== connectionId)
    : [];
  if (next.length === state.entries.length && state.entries.length > 0 && connectionId) return;
  if (!connectionId && state.entries.length === 0) return;
  state = { entries: next };
  persist();
}

/* ------------------------------------------------------------------ */
/*  Convenience builders                                               */
/* ------------------------------------------------------------------ */

/** Lifecycle rows — connected, revoked, token issued. `moduleId` is null
 *  because these aren't about a module, and the UI renders a muted dash
 *  rather than pretending otherwise. */
export function buildAuthEntry(params: {
  connectionId: string;
  connectionName: string;
  agentKind: AgentKind;
  actionId: string;
  actionLabel: string;
  /** The ATTEMPT / event, never the refusal — see ConnectorAuditEntry.detail. */
  detail: string;
  at: string;
  outcome?: AuditOutcome;
  /** Verbatim agent-facing string. Only meaningful on a non-allowed outcome. */
  blockMessage?: string | null;
}): NewAuditEntry {
  return {
    connectionId: params.connectionId,
    connectionName: params.connectionName,
    agentKind: params.agentKind,
    moduleId: null,
    moduleLabel: null,
    kind: "auth",
    actionId: params.actionId,
    actionLabel: params.actionLabel,
    outcome: params.outcome ?? "allowed",
    detail: params.detail,
    blockMessage: params.blockMessage ?? null,
    meter: null,
    at: params.at,
  };
}

/** Permission / limit edits made by a HUMAN in the FabAds UI, so the log
 *  answers "who gave it that access?" and not only "what did it do?". */
export function buildConfigEntry(params: {
  connectionId: string;
  connectionName: string;
  agentKind: AgentKind;
  moduleId: ConnectorModuleId | null;
  moduleLabel: string | null;
  actionId: string;
  actionLabel: string;
  detail: string;
  at: string;
  meter?: LimitMeterId | null;
}): NewAuditEntry {
  return {
    connectionId: params.connectionId,
    connectionName: params.connectionName,
    agentKind: params.agentKind,
    moduleId: params.moduleId,
    moduleLabel: params.moduleLabel,
    kind: "config",
    actionId: params.actionId,
    actionLabel: params.actionLabel,
    outcome: "allowed",
    detail: params.detail,
    // A human edit in the FabAds UI is never refused by the connector, so
    // there is no agent-facing string to quote.
    blockMessage: null,
    meter: params.meter ?? null,
    at: params.at,
  };
}
