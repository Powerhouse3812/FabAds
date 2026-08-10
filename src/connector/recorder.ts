/**
 * Connector (AI access) — THE single write path for agent activity.
 *
 * Permission check → meter → audit row, in one readable function. No
 * component ever calls `consumeMeter` or `appendAuditEntry` directly.
 *
 * WHY THIS FILE EXISTS AT ALL
 * The connections store and the audit store are deliberately separate (a
 * revoked connection's history has to outlive its record). The cost of that
 * split is that a meter consumption and its evidence are two writes to two
 * different places. Funnelling every agent call through here is what keeps
 * them from drifting: there is exactly one place where "the agent did
 * something" turns into both a counter movement and a log row, so a future
 * caller cannot accidentally record one without the other.
 *
 * THE ORDER OF THE CHECKS IS LOAD-BEARING
 *   1. connection exists / enabled / connected / token still in date
 *   2. PERMISSION — a denied call must NEVER burn a limit. Checking the
 *      meter first would let an unauthorised agent drain someone's daily
 *      budget allowance just by being refused repeatedly.
 *   3. per-change cap, then the window meter
 *   4. audit row, always, whatever the outcome
 *
 * TWO FACTS PER ROW, NOT ONE
 * `agentError` is the literal string handed back to the agent, and it is
 * stored VERBATIM as the audit row's `blockMessage`. The row's `detail` stays
 * the caller's ATTEMPT sentence, whatever the outcome. Storing the refusal in
 * `detail` (as this file used to) kept the log and the agent in sync at the
 * cost of the more useful fact: every blocked launch rendered the same
 * "limit reached" line, so the log could no longer say which launch was
 * refused. Carrying both fields keeps the parity claim AND the identity of
 * the thing that was refused — which is what someone actually needs when they
 * are working out why their assistant said it couldn't do something.
 */
import type {
  AgentCallOutcome,
  AuditOutcome,
  ConnectorConnection,
  ConnectorModuleId,
  LimitMeterId,
  ReadTier,
  WriteActionId,
} from "@/connector/model";
import { getModuleDef, getWriteAction } from "@/connector/catalogue";
// The agent-facing refusal sentence is written in exactly one place — see the
// header comment on `buildLimitBlockMessage`. The seed reads it from there too.
import { buildLimitBlockMessage } from "@/connector/selectors";
import {
  appendAuditEntry,
  buildAuthEntry,
  buildConfigEntry,
  type NewAuditEntry,
} from "@/connector/auditStore";
import {
  consumeMeter,
  getConnection,
  touchConnection,
} from "@/connector/connectionsStore";

/* ------------------------------------------------------------------ */
/*  Intent                                                             */
/* ------------------------------------------------------------------ */

export type AgentIntent =
  | { kind: "write"; actionId: WriteActionId }
  | { kind: "read"; tier: "view" | "view_export" };

const TIER_RANK: Record<ReadTier, number> = { off: 0, view: 1, view_export: 2 };

const ALLOWED: PermissionVerdict = { allowed: true, reason: null, message: null };

export type PermissionDenial = "unknown" | "disabled" | "revoked" | "expired" | "no_permission";

/**
 * A FLAT shape, not a discriminated union — deliberately.
 *
 * This project compiles with `"strict": false` (see tsconfig.app.json), which
 * turns off `strictNullChecks`, and without it TypeScript does not narrow a
 * union discriminated by a BOOLEAN literal: `if (!verdict.allowed)` leaves
 * `verdict` as the full union and every access to `.reason` / `.message` is
 * an error. Anywhere in this module that genuinely needs a union uses a
 * STRING discriminant instead, which narrows fine either way.
 *
 * Do not "tidy" this back into `{ allowed: true } | { allowed: false, ... }`.
 */
export interface PermissionVerdict {
  allowed: boolean;
  /** null when allowed. */
  reason: PermissionDenial | null;
  /** The literal sentence handed to the agent. null when allowed. */
  message: string | null;
}

/**
 * Has the token's expiry date passed?
 *
 * Mirrors `selectors.tokenHasExpired` deliberately: `status` is a stored field
 * and nothing in a prototype with no backend ever flips it, so a connection
 * whose token lapsed at midnight still reads `status: "connected"`. Trusting
 * the status alone would let a dead token keep working — the exact opposite of
 * what the "This token expired" strip in the UI promises.
 *
 * `Number.isFinite` guards the parse: an unparseable stamp is not evidence of
 * expiry, and treating it as such would let one corrupt string block every
 * call on the connection.
 */
function tokenHasExpired(c: ConnectorConnection, now: number): boolean {
  if (!c.tokenExpiresAt) return false;
  const at = Date.parse(c.tokenExpiresAt);
  return Number.isFinite(at) && at <= now;
}

/**
 * Pure. Exported so the UI can answer "what would happen if the agent tried
 * this?" without recording anything — and so this logic is testable in
 * isolation from the two stores it otherwise sits between.
 *
 * `now` is an ARGUMENT, never `Date.now()` read inside: same inputs, same
 * answer, and a test can sit on any date without mocking the clock — the rule
 * the whole of `selectors.ts` is written to.
 */
export function evaluateAgentCall(
  c: ConnectorConnection | undefined,
  moduleId: ConnectorModuleId,
  intent: AgentIntent,
  now: number = Date.now(),
): PermissionVerdict {
  if (!c) {
    return { allowed: false, reason: "unknown", message: "FabAds: this connection no longer exists." };
  }
  if (c.status === "revoked") {
    return {
      allowed: false,
      reason: "revoked",
      message: "FabAds: this connection was revoked. Connect the app again from Settings → Connector.",
    };
  }
  if (c.status === "expired" || tokenHasExpired(c, now)) {
    return {
      allowed: false,
      reason: "expired",
      message: "FabAds: this connection's token has expired. Issue a new one in Settings → Connector.",
    };
  }
  if (!c.enabled) {
    return { allowed: false, reason: "disabled", message: "FabAds: this connection is paused." };
  }

  const grant = c.permissions[moduleId];
  const moduleLabel = getModuleDef(moduleId).label;

  if (intent.kind === "read") {
    if (TIER_RANK[grant.read] >= TIER_RANK[intent.tier]) return ALLOWED;
    const need = intent.tier === "view_export" ? "download" : "read";
    return {
      allowed: false,
      reason: "no_permission",
      message: `FabAds: this connection can't ${need} ${moduleLabel}. Turn it on in Settings → Connector.`,
    };
  }

  if (grant.write.includes(intent.actionId)) return ALLOWED;
  return {
    allowed: false,
    reason: "no_permission",
    message: `FabAds: this connection isn't allowed to ${getWriteAction(intent.actionId).label.toLowerCase()} in ${moduleLabel}. Turn it on in Settings → Connector.`,
  };
}

/* ------------------------------------------------------------------ */
/*  The write path                                                     */
/* ------------------------------------------------------------------ */

function baseEntry(c: ConnectorConnection, moduleId: ConnectorModuleId | null) {
  return {
    connectionId: c.id,
    // Denormalised on purpose — see auditStore's header. A row must explain
    // itself after its connection is gone.
    connectionName: c.name,
    agentKind: c.agentKind,
    moduleId,
    moduleLabel: moduleId ? getModuleDef(moduleId).label : null,
  };
}

export interface RecordAgentCallInput {
  connectionId: string;
  moduleId: ConnectorModuleId;
  intent: AgentIntent;
  /**
   * The ATTEMPT, WITH THE ACTUAL VALUES — `Raised "Prospecting — US" daily
   * budget $200 → $260`, or `Tried to publish "Winter Sale — Prospecting"`.
   * Never "changed budget": a log that says "changed budget" answers nothing,
   * which is the whole product value at stake.
   *
   * It is written to the audit row's `detail` UNCHANGED on every path,
   * including the refused ones — the refusal goes to `blockMessage`, so a
   * blocked row still names which thing was refused.
   */
  detail: string;
  /** Dollars for budget_change, 1 for count meters. Defaults to 1. */
  amount?: number;
  /** Fraction (0–1) of the current value this single change represents.
   *  Only consulted for `budget_change`, against `rule.maxSinglePct`. */
  singleChangePct?: number;
  at?: number;
}

export function recordAgentCall(input: RecordAgentCallInput): AgentCallOutcome {
  const now = input.at ?? Date.now();
  const nowIso = new Date(now).toISOString();
  const c = getConnection(input.connectionId);

  const actionId =
    input.intent.kind === "write" ? input.intent.actionId : `${input.moduleId}.read`;
  const actionLabel =
    input.intent.kind === "write"
      ? getWriteAction(input.intent.actionId).label
      : input.intent.tier === "view_export"
        ? "Download"
        : "Read";

  /* 1 — the connection is gone entirely. Nothing to attribute a row to, so
   *      there is nothing honest to log; just tell the agent. */
  if (!c) {
    return {
      outcome: "error",
      agentError: "FabAds: this connection no longer exists.",
      meter: null,
      remaining: null,
      resetsAt: null,
    };
  }

  /* 2 — PERMISSION, before any meter is touched. A denied call must never
   *     burn a limit, or an unauthorised agent could drain someone's daily
   *     allowance purely by being refused over and over. */
  const verdict = evaluateAgentCall(c, input.moduleId, input.intent, now);
  if (!verdict.allowed) {
    const outcome: AuditOutcome =
      verdict.reason === "no_permission" ? "blocked_permission" : "error";
    appendAuditEntry({
      ...baseEntry(c, input.moduleId),
      kind: input.intent.kind,
      actionId,
      actionLabel,
      outcome,
      // The ATTEMPT, unchanged — so the row still says WHICH thing was
      // refused, not merely that something was.
      detail: input.detail,
      // Verbatim, same as the limit path — the log must never tell a
      // different story from what the agent was told.
      blockMessage: verdict.message,
      meter: null,
      at: nowIso,
    } satisfies NewAuditEntry);
    return {
      outcome,
      agentError: verdict.message,
      meter: null,
      remaining: null,
      resetsAt: null,
    };
  }

  const meter: LimitMeterId | null =
    input.intent.kind === "write" ? getWriteAction(input.intent.actionId).meter : null;

  /* 3 — unmetered calls still prove liveness and flip pending → connected. */
  if (!meter) {
    touchConnection(input.connectionId, now);
    appendAuditEntry({
      ...baseEntry(c, input.moduleId),
      kind: input.intent.kind,
      actionId,
      actionLabel,
      outcome: "allowed",
      detail: input.detail,
      blockMessage: null,
      meter: null,
      at: nowIso,
    } satisfies NewAuditEntry);
    return { outcome: "allowed", agentError: null, meter: null, remaining: null, resetsAt: null };
  }

  const amount = input.amount ?? 1;
  const result = consumeMeter(input.connectionId, meter, amount, now, input.singleChangePct);

  if (!result.allowed) {
    const agentError =
      result.reason === "over_single_change"
        ? `FabAds: that change is larger than this connection's per-change cap of ${c.limits.rules.budget_change.maxSinglePct}%. Ask the workspace owner to raise it in Settings → Connector.`
        : buildLimitBlockMessage({
            meter,
            used: result.used,
            max: result.max,
            window: c.limits.window,
            currentWindowStart: result.resetsAt,
          });

    appendAuditEntry({
      ...baseEntry(c, input.moduleId),
      kind: "write",
      actionId,
      actionLabel,
      outcome: "blocked_limit",
      // The ATTEMPT — three blocked launches must not all read alike.
      detail: input.detail,
      // VERBATIM — the log and the agent must never tell different stories.
      blockMessage: agentError,
      meter,
      at: nowIso,
    } satisfies NewAuditEntry);

    return {
      outcome: "blocked_limit",
      agentError,
      meter,
      remaining: result.remaining,
      resetsAt: result.resetsAt,
    };
  }

  appendAuditEntry({
    ...baseEntry(c, input.moduleId),
    kind: "write",
    actionId,
    actionLabel,
    outcome: "allowed",
    detail: input.detail,
    blockMessage: null,
    meter,
    at: nowIso,
  } satisfies NewAuditEntry);

  return {
    outcome: "allowed",
    agentError: null,
    meter,
    remaining: Number.isFinite(result.remaining) ? result.remaining : null,
    resetsAt: result.resetsAt,
  };
}

/* ------------------------------------------------------------------ */
/*  Lifecycle + config events                                          */
/* ------------------------------------------------------------------ */

export type AuthEvent =
  | "connected"
  | "revoked"
  | "token_issued"
  | "oauth_approved"
  | "expired"
  | "deleted";

const AUTH_COPY: Record<AuthEvent, { label: string; detail: (by: string) => string }> = {
  connected: { label: "Connected", detail: (by) => `Connected by ${by}.` },
  oauth_approved: { label: "Approved", detail: (by) => `Access approved by ${by}.` },
  token_issued: { label: "New token issued", detail: (by) => `A new access token was issued by ${by}. The previous one stopped working.` },
  revoked: { label: "Access revoked", detail: (by) => `Access revoked by ${by}. The connection can no longer read or change anything.` },
  expired: { label: "Token expired", detail: () => "The access token reached its expiry date and stopped working." },
  deleted: { label: "Removed from list", detail: (by) => `Removed from the list by ${by}. This history is kept.` },
};

/** Lifecycle rows exist so the roll-up shows how a connection GOT its access,
 *  not only what it did with it. "Who gave the robot permission" is the first
 *  question anyone asks after something goes wrong. */
export function recordAuthEvent(connectionId: string, event: AuthEvent, by = "You"): void {
  const c = getConnection(connectionId);
  if (!c) return;
  const copy = AUTH_COPY[event];
  appendAuditEntry(
    buildAuthEntry({
      connectionId: c.id,
      connectionName: c.name,
      agentKind: c.agentKind,
      actionId: `auth.${event}`,
      actionLabel: copy.label,
      detail: copy.detail(by),
      at: new Date().toISOString(),
    }),
  );
}

/** A permission or limit edit made by a HUMAN in the FabAds UI. */
export function recordConfigChange(params: {
  connectionId: string;
  moduleId?: ConnectorModuleId | null;
  actionId: string;
  actionLabel: string;
  detail: string;
  meter?: LimitMeterId | null;
}): void {
  const c = getConnection(params.connectionId);
  if (!c) return;
  const moduleId = params.moduleId ?? null;
  appendAuditEntry(
    buildConfigEntry({
      connectionId: c.id,
      connectionName: c.name,
      agentKind: c.agentKind,
      moduleId,
      moduleLabel: moduleId ? getModuleDef(moduleId).label : null,
      actionId: params.actionId,
      actionLabel: params.actionLabel,
      detail: params.detail,
      at: new Date().toISOString(),
      meter: params.meter ?? null,
    }),
  );
}

