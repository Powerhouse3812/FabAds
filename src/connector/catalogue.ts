/**
 * Connector (AI access) — the catalogue.
 *
 * Everything an agent could be granted, and every rule about what a grant
 * implies. Pure data plus a handful of load-time derivations. No React, no
 * storage, no side effects beyond the DEV-only acyclicity assertion.
 *
 * THREE THINGS THIS FILE IS THE AUTHORITY ON
 *
 * 1. WHICH MODULES EXIST over MCP (9 — Copilot deliberately absent, and
 *    EXCLUDED_MODULE_NOTES explains that absence in the UI rather than
 *    letting the user notice a silent gap against the sidebar).
 *
 * 2. WHAT EACH WRITE ACTION ACTUALLY DOES, which meter it draws down, and
 *    which consequence chips it earns. Descriptions are written to be read
 *    by someone deciding whether to trust a robot with their ad account —
 *    plain English, actual consequences, no marketing.
 *
 * 3. THE DEPENDENCY GRAPH. Twelve edges. Without edges 1 and 2 in
 *    particular, an agent DENIED the Launch module could still create live
 *    campaigns through Reports → "Duplicate" or Reports → "Launch from
 *    report" — a straight permission-escalation hole. That is the whole
 *    reason this graph exists rather than treating modules as independent.
 *
 * WHAT THIS FILE DELIBERATELY DOES *NOT* ENCODE
 * The universal invariant — "any write action in module M forces M.read >=
 * view" — lives in `connectionsStore.ts`, not in 30 `requires` arrays. An
 * agent that can pause an ad it cannot see is nonsense, so the rule is
 * absolute and belongs in one place. Encoding it per-action would be 30
 * copies of the same edge and would make the real cross-module edges below
 * hard to find.
 *
 * HARD CAP ON THE GRAPH: one hop, at most two prerequisites per action.
 * Past that, "[Turn on all three]" becomes reflexive whack-a-mole — a silent
 * grant wearing a button. If a future action needs more, don't ship it.
 */
import {
  BarChart3,
  Boxes,
  ImageIcon,
  LayoutDashboard,
  Sparkles,
  Telescope,
  Video,
  Wand2,
  Workflow,
} from "lucide-react";
import type {
  AgentKind,
  AgentPreset,
  ConnectorModuleDef,
  ConnectorModuleId,
  LimitMeterId,
  LimitsConfig,
  ModulePermissionGrant,
  PermissionMap,
  Prerequisite,
  UsageMap,
  WriteActionDef,
  WriteActionId,
} from "@/connector/model";

/* ------------------------------------------------------------------ */
/*  Server identity                                                    */
/* ------------------------------------------------------------------ */

/** The one address every connection points at. The token decides what it
 *  can reach — the URL is identical for everyone on the account. */
export const MCP_SERVER_URL = "https://mcp.fabads.com/v1/mcp";

/** Token lifetime, stated to the user in the wizard rather than left as a
 *  hidden server default. A long-lived bearer token pasted into a plaintext
 *  config file is the weakest link in this whole feature; the least we can
 *  do is be explicit about how long it lives. */
export const TOKEN_TTL_DAYS = 90;

/* ------------------------------------------------------------------ */
/*  Modules                                                            */
/* ------------------------------------------------------------------ */

/**
 * Order matters — RUN, then CREATE, then TOOLS, matching GROUP_ORDER in
 * `src/components/sidebar/modules.ts`. Users already learned this taxonomy
 * in the nav rail; teaching a second one in Settings would be a recognition
 * tax for zero gain.
 *
 * `navKey` / `navPath` are back-pointers for the "Open module" deep link
 * ONLY. They are never used as permission identifiers — see the note in
 * model.ts about why nav keys and permission ids must not share a namespace.
 */
export const CONNECTOR_MODULES: ConnectorModuleDef[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    group: "RUN",
    icon: LayoutDashboard,
    description: "Your account roll-up",
    readDescription: "Headline spend, delivery and performance across your accounts.",
    exportDescription: "Pull the roll-up out as a file.",
    navKey: "dashboard",
    navPath: "/dashboard",
  },
  {
    id: "reports",
    label: "Reports",
    group: "RUN",
    icon: BarChart3,
    description: "Campaign, adset, ad and creative performance",
    readDescription:
      "Spend, impressions, clicks, conversions, CPA and ROAS down to individual creatives.",
    exportDescription: "Pull whole reports out as files.",
    navKey: "reports",
    navPath: "/reports/fb",
  },
  {
    id: "insights",
    label: "Industry Insights",
    group: "RUN",
    icon: Telescope,
    description: "Competitor ads, benchmarks and saved boards",
    readDescription: "Competitor creatives, category benchmarks, your feeds and boards.",
    exportDescription: "Pull competitor ads and benchmark data out as files.",
    navKey: "insights",
    navPath: "/insights-v2/feed",
  },
  {
    id: "launch",
    label: "Launch",
    group: "RUN",
    icon: Sparkles,
    description: "Building and publishing campaigns",
    readDescription: "Draft launches, run history, strategies and templates.",
    exportDescription: "Pull launch history and strategies out as files.",
    navKey: "launchv2",
    navPath: "/launchv2/new",
  },
  {
    id: "automation",
    label: "Automation",
    group: "RUN",
    icon: Workflow,
    description: "Rules that act on your account by themselves",
    readDescription: "Your rules, what they've matched, and what they did.",
    exportDescription: "Pull rule history out as files.",
    navKey: "automation",
    navPath: "/automation",
  },
  {
    id: "genie",
    label: "Genie",
    group: "CREATE",
    icon: Wand2,
    description: "Creative generation",
    readDescription: "Past generations, saved concepts and your brand context.",
    exportDescription: "Pull generated copy and assets out as files.",
    navKey: "genie",
    navPath: "/iq/genie6",
  },
  {
    id: "catalogue",
    label: "Catalogue",
    group: "CREATE",
    icon: Boxes,
    description: "Brands, products and categories",
    readDescription: "Your brands, products, categories and the context attached to them.",
    exportDescription: "Pull the whole catalogue out as files.",
    navKey: "catalogue",
    navPath: "/catalogue/brands",
  },
  {
    id: "creative-library",
    label: "Creative Library",
    group: "CREATE",
    icon: ImageIcon,
    description: "Stored images, videos, copy and ad groups",
    readDescription: "Folders, assets, ad groups and their metadata.",
    exportDescription: "Download the actual asset files, not just the list.",
    navKey: "creative-library",
    navPath: "/iq/creative-library",
  },
  {
    id: "video-sage",
    label: "Video Sage",
    group: "TOOLS",
    icon: Video,
    description: "Video breakdown and analysis",
    readDescription: "Past analyses, scripts and frameworks.",
    exportDescription: "Pull analyses and scripts out as files.",
    navKey: "video-sage",
    navPath: "/iq/video-sage",
  },
];

export const CONNECTOR_MODULE_IDS: ConnectorModuleId[] = CONNECTOR_MODULES.map((m) => m.id);

const MODULE_BY_ID = new Map<ConnectorModuleId, ConnectorModuleDef>(
  CONNECTOR_MODULES.map((m) => [m.id, m]),
);

export function getModuleDef(id: ConnectorModuleId): ConnectorModuleDef {
  const def = MODULE_BY_ID.get(id);
  // Unreachable for a valid ConnectorModuleId; throwing beats returning
  // undefined and letting a null module label reach an audit row.
  if (!def) throw new Error(`Unknown connector module: ${id}`);
  return def;
}

export function isConnectorModuleId(v: unknown): v is ConnectorModuleId {
  return typeof v === "string" && MODULE_BY_ID.has(v as ConnectorModuleId);
}

/**
 * Modules a user can see in the nav but NOT here, with the reason.
 *
 * Copilot is the one absence that doesn't explain itself — bg-remover and
 * obj-remover are visibly "Soon", and dashboard-variants / auth-screens are
 * dev surfaces nobody expects. Someone comparing this list against the
 * sidebar will find 9 of 11 and wonder what happened to Copilot, so we say
 * it out loud instead of letting them guess.
 */
export const EXCLUDED_MODULE_NOTES: { label: string; reason: string }[] = [
  {
    label: "Copilot",
    reason:
      "Copilot is FabAds' own assistant. Pointing one AI at another adds cost without adding anything you can't already get directly.",
  },
];

/* ------------------------------------------------------------------ */
/*  Meters                                                             */
/* ------------------------------------------------------------------ */

export interface MeterDef {
  id: LimitMeterId;
  label: string;
  description: string;
  unit: "currency" | "count";
}

/**
 * `budget_change` is the only VALUE meter and that is deliberate. A pure
 * frequency cap — "6 budget changes a day" — lets an agent take a $100/day
 * adset to $100,000/day, six times over, entirely within its limit. Counting
 * how often it acts tells you nothing about how much damage it can do.
 *
 * `live_changes` exists for the opposite reason: pause, resume, duplicate and
 * delete move no money at all, so there is no value to cap and a count is the
 * only lever available. Without this meter an agent could pause every
 * campaign in the account and never touch a limit.
 */
export const METERS: MeterDef[] = [
  {
    id: "budget_change",
    label: "Budget it can change",
    description: "Total of all the increases it makes. Counts every budget change, from any module.",
    unit: "currency",
  },
  {
    id: "launches",
    label: "Launches it can publish",
    description: "Each publish counts once. Counts every launch, from any module.",
    unit: "count",
  },
  {
    id: "live_changes",
    label: "Changes to live ads",
    description: "Pausing, resuming, duplicating and deleting. Counts every change, from any module.",
    unit: "count",
  },
  {
    id: "creations",
    label: "Credits it can spend",
    description: "Genie generations and Video Sage runs. Counts every generation, from any module.",
    unit: "count",
  },
];

export const METER_IDS: LimitMeterId[] = METERS.map((m) => m.id);

const METER_BY_ID = new Map<LimitMeterId, MeterDef>(METERS.map((m) => [m.id, m]));

export function getMeterDef(id: LimitMeterId): MeterDef {
  const def = METER_BY_ID.get(id);
  if (!def) throw new Error(`Unknown meter: ${id}`);
  return def;
}

export function isMeterId(v: unknown): v is LimitMeterId {
  return typeof v === "string" && METER_BY_ID.has(v as LimitMeterId);
}

/* ------------------------------------------------------------------ */
/*  Write actions                                                      */
/* ------------------------------------------------------------------ */

/** Shorthand for the only prerequisite kind used below. Read prerequisites
 *  are implied by the store's universal invariant, so every explicit edge in
 *  this catalogue is a write→write edge. */
const needs = (actionId: WriteActionId): Prerequisite => ({ kind: "write", actionId });

/**
 * Every write action, grouped by module in CONNECTOR_MODULES order.
 *
 * Dashboard has none — it is a roll-up of other modules, and every mutation
 * it could imply belongs to the module it summarises. The UI renders that as
 * an explicit "Read only" rather than an empty expander, because an empty
 * expander reads as a bug.
 */
export const WRITE_ACTIONS: WriteActionDef[] = [
  /* ── Reports ───────────────────────────────────────────────── */
  {
    id: "reports.change_budget",
    moduleId: "reports",
    label: "Change adset budget",
    description: "Raises or lowers the daily budget on a live adset.",
    risk: ["changes_live_ads", "spends_budget"],
    meter: "budget_change",
    requires: [],
  },
  {
    id: "reports.pause_resume",
    moduleId: "reports",
    label: "Pause or resume",
    description: "Stops or restarts delivery on a campaign, adset or ad.",
    risk: ["changes_live_ads"],
    meter: "live_changes",
    requires: [],
  },
  {
    id: "reports.duplicate",
    moduleId: "reports",
    label: "Duplicate campaign, adset or ad",
    description: "Copies an existing entity into a new one that can go live.",
    risk: ["changes_live_ads"],
    meter: "live_changes",
    // A duplicate is a launch with pre-filled fields — same blast radius, new
    // live entity, new delivery, new spend. Without this edge an agent denied
    // Launch could still create campaigns from the Reports screen.
    requires: [needs("launch.create_draft")],
  },
  {
    id: "reports.save_to_library",
    moduleId: "reports",
    label: "Save a creative to the library",
    description: "Files an ad's creative into your Creative Library.",
    risk: [],
    meter: null,
    // Writes into another module's store. Library write is granted in the
    // Library, never smuggled in through a report drawer.
    requires: [needs("creative-library.manage_folders")],
  },
  {
    id: "reports.generate_variation",
    moduleId: "reports",
    label: "Generate a variation",
    description: "Sends a winning ad to Genie and generates new versions of it.",
    risk: ["uses_credits"],
    meter: "creations",
    requires: [needs("genie.generate")],
  },
  {
    id: "reports.launch_from_report",
    moduleId: "reports",
    label: "Launch from a report",
    description: "Builds and publishes a new campaign straight from a report row.",
    risk: ["changes_live_ads", "spends_budget"],
    meter: "launches",
    requires: [needs("launch.create_draft")],
  },

  /* ── Industry Insights ─────────────────────────────────────── */
  {
    id: "insights.save_ad",
    moduleId: "insights",
    label: "Save an ad",
    description: "Bookmarks a competitor ad into your saved list.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "insights.manage_board",
    moduleId: "insights",
    label: "Create or edit a board",
    description: "Makes, renames and fills inspiration boards.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "insights.track_brand",
    moduleId: "insights",
    label: "Follow a brand or competitor",
    description: "Adds or removes brands from what you track.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "insights.generate_from_ad",
    moduleId: "insights",
    label: "Generate from a competitor ad",
    description: "Sends a competitor ad to Genie and generates your own version.",
    risk: ["uses_credits"],
    meter: "creations",
    requires: [needs("genie.generate")],
  },
  {
    id: "insights.launch_from_ad",
    moduleId: "insights",
    label: "Launch from a competitor ad",
    description: "Builds and publishes a campaign based on a competitor's ad.",
    risk: ["changes_live_ads", "spends_budget"],
    meter: "launches",
    requires: [needs("launch.create_draft")],
  },

  /* ── Launch ────────────────────────────────────────────────── */
  {
    id: "launch.create_draft",
    moduleId: "launch",
    label: "Create a draft launch",
    description: "Builds a launch inside FabAds. Nothing goes live and nothing spends.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "launch.publish",
    moduleId: "launch",
    label: "Publish a launch to Meta",
    description: "Pushes campaigns, adsets and ads live. They start spending immediately.",
    risk: ["changes_live_ads", "spends_budget"],
    meter: "launches",
    requires: [needs("launch.create_draft")],
  },
  {
    id: "launch.save_strategy",
    moduleId: "launch",
    label: "Save a strategy or template",
    description: "Stores a reusable launch setup for later.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "launch.edit_defaults",
    moduleId: "launch",
    label: "Change launch settings",
    description: "Edits the defaults every future launch starts from.",
    risk: [],
    meter: null,
    requires: [],
  },

  /* ── Automation ────────────────────────────────────────────── */
  {
    id: "automation.manage_rule",
    moduleId: "automation",
    label: "Create or edit a rule",
    description: "Writes a rule that acts on your account on its own, later, without being asked.",
    risk: [],
    meter: null,
    // A rule is stored intent. Letting an agent author a rule that files
    // creatives into the Library while Library write is off is the same
    // escalation as saving directly — just time-delayed and much harder to
    // notice afterwards.
    requires: [needs("creative-library.manage_folders")],
  },
  {
    id: "automation.toggle_rule",
    moduleId: "automation",
    label: "Turn a rule on or off",
    description: "Starts or stops an existing rule from running.",
    risk: ["changes_live_ads"],
    meter: null,
    requires: [],
  },
  {
    id: "automation.run_now",
    moduleId: "automation",
    label: "Run a rule now",
    description: "Executes a rule immediately against everything it matches.",
    risk: ["changes_live_ads"],
    meter: null,
    requires: [],
  },

  /* ── Genie ─────────────────────────────────────────────────── */
  {
    id: "genie.generate",
    moduleId: "genie",
    label: "Generate creatives",
    description: "Produces new copy and images. Each run spends credits from your plan.",
    risk: ["uses_credits"],
    meter: "creations",
    requires: [],
  },
  {
    id: "genie.save_to_library",
    moduleId: "genie",
    label: "Save generations to the library",
    description: "Files generated assets into your Creative Library.",
    risk: [],
    meter: null,
    requires: [needs("creative-library.manage_folders")],
  },
  {
    id: "genie.edit_brand_context",
    moduleId: "genie",
    label: "Edit brand context",
    description: "Changes the brand instructions every future generation is built on.",
    risk: [],
    meter: null,
    requires: [],
  },

  /* ── Catalogue ─────────────────────────────────────────────── */
  {
    id: "catalogue.manage_brand",
    moduleId: "catalogue",
    label: "Add or edit a brand",
    description: "Creates and updates brands and their details.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "catalogue.manage_product",
    moduleId: "catalogue",
    label: "Add or edit a product",
    description: "Creates and updates products under a brand.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "catalogue.manage_category",
    moduleId: "catalogue",
    label: "Add or edit a category",
    description: "Creates and updates categories.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "catalogue.generate_from_product",
    moduleId: "catalogue",
    label: "Generate from a product",
    description: "Sends a product to Genie and generates creatives for it.",
    risk: ["uses_credits"],
    meter: "creations",
    requires: [needs("genie.generate")],
  },
  {
    id: "catalogue.launch_from_product",
    moduleId: "catalogue",
    label: "Launch from a product",
    description: "Builds and publishes a campaign for a product in your catalogue.",
    risk: ["changes_live_ads", "spends_budget"],
    meter: "launches",
    requires: [needs("launch.create_draft")],
  },

  /* ── Creative Library ──────────────────────────────────────── */
  {
    id: "creative-library.manage_folders",
    moduleId: "creative-library",
    label: "Create folders and ad groups",
    description: "Makes and renames folders and ad groups, and adds assets to them.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "creative-library.move_items",
    moduleId: "creative-library",
    label: "Move items between folders",
    description: "Reorganises what sits where. Nothing is removed.",
    risk: [],
    meter: null,
    requires: [],
  },
  {
    id: "creative-library.delete_assets",
    moduleId: "creative-library",
    label: "Delete assets",
    description: "Permanently removes assets from the library. This can't be undone.",
    risk: [],
    // Metered under live_changes because it moves no money but is genuinely
    // destructive — a count is the only lever that constrains it at all.
    meter: "live_changes",
    // Kept SEPARATE from "Move items" on purpose. Folding delete into a
    // generic "manage assets" toggle is exactly how products end up with an
    // agent that quietly empties someone's library.
    requires: [],
  },
  {
    id: "creative-library.launch_adgroup",
    moduleId: "creative-library",
    label: "Launch an ad group",
    description: "Publishes an ad group straight to Meta as live ads.",
    risk: ["changes_live_ads", "spends_budget"],
    meter: "launches",
    requires: [needs("launch.publish")],
  },

  /* ── Video Sage ────────────────────────────────────────────── */
  {
    id: "video-sage.analyze_video",
    moduleId: "video-sage",
    label: "Analyse a video",
    description: "Breaks a video down into hooks, scripts and frameworks. Spends credits.",
    risk: ["uses_credits"],
    meter: "creations",
    requires: [],
  },
];

const ACTION_BY_ID = new Map<WriteActionId, WriteActionDef>(
  WRITE_ACTIONS.map((a) => [a.id, a]),
);

export function getWriteAction(id: WriteActionId): WriteActionDef {
  const def = ACTION_BY_ID.get(id);
  if (!def) throw new Error(`Unknown write action: ${id}`);
  return def;
}

export function isWriteActionId(v: unknown): v is WriteActionId {
  return typeof v === "string" && ACTION_BY_ID.has(v as WriteActionId);
}

/** Actions per module, in catalogue order. Dashboard maps to an empty array —
 *  a real, expected value, not a missing key. */
export const WRITE_ACTIONS_BY_MODULE: Record<ConnectorModuleId, WriteActionDef[]> =
  CONNECTOR_MODULE_IDS.reduce(
    (acc, id) => {
      acc[id] = WRITE_ACTIONS.filter((a) => a.moduleId === id);
      return acc;
    },
    {} as Record<ConnectorModuleId, WriteActionDef[]>,
  );

/** Every action that draws down a given meter. Drives the "Counts every
 *  launch, from any module" copy — five different entry points share one
 *  budget, and the UI has to say so or the number looks wrong. */
export const ACTIONS_BY_METER: Record<LimitMeterId, WriteActionDef[]> = METER_IDS.reduce(
  (acc, id) => {
    acc[id] = WRITE_ACTIONS.filter((a) => a.meter === id);
    return acc;
  },
  {} as Record<LimitMeterId, WriteActionDef[]>,
);

/**
 * Reverse edges, built once at module load.
 *
 * `WRITE_ACTION_DEPENDENTS[X]` = every action that requires X. This is what
 * makes the REVERSE block possible — turning a prerequisite off while
 * dependents are still on has to be refused too, or you end up with a grant
 * that references a permission the connection no longer has. An inconsistent
 * grant is worse than a refused one.
 */
export const WRITE_ACTION_DEPENDENTS: Record<WriteActionId, WriteActionId[]> = (() => {
  const map = {} as Record<WriteActionId, WriteActionId[]>;
  for (const a of WRITE_ACTIONS) map[a.id] = [];
  for (const a of WRITE_ACTIONS) {
    for (const p of a.requires) {
      if (p.kind === "write") map[p.actionId].push(a.id);
    }
  }
  return map;
})();

/**
 * DEV-only guard. The graph is hand-maintained, and a cycle would make the
 * prerequisite-closure walk in selectors.ts recurse forever and white-screen
 * the whole Settings tab. Cheap insurance against a future edit.
 *
 * Also enforces the one-hop / two-prerequisite cap, because that cap is a
 * usability decision that will otherwise erode silently over time.
 */
export function assertCatalogueIsAcyclic(): void {
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const colour = new Map<WriteActionId, number>();
  for (const a of WRITE_ACTIONS) colour.set(a.id, WHITE);

  const visit = (id: WriteActionId, trail: WriteActionId[]): void => {
    const c = colour.get(id);
    if (c === BLACK) return;
    if (c === GREY) {
      throw new Error(
        `Connector catalogue has a dependency cycle: ${[...trail, id].join(" → ")}`,
      );
    }
    colour.set(id, GREY);
    for (const p of getWriteAction(id).requires) {
      if (p.kind === "write") visit(p.actionId, [...trail, id]);
    }
    colour.set(id, BLACK);
  };

  for (const a of WRITE_ACTIONS) visit(a.id, []);

  for (const a of WRITE_ACTIONS) {
    if (a.requires.length > 2) {
      throw new Error(
        `"${a.id}" declares ${a.requires.length} prerequisites. The cap is 2 — past that, ` +
          `"Turn on all of them" stops being an informed choice.`,
      );
    }
    // One hop: a prerequisite must not itself have cross-module prerequisites,
    // or the amber note has to explain a chain rather than a list.
    for (const p of a.requires) {
      if (p.kind !== "write") continue;
      const parent = getWriteAction(p.actionId);
      const crossModule = parent.requires.filter(
        (pp) => pp.kind === "write" && getWriteAction(pp.actionId).moduleId !== parent.moduleId,
      );
      if (crossModule.length > 0) {
        throw new Error(
          `"${a.id}" → "${p.actionId}" is more than one hop: "${p.actionId}" has its own ` +
            `cross-module prerequisites.`,
        );
      }
    }
  }
}

if (import.meta.env.DEV) {
  assertCatalogueIsAcyclic();
}

/* ------------------------------------------------------------------ */
/*  Agent presets                                                      */
/* ------------------------------------------------------------------ */

/**
 * The tiles in wizard step 1, in render order, bucketed.
 *
 * Hick's law is about UNDIFFERENTIATED alternatives — eight flat tiles is one
 * eight-way decision, but three labelled buckets is a three-way decision
 * followed by a four-way one, and most people self-sort instantly because
 * they already know which bucket they're in.
 *
 * `authMethods` is honest per agent, not aspirational: web surfaces get
 * OAuth, editors get a token in a config file. Claude is the one agent with
 * genuinely both, so it is the only one with `hasSurfaceChoice` — and the
 * wizard ASKS rather than inferring, because that answer is what decides the
 * whole last step.
 *
 * `brandHex` is a third-party brand mark used only as an avatar fill. It is
 * the one deliberate exception to this module's no-raw-hex rule; it must look
 * identical in light and dark, which is exactly what a design token would
 * prevent.
 */
export const AGENT_PRESETS: AgentPreset[] = [
  {
    kind: "claude",
    label: "Claude",
    tagline: "Desktop app or claude.ai",
    bucket: "chat",
    monogram: "CL",
    brandHex: "#c96442",
    authMethods: ["oauth", "token"],
    hasSurfaceChoice: true,
    configPath: "claude_desktop_config.json",
    configShape: "mcpServers",
    defaultName: "Claude",
  },
  {
    kind: "chatgpt",
    label: "ChatGPT",
    tagline: "Connectors in settings",
    bucket: "chat",
    monogram: "GP",
    brandHex: "#0f9d76",
    authMethods: ["oauth"],
    hasSurfaceChoice: false,
    configPath: null,
    configShape: "urlAndHeader",
    defaultName: "ChatGPT",
  },
  {
    kind: "gemini",
    label: "Gemini",
    tagline: "Gemini app and CLI",
    bucket: "chat",
    monogram: "GM",
    brandHex: "#3b7ddd",
    authMethods: ["oauth"],
    hasSurfaceChoice: false,
    configPath: null,
    configShape: "urlAndHeader",
    defaultName: "Gemini",
  },
  {
    kind: "cursor",
    label: "Cursor",
    tagline: "Editor with built-in MCP",
    bucket: "coding",
    monogram: "CU",
    brandHex: "#2b2b2b",
    authMethods: ["token"],
    hasSurfaceChoice: false,
    configPath: "~/.cursor/mcp.json",
    configShape: "mcpServers",
    defaultName: "Cursor",
  },
  {
    kind: "vscode",
    label: "VS Code",
    tagline: "With GitHub Copilot",
    bucket: "coding",
    monogram: "VS",
    brandHex: "#2f7ae5",
    authMethods: ["token"],
    hasSurfaceChoice: false,
    configPath: ".vscode/mcp.json",
    configShape: "vscodeServers",
    defaultName: "VS Code",
  },
  {
    kind: "windsurf",
    label: "Windsurf",
    tagline: "Editor with built-in MCP",
    bucket: "coding",
    monogram: "WS",
    brandHex: "#0b8f85",
    authMethods: ["token"],
    hasSurfaceChoice: false,
    configPath: "~/.codeium/windsurf/mcp_config.json",
    configShape: "mcpServers",
    defaultName: "Windsurf",
  },
  {
    kind: "cline",
    label: "Cline",
    tagline: "VS Code extension",
    bucket: "coding",
    monogram: "CN",
    brandHex: "#5b53c4",
    authMethods: ["token"],
    hasSurfaceChoice: false,
    configPath: "cline_mcp_settings.json",
    configShape: "mcpServers",
    defaultName: "Cline",
  },
  {
    kind: "custom",
    label: "Something else",
    tagline: "Any tool that speaks MCP",
    bucket: "other",
    monogram: "MC",
    brandHex: "#6b7280",
    authMethods: ["token"],
    hasSurfaceChoice: false,
    configPath: null,
    configShape: "urlAndHeader",
    defaultName: "My MCP client",
  },
];

export const AGENT_BUCKETS: { id: AgentPreset["bucket"]; label: string }[] = [
  { id: "chat", label: "Chat apps" },
  { id: "coding", label: "Coding tools" },
  { id: "other", label: "Anything else" },
];

const PRESET_BY_KIND = new Map<AgentKind, AgentPreset>(AGENT_PRESETS.map((p) => [p.kind, p]));

export function getAgentPreset(kind: AgentKind): AgentPreset {
  // Falling back to "custom" rather than throwing: an unknown agentKind can
  // only reach here from hand-edited localStorage, and a connection row that
  // renders as "Something else" is far better than a crashed Settings tab.
  return PRESET_BY_KIND.get(kind) ?? PRESET_BY_KIND.get("custom")!;
}

export function isAgentKind(v: unknown): v is AgentKind {
  return typeof v === "string" && PRESET_BY_KIND.has(v as AgentKind);
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

/** Every module present, everything off. sanitize() and createConnection()
 *  both start from this, which is what lets selectors read `map[id].read`
 *  with no optional chaining anywhere. */
export function emptyPermissionMap(): PermissionMap {
  return CONNECTOR_MODULE_IDS.reduce((acc, id) => {
    acc[id] = { read: "off", write: [] } satisfies ModulePermissionGrant;
    return acc;
  }, {} as PermissionMap);
}

/** All nine modules at a given read tier, no write actions. Backs the
 *  "Read only" / "Read and download" presets in the wizard. */
export function presetPermissionMap(read: "view" | "view_export"): PermissionMap {
  return CONNECTOR_MODULE_IDS.reduce((acc, id) => {
    acc[id] = { read, write: [] } satisfies ModulePermissionGrant;
    return acc;
  }, {} as PermissionMap);
}

/**
 * Sensible starting limits: on, with real numbers, on a daily window.
 *
 * Defaulting every meter to "No limit" would mean the safest-looking path
 * through the wizard produces the least safe connection. Defaulting them ON
 * means a user who ignores the limits step still ends up capped, and the one
 * who genuinely wants no ceiling has to say so deliberately.
 */
export function defaultLimits(): LimitsConfig {
  return {
    window: "day",
    rules: {
      budget_change: { enabled: true, max: 500, maxSinglePct: 20 },
      launches: { enabled: true, max: 3 },
      live_changes: { enabled: true, max: 20 },
      creations: { enabled: true, max: 50 },
    },
  };
}

export function emptyUsage(windowStartedAt: string): UsageMap {
  return METER_IDS.reduce((acc, id) => {
    acc[id] = { used: 0, windowStartedAt, lastEventAt: null, blocked: 0 };
    return acc;
  }, {} as UsageMap);
}
