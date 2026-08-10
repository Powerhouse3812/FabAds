/**
 * Connector (AI access) — the connections store.
 *
 * Owns every connection record: identity, permissions, limits and meter
 * usage. localStorage-backed `useSyncExternalStore`, same discipline as
 * `src/creative-report/automations/activityStore.ts` — module-cached `state`,
 * `snapshot()` returns it with zero construction, `sanitize()` never throws
 * on corrupt JSON, `persist()` is guarded, ONE exported hook.
 *
 * THE TWO RULES THAT LIVE HERE AND NOWHERE ELSE
 *
 * 1. THE UNIVERSAL INVARIANT — enabling any write action in module M forces
 *    `M.read >= "view"`, and setting `M.read = "off"` cascades every write in
 *    M off, transitively. An agent that can pause an ad it cannot see is
 *    nonsense, and it produces audit rows nobody can trace. Encoding this
 *    once here keeps all 30 `requires` arrays in the catalogue clean.
 *
 * 2. REFUSAL IS A STORE CONCERN, NOT A COMPONENT ONE. `setWriteAction`
 *    refuses a grant whose prerequisites are unmet and hands back the plan
 *    that would satisfy them. Because the rule lives here, it holds for the
 *    wizard presets and for any future code path too — not just for the one
 *    switch a component happens to render.
 *
 * The REVERSE direction is enforced with equal weight: turning a prerequisite
 * off while dependents are still on is refused the same way. Forgetting that
 * half leaves a grant referencing a permission the connection no longer has,
 * and an inconsistent grant is worse than a refused one.
 *
 * TOKENS: `issueConnectionToken()` returns a full token string exactly ONCE
 * to a caller that displays it and forgets it. Only the masked preview is
 * ever written to state or to localStorage. If this is someday wired to a
 * real endpoint, that boundary is the thing to preserve — do not "fix" it
 * into a stored field.
 */
import { useSyncExternalStore } from "react";
import type {
  AgentKind,
  AgentSurface,
  AuthMethod,
  ConnectorConnection,
  ConnectorModuleId,
  DisablePlan,
  EnablePlan,
  LimitMeterId,
  LimitRule,
  LimitWindow,
  ModulePermissionGrant,
  PermissionMap,
  ReadTier,
  UsageMap,
  WriteActionId,
} from "@/connector/model";
import {
  CONNECTOR_MODULE_IDS,
  METER_IDS,
  TOKEN_TTL_DAYS,
  defaultLimits,
  emptyPermissionMap,
  emptyUsage,
  getAgentPreset,
  getWriteAction,
  isAgentKind,
  isConnectorModuleId,
  isWriteActionId,
  presetPermissionMap,
} from "@/connector/catalogue";
import {
  buildDisablePlanForAction,
  buildDisablePlanForRead,
  buildEnablePlan,
  normalizedUsage,
  windowStartOf,
} from "@/connector/selectors";

const KEY = "fabads:connector:connections:v1";

interface ConnectorState {
  connections: ConnectorConnection[];
  /** ISO of the last time the user looked at the activity roll-up. Drives
   *  "N blocked calls since you last looked" without needing a third store. */
  auditLastSeenAt: string | null;
}

const DEFAULT_STATE: ConnectorState = { connections: [], auditLastSeenAt: null };

const READ_TIERS: ReadTier[] = ["off", "view", "view_export"];
const WINDOWS: LimitWindow[] = ["day", "week", "month"];
const STATUSES = ["connected", "pending", "expired", "revoked"] as const;

/* ------------------------------------------------------------------ */
/*  Sanitize                                                           */
/* ------------------------------------------------------------------ */

function sanitizeGrant(raw: unknown): ModulePermissionGrant {
  const g = (raw ?? {}) as Partial<ModulePermissionGrant>;
  const read = READ_TIERS.includes(g.read as ReadTier) ? (g.read as ReadTier) : "off";
  const write = Array.isArray(g.write)
    ? Array.from(new Set(g.write.filter(isWriteActionId))).sort()
    : [];
  return { read, write };
}

/** Always returns a FULL map — every module present, missing ones backfilled
 *  to off. That is what lets every selector read `map[id].read` with no
 *  optional chaining anywhere in the codebase. */
function sanitizePermissions(raw: unknown): PermissionMap {
  const base = emptyPermissionMap();
  if (!raw || typeof raw !== "object") return base;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!isConnectorModuleId(k)) continue;
    base[k] = sanitizeGrant(v);
  }
  // Drop any write action whose module doesn't match — a hand-edited file
  // could otherwise grant "launch.publish" under Reports.
  for (const id of CONNECTOR_MODULE_IDS) {
    base[id].write = base[id].write.filter((a) => getWriteAction(a).moduleId === id);
  }
  return base;
}

function sanitizeRule(raw: unknown, fallback: LimitRule): LimitRule {
  const r = (raw ?? {}) as Partial<LimitRule>;
  const max = typeof r.max === "number" && Number.isFinite(r.max) && r.max >= 0 ? r.max : fallback.max;
  const pct =
    typeof r.maxSinglePct === "number" && Number.isFinite(r.maxSinglePct) && r.maxSinglePct >= 0
      ? Math.min(r.maxSinglePct, 100)
      : fallback.maxSinglePct;
  return {
    enabled: typeof r.enabled === "boolean" ? r.enabled : fallback.enabled,
    max,
    ...(pct === undefined ? {} : { maxSinglePct: pct }),
  };
}

function sanitizeLimits(raw: unknown) {
  const base = defaultLimits();
  const l = (raw ?? {}) as Partial<typeof base>;
  const window = WINDOWS.includes(l.window as LimitWindow) ? (l.window as LimitWindow) : base.window;
  const rules = { ...base.rules };
  const incoming = (l.rules ?? {}) as Record<string, unknown>;
  for (const m of METER_IDS) rules[m] = sanitizeRule(incoming[m], base.rules[m]);
  return { window, rules };
}

function sanitizeUsage(raw: unknown, windowStartedAt: string): UsageMap {
  const base = emptyUsage(windowStartedAt);
  if (!raw || typeof raw !== "object") return base;
  for (const m of METER_IDS) {
    const u = (raw as Record<string, unknown>)[m] as Partial<UsageMap[LimitMeterId]> | undefined;
    if (!u) continue;
    base[m] = {
      used: typeof u.used === "number" && Number.isFinite(u.used) && u.used >= 0 ? u.used : 0,
      windowStartedAt: typeof u.windowStartedAt === "string" ? u.windowStartedAt : windowStartedAt,
      lastEventAt: typeof u.lastEventAt === "string" ? u.lastEventAt : null,
      blocked:
        typeof u.blocked === "number" && Number.isFinite(u.blocked) && u.blocked >= 0 ? u.blocked : 0,
    };
  }
  return base;
}

function sanitizeConnection(raw: unknown): ConnectorConnection | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<ConnectorConnection>;
  if (typeof c.id !== "string" || !c.id) return null;
  const agentKind: AgentKind = isAgentKind(c.agentKind) ? c.agentKind : "custom";
  const limits = sanitizeLimits(c.limits);
  const nowIso = new Date().toISOString();
  return {
    id: c.id,
    agentKind,
    agentSurface:
      c.agentSurface === "desktop" || c.agentSurface === "web" ? c.agentSurface : null,
    name: typeof c.name === "string" && c.name.trim() ? c.name.slice(0, 60) : getAgentPreset(agentKind).defaultName,
    customAgentLabel: typeof c.customAgentLabel === "string" ? c.customAgentLabel : null,
    authMethod: c.authMethod === "oauth" ? "oauth" : "token",
    status: (STATUSES as readonly string[]).includes(c.status as string)
      ? (c.status as ConnectorConnection["status"])
      : "pending",
    tokenPreview: typeof c.tokenPreview === "string" ? c.tokenPreview : "ff_mcp_••••••••",
    createdAt: typeof c.createdAt === "string" ? c.createdAt : nowIso,
    tokenExpiresAt: typeof c.tokenExpiresAt === "string" ? c.tokenExpiresAt : null,
    createdBy: typeof c.createdBy === "string" ? c.createdBy : "You",
    lastActiveAt: typeof c.lastActiveAt === "string" ? c.lastActiveAt : null,
    permissions: sanitizePermissions(c.permissions),
    limits,
    usage: sanitizeUsage(c.usage, windowStartOf(limits.window, Date.now())),
    enabled: typeof c.enabled === "boolean" ? c.enabled : true,
    revokedAt: typeof c.revokedAt === "string" ? c.revokedAt : null,
    revokedBy: typeof c.revokedBy === "string" ? c.revokedBy : null,
    simulated: true,
  };
}

function sanitize(raw: unknown): ConnectorState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_STATE;
  const s = raw as Partial<ConnectorState>;
  const connections = Array.isArray(s.connections)
    ? s.connections.map(sanitizeConnection).filter((c): c is ConnectorConnection => c !== null)
    : [];
  return {
    connections,
    auditLastSeenAt: typeof s.auditLastSeenAt === "string" ? s.auditLastSeenAt : null,
  };
}

/* ------------------------------------------------------------------ */
/*  Store plumbing                                                     */
/* ------------------------------------------------------------------ */

/** Absent-at-boot, NOT empty-at-boot. Clearing writes an empty array, so the
 *  key exists, so the seed never returns and "cleared" survives a reload. */
let keyWasAbsent = false;

function readInitial(): ConnectorState {
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

let state: ConnectorState = readInitial();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded or storage unavailable — keep in-memory state rather
      // than letting a write failure wedge the store.
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): ConnectorState {
  return state;
}

/** Replace one connection immutably and persist. Every mutator funnels
 *  through here so there is exactly one place that touches `state`. */
function patch(id: string, fn: (c: ConnectorConnection) => ConnectorConnection): void {
  let touched = false;
  const connections = state.connections.map((c) => {
    if (c.id !== id) return c;
    touched = true;
    return fn(c);
  });
  if (!touched) return;
  state = { ...state, connections };
  persist();
}

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/* ------------------------------------------------------------------ */
/*  Reads                                                              */
/* ------------------------------------------------------------------ */

export function getConnections(): ConnectorConnection[] {
  return state.connections;
}

export function getConnection(id: string): ConnectorConnection | undefined {
  return state.connections.find((c) => c.id === id);
}

/** THE ONLY HOOK. A second one that constructs its return value reintroduces
 *  the getSnapshot infinite loop. Derive with `useMemo` + `selectors.ts`. */
export function useConnectorConnections(): ConnectorState {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}

/* ------------------------------------------------------------------ */
/*  Lifecycle                                                          */
/* ------------------------------------------------------------------ */

export function seedConnectionsIfEmpty(build: () => ConnectorConnection[]): boolean {
  if (!keyWasAbsent) return false;
  keyWasAbsent = false;
  const seeded = build()
    .map(sanitizeConnection)
    .filter((c): c is ConnectorConnection => c !== null);
  state = { ...state, connections: seeded };
  persist();
  return true;
}

export function createConnection(input: {
  agentKind: AgentKind;
  agentSurface?: AgentSurface | null;
  name?: string;
  customAgentLabel?: string | null;
  authMethod: AuthMethod;
  permissions?: PermissionMap;
  limits?: ConnectorConnection["limits"];
  createdBy?: string;
}): string {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const preset = getAgentPreset(input.agentKind);
  const limits = input.limits ?? defaultLimits();
  const id = makeId("conn");

  const connection: ConnectorConnection = {
    id,
    agentKind: input.agentKind,
    agentSurface: input.agentSurface ?? null,
    name: (input.name?.trim() || preset.defaultName).slice(0, 60),
    customAgentLabel: input.customAgentLabel ?? null,
    authMethod: input.authMethod,
    // Always "pending" at birth: the agent has not called yet, whichever auth
    // path was used. The OAuth flow needs a row to exist BEFORE approval so
    // closing the browser mid-flow doesn't lose the whole configuration.
    status: "pending",
    tokenPreview: "ff_mcp_••••••••",
    createdAt: nowIso,
    tokenExpiresAt:
      input.authMethod === "token"
        ? new Date(now + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
        : null,
    createdBy: input.createdBy ?? "You",
    lastActiveAt: null,
    permissions: sanitizePermissions(input.permissions ?? emptyPermissionMap()),
    limits,
    usage: emptyUsage(windowStartOf(limits.window, now)),
    enabled: true,
    revokedAt: null,
    revokedBy: null,
    simulated: true,
  };

  state = { ...state, connections: [connection, ...state.connections] };
  persist();
  return id;
}

export function updateConnection(
  id: string,
  next: Partial<Pick<ConnectorConnection, "name" | "status" | "enabled" | "lastActiveAt" | "customAgentLabel">>,
): void {
  patch(id, (c) => ({
    ...c,
    ...next,
    ...(next.name === undefined ? {} : { name: next.name.slice(0, 60) }),
  }));
}

export function setConnectionEnabled(id: string, enabled: boolean): void {
  patch(id, (c) => ({ ...c, enabled }));
}

/**
 * Revoke keeps the record AND its permission grant. The row lives on as a
 * tombstone so the audit log's references still resolve, and the grant is
 * kept so "what did this thing have access to?" stays answerable after the
 * fact — which is the only question that matters once something has gone
 * wrong. Audit rows are deliberately untouched.
 */
export function revokeConnection(id: string, by = "You"): void {
  patch(id, (c) => ({
    ...c,
    status: "revoked",
    enabled: false,
    revokedAt: new Date().toISOString(),
    revokedBy: by,
  }));
}

/** Hard delete — the "Delete from list" action on an already-revoked
 *  tombstone. Audit rows SURVIVE, by design: they denormalise the connection
 *  name precisely so they can outlive the record. */
export function deleteConnection(id: string): void {
  const connections = state.connections.filter((c) => c.id !== id);
  if (connections.length === state.connections.length) return;
  state = { ...state, connections };
  persist();
}

/**
 * Returns a full token ONCE. Only the mask reaches state or storage.
 *
 * The value is generated from a fixed alphabet rather than anything
 * cryptographic on purpose — this is a prototype, nothing authenticates
 * against it, and a real-looking secret in localStorage would be worse than
 * an obviously fake one.
 */
export function issueConnectionToken(id: string): string | null {
  const c = getConnection(id);
  if (!c) return null;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let body = "";
  for (let i = 0; i < 32; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const token = `ff_mcp_live_${body}`;
  const now = Date.now();
  patch(id, (x) => ({
    ...x,
    tokenPreview: `ff_mcp_••••${body.slice(-4)}`,
    authMethod: "token",
    tokenExpiresAt: new Date(now + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    status: x.status === "expired" || x.status === "revoked" ? "pending" : x.status,
    enabled: true,
    revokedAt: null,
    revokedBy: null,
  }));
  return token;
}

/** Demo reset. Writes an EMPTY ARRAY rather than removing the key, so the
 *  zero state survives a reload instead of being re-seeded. */
export function clearAllConnections(): void {
  state = { ...state, connections: [] };
  persist();
}

export function markAuditSeen(at: string = new Date().toISOString()): void {
  state = { ...state, auditLastSeenAt: at };
  persist();
}

/* ------------------------------------------------------------------ */
/*  Permissions                                                        */
/* ------------------------------------------------------------------ */

/**
 * FLAT result shapes, not discriminated unions — deliberately, and for the
 * same reason as `PermissionVerdict` in recorder.ts.
 *
 * This project compiles with `"strict": false`, so `strictNullChecks` is off,
 * and TypeScript will NOT narrow a union discriminated by a boolean literal:
 * `if (!result.ok)` leaves the full union in scope and every `.plan` access
 * becomes a compile error. Every caller here reads `reason` and null-checks
 * the plan instead. Do not "tidy" these into `{ ok: true } | { ok: false }`.
 */
export type SetReadTierReason = "has_dependents" | "not_editable" | null;

export interface SetReadTierResult {
  ok: boolean;
  reason: SetReadTierReason;
  /** Write actions switched off as a consequence. Empty unless `ok`. */
  alsoDisabled: WriteActionId[];
  /** Present when `reason === "has_dependents"` — render it, then offer
   *  `applyDisablePlan`. */
  plan: DisablePlan | null;
}

export type SetWriteActionReason =
  | "missing_prerequisites"
  | "has_dependents"
  | "not_editable"
  | null;

export interface SetWriteActionResult {
  ok: boolean;
  reason: SetWriteActionReason;
  /** Present when `reason === "missing_prerequisites"` — this is what the
   *  amber block note renders, and what `applyEnablePlan` consumes. */
  enablePlan: EnablePlan | null;
  /** Present when `reason === "has_dependents"` — the reverse block. */
  disablePlan: DisablePlan | null;
}

/** A revoked connection is a read-only historical record. Editing its grant
 *  would rewrite what it had access to, which is exactly the thing the
 *  tombstone exists to preserve. */
function isEditable(c: ConnectorConnection): boolean {
  return c.status !== "revoked";
}

function writeGrant(
  c: ConnectorConnection,
  moduleId: ConnectorModuleId,
  fn: (g: ModulePermissionGrant) => ModulePermissionGrant,
): ConnectorConnection {
  return {
    ...c,
    permissions: { ...c.permissions, [moduleId]: fn(c.permissions[moduleId]) },
  };
}

const READ_OK = (alsoDisabled: WriteActionId[] = []): SetReadTierResult => ({
  ok: true,
  reason: null,
  alsoDisabled,
  plan: null,
});

export function setModuleReadTier(
  id: string,
  moduleId: ConnectorModuleId,
  tier: ReadTier,
): SetReadTierResult {
  const c = getConnection(id);
  if (!c || !isEditable(c)) {
    return { ok: false, reason: "not_editable", alsoDisabled: [], plan: null };
  }
  if (c.permissions[moduleId].read === tier) return READ_OK();

  if (tier === "off") {
    const plan = buildDisablePlanForRead(c, moduleId, tier);
    // Anything OUTSIDE this module that would break is a cross-module
    // consequence the user has not seen — refuse and let them confirm.
    const external = plan.alsoDisables.filter((a) => getWriteAction(a).moduleId !== moduleId);
    if (external.length > 0) {
      return { ok: false, reason: "has_dependents", alsoDisabled: [], plan };
    }

    const inModule = c.permissions[moduleId].write;
    patch(id, (x) => writeGrant(x, moduleId, () => ({ read: "off", write: [] })));
    return READ_OK(inModule);
  }

  patch(id, (x) => writeGrant(x, moduleId, (g) => ({ ...g, read: tier })));
  return READ_OK();
}

const WRITE_OK: SetWriteActionResult = {
  ok: true,
  reason: null,
  enablePlan: null,
  disablePlan: null,
};

export function setWriteAction(
  id: string,
  actionId: WriteActionId,
  on: boolean,
): SetWriteActionResult {
  const c = getConnection(id);
  if (!c || !isEditable(c)) {
    return { ok: false, reason: "not_editable", enablePlan: null, disablePlan: null };
  }

  const moduleId = getWriteAction(actionId).moduleId;
  const isOn = c.permissions[moduleId].write.includes(actionId);
  if (isOn === on) return WRITE_OK;

  if (on) {
    const plan = buildEnablePlan(c, actionId);
    // Refuse rather than silently granting the closure. The amber note in the
    // UI renders `plan.summary`, and [Turn on all of them] calls
    // applyEnablePlan — so nothing is ever granted the user hasn't read.
    if (plan.blocked) {
      return { ok: false, reason: "missing_prerequisites", enablePlan: plan, disablePlan: null };
    }
    patch(id, (x) => applyEnableToConnection(x, plan, actionId));
    return WRITE_OK;
  }

  const plan = buildDisablePlanForAction(c, actionId);
  if (plan.blocked) {
    return { ok: false, reason: "has_dependents", enablePlan: null, disablePlan: plan };
  }
  patch(id, (x) => applyDisableToConnection(x, [actionId]));
  return WRITE_OK;
}

/**
 * PURE. Exported because the connect wizard edits a DRAFT connection held in
 * local React state — no store record exists until the user presses Create —
 * and it must apply exactly the same rules the store would. Two
 * implementations of "what does enabling this action imply" would drift, and
 * the one in the wizard is the one users meet first.
 */
export function applyEnableToConnection(
  c: ConnectorConnection,
  plan: EnablePlan,
  actionId: WriteActionId,
): ConnectorConnection {
  const permissions: PermissionMap = { ...c.permissions };

  for (const r of plan.raisesReads) {
    permissions[r.moduleId] = { ...permissions[r.moduleId], read: r.to };
  }

  const toEnable = [...plan.enablesWrites, actionId];
  for (const a of toEnable) {
    const m = getWriteAction(a).moduleId;
    const g = permissions[m];
    // THE UNIVERSAL INVARIANT. Belt and braces alongside plan.raisesReads —
    // this must hold no matter which path reached here.
    const read: ReadTier = g.read === "off" ? "view" : g.read;
    permissions[m] = {
      read,
      write: g.write.includes(a) ? g.write : [...g.write, a].sort(),
    };
  }

  return { ...c, permissions };
}

/** PURE — see `applyEnableToConnection`. Same reason. */
export function applyDisableToConnection(
  c: ConnectorConnection,
  actionIds: WriteActionId[],
): ConnectorConnection {
  const permissions: PermissionMap = { ...c.permissions };
  for (const a of actionIds) {
    const m = getWriteAction(a).moduleId;
    const g = permissions[m];
    permissions[m] = { ...g, write: g.write.filter((x) => x !== a) };
  }
  return { ...c, permissions };
}

/**
 * PURE. Setting a module to Off drops its write actions too — the universal
 * invariant makes write-without-read impossible, so leaving them behind would
 * produce a grant that `brokenGrants()` immediately flags.
 *
 * NOTE: this does NOT walk cross-module dependents. Callers must run
 * `buildDisablePlanForRead` first and refuse (or confirm) when it reports
 * external breakage — same contract `setModuleReadTier` follows.
 */
export function withReadTier(
  c: ConnectorConnection,
  moduleId: ConnectorModuleId,
  tier: ReadTier,
): ConnectorConnection {
  return writeGrant(c, moduleId, (g) =>
    tier === "off" ? { read: "off", write: [] } : { ...g, read: tier },
  );
}

/** PURE. Bulk read-tier change on a draft, mirroring `setAllReadTiers`. */
export function withAllReadTiers(c: ConnectorConnection, tier: ReadTier): ConnectorConnection {
  const permissions: PermissionMap = { ...c.permissions };
  for (const m of CONNECTOR_MODULE_IDS) {
    permissions[m] = tier === "off" ? { read: "off", write: [] } : { ...permissions[m], read: tier };
  }
  return { ...c, permissions };
}

/** PURE. Applies a DisablePlan to a draft — the [Turn off all four] path. */
export function withDisablePlanApplied(
  c: ConnectorConnection,
  plan: DisablePlan,
): ConnectorConnection {
  const cleared = applyDisableToConnection(c, plan.alsoDisables);
  if (plan.target.kind === "write") {
    return applyDisableToConnection(cleared, [plan.target.actionId]);
  }
  return withReadTier(cleared, plan.target.moduleId, "off");
}

/** Backs the [Turn on all of them] button. The plan came from a pure dry-run,
 *  so what gets applied is exactly what the note listed. */
export function applyEnablePlan(id: string, plan: EnablePlan): void {
  const c = getConnection(id);
  if (!c || !isEditable(c)) return;
  patch(id, (x) => applyEnableToConnection(x, plan, plan.actionId));
}

/** Backs [Turn off all four]. Handles both a write target and a read target —
 *  turning a module to Off is the same operation with a wider blast radius. */
export function applyDisablePlan(id: string, plan: DisablePlan): void {
  const c = getConnection(id);
  if (!c || !isEditable(c)) return;
  patch(id, (x) => {
    const cleared = applyDisableToConnection(x, plan.alsoDisables);
    if (plan.target.kind === "write") {
      return applyDisableToConnection(cleared, [plan.target.actionId]);
    }
    const m = plan.target.moduleId;
    return {
      ...cleared,
      permissions: { ...cleared.permissions, [m]: { read: "off", write: [] } },
    };
  });
}

/**
 * Persist a permission map that has ALREADY been through the dependency
 * rules — i.e. one produced by `applyEnableToConnection` /
 * `applyDisableToConnection` / `withReadTier`, which is exactly what
 * `PermissionMatrix` hands back.
 *
 * Deliberately does NOT re-run `buildEnablePlan`. Re-deriving the closure
 * here would double-apply it and, worse, could silently grant something the
 * user never saw in the amber note — the one outcome the whole block-and-
 * confirm design exists to prevent. `sanitizePermissions` still runs, so a
 * malformed map can't get in; the invariant is re-asserted rather than
 * re-decided.
 */
export function setConnectionPermissions(id: string, permissions: PermissionMap): void {
  patch(id, (c) => ({ ...c, permissions: sanitizePermissions(permissions) }));
}

/**
 * Bulk read-tier control. Touches READ TIERS ONLY, never write actions — a
 * bulk control that can silently grant write access is exactly the silent
 * grant the whole dependency-block design exists to prevent.
 *
 * Setting everything to "off" therefore also drops every write action, since
 * the universal invariant makes a write-without-read impossible.
 */
export function setAllReadTiers(id: string, tier: ReadTier): void {
  const c = getConnection(id);
  if (!c || !isEditable(c)) return;
  patch(id, (x) => {
    const permissions: PermissionMap = { ...x.permissions };
    for (const m of CONNECTOR_MODULE_IDS) {
      permissions[m] =
        tier === "off" ? { read: "off", write: [] } : { ...permissions[m], read: tier };
    }
    return { ...x, permissions };
  });
}

/** Wizard presets. `read` / `read_export` wipe write actions by construction;
 *  "custom" is a no-op here because the user edits the matrix directly. */
export function applyPermissionPreset(id: string, preset: "read" | "read_export"): void {
  const c = getConnection(id);
  if (!c || !isEditable(c)) return;
  patch(id, (x) => ({
    ...x,
    permissions: presetPermissionMap(preset === "read" ? "view" : "view_export"),
  }));
}

/* ------------------------------------------------------------------ */
/*  Limits                                                             */
/* ------------------------------------------------------------------ */

export function setLimitRule(
  id: string,
  meter: LimitMeterId,
  next: Partial<LimitRule>,
): void {
  patch(id, (c) => ({
    ...c,
    limits: { ...c.limits, rules: { ...c.limits.rules, [meter]: { ...c.limits.rules[meter], ...next } } },
  }));
}

/**
 * Changing the window RESETS every meter's usage.
 *
 * Carrying `used: 10` from a weekly bucket into a daily one would instantly
 * block the connection with a number that never made sense in the new window.
 * The UI confirms this first — silently zeroing a spend counter is a trust
 * bug in the other direction, so the reset must be stated, not just done.
 */
export function setLimitWindow(id: string, window: LimitWindow): void {
  const now = Date.now();
  patch(id, (c) => {
    if (c.limits.window === window) return c;
    return {
      ...c,
      limits: { ...c.limits, window },
      usage: emptyUsage(windowStartOf(window, now)),
    };
  });
}

/** Demo reset, labelled as such in the UI. Not an audit deletion. */
export function resetUsage(id: string, meter?: LimitMeterId): void {
  const now = Date.now();
  patch(id, (c) => {
    const start = windowStartOf(c.limits.window, now);
    if (!meter) return { ...c, usage: emptyUsage(start) };
    return {
      ...c,
      usage: {
        ...c.usage,
        [meter]: { used: 0, windowStartedAt: start, lastEventAt: null, blocked: 0 },
      },
    };
  });
}

export interface ConsumeResult {
  allowed: boolean;
  used: number;
  max: number;
  remaining: number;
  resetsAt: string;
  /** Present only when `allowed` is false. */
  reason: "over_limit" | "over_single_change" | null;
}

/**
 * The one place a meter moves. Called by `recorder.ts` only.
 *
 * `amount` is DOLLARS for `budget_change` and 1 for every count meter — which
 * is the whole reason the budget meter is value-based. A frequency cap tells
 * you how often an agent acted, never how much damage it did.
 *
 * Two deliberate calls:
 *  - Usage is counted even when `rule.enabled` is false. Only BLOCKING is
 *    gated on `enabled`, so switching a limit on later shows real history
 *    ("14 launches this week") instead of a meaningless zero.
 *  - A refusal increments `blocked` and leaves `used` alone. A call that
 *    never happened must not consume budget.
 */
export function consumeMeter(
  id: string,
  meter: LimitMeterId,
  amount: number,
  now: number = Date.now(),
  /** Fraction of the current value this single change represents, 0–1.
   *  Only meaningful for `budget_change`. */
  singleChangePct?: number,
): ConsumeResult {
  const c = getConnection(id);
  if (!c) {
    return { allowed: false, used: 0, max: 0, remaining: 0, resetsAt: "", reason: "over_limit" };
  }

  const rule = c.limits.rules[meter];
  const usage = normalizedUsage(c, meter, now);
  const nowIso = new Date(now).toISOString();
  const resetsAt = windowStartOf(c.limits.window, now);

  const refuse = (reason: ConsumeResult["reason"]): ConsumeResult => {
    patch(id, (x) => ({
      ...x,
      usage: { ...x.usage, [meter]: { ...usage, blocked: usage.blocked + 1 } },
    }));
    return {
      allowed: false,
      used: usage.used,
      max: rule.max,
      remaining: Math.max(0, rule.max - usage.used),
      resetsAt,
      reason,
    };
  };

  if (
    meter === "budget_change" &&
    rule.enabled &&
    typeof rule.maxSinglePct === "number" &&
    rule.maxSinglePct > 0 &&
    typeof singleChangePct === "number" &&
    singleChangePct * 100 > rule.maxSinglePct
  ) {
    return refuse("over_single_change");
  }

  if (rule.enabled && usage.used + amount > rule.max) return refuse("over_limit");

  const used = usage.used + amount;
  patch(id, (x) => ({
    ...x,
    lastActiveAt: nowIso,
    status: x.status === "pending" ? "connected" : x.status,
    usage: { ...x.usage, [meter]: { ...usage, used, lastEventAt: nowIso } },
  }));

  return {
    allowed: true,
    used,
    max: rule.max,
    remaining: rule.enabled ? Math.max(0, rule.max - used) : Number.POSITIVE_INFINITY,
    resetsAt,
    reason: null,
  };
}

/** Unmetered activity still proves the connection is alive, and flips a
 *  pending connection to connected the first time the agent actually calls. */
export function touchConnection(id: string, now: number = Date.now()): void {
  const nowIso = new Date(now).toISOString();
  patch(id, (c) => ({
    ...c,
    lastActiveAt: nowIso,
    status: c.status === "pending" ? "connected" : c.status,
  }));
}
