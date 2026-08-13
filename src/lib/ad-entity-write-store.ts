/**
 * Shared ad-entity write store — Reports (desktop table + mobile list).
 *
 * Module-level external store (useSyncExternalStore), same pattern as
 * src/creative-report/actions/actionStore.ts. Holds the client-side result of
 * status / budget / duplicate actions layered on top of the immutable seeded
 * dataset in src/lib/reports-dummy-data.ts, which is never mutated or forked.
 *
 * Optimistic and synchronous — there is no API, so a write cannot fail. Not
 * persisted (resets on reload); this is a prototype surface, not a real store.
 * The reset is DISCLOSED in the UI (a "changes are local" line plus a Session
 * changes sheet) rather than left for the user to discover.
 *
 * WHY DUPLICATE FABRICATES A ROW
 * actionStore.ts deliberately flips a flag instead of fabricating a creative,
 * because there the creative COUNT is the analytical claim. Reports is an
 * inventory of ad objects, and in real Meta a duplicate produces a new object —
 * so a flag would mean the user taps Duplicate, the sheet closes, and nothing
 * appears. That fails visibility of system status on the one action whose whole
 * point is that a new thing exists. Four guardrails keep it honest: all of a
 * copy's metrics are zero, its id is recognisably derived, it is never offered
 * at account level, and Active copies are capacity-checked against the real
 * Meta active-ad ceilings before they can be created (src/lib/reports-capacity.ts).
 * Paused — once forced — is now only the DEFAULT, because a buyer duplicating a
 * winner to scale it needs it delivering; see `duplicateEntity`.
 */
import { useSyncExternalStore } from "react";
import type {
  BudgetType,
  EntityLevel,
  EntityStatus,
  ReportEntity,
  ReportMetrics,
} from "@/lib/reports-dummy-data";

/** Must match the undo-toast duration — see `filterExempt` below. */
export const EXEMPT_MS = 8000;

/** Base name is truncated to this before " — Copy" is appended, so a long
 *  name's copy is never visually identical to its source. */
const NAME_BUDGET = 42;

export interface EntityOverride {
  status?: EntityStatus;
  budgetValue?: number;
  budgetType?: BudgetType;
  /** Wall-clock of the last write — drives the "edited" dot and Session changes. */
  updatedAt?: number;
}

export interface UndoToken {
  kind: "status" | "budget" | "duplicate";
  /** Human label, e.g. "Paused 4 items". */
  label: string;
  entries: { id: string; prev: EntityOverride | undefined }[];
  /**
   * Every row this token fabricated. A duplicate of N copies is ONE user
   * gesture, so it carries ONE token holding all N ids — undo reverses the
   * gesture, not one copy out of N.
   */
  fabricatedIds?: string[];
}

export interface JournalEntry {
  token: UndoToken;
  at: number;
  undone: boolean;
}

/** A duplicate. Stores only the delta — the row itself is re-derived from the
 *  live source on every read (see `materialise`). */
interface Fabricated {
  id: string;
  sourceId: string;
  level: EntityLevel;
  parentId: string | null;
  copyIndex: number;
  /** The status the user chose in the duplicate sheet — NOT always Paused. */
  status: EntityStatus;
  createdAt: number;
}

export interface WriteStoreShape {
  version: number;
  overrides: Record<string, EntityOverride>;
  fabricated: Record<string, Fabricated>;
  /**
   * Ids exempted from the status filter until `expiresAt`, so a row the user
   * just paused inside an "Active only" view does not vanish under their thumb
   * while the Undo toast is still on screen.
   */
  filterExempt: Record<string, number>;
  /** Newest-first op log. Powers the Session changes sheet — the undo path that
   *  survives the toast being dismissed or the user navigating away. */
  journal: JournalEntry[];
  /** Single aria-live string; the mobile shell renders one sr-only region. */
  announcement: string;
}

export const ZERO_METRICS: ReportMetrics = {
  spend: 0,
  revenue: 0,
  roas: 0,
  impressions: 0,
  clicks: 0,
  ctr: 0,
  cpa: 0,
  cpc: 0,
  cpm: 0,
  conversions: 0,
  margin: 0,
  marginPercent: 0,
};

const EMPTY: WriteStoreShape = {
  version: 0,
  overrides: {},
  fabricated: {},
  filterExempt: {},
  journal: [],
  announcement: "",
};

let state: WriteStoreShape = EMPTY;
const listeners = new Set<() => void>();

/** Replaces `state` with a NEW reference so useSyncExternalStore sees a change.
 *  Between emits the reference is stable, which is what stops a render loop. */
function commit(next: Omit<WriteStoreShape, "version">): void {
  state = { ...next, version: state.version + 1 };
  for (const l of listeners) l();
}

function subscribeWrites(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getWriteSnapshot(): WriteStoreShape {
  return state;
}

function pushJournal(journal: JournalEntry[], token: UndoToken): JournalEntry[] {
  return [{ token, at: Date.now(), undone: false }, ...journal];
}

/* ─────────────────────────────── writes ─────────────────────────────── */

function statusVerb(status: EntityStatus): string {
  if (status === "Active") return "Activated";
  if (status === "Paused") return "Paused";
  return "Archived";
}

/** Status for one or many. Unified so there is no separate bulk path to drift. */
export function setStatus(
  entities: ReportEntity[],
  status: EntityStatus,
): UndoToken {
  const now = Date.now();
  const overrides = { ...state.overrides };
  const filterExempt = { ...state.filterExempt };
  const entries = entities.map((e) => ({ id: e.id, prev: state.overrides[e.id] }));

  for (const e of entities) {
    overrides[e.id] = { ...overrides[e.id], status, updatedAt: now };
    filterExempt[e.id] = now + EXEMPT_MS;
  }

  const what =
    entities.length === 1 ? entities[0].name : `${entities.length} items`;
  const token: UndoToken = {
    kind: "status",
    label: `${statusVerb(status)} ${what}`,
    entries,
  };

  commit({
    overrides,
    fabricated: state.fabricated,
    filterExempt,
    journal: pushJournal(state.journal, token),
    announcement: `${token.label}. Undo available.`,
  });
  return token;
}

export function setBudget(
  entity: ReportEntity,
  next: { value?: number; type?: BudgetType },
): UndoToken {
  const prev = state.overrides[entity.id];
  const token: UndoToken = {
    kind: "budget",
    label: `Budget updated for ${entity.name}`,
    entries: [{ id: entity.id, prev }],
  };

  commit({
    overrides: {
      ...state.overrides,
      [entity.id]: {
        ...prev,
        ...(next.value !== undefined ? { budgetValue: next.value } : {}),
        ...(next.type !== undefined ? { budgetType: next.type } : {}),
        updatedAt: Date.now(),
      },
    },
    fabricated: state.fabricated,
    filterExempt: state.filterExempt,
    journal: pushJournal(state.journal, token),
    announcement: `${token.label}. Undo available.`,
  });
  return token;
}

/** You cannot duplicate an ad account. */
export function canDuplicate(level: EntityLevel): boolean {
  return level !== "account";
}

export interface DuplicateOptions {
  /** How many copies to create. Clamped to ≥1; non-integers are floored. */
  count?: number;
  /** Status the copies publish with. Defaults to Paused (the safe default). */
  status?: EntityStatus;
}

/**
 * Fabricates N zero-metric copies in the SAME ad account.
 *
 * Defaults to `{ count: 1, status: "Paused" }` so any older single-copy call
 * site keeps its exact previous behaviour.
 *
 * The status is the USER'S choice now (see DuplicateEntitySheet) rather than a
 * forced Paused: a media buyer duplicating a winner to scale it wants it
 * delivering, and silently pausing it meant they had to find every copy and
 * flip it by hand. The guardrails that keep a fabricated row honest are
 * unchanged: zero metrics, a recognisably derived id, never offered at account
 * level, and — new — an active-ad capacity check before Active is allowed
 * (see src/lib/reports-capacity.ts).
 */
export function duplicateEntity(
  source: ReportEntity,
  opts: DuplicateOptions = {},
): {
  newIds: string[];
  token: UndoToken;
} {
  if (!canDuplicate(source.level)) {
    throw new Error("Ad accounts cannot be duplicated");
  }

  const status: EntityStatus = opts.status ?? "Paused";
  const count = Math.max(1, Math.floor(opts.count ?? 1));

  // A duplicate-of-a-duplicate counts against the ROOT source, so the suffix
  // keeps incrementing on the original rather than restarting at "Copy".
  const rootId = state.fabricated[source.id]?.sourceId ?? source.id;
  // HIGH-WATER MARK, not a count. A count breaks as soon as an EARLIER batch is
  // undone while a later one survives — which the Session changes sheet allows
  // at any time. Create 3 (Copy 1-3), create 3 more (Copy 4-6), then undo the
  // first batch: the count falls back to 3, the next batch re-derives ids
  // `dup_4__…`/`dup_5__…` that are still live, and writing them into the
  // fabricated map silently OVERWRITES those rows — the user is toasted that N
  // copies were created while the row total does not move. Taking the maximum
  // live copyIndex is monotonic for as long as any copy survives, so a derived
  // id can never collide with one that is still on screen. Numbering may skip
  // (…5, 6, then 9) after an undo; a visible gap is the honest trade for never
  // clobbering a row the user can still see.
  const existing = Object.values(state.fabricated).reduce(
    (max, f) => (f.sourceId === rootId && f.copyIndex > max ? f.copyIndex : max),
    0,
  );

  const now = Date.now();
  const fabricated = { ...state.fabricated };
  const filterExempt = { ...state.filterExempt };
  const newIds: string[] = [];

  for (let i = 0; i < count; i += 1) {
    // Continues past the highest copy already in the store, so a second batch
    // names itself "Copy 4/5/6" instead of colliding with "Copy 1/2/3".
    const copyIndex = existing + i + 1;
    const id = `dup_${copyIndex}__${rootId}`;
    newIds.push(id);
    fabricated[id] = {
      id,
      sourceId: rootId,
      level: source.level,
      parentId: source.parentId,
      copyIndex,
      status,
      createdAt: now,
    };
    // A Paused copy inside an "Active only" view would be dropped the instant it
    // appears — the user acts, gets a toast saying copies were created, and sees
    // no new rows. An Active copy inside a "Paused only" view has the mirror-image
    // problem, so BOTH statuses get the same grace the status path uses.
    filterExempt[id] = now + EXEMPT_MS;
  }

  const what = count === 1 ? "Copy" : `${count} copies`;
  const token: UndoToken = {
    kind: "duplicate",
    label: `${what} of ${source.name} created`,
    entries: [],
    fabricatedIds: newIds,
  };

  commit({
    overrides: state.overrides,
    fabricated,
    filterExempt,
    journal: pushJournal(state.journal, token),
    announcement: `${token.label}, ${status.toLowerCase()}. Undo available.`,
  });
  return { newIds, token };
}

export function undo(token: UndoToken): void {
  const overrides = { ...state.overrides };
  for (const { id, prev } of token.entries) {
    if (prev) overrides[id] = prev;
    else delete overrides[id];
  }

  const fabricated = { ...state.fabricated };
  // All N copies of one duplicate gesture go together — see UndoToken.
  //
  // Also drop any OVERRIDE on each id being removed, not just the fabricated
  // entry itself. A copy can pick up its own override after creation — e.g.
  // pause it — via a SEPARATE status action with its own token; undoing THIS
  // (the duplicate) token only knew about `entries: []` at creation time, so
  // it never touched that later override. Left behind, it becomes a live
  // landmine: `duplicateEntity`'s high-water mark is monotonic per root and
  // does not know an id is "free" again, so it WILL reissue this same
  // `dup_N__root` id on a later duplicate call, and `materialise()` would
  // silently apply the stale override on top of the brand-new row — a copy
  // created Active a second ago rendering Paused, with capacity math already
  // charged for the status the UI never actually shows. Once the fabricated
  // row is gone, an override keyed to that exact id is never meaningful for
  // anything else, so unconditional deletion here is always correct.
  for (const id of token.fabricatedIds ?? []) delete fabricated[id];
  for (const id of token.fabricatedIds ?? []) delete overrides[id];

  commit({
    overrides,
    fabricated,
    filterExempt: state.filterExempt,
    journal: state.journal.map((j) =>
      j.token === token ? { ...j, undone: true } : j,
    ),
    announcement: `Undone: ${token.label}.`,
  });
}

/** Clears every simulated change. Backs "Reset all demo changes". */
export function resetWriteStore(): void {
  commit({
    overrides: {},
    fabricated: {},
    filterExempt: {},
    journal: [],
    announcement: "All demo changes reset.",
  });
}

/* ──────────────────── read-through projection (pure) ──────────────────── */

const copySuffix = (n: number): string => (n === 1 ? " — Copy" : ` — Copy ${n}`);

/**
 * Re-derives a copy from its CURRENT source rather than a snapshot: the caller
 * bumps a date seed on refresh, which regenerates every entity's metrics, so a
 * snapshotted copy would carry stale identity fields forever.
 */
function materialise(f: Fabricated, source: ReportEntity): ReportEntity {
  const base =
    source.name.length > NAME_BUDGET
      ? `${source.name.slice(0, NAME_BUDGET - 1)}…`
      : source.name;

  return {
    ...source,
    id: f.id,
    name: `${base}${copySuffix(f.copyIndex)}`,
    // The status the user picked in the duplicate sheet. Read from the
    // Fabricated record, not hardcoded — a copy created Active must render
    // Active everywhere, including inside a status-filtered view.
    status: f.status,
    metrics: ZERO_METRICS,
    ...(source.creative
      ? { creative: { ...source.creative, id: `cr_${f.id}`, adId: f.id } }
      : {}),
  };
}

/**
 * Appends fabricated rows for this level/parent scope, then applies overrides.
 *
 * MUST run before the caller's status/search/platform filters, or a row the
 * user just paused stays visible inside an "Active only" view while claiming to
 * be Paused.
 */
export function projectLevel(
  items: ReportEntity[],
  scope: { level: EntityLevel; parentId?: string | null },
  snap: WriteStoreShape,
): ReportEntity[] {
  const byId = new Map(items.map((e) => [e.id, e]));
  const copies: ReportEntity[] = [];

  for (const f of Object.values(snap.fabricated)) {
    if (f.level !== scope.level) continue;
    if (scope.parentId != null && f.parentId !== scope.parentId) continue;
    const src = byId.get(f.sourceId);
    // Source outside this scope (filtered away upstream) — skip silently.
    if (src) copies.push(materialise(f, src));
  }

  const all = copies.length > 0 ? [...items, ...copies] : items;

  return all.map((e) => {
    const o = snap.overrides[e.id];
    if (!o) return e;
    return {
      ...e,
      ...(o.status ? { status: o.status } : {}),
      ...(o.budgetValue !== undefined ? { budgetValue: o.budgetValue } : {}),
      ...(o.budgetType ? { budgetType: o.budgetType } : {}),
    };
  });
}

/**
 * Post-sort pass placing each copy directly under its source, as Meta Ads
 * Manager does. Without it a zero-metric copy sinks to the bottom of a
 * spend-desc sort and the user never sees the thing they just created.
 * Stable, and tolerant of a source that isn't in this page of results.
 */
export function pinCopiesToSources(
  sorted: ReportEntity[],
  snap: WriteStoreShape,
): ReportEntity[] {
  if (Object.keys(snap.fabricated).length === 0) return sorted;

  const copiesBySource = new Map<string, ReportEntity[]>();
  const orphans: ReportEntity[] = [];
  const present = new Set(sorted.map((e) => e.id));

  for (const row of sorted) {
    const f = snap.fabricated[row.id];
    if (!f) continue;
    if (!present.has(f.sourceId)) {
      orphans.push(row);
      continue;
    }
    const list = copiesBySource.get(f.sourceId) ?? [];
    list.push(row);
    copiesBySource.set(f.sourceId, list);
  }

  if (copiesBySource.size === 0 && orphans.length === 0) return sorted;

  const out: ReportEntity[] = [];
  for (const row of sorted) {
    if (snap.fabricated[row.id]) continue; // placed with its source, or an orphan
    out.push(row);
    const copies = copiesBySource.get(row.id);
    if (copies) {
      // Keep copies in ascending copyIndex so "Copy" precedes "Copy 2".
      out.push(
        ...[...copies].sort(
          (a, b) =>
            (snap.fabricated[a.id]?.copyIndex ?? 0) -
            (snap.fabricated[b.id]?.copyIndex ?? 0),
        ),
      );
    }
  }
  // A copy whose source isn't on this page still has to render somewhere.
  out.push(...orphans);
  return out;
}

export function isFilterExempt(id: string, snap: WriteStoreShape): boolean {
  const until = snap.filterExempt[id];
  return until !== undefined && until > Date.now();
}

/** Applies any override to a possibly-stale entity snapshot. */
function overlay(
  e: ReportEntity,
  snap: WriteStoreShape,
): ReportEntity {
  const o = snap.overrides[e.id];
  if (!o) return e;
  return {
    ...e,
    ...(o.status ? { status: o.status } : {}),
    ...(o.budgetValue !== undefined ? { budgetValue: o.budgetValue } : {}),
    ...(o.budgetType ? { budgetType: o.budgetType } : {}),
  };
}

/* ─────────────────────────────── hooks ─────────────────────────────── */

export function useWriteStore(): WriteStoreShape {
  return useSyncExternalStore(subscribeWrites, getWriteSnapshot, getWriteSnapshot);
}

export function useEntityOverride(id?: string): EntityOverride | undefined {
  return useWriteStore().overrides[id ?? ""];
}

/**
 * For drawers/rows holding an entity in local page state: that snapshot goes
 * stale the moment a write lands, so render THIS instead of the raw prop or the
 * status badge will contradict the list behind it.
 */
export function useOverlaidEntity(e: ReportEntity | null): ReportEntity | null {
  const snap = useWriteStore();
  if (!e) return null;
  return overlay(e, snap);
}

export function useSessionChanges(): JournalEntry[] {
  return useWriteStore().journal.filter((j) => !j.undone);
}

export function useStoreAnnouncement(): string {
  return useWriteStore().announcement;
}

export { subscribeWrites, getWriteSnapshot };
