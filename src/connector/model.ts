/**
 * Connector (AI access) — type contract.
 *
 * Pure types. Zero runtime, zero React, zero storage. Every other file in
 * `src/connector/` imports from here and nothing here imports from them, so
 * the module graph stays a tree and the stores/catalogue/selectors can be
 * built independently against one fixed shape.
 *
 * WHY PERMISSION IDS ARE NOT NAV KEYS
 * `src/components/sidebar/modules.ts` keys Launch as `launchv2` and its IA has
 * been re-cut five times (A-2 → A-12.38). A permission grant persisted in
 * localStorage against nav keys would silently drop permissions on the next
 * rename — permissions are a security surface, nav is a layout surface, and
 * they must not share an identifier namespace. `ConnectorModuleDef.navKey`
 * is the one-way back-pointer, used ONLY for the "Open module" deep link.
 *
 * The `ModuleGroup` type IS imported from modules.ts so RUN/CREATE/TOOLS
 * ordering stays single-sourced.
 */
import type { ModuleGroup } from "@/components/sidebar/modules";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Module + action identity                                           */
/* ------------------------------------------------------------------ */

/** The 9 modules exposed over MCP. Copilot is deliberately absent — see
 *  EXCLUDED_MODULE_NOTES in catalogue.ts, which explains it in the UI. */
export type ConnectorModuleId =
  // RUN
  | "dashboard"
  | "reports"
  | "insights"
  | "launch"
  | "automation"
  // CREATE
  | "genie"
  | "catalogue"
  | "creative-library"
  // TOOLS
  | "video-sage";

/** Namespaced `<moduleId>.<action>` so an audit row is self-describing even
 *  when read in isolation. */
export type WriteActionId =
  // reports
  | "reports.change_budget"
  | "reports.pause_resume"
  | "reports.duplicate"
  | "reports.save_to_library"
  | "reports.generate_variation"
  | "reports.launch_from_report"
  // insights
  | "insights.save_ad"
  | "insights.manage_board"
  | "insights.track_brand"
  | "insights.generate_from_ad"
  | "insights.launch_from_ad"
  // launch
  | "launch.create_draft"
  | "launch.publish"
  | "launch.save_strategy"
  | "launch.edit_defaults"
  // automation
  | "automation.manage_rule"
  | "automation.toggle_rule"
  | "automation.run_now"
  // genie
  | "genie.generate"
  | "genie.save_to_library"
  | "genie.edit_brand_context"
  // catalogue
  | "catalogue.manage_brand"
  | "catalogue.manage_product"
  | "catalogue.manage_category"
  | "catalogue.generate_from_product"
  | "catalogue.launch_from_product"
  // creative library
  | "creative-library.manage_folders"
  | "creative-library.move_items"
  | "creative-library.delete_assets"
  | "creative-library.launch_adgroup"
  // video sage
  | "video-sage.analyze_video";

/* ------------------------------------------------------------------ */
/*  Permission grant                                                   */
/* ------------------------------------------------------------------ */

/**
 * Off → View → View + Export, in increasing order of power.
 *
 * HONESTY NOTE, load-bearing: "view_export" enables bulk-export tools. It is
 * a statement of intent, NOT an enforceable boundary — anything an agent can
 * read it can reproduce. Copy must never imply it prevents the agent from
 * copying data.
 */
export type ReadTier = "off" | "view" | "view_export";

export interface ModulePermissionGrant {
  read: ReadTier;
  /** Sorted + deduped + validated against the catalogue by sanitize(). */
  write: WriteActionId[];
}

/**
 * FULL record, never Partial. sanitize() backfills every missing module with
 * `{ read: "off", write: [] }`, so selectors read `map[id].read` with no
 * optional chaining and "3 of 9 modules on" is a plain count, not a guess.
 */
export type PermissionMap = Record<ConnectorModuleId, ModulePermissionGrant>;

/* ------------------------------------------------------------------ */
/*  Write-action catalogue                                             */
/* ------------------------------------------------------------------ */

/** Drives the consequence chip. Exactly three kinds, no more — past three,
 *  people stop reading them (Miller). `standard` renders no chip. */
export type WriteActionRisk = "standard" | "changes_live_ads" | "spends_budget" | "uses_credits";

/** A prerequisite is either another write action, or a minimum read tier. */
export type Prerequisite =
  | { kind: "write"; actionId: WriteActionId }
  | { kind: "read"; moduleId: ConnectorModuleId; minTier: "view" | "view_export" };

/** The four things a connection can be capped on. */
export type LimitMeterId =
  /** VALUE meter — dollars of budget increase, not a count. */
  | "budget_change"
  | "launches"
  /** Pause / resume / duplicate / delete — burn no money, so a count is the
   *  only available lever. Without this meter they'd be unconstrained. */
  | "live_changes"
  | "creations";

export interface WriteActionDef {
  id: WriteActionId;
  moduleId: ConnectorModuleId;
  /** Toggle label — "Change adset budget". Sentence case, plain English. */
  label: string;
  /** One honest line: what the agent can actually do. Rendered under the toggle. */
  description: string;
  /** Zero or more chips. Empty array = no chip. */
  risk: WriteActionRisk[];
  /** Which meter a single invocation consumes. null = unmetered. */
  meter: LimitMeterId | null;
  /**
   * Cross-module dependency edges. HARD CAP: one hop, max two entries.
   * Past that, "Turn on all three" becomes reflexive whack-a-mole — a silent
   * grant wearing a button. If an action needs more, don't ship the action.
   *
   * The universal invariant (any write in M forces M.read >= "view") is NOT
   * listed here — it lives in the store so all 30 arrays stay clean.
   */
  requires: Prerequisite[];
}

export interface ConnectorModuleDef {
  id: ConnectorModuleId;
  label: string;
  group: ModuleGroup;
  icon: LucideIcon;
  /** One line under the module name in the permission row. */
  description: string;
  /** What "View" lets the agent see. */
  readDescription: string;
  /** What "View + Export" adds on top. */
  exportDescription: string;
  /** Back-pointer into MODULES — for the "Open module" deep link ONLY.
   *  Never used as a permission identifier. */
  navKey: string;
  /** Route for that deep link. */
  navPath: string;
}

/* ------------------------------------------------------------------ */
/*  Limits                                                             */
/* ------------------------------------------------------------------ */

export type LimitWindow = "day" | "week" | "month";

export interface LimitRule {
  enabled: boolean;
  /**
   * Dollars for `budget_change`, a plain count for every other meter.
   * Meaningless while `enabled` is false, but PRESERVED — flipping
   * "No limit" back must not destroy what the user typed.
   */
  max: number;
  /**
   * `budget_change` ONLY. Max % of the current budget a single change may
   * move. 0 = no per-change cap.
   *
   * This field is the whole reason the budget meter went value-based: a pure
   * frequency cap ("6 changes/day") lets an agent take a $100/day adset to
   * $100,000/day, six times, fully compliant.
   */
  maxSinglePct?: number;
}

export interface LimitsConfig {
  /** ONE window shared by all four meters. Three independent windows is a
   *  3×3 mental model with no payoff. */
  window: LimitWindow;
  rules: Record<LimitMeterId, LimitRule>;
}

export interface MeterUsage {
  /** Dollars for `budget_change`, a count otherwise. Current window only. */
  used: number;
  /** ISO start of the bucket `used` belongs to. Drives lazy rollover — there
   *  are no timers anywhere in this module. */
  windowStartedAt: string;
  /** ISO of the most recent counted call, or null. */
  lastEventAt: string | null;
  /** Refusals since windowStartedAt. Feeds "refused 3 times this week". */
  blocked: number;
}

export type UsageMap = Record<LimitMeterId, MeterUsage>;

/* ------------------------------------------------------------------ */
/*  Connection record                                                  */
/* ------------------------------------------------------------------ */

export type AgentKind =
  | "claude"
  | "chatgpt"
  | "gemini"
  | "cursor"
  | "vscode"
  | "windsurf"
  | "cline"
  | "custom";

/** Which surface of a multi-surface agent. Only Claude has two today; the
 *  wizard asks explicitly rather than inferring, because this is what decides
 *  the token-vs-OAuth fork. */
export type AgentSurface = "desktop" | "web";

export type AuthMethod = "token" | "oauth";

export type ConnectionStatus = "connected" | "pending" | "expired" | "revoked";

export interface AgentPreset {
  kind: AgentKind;
  label: string;
  /** One line in the wizard tile. */
  tagline: string;
  /** Wizard grouping — "Chat apps" / "Coding tools" / "Anything else". */
  bucket: "chat" | "coding" | "other";
  /** Two-letter monogram for the avatar. */
  monogram: string;
  /** Brand hex for the avatar chip ONLY. Never used as a text or UI colour —
   *  these are third-party brand marks, not design tokens. */
  brandHex: string;
  /** Auth methods this agent genuinely supports, in preference order. */
  authMethods: AuthMethod[];
  /** True when the agent has both a desktop and a web surface (Claude). */
  hasSurfaceChoice: boolean;
  /** Config file path shown above the snippet. null for OAuth-only / manual. */
  configPath: string | null;
  /** Which snippet shape the agent wants. */
  configShape: "mcpServers" | "vscodeServers" | "urlAndHeader";
  defaultName: string;
}

export interface ConnectorConnection {
  id: string;
  agentKind: AgentKind;
  /** Only meaningful when the agent has a surface choice; null otherwise. */
  agentSurface: AgentSurface | null;
  /** User-editable, max 60 chars. */
  name: string;
  /** Only meaningful for agentKind === "custom"; null otherwise. */
  customAgentLabel: string | null;
  authMethod: AuthMethod;
  status: ConnectionStatus;
  /**
   * MASKED, DISPLAY-ONLY — e.g. "ff_mcp_••••7Q2A".
   *
   * A full token is returned exactly ONCE from `issueConnectionToken()` to a
   * component that shows it and forgets it. It is NEVER written to state or
   * to localStorage. If this is ever wired to a real endpoint, that boundary
   * is the thing to preserve — do not "fix" this into a plain-text field.
   */
  tokenPreview: string;
  createdAt: string;
  /** ISO. Token path only; null for OAuth. */
  tokenExpiresAt: string | null;
  createdBy: string;
  /** null until the agent has actually called something. */
  lastActiveAt: string | null;
  permissions: PermissionMap;
  limits: LimitsConfig;
  usage: UsageMap;
  /** Pause switch, kept separate from `status` so "paused" is not "revoked". */
  enabled: boolean;
  /** ISO — set on revoke, drives the 30-day tombstone. */
  revokedAt: string | null;
  revokedBy: string | null;
  /** Honesty flag on every record. Nothing here ever reached a real system. */
  simulated: true;
}

/* ------------------------------------------------------------------ */
/*  Audit                                                              */
/* ------------------------------------------------------------------ */

export type AuditKind = "read" | "write" | "auth" | "config";

export type AuditOutcome =
  | "allowed"
  | "blocked_permission"
  | "blocked_limit"
  | "error";

export interface ConnectorAuditEntry {
  id: string;
  connectionId: string;
  /**
   * Denormalised — and this is the entire reason the audit log is a SEPARATE
   * store rather than a field on ConnectorConnection. A revoked or deleted
   * connection's history must still explain itself, never fall back to a
   * raw id.
   */
  connectionName: string;
  agentKind: AgentKind;
  /** null for auth/config events that aren't about a module. */
  moduleId: ConnectorModuleId | null;
  moduleLabel: string | null;
  kind: AuditKind;
  /** "reports.change_budget" | "reports.read" | "auth.revoked" */
  actionId: string;
  actionLabel: string;
  outcome: AuditOutcome;
  /**
   * ALWAYS THE ATTEMPT, never the refusal.
   *
   * Honest, human-readable, past tense, and containing the ACTUAL VALUES —
   * `Raised "Prospecting — US" daily budget $200 → $260`, or, when it was
   * refused, `Tried to publish "Winter Sale — Prospecting"`. Never a generic
   * verb ("changed budget"), and never the FabAds error string.
   *
   * WHY THIS IS NOT THE ERROR MESSAGE (it used to be)
   * Storing the refusal here satisfied "the log and the agent never disagree"
   * by throwing away the more useful fact: three blocked launches all rendered
   * the identical "FabAds: launch limit reached (10 of 10 this week)…" in the
   * `What it did` column, so the log could no longer say WHICH launch was
   * refused. The two facts are now split — the attempt lives here, the verbatim
   * refusal lives in `blockMessage`, and the row carries both.
   */
  detail: string;
  /**
   * The VERBATIM string the agent was handed, byte-identical, or null.
   *
   * Non-null only for `blocked_limit` / `blocked_permission` / `error`.
   *
   * This must stay byte-identical to what the agent was told — it is the whole
   * basis of the claim that the log and the agent can never tell different
   * stories, which matters most in exactly the case someone is trying to work
   * out why their assistant said it couldn't do something. So it is quoted,
   * never re-derived, never re-worded, and never localised at render time: both
   * the recorder and the seed produce it from `buildLimitBlockMessage` /
   * `evaluateAgentCall` rather than hand-writing a second copy of the sentence.
   */
  blockMessage: string | null;
  /** Set only for blocked_limit / metered writes. */
  meter: LimitMeterId | null;
  at: string;
  simulated: true;
}

/* ------------------------------------------------------------------ */
/*  Derived shapes                                                     */
/* ------------------------------------------------------------------ */

/**
 * The dry-run behind the dependency block. `buildEnablePlan()` produces this
 * WITHOUT mutating anything, so the amber note can name every consequence
 * before the user commits — that is what makes "block + inline enable" an
 * informed grant rather than a silent one.
 */
export interface EnablePlan {
  actionId: WriteActionId;
  /** false = prerequisites already satisfied, the toggle may proceed. */
  blocked: boolean;
  /** Other write actions that must be switched on. Excludes actionId itself. */
  enablesWrites: WriteActionId[];
  /** Read tiers that must be raised. */
  raisesReads: { moduleId: ConnectorModuleId; from: ReadTier; to: ReadTier }[];
  /** Flattened human lines for the note. Must name EVERY consequence. */
  summary: string[];
}

/** Mirror of EnablePlan for the reverse direction — turning a prerequisite
 *  OFF while dependents are on. Forgetting this half leaves inconsistent
 *  grants, which are worse than refused ones. */
export interface DisablePlan {
  /** What the user tried to turn off. */
  target: { kind: "write"; actionId: WriteActionId } | { kind: "read"; moduleId: ConnectorModuleId };
  blocked: boolean;
  /** Write actions that would break and must come off too. */
  alsoDisables: WriteActionId[];
  summary: string[];
}

/**
 * Single status shown in the list column. Ordered by precedence — resolve
 * with an ordered list, never nested ternaries.
 *
 * revoked › expired › over_limit › needs_attention › pending › no_access › active
 */
export type ConnectionHealth =
  | "revoked"
  | "expired"
  | "over_limit"
  /** A grant references a prerequisite that is no longer satisfied. */
  | "needs_attention"
  | "pending"
  /** Live token, every module Off — connects fine, then fails every request. */
  | "no_access"
  | "active";

export interface LimitStatus {
  state: "off" | "ok" | "near" | "blocked";
  used: number;
  max: number;
  remaining: number;
  /** 0–100, clamped. */
  pct: number;
  /** ISO of the next window boundary. */
  resetsAt: string;
}

/** What a simulated agent call returns. `agentError` is stored verbatim as the
 *  audit row's `blockMessage` (NOT its `detail`, which stays the attempt),
 *  which is what keeps the log and the agent in sync. */
export interface AgentCallOutcome {
  outcome: AuditOutcome;
  agentError: string | null;
  meter: LimitMeterId | null;
  remaining: number | null;
  resetsAt: string | null;
}
