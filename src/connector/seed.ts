/**
 * Connector (AI access) — demo seed data.
 *
 * WHY EVERY TIMESTAMP IS A RELATIVE OFFSET
 * This is a prototype with no backend — the "data" is whatever this module
 * returns at import time. A frozen `createdAt: "2026-01-01T..."` would drift
 * the moment the calendar moves past it: "23 days ago" quietly becomes "9
 * months ago", and a fixed `tokenExpiresAt` eventually renders as a token
 * that expired in the past — or, worse, one still years in the future. So
 * every date below is computed from a `now` argument supplied by the caller
 * at call time (`Date.now()` in practice, a fixed value in tests), using
 * `date-fns` offsets (`subDays`/`subHours`/`subMinutes`/`addDays`) rather
 * than string literals. Re-running this module next month should look exactly
 * as fresh as it does today.
 *
 * WHY THESE SIX CONNECTIONS, SPECIFICALLY
 * Each one is seeded to land the app on a state that would otherwise take
 * several manual clicks to reach — most importantly Claude's
 * `launch.create_draft` sitting OFF (see the comment on that line below),
 * which puts a first-time viewer one click away from the amber dependency
 * block instead of a wall of green toggles. The other five cover the
 * remaining corners: a read-only connection with nothing to limit, a
 * never-connected pending OAuth flow, a connection that is over its limit,
 * a revoked connection whose grant and audit trail both survive it, and a
 * connection whose TOKEN LAPSED — without which the amber "This token
 * expired" strip and the entire "Issue a new token" recovery flow are dead
 * code in the demo.
 *
 * EVERY MONEY FIGURE IS USD
 * The limit meters format `budget_change` with `$` (see
 * `selectors.formatMeterValue`), so a rupee figure anywhere in an audit
 * detail makes the same workspace appear to run two currencies at once.
 */
import { addDays, subDays, subHours, subMinutes } from "date-fns";
import {
  buildLimitBlockMessage,
  windowStartOf as selectorsWindowStartOf,
} from "@/connector/selectors";
// The refusal sentences are QUOTED from the same two functions the runtime
// hands to the agent, never re-typed — that is the only thing that keeps the
// seeded `blockMessage` byte-identical to what a real refusal would say.
import { evaluateAgentCall } from "@/connector/recorder";

import {
  CONNECTOR_MODULE_IDS,
  METER_IDS,
  TOKEN_TTL_DAYS,
  defaultLimits,
  emptyPermissionMap,
  emptyUsage,
  getModuleDef,
  getWriteAction,
} from "@/connector/catalogue";
import type {
  AgentKind,
  ConnectorAuditEntry,
  ConnectorConnection,
  ConnectorModuleId,
  LimitMeterId,
  LimitsConfig,
  LimitWindow,
  ModulePermissionGrant,
  PermissionMap,
  UsageMap,
  WriteActionId,
} from "@/connector/model";

/* ------------------------------------------------------------------ */
/*  Time helpers                                                      */
/* ------------------------------------------------------------------ */

/** Offset a base Date by any combination of days/hours/minutes in the past. */
function agoFrom(base: Date, days = 0, hours = 0, minutes = 0): Date {
  let d = base;
  if (days) d = subDays(d, days);
  if (hours) d = subHours(d, hours);
  if (minutes) d = subMinutes(d, minutes);
  return d;
}

const iso = (d: Date): string => d.toISOString();

/**
 * Start of the bucket a given LimitWindow is currently in, relative to `at`.
 *
 * Delegates to `selectors.windowStartOf` rather than reimplementing the
 * bucket maths. The seed writes `usage.windowStartedAt`, and `normalizedUsage`
 * decides whether a meter has rolled over by comparing that string against
 * its own computation — so if the two ever disagreed by even a millisecond,
 * every seeded connection would appear to have rolled over on first render
 * and the demo would boot with all its usage silently zeroed.
 */
function windowStartOf(window: LimitWindow, at: Date): Date {
  return new Date(selectorsWindowStartOf(window, at.getTime()));
}

/* ------------------------------------------------------------------ */
/*  Permission helpers                                                */
/* ------------------------------------------------------------------ */

function grant(read: ModulePermissionGrant["read"], write: WriteActionId[] = []): ModulePermissionGrant {
  return { read, write };
}

/** Starts from `emptyPermissionMap()` (every module off) and overlays only
 *  the modules a connection actually has something set on — reusing the
 *  catalogue's own enumeration of CONNECTOR_MODULE_IDS instead of a second,
 *  hand-written list that could drift from it. */
function buildPermissions(overrides: Partial<Record<ConnectorModuleId, ModulePermissionGrant>>): PermissionMap {
  const base = emptyPermissionMap();
  for (const id of CONNECTOR_MODULE_IDS) {
    if (overrides[id]) base[id] = overrides[id]!;
  }
  return base;
}

/* ------------------------------------------------------------------ */
/*  Connections                                                       */
/* ------------------------------------------------------------------ */

export function buildSeedConnections(now: number): ConnectorConnection[] {
  const nowDate = new Date(now);

  /* ---------------- 1. Claude — claude.ai ---------------- */

  const claudeCreatedAt = agoFrom(nowDate, 23);
  const claudeWindowStart = windowStartOf("day", nowDate);

  const claudePermissions = buildPermissions({
    reports: grant("view_export", ["reports.change_budget", "reports.pause_resume"]),
    insights: grant("view_export", ["insights.save_ad"]),
    dashboard: grant("view"),
    // launch.create_draft is deliberately OFF, not just left unset. It is the
    // single most important seeding decision in this file: with it off, a
    // reviewer who opens this connection and flips Industry Insights → "Launch
    // from a competitor ad" hits the amber dependency block on their very
    // first click — instead of having to configure five other things by hand
    // before ever seeing the feature's hero interaction (block + inline
    // enable). If this ever gets accidentally turned on while seeding, the
    // demo's best moment becomes invisible.
    launch: grant("view"),
    genie: grant("view", ["genie.generate"]),
    catalogue: grant("view"),
    "creative-library": grant("view", ["creative-library.manage_folders"]),
    automation: grant("off"),
    "video-sage": grant("off"),
  });

  const claudeUsage: UsageMap = {
    ...emptyUsage(iso(claudeWindowStart)),
    // 415 of 500 → 83%, which selectors should read as "near".
    budget_change: {
      used: 415,
      windowStartedAt: iso(claudeWindowStart),
      lastEventAt: iso(agoFrom(nowDate, 0, 3)),
      blocked: 0,
    },
    creations: {
      used: 32,
      windowStartedAt: iso(claudeWindowStart),
      lastEventAt: iso(agoFrom(nowDate, 2, 5)),
      blocked: 0,
    },
    launches: {
      used: 0,
      windowStartedAt: iso(claudeWindowStart),
      lastEventAt: null,
      blocked: 0,
    },
    live_changes: {
      used: 6,
      windowStartedAt: iso(claudeWindowStart),
      lastEventAt: iso(agoFrom(nowDate, 0, 6)),
      blocked: 0,
    },
  };

  const claude: ConnectorConnection = {
    id: "conn-seed-claude",
    agentKind: "claude",
    agentSurface: "web",
    name: "Claude",
    customAgentLabel: null,
    authMethod: "oauth",
    status: "connected",
    tokenPreview: "ff_mcp_••••7Q2A",
    createdAt: iso(claudeCreatedAt),
    tokenExpiresAt: null, // OAuth has no pasted token to expire.
    createdBy: "Rahul",
    lastActiveAt: iso(agoFrom(nowDate, 0, 0, 40)),
    permissions: claudePermissions,
    limits: defaultLimits(), // Every field below matches the catalogue defaults exactly.
    usage: claudeUsage,
    enabled: true,
    revokedAt: null,
    revokedBy: null,
    simulated: true,
  };

  /* ---------------- 2. Cursor — Rahul's laptop ---------------- */

  const cursorCreatedAt = agoFrom(nowDate, 11);
  const cursorWindowStart = windowStartOf("day", nowDate);

  const cursorPermissions = buildPermissions({
    reports: grant("view_export"),
    dashboard: grant("view"),
    "creative-library": grant("view"),
    // Every other module stays off, and — the point of this connection —
    // there is not a single write action on anywhere. This is what proves
    // the "Nothing to limit yet — this connection can only look, not
    // change" copy path actually renders instead of being dead code.
  });

  // All four rules disabled; the max values are carried over from
  // defaultLimits() rather than zeroed, because LimitRule.max is documented
  // as PRESERVED so flipping "No limit" back on doesn't erase what was there.
  const cursorLimits: LimitsConfig = {
    window: "day",
    rules: Object.fromEntries(
      METER_IDS.map((id) => [id, { ...defaultLimits().rules[id], enabled: false }]),
    ) as LimitsConfig["rules"],
  };

  const cursor: ConnectorConnection = {
    id: "conn-seed-cursor",
    agentKind: "cursor",
    agentSurface: null,
    name: "Cursor — Rahul's laptop",
    customAgentLabel: null,
    authMethod: "token",
    status: "connected",
    tokenPreview: "ff_mcp_••••K3M9",
    createdAt: iso(cursorCreatedAt),
    tokenExpiresAt: iso(addDays(cursorCreatedAt, TOKEN_TTL_DAYS)),
    createdBy: "Rahul",
    lastActiveAt: iso(agoFrom(nowDate, 2)),
    permissions: cursorPermissions,
    limits: cursorLimits,
    usage: emptyUsage(iso(cursorWindowStart)),
    enabled: true,
    revokedAt: null,
    revokedBy: null,
    simulated: true,
  };

  /* ---------------- 3. ChatGPT ---------------- */

  const chatgptCreatedAt = agoFrom(nowDate, 0, 2);
  const chatgptWindowStart = windowStartOf("day", nowDate);

  const chatgpt: ConnectorConnection = {
    id: "conn-seed-chatgpt",
    agentKind: "chatgpt",
    agentSurface: null,
    name: "ChatGPT",
    customAgentLabel: null,
    authMethod: "oauth",
    status: "pending",
    tokenPreview: "ff_mcp_••••P1XZ",
    createdAt: iso(chatgptCreatedAt),
    tokenExpiresAt: null,
    createdBy: "Rahul",
    lastActiveAt: null, // Never connected — the OAuth flow hasn't been finished.
    permissions: emptyPermissionMap(),
    limits: defaultLimits(),
    usage: emptyUsage(iso(chatgptWindowStart)),
    enabled: true,
    revokedAt: null,
    revokedBy: null,
    simulated: true,
  };

  /* ---------------- 4. Ops bot ---------------- */

  const opsBotCreatedAt = agoFrom(nowDate, 46);
  const opsBotWindowStart = windowStartOf("week", nowDate);

  // Every write action below has its prerequisites hand-verified against
  // catalogue.ts's `requires` arrays — see the report at the end of the build
  // for the walk-through. Nothing here trips `brokenGrants()`.
  const opsBotPermissions = buildPermissions({
    reports: grant("view", ["reports.duplicate"]),
    launch: grant("view", ["launch.create_draft", "launch.publish"]),
    insights: grant("view", ["insights.launch_from_ad"]),
    catalogue: grant("view", ["catalogue.launch_from_product"]),
    "creative-library": grant("view", ["creative-library.manage_folders"]),
    automation: grant("view", ["automation.toggle_rule"]),
  });

  const opsBotUsage: UsageMap = {
    ...emptyUsage(iso(opsBotWindowStart)),
    budget_change: {
      used: 350,
      windowStartedAt: iso(opsBotWindowStart),
      lastEventAt: iso(agoFrom(nowDate, 1)),
      blocked: 0,
    },
    // 10 of 10, 3 refused — the only way to demo a hard block without waiting
    // for one to occur live. The three blocked_limit audit rows below are
    // exactly the three write actions that draw on this meter for Ops bot.
    launches: {
      used: 10,
      windowStartedAt: iso(opsBotWindowStart),
      lastEventAt: iso(agoFrom(nowDate, 0, 3, 30)),
      blocked: 3,
    },
    live_changes: {
      used: 12,
      windowStartedAt: iso(opsBotWindowStart),
      lastEventAt: iso(agoFrom(nowDate, 3)),
      blocked: 0,
    },
    creations: {
      used: 20,
      windowStartedAt: iso(opsBotWindowStart),
      lastEventAt: iso(agoFrom(nowDate, 2)),
      blocked: 0,
    },
  };

  const opsBotLimits: LimitsConfig = {
    window: "week",
    rules: {
      budget_change: { enabled: true, max: 1000, maxSinglePct: 25 },
      launches: { enabled: true, max: 10 },
      live_changes: { enabled: true, max: 40 },
      creations: { enabled: true, max: 80 },
    },
  };

  const opsBot: ConnectorConnection = {
    id: "conn-seed-opsbot",
    agentKind: "custom",
    agentSurface: null,
    name: "Ops bot",
    customAgentLabel: "Internal ops runner",
    authMethod: "token",
    status: "connected",
    tokenPreview: "ff_mcp_••••4T7B",
    createdAt: iso(opsBotCreatedAt),
    tokenExpiresAt: iso(addDays(opsBotCreatedAt, TOKEN_TTL_DAYS)),
    createdBy: "Priya",
    lastActiveAt: iso(agoFrom(nowDate, 0, 3, 30)),
    permissions: opsBotPermissions,
    limits: opsBotLimits,
    usage: opsBotUsage,
    enabled: true,
    revokedAt: null,
    revokedBy: null,
    simulated: true,
  };

  /* ---------------- 5. Windsurf ---------------- */

  const windsurfCreatedAt = agoFrom(nowDate, 60);
  const windsurfWindowStart = windowStartOf("day", nowDate);

  // A real grant survives the revoke — Reports view + pause/resume stay set
  // on the connection record. That grant, plus the separate audit store
  // still explaining this connection's history below, is the visible proof
  // that permissions and audit are two stores, not one.
  const windsurfPermissions = buildPermissions({
    reports: grant("view", ["reports.pause_resume"]),
  });

  const windsurf: ConnectorConnection = {
    id: "conn-seed-windsurf",
    agentKind: "windsurf",
    agentSurface: null,
    name: "Windsurf",
    customAgentLabel: null,
    authMethod: "token",
    status: "revoked",
    tokenPreview: "ff_mcp_••••9XQ1",
    createdAt: iso(windsurfCreatedAt),
    tokenExpiresAt: iso(addDays(windsurfCreatedAt, TOKEN_TTL_DAYS)),
    createdBy: "Rahul",
    lastActiveAt: iso(agoFrom(nowDate, 9)),
    permissions: windsurfPermissions,
    limits: defaultLimits(),
    usage: emptyUsage(iso(windsurfWindowStart)),
    enabled: false,
    revokedAt: iso(agoFrom(nowDate, 4)),
    revokedBy: "Rahul",
    simulated: true,
  };

  /* ---------------- 6. VS Code — old laptop ---------------- */

  // The ONLY connection in the demo whose token has actually lapsed.
  //
  // Without it, `status: "expired"` and a past `tokenExpiresAt` are both
  // unreachable states: nothing in the app ever sets the status, and the other
  // five tokens are all issued TOKEN_TTL_DAYS ahead of a creation date inside
  // that window. So the amber "This token expired on …" strip and the whole
  // "Issue a new token" recovery flow render for nobody. State coverage is not
  // optional in this repo, and an unreachable recovery path is the state most
  // worth being able to look at.
  //
  // Both signals are set deliberately — `status: "expired"` AND a stamp 30 days
  // in the past — so the demo is honest whichever one a reader trusts, and so
  // `evaluateAgentCall`'s date check (not just its status check) is exercised.
  const vscodeCreatedAt = agoFrom(nowDate, 120);
  const vscodeWindowStart = windowStartOf("day", nowDate);

  // A REAL grant survives the expiry — this is what makes the strip's promise
  // ("everything you set up below is kept") visibly true rather than a claim.
  // Reissuing the token restores exactly this access, nothing more.
  const vscodePermissions = buildPermissions({
    reports: grant("view", ["reports.pause_resume"]),
  });

  const vscode: ConnectorConnection = {
    id: "conn-seed-vscode",
    agentKind: "vscode",
    agentSurface: null,
    name: "VS Code — old laptop",
    customAgentLabel: null,
    authMethod: "token",
    status: "expired",
    tokenPreview: "ff_mcp_••••D8W5",
    createdAt: iso(vscodeCreatedAt),
    // 30 days in the PAST — deliberately not `createdAt + TOKEN_TTL_DAYS`,
    // which would only land in the past for as long as 120 > TOKEN_TTL_DAYS.
    tokenExpiresAt: iso(agoFrom(nowDate, 30)),
    createdBy: "Rahul",
    // Last used the day BEFORE it expired, so its two audit rows below sit
    // earlier than the expiry rather than after a token that no longer worked.
    lastActiveAt: iso(agoFrom(nowDate, 31)),
    permissions: vscodePermissions,
    limits: defaultLimits(),
    usage: emptyUsage(iso(vscodeWindowStart)),
    enabled: true,
    revokedAt: null,
    revokedBy: null,
    simulated: true,
  };

  return [claude, cursor, chatgpt, opsBot, windsurf, vscode];
}

/* ------------------------------------------------------------------ */
/*  Audit                                                              */
/* ------------------------------------------------------------------ */

interface AuditSeedInput {
  id: string;
  connectionId: string;
  moduleId: ConnectorModuleId | null;
  kind: ConnectorAuditEntry["kind"];
  actionId: string;
  outcome: ConnectorAuditEntry["outcome"];
  /** The ATTEMPT, always — never the refusal. See ConnectorAuditEntry.detail. */
  detail: string;
  /** Verbatim agent-facing refusal. Omitted (→ null) on allowed rows. */
  blockMessage?: string;
  meter: LimitMeterId | null;
  at: Date;
  /** Only needed for kinds without a WriteActionDef to pull a label from. */
  actionLabelOverride?: string;
}

export function buildSeedAudit(connections: ConnectorConnection[], now: number): ConnectorAuditEntry[] {
  const nowDate = new Date(now);
  const byId = new Map(connections.map((c) => [c.id, c]));

  const connOf = (id: string): { connectionName: string; agentKind: AgentKind } => {
    const c = byId.get(id);
    if (!c) throw new Error(`buildSeedAudit: unknown seed connection id "${id}"`);
    return { connectionName: c.name, agentKind: c.agentKind };
  };

  // The exact agent-facing string Ops bot's launch attempts receive once the
  // "launches" meter is at 10 of 10 for the week. Built by the SAME function
  // the recorder calls, not re-typed here: the design's whole claim is that the
  // log quotes the agent verbatim, and a second hand-written copy of the
  // sentence is how that claim quietly stops being true. Computed from `now`
  // rather than hard-coded, for the same reason nothing else here is.
  //
  // It goes to `blockMessage`, NOT to `detail` — each of the three blocked rows
  // below names the launch it actually tried, or the log cannot say which one
  // was refused.
  const launchLimitMessage = buildLimitBlockMessage({
    meter: "launches",
    used: 10,
    max: 10,
    window: "week",
    currentWindowStart: selectorsWindowStartOf("week", now),
  });

  // Same discipline for the one blocked_permission row: quoted from the
  // function that would actually refuse the call, against the real seeded
  // Cursor record (which genuinely holds no write on Reports), rather than
  // typed out by hand.
  const cursorPauseRefusal = evaluateAgentCall(
    byId.get("conn-seed-cursor"),
    "reports",
    { kind: "write", actionId: "reports.pause_resume" },
    now,
  ).message;

  function toEntry(input: AuditSeedInput): ConnectorAuditEntry {
    const { connectionName, agentKind } = connOf(input.connectionId);
    const moduleLabel = input.moduleId ? getModuleDef(input.moduleId).label : null;
    const actionLabel =
      input.actionLabelOverride ??
      (input.kind === "write" ? getWriteAction(input.actionId as WriteActionId).label : "Read");
    return {
      id: input.id,
      connectionId: input.connectionId,
      connectionName,
      agentKind,
      moduleId: input.moduleId,
      moduleLabel,
      kind: input.kind,
      actionId: input.actionId,
      actionLabel,
      outcome: input.outcome,
      detail: input.detail,
      blockMessage: input.blockMessage ?? null,
      meter: input.meter,
      at: iso(input.at),
      simulated: true,
    };
  }

  const CLAUDE = "conn-seed-claude";
  const CURSOR = "conn-seed-cursor";
  const OPSBOT = "conn-seed-opsbot";
  const WINDSURF = "conn-seed-windsurf";
  const VSCODE = "conn-seed-vscode";

  // Listed newest-first by construction — every `at` offset below is strictly
  // increasing top to bottom, so no separate sort step is needed (or can hide
  // a mistake).
  const seeds: AuditSeedInput[] = [
    // 1 — Claude, read
    {
      id: "audit-seed-1",
      connectionId: CLAUDE,
      moduleId: "reports",
      kind: "read",
      actionId: "reports.read",
      outcome: "allowed",
      detail: "Read performance for 34 campaigns (last 7 days).",
      meter: null,
      at: agoFrom(nowDate, 0, 0, 40),
    },
    // 2 — Claude, write (metered)
    {
      id: "audit-seed-2",
      connectionId: CLAUDE,
      moduleId: "reports",
      kind: "write",
      actionId: "reports.change_budget",
      outcome: "allowed",
      detail: 'Raised "Prospecting — US" daily budget $200 → $260.',
      meter: getWriteAction("reports.change_budget").meter,
      at: agoFrom(nowDate, 0, 3),
    },
    // 3 — Ops bot, blocked_limit
    {
      id: "audit-seed-3",
      connectionId: OPSBOT,
      moduleId: "catalogue",
      kind: "write",
      actionId: "catalogue.launch_from_product",
      outcome: "blocked_limit",
      detail: 'Tried to launch "Mamaearth — Vitamin C Serum" from the catalogue.',
      blockMessage: launchLimitMessage,
      meter: "launches",
      at: agoFrom(nowDate, 0, 3, 30),
    },
    // 4 — Ops bot, blocked_limit
    {
      id: "audit-seed-4",
      connectionId: OPSBOT,
      moduleId: "insights",
      kind: "write",
      actionId: "insights.launch_from_ad",
      outcome: "blocked_limit",
      detail: 'Tried to launch a campaign from competitor ad "Boat — Monsoon Sale Hook".',
      blockMessage: launchLimitMessage,
      meter: "launches",
      at: agoFrom(nowDate, 0, 5, 30),
    },
    // 5 — Claude, write (metered)
    {
      id: "audit-seed-5",
      connectionId: CLAUDE,
      moduleId: "reports",
      kind: "write",
      actionId: "reports.pause_resume",
      outcome: "allowed",
      detail: 'Paused "Retargeting — Cart Abandoners" ad set.',
      meter: getWriteAction("reports.pause_resume").meter,
      at: agoFrom(nowDate, 0, 6),
    },
    // 6 — Ops bot, blocked_limit
    {
      id: "audit-seed-6",
      connectionId: OPSBOT,
      moduleId: "launch",
      kind: "write",
      actionId: "launch.publish",
      outcome: "blocked_limit",
      detail: 'Tried to publish "Winter Sale — Prospecting".',
      blockMessage: launchLimitMessage,
      meter: "launches",
      at: agoFrom(nowDate, 1, 0, 30),
    },
    // 7 — Claude, read
    {
      id: "audit-seed-7",
      connectionId: CLAUDE,
      moduleId: "insights",
      kind: "read",
      actionId: "insights.read",
      outcome: "allowed",
      detail: "Read 18 competitor ads for the Beauty & Personal Care benchmark.",
      meter: null,
      at: agoFrom(nowDate, 1, 2),
    },
    // 8 — Claude, write (unmetered)
    {
      id: "audit-seed-8",
      connectionId: CLAUDE,
      moduleId: "insights",
      kind: "write",
      actionId: "insights.save_ad",
      outcome: "allowed",
      detail: 'Saved competitor ad "Boat — Monsoon Sale Hook" to Saved list.',
      meter: getWriteAction("insights.save_ad").meter,
      at: agoFrom(nowDate, 1, 6),
    },
    // 9 — Cursor, read (matches lastActiveAt)
    {
      id: "audit-seed-9",
      connectionId: CURSOR,
      moduleId: "reports",
      kind: "read",
      actionId: "reports.read",
      outcome: "allowed",
      detail: "Read performance for 8 campaigns (last 7 days).",
      meter: null,
      at: agoFrom(nowDate, 2),
    },
    // 10 — Ops bot, write (unmetered)
    {
      id: "audit-seed-10",
      connectionId: OPSBOT,
      moduleId: "automation",
      kind: "write",
      actionId: "automation.toggle_rule",
      outcome: "allowed",
      detail: 'Turned on rule "Auto-pause CPA > $50".',
      meter: getWriteAction("automation.toggle_rule").meter,
      at: agoFrom(nowDate, 2, 0, 30),
    },
    // 11 — Claude, read
    {
      id: "audit-seed-11",
      connectionId: CLAUDE,
      moduleId: "genie",
      kind: "read",
      actionId: "genie.read",
      outcome: "allowed",
      detail: 'Read 6 past generations for brand "Mamaearth".',
      meter: null,
      at: agoFrom(nowDate, 2, 1),
    },
    // 12 — Cursor, read
    {
      id: "audit-seed-12",
      connectionId: CURSOR,
      moduleId: "dashboard",
      kind: "read",
      actionId: "dashboard.read",
      outcome: "allowed",
      detail: "Read account roll-up for 3 ad accounts.",
      meter: null,
      at: agoFrom(nowDate, 2, 3),
    },
    // 13 — Claude, write (metered)
    {
      id: "audit-seed-13",
      connectionId: CLAUDE,
      moduleId: "genie",
      kind: "write",
      actionId: "genie.generate",
      outcome: "allowed",
      detail: 'Generated 4 headline variations for "Mamaearth — Hair Oil".',
      meter: getWriteAction("genie.generate").meter,
      at: agoFrom(nowDate, 2, 5),
    },
    // 14 — Claude, write (unmetered)
    {
      id: "audit-seed-14",
      connectionId: CLAUDE,
      moduleId: "creative-library",
      kind: "write",
      actionId: "creative-library.manage_folders",
      outcome: "allowed",
      detail: 'Created folder "Q3 Winners" in Creative Library.',
      meter: getWriteAction("creative-library.manage_folders").meter,
      at: agoFrom(nowDate, 3, 2),
    },
    // 15 — Claude, read
    {
      id: "audit-seed-15",
      connectionId: CLAUDE,
      moduleId: "reports",
      kind: "read",
      actionId: "reports.read",
      outcome: "allowed",
      detail: "Read performance for 12 ad sets (last 24 hours).",
      meter: null,
      at: agoFrom(nowDate, 3, 8),
    },
    // 16 — Ops bot, write (unmetered)
    {
      id: "audit-seed-16",
      connectionId: OPSBOT,
      moduleId: "launch",
      kind: "write",
      actionId: "launch.create_draft",
      outcome: "allowed",
      // USD, like every other figure in this workspace — the budget meter
      // formats with `$`, so a rupee amount here would read as two currencies.
      detail: 'Created draft launch "Mamaearth — Retarget Wave 2" ($1,500/day, 3 ad sets).',
      meter: getWriteAction("launch.create_draft").meter,
      at: agoFrom(nowDate, 4, 0, 30),
    },
    // 17 — Cursor, read
    {
      id: "audit-seed-17",
      connectionId: CURSOR,
      moduleId: "creative-library",
      kind: "read",
      actionId: "creative-library.read",
      outcome: "allowed",
      detail: "Read 22 assets across 5 folders.",
      meter: null,
      at: agoFrom(nowDate, 4, 1),
    },
    // 18 — Windsurf, auth (revoked)
    {
      id: "audit-seed-18",
      connectionId: WINDSURF,
      moduleId: null,
      kind: "auth",
      actionId: "auth.revoked",
      outcome: "allowed",
      detail: "Access revoked by Rahul.",
      meter: null,
      at: agoFrom(nowDate, 4, 1, 30),
      actionLabelOverride: "Access revoked",
    },
    // 19 — Claude, write (metered)
    {
      id: "audit-seed-19",
      connectionId: CLAUDE,
      moduleId: "reports",
      kind: "write",
      actionId: "reports.change_budget",
      outcome: "allowed",
      detail: 'Raised "Scale — Metro IN" daily budget $500 → $600.',
      meter: getWriteAction("reports.change_budget").meter,
      at: agoFrom(nowDate, 4, 3),
    },
    // 20 — Cursor, read
    {
      id: "audit-seed-20",
      connectionId: CURSOR,
      moduleId: "reports",
      kind: "read",
      actionId: "reports.read",
      outcome: "allowed",
      detail: "Read performance for 15 ad sets (last 24 hours).",
      meter: null,
      at: agoFrom(nowDate, 4, 4),
    },
    // 21 — Cursor, blocked_permission — the only one in the file
    {
      id: "audit-seed-21",
      connectionId: CURSOR,
      moduleId: "reports",
      kind: "write",
      actionId: "reports.pause_resume",
      outcome: "blocked_permission",
      detail: 'Tried to pause "Prospecting — US" ad set.',
      blockMessage: cursorPauseRefusal,
      meter: null,
      at: agoFrom(nowDate, 4, 5),
    },
    // 22 — Claude, write (metered)
    {
      id: "audit-seed-22",
      connectionId: CLAUDE,
      moduleId: "reports",
      kind: "write",
      actionId: "reports.pause_resume",
      outcome: "allowed",
      detail: 'Resumed "Prospecting — US" ad set.',
      meter: getWriteAction("reports.pause_resume").meter,
      at: agoFrom(nowDate, 5, 1),
    },
    // 23 — Claude, read
    {
      id: "audit-seed-23",
      connectionId: CLAUDE,
      moduleId: "insights",
      kind: "read",
      actionId: "insights.read",
      outcome: "allowed",
      detail: "Read category benchmarks for Beauty & Personal Care.",
      meter: null,
      at: agoFrom(nowDate, 5, 6),
    },
    // 24 — Claude, write (metered)
    {
      id: "audit-seed-24",
      connectionId: CLAUDE,
      moduleId: "genie",
      kind: "write",
      actionId: "genie.generate",
      outcome: "allowed",
      detail: 'Generated 3 image concepts for "Mamaearth — Face Wash".',
      meter: getWriteAction("genie.generate").meter,
      at: agoFrom(nowDate, 6, 4),
    },
    // 25 — Claude, read
    {
      id: "audit-seed-25",
      connectionId: CLAUDE,
      moduleId: "reports",
      kind: "read",
      actionId: "reports.read",
      outcome: "allowed",
      detail: "Read performance for 34 campaigns (last 30 days).",
      meter: null,
      at: agoFrom(nowDate, 9, 2),
    },
    // 27 — VS Code, read. Its two rows sit BEFORE the token's expiry date
    // (30 days ago), because a lapsed token cannot have made a call after it
    // lapsed — and because the expired strip promises the connection's history
    // and grants are kept, which is only visible if there is a history to keep.
    {
      id: "audit-seed-27",
      connectionId: VSCODE,
      moduleId: "reports",
      kind: "read",
      actionId: "reports.read",
      outcome: "allowed",
      detail: "Read performance for 6 campaigns (last 7 days).",
      meter: null,
      at: agoFrom(nowDate, 31),
    },
    // 28 — VS Code, read
    {
      id: "audit-seed-28",
      connectionId: VSCODE,
      moduleId: "reports",
      kind: "read",
      actionId: "reports.read",
      outcome: "allowed",
      detail: "Read spend and CPA for 4 ad sets (yesterday).",
      meter: null,
      at: agoFrom(nowDate, 31, 4),
    },
    // 26 — Windsurf, auth (connected) — oldest entry in the file
    {
      id: "audit-seed-26",
      connectionId: WINDSURF,
      moduleId: null,
      kind: "auth",
      actionId: "auth.connected",
      outcome: "allowed",
      detail: "Connected via token.",
      meter: null,
      at: agoFrom(nowDate, 60),
      actionLabelOverride: "Connected",
    },
  ];

  // ChatGPT gets zero entries by omission — it has never connected, and its
  // per-connection log must render an honest empty state rather than a
  // fabricated one.
  return seeds.map(toEntry);
}
