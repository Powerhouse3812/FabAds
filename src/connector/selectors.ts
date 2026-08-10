/**
 * Connector (AI access) — pure derivation layer.
 *
 * Everything the Connector UI *knows* rather than *stores*. No React, no
 * hooks, no localStorage, no `Date.now()`. Every time-dependent function takes
 * an explicit `now` so the same inputs always produce the same output and a
 * test can sit on a Tuesday in 2027 without mocking the clock. Callers pass
 * `Date.now()`; this file never reaches for it.
 *
 * THREE DECISIONS WORTH KNOWING BEFORE YOU EDIT THIS FILE
 *
 * 1. THE UNIVERSAL INVARIANT LIVES HERE.
 *    "Enabling any write action in module M requires M.read >= view."
 *    catalogue.ts deliberately does NOT encode this in its 30 `requires`
 *    arrays — it would be thirty copies of the same edge, and it would bury
 *    the twelve real cross-module edges that actually need reading. So the
 *    rule is applied exactly once, in `unmetPrerequisites()`, and every other
 *    function in this file inherits it by going through there or through the
 *    same walk. An agent that can pause an ad it cannot see is nonsense; the
 *    rule is absolute, so it belongs in one place, not thirty.
 *
 * 2. LAZY ROLLOVER, NO TIMERS.
 *    A limit window is not a scheduled job. `normalizedUsage()` compares the
 *    stored `windowStartedAt` against the bucket `now` actually falls in, and
 *    if they differ it hands back a zeroed meter stamped with the new bucket.
 *    Nothing has to be running for a Monday-morning reset to be correct — the
 *    reset happens the first time anyone looks. A timer would give the same
 *    answer only while the tab is open, which is most of the time and
 *    therefore the worst possible failure mode.
 *
 * 3. THE REVERSE DISABLE PLAN EXISTS BECAUSE HALF A GRAPH IS WORSE THAN NONE.
 *    Blocking "turn on X without its prerequisites" and then allowing "turn
 *    off X while its dependents are on" leaves a grant that references a
 *    permission the connection no longer has. That inconsistent grant renders
 *    as a working toggle and behaves as a broken one. Refusing is honest;
 *    silently drifting is not. Hence `buildDisablePlanForAction()` and
 *    `buildDisablePlanForRead()`, walking `WRITE_ACTION_DEPENDENTS`.
 *
 * Nothing here mutates its arguments. Derived objects are always new.
 */
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { GROUP_ORDER, type ModuleGroup } from "@/components/sidebar/modules";
import {
  ACTIONS_BY_METER,
  CONNECTOR_MODULES,
  CONNECTOR_MODULE_IDS,
  METER_IDS,
  WRITE_ACTIONS,
  WRITE_ACTIONS_BY_MODULE,
  WRITE_ACTION_DEPENDENTS,
  getMeterDef,
  getModuleDef,
  getWriteAction,
} from "@/connector/catalogue";
import type {
  ConnectionHealth,
  ConnectorAuditEntry,
  ConnectorConnection,
  ConnectorModuleDef,
  ConnectorModuleId,
  DisablePlan,
  EnablePlan,
  LimitMeterId,
  LimitStatus,
  LimitWindow,
  MeterUsage,
  ModulePermissionGrant,
  Prerequisite,
  ReadTier,
  WriteActionDef,
  WriteActionId,
} from "@/connector/model";

/* ------------------------------------------------------------------ */
/*  Shared primitives                                                  */
/* ------------------------------------------------------------------ */

/** Read tiers are ordered, so comparisons are rank comparisons, not string
 *  equality. Anything that asks "is this tier enough?" goes through here. */
const READ_RANK: Record<ReadTier, number> = { off: 0, view: 1, view_export: 2 };

const READ_TIER_LABEL: Record<ReadTier, string> = {
  off: "Off",
  view: "View",
  view_export: "View + Export",
};

const OFF_GRANT: ModulePermissionGrant = { read: "off", write: [] };

/**
 * The one accessor for a module's grant.
 *
 * `sanitize()` guarantees a full PermissionMap, so the fallback is unreachable
 * for well-formed state — but hand-edited localStorage is a real input to this
 * module, and a missing key must read as "off", never crash the Settings tab.
 */
export function moduleGrant(
  c: ConnectorConnection,
  moduleId: ConnectorModuleId,
): ModulePermissionGrant {
  return c.permissions?.[moduleId] ?? OFF_GRANT;
}

function readTierOf(c: ConnectorConnection, moduleId: ConnectorModuleId): ReadTier {
  return moduleGrant(c, moduleId).read ?? "off";
}

/** Is this specific write action currently granted? Looks the action up by its
 *  own `moduleId` rather than trusting where it was found in the map. */
function isGranted(c: ConnectorConnection, actionId: WriteActionId): boolean {
  const def = getWriteAction(actionId);
  return moduleGrant(c, def.moduleId).write?.includes(actionId) ?? false;
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/* ------------------------------------------------------------------ */
/*  Permission shape                                                   */
/* ------------------------------------------------------------------ */

/** Modules the agent can see at all. Counted over CONNECTOR_MODULE_IDS, not
 *  over the map's own keys, so a stray persisted key can't inflate it. */
export function enabledModuleCount(c: ConnectorConnection): number {
  return CONNECTOR_MODULE_IDS.filter((id) => readTierOf(c, id) !== "off").length;
}

export function exportModuleCount(c: ConnectorConnection): number {
  return CONNECTOR_MODULE_IDS.filter((id) => readTierOf(c, id) === "view_export").length;
}

/** Counted over the catalogue, so an unknown id left behind by a catalogue
 *  change is not reported as a granted power. */
export function writeActionCount(c: ConnectorConnection): number {
  return WRITE_ACTIONS.filter((a) => isGranted(c, a.id)).length;
}

export function hasAnyWriteAccess(c: ConnectorConnection): boolean {
  return WRITE_ACTIONS.some((a) => isGranted(c, a.id));
}

export function hasAnyExportAccess(c: ConnectorConnection): boolean {
  return CONNECTOR_MODULE_IDS.some((id) => readTierOf(c, id) === "view_export");
}

/**
 * The running sentence in the permission card header.
 *
 * The degenerate cases are handled explicitly rather than by string assembly,
 * because that is exactly where these lines start lying: "Views 0 of 9
 * modules · 0 actions allowed" describes a connection that will fail every
 * request as though it were a configuration. "Views 9 of 9" is the same
 * failure in the other direction — technically true, and nobody counts to nine
 * to discover it means everything.
 */
export function accessSummaryLine(c: ConnectorConnection): string {
  const total = CONNECTOR_MODULE_IDS.length;
  const views = enabledModuleCount(c);

  if (views === 0) return "No access — this connection can't see anything";

  const parts: string[] = [
    views === total ? `Views all ${total} modules` : `Views ${views} of ${total} modules`,
  ];

  const exports = exportModuleCount(c);
  if (exports > 0) parts.push(`downloads from ${exports}`);

  const writes = writeActionCount(c);
  if (writes > 0) parts.push(`${writes} action${writes === 1 ? "" : "s"} allowed`);

  return parts.join(" · ");
}

export interface ModuleGrantRow {
  def: ConnectorModuleDef;
  grant: ModulePermissionGrant;
  actions: WriteActionDef[];
  /** How many of `actions` are currently granted. */
  onCount: number;
}

/**
 * Every module, grouped RUN → CREATE → TOOLS.
 *
 * Group order is imported from modules.ts rather than restated, so the
 * Settings taxonomy can never drift from the nav taxonomy the user already
 * learned. Empty groups are dropped — a group label with nothing under it
 * reads as a rendering bug, not as information.
 */
export function groupedGrants(
  c: ConnectorConnection,
): { group: ModuleGroup; modules: ModuleGrantRow[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    modules: CONNECTOR_MODULES.filter((def) => def.group === group).map((def) => {
      const grant = moduleGrant(c, def.id);
      const actions = WRITE_ACTIONS_BY_MODULE[def.id] ?? [];
      return {
        def,
        grant,
        actions,
        onCount: actions.filter((a) => isGranted(c, a.id)).length,
      };
    }),
  })).filter((g) => g.modules.length > 0);
}

/* ------------------------------------------------------------------ */
/*  Dependency graph                                                   */
/* ------------------------------------------------------------------ */

export function isPrerequisiteSatisfied(c: ConnectorConnection, p: Prerequisite): boolean {
  if (p.kind === "read") return READ_RANK[readTierOf(c, p.moduleId)] >= READ_RANK[p.minTier];
  return isGranted(c, p.actionId);
}

/**
 * The direct, one-level prerequisites of `actionId` that are NOT met.
 *
 * The module's own read tier is checked FIRST and is not read from the
 * catalogue — this is the universal invariant described at the top of the
 * file, applied here and nowhere else.
 */
export function unmetPrerequisites(
  c: ConnectorConnection,
  actionId: WriteActionId,
): Prerequisite[] {
  const def = getWriteAction(actionId);
  const out: Prerequisite[] = [];

  // Universal invariant — not in def.requires, deliberately.
  if (READ_RANK[readTierOf(c, def.moduleId)] < READ_RANK.view) {
    out.push({ kind: "read", moduleId: def.moduleId, minTier: "view" });
  }

  for (const p of def.requires) {
    if (!isPrerequisiteSatisfied(c, p)) out.push(p);
  }
  return out;
}

function writeLine(actionId: WriteActionId, verb: "on" | "off"): string {
  const def = getWriteAction(actionId);
  return `Also turns ${verb} ${getModuleDef(def.moduleId).label} → ${def.label}`;
}

function readLine(moduleId: ConnectorModuleId, to: ReadTier): string {
  return `Also sets ${getModuleDef(moduleId).label} to ${READ_TIER_LABEL[to]}`;
}

/**
 * The dry-run behind the dependency block: everything that would have to
 * change for `actionId` to be legal, named before anything is committed.
 *
 * The walk is post-order over the prerequisite edges, which is what puts
 * `enablesWrites` in dependency order — a prerequisite is pushed only after
 * its own prerequisites are. `visited` is not optional defensive noise: the
 * catalogue asserts acyclicity in DEV only, so in a production build a bad
 * edge added later would recurse until the stack blows and white-screen the
 * whole Settings tab. The set makes the worst case a wrong plan instead of a
 * dead page.
 *
 * Read requirements are collected in PRE-order, so the action's own module
 * comes first and the note reads top-down ("set Insights to View, then Launch
 * to View") rather than inside-out.
 */
export function buildEnablePlan(c: ConnectorConnection, actionId: WriteActionId): EnablePlan {
  const enablesWrites: WriteActionId[] = [];
  const visited = new Set<WriteActionId>();
  /** moduleId → highest tier demanded by anything in this closure. */
  const readNeeds = new Map<ConnectorModuleId, ReadTier>();

  const requireRead = (moduleId: ConnectorModuleId, tier: ReadTier): void => {
    const current = readNeeds.get(moduleId);
    if (!current || READ_RANK[tier] > READ_RANK[current]) readNeeds.set(moduleId, tier);
  };

  const walk = (id: WriteActionId, isRoot: boolean): void => {
    if (visited.has(id)) return;
    visited.add(id);

    const def = getWriteAction(id);
    requireRead(def.moduleId, "view"); // universal invariant

    for (const p of def.requires) {
      if (p.kind === "read") {
        requireRead(p.moduleId, p.minTier);
        continue;
      }
      // An already-granted prerequisite needs nothing further. If ITS own read
      // tier is missing, that is a pre-existing broken grant and belongs to
      // brokenGrants(), not to this plan.
      if (isGranted(c, p.actionId)) continue;
      walk(p.actionId, false);
    }

    if (!isRoot) enablesWrites.push(id); // post-order → prerequisites first
  };

  walk(actionId, true);

  const raisesReads: EnablePlan["raisesReads"] = [];
  for (const [moduleId, to] of readNeeds) {
    const from = readTierOf(c, moduleId);
    if (READ_RANK[from] >= READ_RANK[to]) continue;
    raisesReads.push({ moduleId, from, to });
  }

  const summary = [
    ...enablesWrites.map((id) => writeLine(id, "on")),
    ...raisesReads.map((r) => readLine(r.moduleId, r.to)),
  ];

  return {
    actionId,
    blocked: summary.length > 0,
    enablesWrites,
    raisesReads,
    summary,
  };
}

/**
 * BFS over the reverse edges, following only GRANTED nodes.
 *
 * An ungranted dependent is a dead end in both senses: it does not come off
 * (it is already off), and anything hanging off it was already broken before
 * this change, so attributing that breakage to the current toggle would be a
 * lie. It is still marked visited so a diamond in the graph can't re-enqueue
 * it.
 */
function grantedDependentClosure(
  c: ConnectorConnection,
  roots: WriteActionId[],
  includeRoots: boolean,
): WriteActionId[] {
  const visited = new Set<WriteActionId>();
  const out: WriteActionId[] = [];
  const queue: WriteActionId[] = [];

  for (const r of roots) {
    if (visited.has(r)) continue;
    visited.add(r);
    if (includeRoots) out.push(r);
    queue.push(r);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const dep of WRITE_ACTION_DEPENDENTS[id] ?? []) {
      if (visited.has(dep)) continue;
      visited.add(dep);
      if (!isGranted(c, dep)) continue;
      out.push(dep);
      queue.push(dep);
    }
  }

  return out;
}

/**
 * The reverse of buildEnablePlan: what breaks if this action comes off.
 *
 * Turning off `launch.create_draft` has to name every granted launch-shaped
 * action across Reports, Insights and Catalogue, transitively — those grants
 * exist only because create_draft does.
 */
export function buildDisablePlanForAction(
  c: ConnectorConnection,
  actionId: WriteActionId,
): DisablePlan {
  const alsoDisables = grantedDependentClosure(c, [actionId], false);
  return {
    target: { kind: "write", actionId },
    blocked: alsoDisables.length > 0,
    alsoDisables,
    summary: alsoDisables.map((id) => writeLine(id, "off")),
  };
}

/**
 * Lowering a module's read tier.
 *
 * Two seed sources, and the second is defensive on purpose:
 *  - `off` revokes the universal invariant, so every granted write in the
 *    module comes off;
 *  - any granted action anywhere that declares an explicit read prerequisite
 *    on this module above the new tier comes off too. The catalogue has no
 *    such edges today, which is exactly why `view_export → view` returns an
 *    empty plan — but the check is written against the graph rather than
 *    against today's data, so adding one edge later doesn't silently produce
 *    an inconsistent grant.
 */
export function buildDisablePlanForRead(
  c: ConnectorConnection,
  moduleId: ConnectorModuleId,
  nextTier: ReadTier,
): DisablePlan {
  const seeds: WriteActionId[] = [];

  if (nextTier === "off") {
    for (const a of WRITE_ACTIONS_BY_MODULE[moduleId] ?? []) {
      if (isGranted(c, a.id)) seeds.push(a.id);
    }
  }

  for (const a of WRITE_ACTIONS) {
    if (seeds.includes(a.id) || !isGranted(c, a.id)) continue;
    const needsMore = a.requires.some(
      (p) =>
        p.kind === "read" &&
        p.moduleId === moduleId &&
        READ_RANK[nextTier] < READ_RANK[p.minTier],
    );
    if (needsMore) seeds.push(a.id);
  }

  const alsoDisables = grantedDependentClosure(c, seeds, true);

  return {
    target: { kind: "read", moduleId },
    blocked: alsoDisables.length > 0,
    alsoDisables,
    summary: alsoDisables.map((id) => writeLine(id, "off")),
  };
}

/**
 * Granted actions whose prerequisites are not satisfied.
 *
 * Unreachable through the UI — every path into a grant goes through a plan.
 * It happens via hand-edited localStorage or a catalogue edit that removes an
 * action or adds an edge to an already-persisted connection. Drives the
 * "Needs attention" health state, because the alternative is a connection
 * that looks configured and refuses every call.
 */
export function brokenGrants(c: ConnectorConnection): WriteActionId[] {
  return WRITE_ACTIONS.filter(
    (a) => isGranted(c, a.id) && unmetPrerequisites(c, a.id).length > 0,
  ).map((a) => a.id);
}

/* ------------------------------------------------------------------ */
/*  Limits                                                             */
/* ------------------------------------------------------------------ */

/** The "you're close" threshold. Exported so the copy, the meter fill and the
 *  status all agree on one number instead of three 0.8s in three files. */
export const NEAR_LIMIT_RATIO = 0.8;

/**
 * Buckets are LOCAL time, not UTC. A daily cap that resets at 5:30am because
 * the server thinks in UTC is a cap the user cannot reason about. Weeks start
 * Monday — the working week these limits are set against.
 */
export function windowStartOf(w: LimitWindow, now: number): string {
  if (w === "week") return startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  if (w === "month") return startOfMonth(now).toISOString();
  return startOfDay(now).toISOString();
}

/** The next boundary — derived from the CURRENT bucket start rather than by
 *  adding to `now`, so month-end arithmetic stays sane (Jan 31 + 1 month). */
export function windowResetsAt(w: LimitWindow, now: number): string {
  if (w === "week") return addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1).toISOString();
  if (w === "month") return addMonths(startOfMonth(now), 1).toISOString();
  return addDays(startOfDay(now), 1).toISOString();
}

/**
 * The one place the agent-facing "limit reached" sentence is written.
 *
 * WHY IT LIVES HERE AND NOT IN `recorder.ts`
 * The design's whole claim is that the audit log and the agent can never tell
 * different stories, because the log stores the agent's own words verbatim. The
 * seed has to produce that same sentence for the demo's already-blocked
 * connection. Two hand-written copies of one sentence is precisely how they
 * come to disagree — so both call this, and neither owns it.
 *
 * `METER_NOUN` exists because `MeterDef.label` is a column heading ("Launches
 * it can publish") and reads as nonsense mid-sentence ("launches it can publish
 * limit reached"). The heading and the noun are different jobs.
 */
const METER_NOUN: Record<LimitMeterId, string> = {
  budget_change: "budget",
  launches: "launch",
  live_changes: "live-change",
  creations: "credit",
};

function formatMeterValue(meter: LimitMeterId, n: number): string {
  if (!Number.isFinite(n)) return "∞";
  return getMeterDef(meter).unit === "currency"
    ? `$${Math.round(n).toLocaleString()}`
    : String(Math.round(n));
}

export function buildLimitBlockMessage(args: {
  meter: LimitMeterId;
  used: number;
  max: number;
  window: LimitWindow;
  /** The CURRENT bucket start (what `consumeMeter` returns); the next boundary
   *  is derived from it, because that is the date the agent needs. */
  currentWindowStart: string;
}): string {
  const { meter, used, max, window, currentWindowStart } = args;
  const windowWord = window === "day" ? "today" : `this ${window}`;

  const start = new Date(currentWindowStart);
  let resets = "at the start of the next period";
  if (!Number.isNaN(start.getTime())) {
    const next =
      window === "week"
        ? addWeeks(start, 1)
        : window === "month"
          ? addMonths(start, 1)
          : addDays(start, 1);
    resets = format(next, "EEE d MMM");
  }

  return (
    `FabAds: ${METER_NOUN[meter]} limit reached ` +
    `(${formatMeterValue(meter, used)} of ${formatMeterValue(meter, max)} ${windowWord}). ` +
    `Resets ${resets}. Ask the workspace owner to raise the limit in Settings → Connector.`
  );
}

/**
 * Usage for the bucket `now` falls in — the lazy rollover.
 *
 * If the stored stamp doesn't match the current bucket, the stored numbers
 * belong to a window that has ended and are not "old data" to be migrated,
 * they are simply not this window's. Zeroed, restamped, returned. `c` is never
 * touched: a selector that quietly rewrote the store would make the reset
 * depend on who read it first.
 */
export function normalizedUsage(
  c: ConnectorConnection,
  meter: LimitMeterId,
  now: number,
): MeterUsage {
  const windowStartedAt = windowStartOf(c.limits.window, now);
  const stored = c.usage?.[meter];

  if (!stored || stored.windowStartedAt !== windowStartedAt) {
    return { used: 0, windowStartedAt, lastEventAt: null, blocked: 0 };
  }

  return { ...stored };
}

/**
 * Where a meter stands right now.
 *
 * `state` is the only field to branch on. When the rule is off there is no
 * ceiling, so `remaining` is genuinely infinite and says so — reporting 0
 * there would render as "0 left" on an unlimited meter, which is the one
 * wrong answer that looks right.
 */
export function limitStatus(
  c: ConnectorConnection,
  meter: LimitMeterId,
  now: number,
): LimitStatus {
  const rule = c.limits?.rules?.[meter];
  const usage = normalizedUsage(c, meter, now);
  const used = usage.used;
  const max = rule?.max ?? 0;
  const resetsAt = windowResetsAt(c.limits.window, now);

  if (!rule?.enabled) {
    return { state: "off", used, max, remaining: Number.POSITIVE_INFINITY, pct: 0, resetsAt };
  }

  // max === 0 with the rule ON means "blocked at zero" — a real, choosable
  // configuration. It is also the one input that makes the pct division
  // undefined (0/0 → NaN, n/0 → Infinity), so it never reaches the division.
  if (max <= 0) {
    return { state: "blocked", used, max, remaining: 0, pct: 100, resetsAt };
  }

  // `used` can legitimately exceed `max` after the user lowers the cap below
  // what has already been spent, hence the clamps rather than an assertion.
  const pct = clamp((used / max) * 100, 0, 100);
  const remaining = Math.max(0, max - used);

  let state: LimitStatus["state"] = "ok";
  if (used >= max) state = "blocked";
  else if (used >= NEAR_LIMIT_RATIO * max) state = "near";

  return { state, used, max, remaining, pct, resetsAt };
}

export function isOverAnyLimit(c: ConnectorConnection, now: number): boolean {
  return METER_IDS.some((id) => limitStatus(c, id, now).state === "blocked");
}

/**
 * Does this connection actually hold any power that draws on this meter?
 *
 * Without this, the limits step nags about an uncapped meter that nothing can
 * ever consume — a warning the user cannot act on, which teaches them to
 * ignore the ones they can.
 */
export function meterActionsGranted(c: ConnectorConnection, meter: LimitMeterId): boolean {
  return (ACTIONS_BY_METER[meter] ?? []).some((a) => isGranted(c, a.id));
}

/* ------------------------------------------------------------------ */
/*  Health                                                             */
/* ------------------------------------------------------------------ */

function tokenHasExpired(c: ConnectorConnection, now: number): boolean {
  if (!c.tokenExpiresAt) return false;
  const at = Date.parse(c.tokenExpiresAt);
  // An unparseable stamp is not evidence of expiry — leave the verdict to the
  // explicit `status` field rather than inventing one from a bad string.
  return Number.isFinite(at) && at <= now;
}

/**
 * One status for the list column.
 *
 * An ordered array of [predicate, health], walked top-down. Nested ternaries
 * were the obvious alternative and are the reason precedence bugs in status
 * resolvers are so hard to see: the order is the specification, so it should
 * be readable as a list. Predicates are lazy — a revoked connection never pays
 * for the limit sweep or the broken-grant scan.
 */
export function connectionHealth(c: ConnectorConnection, now: number): ConnectionHealth {
  const resolution: [() => boolean, ConnectionHealth][] = [
    [() => c.status === "revoked" || !c.enabled, "revoked"],
    [() => c.status === "expired" || tokenHasExpired(c, now), "expired"],
    [() => isOverAnyLimit(c, now), "over_limit"],
    [() => brokenGrants(c).length > 0, "needs_attention"],
    [() => c.status === "pending", "pending"],
    [() => enabledModuleCount(c) === 0, "no_access"],
  ];

  for (const [predicate, health] of resolution) {
    if (predicate()) return health;
  }
  return "active";
}

/* ------------------------------------------------------------------ */
/*  Audit                                                              */
/* ------------------------------------------------------------------ */

const BLOCKED_OUTCOMES = new Set(["blocked_permission", "blocked_limit"]);

/** Filter only — input order is preserved so the caller owns the sort. */
export function auditForConnection(
  entries: ConnectorAuditEntry[],
  connectionId: string,
): ConnectorAuditEntry[] {
  return entries.filter((e) => e.connectionId === connectionId);
}

/**
 * Outcome counts since a timestamp. Entries with an unparseable `at` fall out
 * rather than being counted into a window they may not belong to — a rollup
 * that overstates is worse than one that is short by a corrupt row.
 */
export function auditRollup(
  entries: ConnectorAuditEntry[],
  sinceMs: number,
): { allowed: number; blockedPermission: number; blockedLimit: number; error: number } {
  const out = { allowed: 0, blockedPermission: 0, blockedLimit: 0, error: 0 };

  for (const e of entries) {
    const at = Date.parse(e.at);
    if (!Number.isFinite(at) || at < sinceMs) continue;
    if (e.outcome === "allowed") out.allowed += 1;
    else if (e.outcome === "blocked_permission") out.blockedPermission += 1;
    else if (e.outcome === "blocked_limit") out.blockedLimit += 1;
    else if (e.outcome === "error") out.error += 1;
  }

  return out;
}

/**
 * Refusals the user has not seen yet.
 *
 * A null marker means nothing has ever been seen, so everything is new — the
 * first visit should show the whole history of refusals, not an empty state
 * that implies the agent has never been told no.
 */
export function blockedSince(
  entries: ConnectorAuditEntry[],
  sinceIso: string | null,
): ConnectorAuditEntry[] {
  const blocked = entries.filter((e) => BLOCKED_OUTCOMES.has(e.outcome));
  if (!sinceIso) return blocked;

  const since = Date.parse(sinceIso);
  if (!Number.isFinite(since)) return blocked;

  return blocked.filter((e) => {
    const at = Date.parse(e.at);
    return Number.isFinite(at) && at > since;
  });
}
