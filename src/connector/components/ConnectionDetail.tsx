/**
 * ConnectionDetail — everything about ONE connection in the Connector (AI
 * access) module: who it is, what it can see, what it can change, what it has
 * actually done, and how to take it all away.
 *
 * SIX DECISIONS WORTH KNOWING BEFORE YOU EDIT THIS FILE
 *
 * 1. AT MOST ONE STATUS STRIP, RESOLVED BY PRECEDENCE — NEVER A STACK.
 *    `connectionHealth()` already collapses the whole world into a single
 *    ConnectionHealth by walking an ordered list (revoked › expired ›
 *    over_limit › needs_attention › pending › no_access › active). This file
 *    renders exactly one strip for that one value, via a lookup keyed by
 *    health — no nested ternaries, and no second banner competing with the
 *    first. A revoked connection is not also "over its limit"; saying both
 *    would make the user solve the wrong problem. The ONE exception is the
 *    "Unlimited" strip, which is deliberately independent of health: an active
 *    connection with write access and every cap switched off is `active` by
 *    every rule in the resolver and is still the single most dangerous state
 *    this feature can produce, so it gets its own line rather than being
 *    silently ranked below "everything's fine".
 *
 * 2. CHANGING THE LIMIT WINDOW IS CONFIRMED FIRST, ALWAYS.
 *    `setLimitWindow()` zeroes every meter — it has to, because carrying
 *    `used: 10` from a weekly bucket into a daily one would instantly block a
 *    connection with a number that never made sense in the new window. But
 *    silently resetting a spend counter is a trust bug in the other direction:
 *    the user thinks they adjusted a label and has actually handed the agent a
 *    fresh allowance. So the AlertDialog fires BEFORE the store call and states
 *    the reset in the same breath as the switch.
 *
 * 3. REVOKE TOASTS WITH NO UNDO.
 *    `revokeConnection()` is genuinely reversible in the store, but reversing
 *    it does NOT give the agent its access back — the token is dead and the
 *    only route back is a fresh connect with a new token. An "Undo" that
 *    restores a row while leaving the integration broken is worse than no
 *    Undo at all, so the toast states the consequence and offers nothing.
 *
 * 4. PERMISSIONS PERSIST IMMEDIATELY, WITH NO LOCAL MIRROR.
 *    `PermissionMatrix` hands back a WHOLE next `ConnectorConnection`, having
 *    already run every dependency rule through the pure appliers and — where a
 *    rule bit — already taken the user's explicit confirmation in the amber
 *    note. `setConnectionPermissions()` stores that map as-is rather than
 *    re-deriving the closure, because re-deriving could refuse a grant the
 *    user just confirmed. There is no shadow copy of the connection here: the
 *    store is the source of truth, and a local mirror would leave the limits
 *    card and the health strip one render behind the matrix directly below
 *    them.
 *
 * 5. THE PAGE SPLITS INTO TABS, BUT IDENTITY AND STATUS NEVER DO.
 *    This used to be one ~3,100px scroll. It is now a hero + status band that
 *    is ALWAYS on screen, above a three-tab strip (Permissions · Limits ·
 *    Activity). What stays out of the tabs is not a layout preference: the
 *    status strips are the only thing on this screen that says the connection
 *    is broken RIGHT NOW, and a user reading the activity log has to keep
 *    seeing "Limit reached" while they read it. The hero stays for the same
 *    reason in a smaller key — Address and Token are what people copy when
 *    they are debugging, and a click to reach them is a click too many. The
 *    tabs only ever hide things that are safe to hide: three settings/history
 *    surfaces, none of which is an alarm. There is deliberately no Overview
 *    tab — an Overview would be a fourth place to look for facts that the
 *    always-visible band already states.
 *
 *    The back button is gone with it. The connection rail to the left IS the
 *    back affordance, exactly as `CatalogueDetailPage` drops its own back link
 *    when `embedded`. Two ways back to the same list is one too many.
 *
 * 6. THE TAB LIVES IN `?section=`, NOT `?tab=`.
 *    `?tab=` is already spoken for: `WorkspaceSettings` uses it for the
 *    settings shell's own tab (`?tab=connector`), and `ConnectorPanel` re-sets
 *    it on every navigation. Reusing that key would have this component and
 *    the shell writing over each other's value on the same URL. `?section=`
 *    is validated against a whitelist, falls back to "permissions", and is
 *    DELETED from the URL when it equals that default — a bare
 *    `?tab=connector&connection=x` is the canonical link, so a pasted URL
 *    doesn't carry a redundant `section=permissions`. Writes are
 *    `{ replace: true }`: flipping between tabs is looking around one screen,
 *    not travelling, and it must not make the browser Back button walk through
 *    every tab a user glanced at.
 */
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { format, formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, Ban, Clock, EyeOff, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { ActivityTable } from "@/connector/components/ActivityTable";
import { AgentAvatar } from "@/connector/components/AgentAvatar";
import {
  ConfigSnippetBlock,
  type ConfigSnippetPair,
} from "@/connector/components/ConfigSnippetBlock";
import {
  ConnectorStatusPill,
  HEALTH_LABEL,
} from "@/connector/components/ConnectorStatusPill";
import { CopyField } from "@/connector/components/CopyField";
import { LimitRow } from "@/connector/components/LimitRow";
import { PermissionMatrix } from "@/connector/components/PermissionMatrix";

import {
  MCP_SERVER_URL,
  METERS,
  TOKEN_TTL_DAYS,
  getAgentPreset,
  getMeterDef,
  getModuleDef,
  getWriteAction,
  type MeterDef,
} from "@/connector/catalogue";
import {
  auditForConnection,
  brokenGrants,
  connectionHealth,
  hasAnyWriteAccess,
  limitStatus,
  meterActionsGranted,
  normalizedUsage,
  writeActionCount,
} from "@/connector/selectors";
import {
  applyDisableToConnection,
  deleteConnection,
  issueConnectionToken,
  revokeConnection,
  setConnectionPermissions,
  setLimitRule,
  setLimitWindow,
} from "@/connector/connectionsStore";
import { useConnectorAudit } from "@/connector/auditStore";
import { recordAuthEvent, recordConfigChange } from "@/connector/recorder";
import type {
  ConnectionHealth,
  ConnectorConnection,
  LimitMeterId,
  LimitRule,
  LimitWindow,
  WriteActionId,
} from "@/connector/model";

/* ------------------------------------------------------------------ */
/*  Constants + copy helpers                                           */
/* ------------------------------------------------------------------ */

/** What the setup snippet shows in place of a real token. The real value is
 *  returned exactly ONCE by `issueConnectionToken()` and never stored, so this
 *  screen genuinely cannot render it — the dots are the truth, not a redaction. */
const MASKED_TOKEN = "ff_mcp_••••••••";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A setup that has sat unfinished for a day is the SAME health state with a
 *  more urgent voice — deliberately not a second status. */
const SETUP_STALE_AFTER_MS = DAY_MS;

const WINDOW_SEGMENTS: { value: LimitWindow; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

/** Adjective form, for sentences like "its whole daily budget allowance". */
const WINDOW_ADJECTIVE: Record<LimitWindow, string> = {
  day: "daily",
  week: "weekly",
  month: "monthly",
};

/** Noun form, for the switch confirmation. "Switch to week?" is not English. */
const WINDOW_NOUN: Record<LimitWindow, string> = {
  day: "a daily window",
  week: "a weekly window",
  month: "a monthly window",
};

/**
 * Short nouns for use INSIDE a sentence. The catalogue labels ("Budget it can
 * change") are column headings and read as nonsense mid-sentence — "its whole
 * daily budget it can change allowance". Kept local because this is copy for
 * one strip, not a second source of truth about what a meter is.
 */
const METER_NOUN: Record<LimitMeterId, string> = {
  budget_change: "budget",
  launches: "launch",
  live_changes: "live-change",
  creations: "credit",
};

/**
 * The three panels below the always-visible band.
 *
 * A string union, not booleans — `strictNullChecks` is off in this project, so
 * TypeScript will not narrow a boolean-literal discriminated union and a
 * `{ isLimits: true } | { isLimits: false }` shape would silently type-check
 * its way into a bug.
 */
type DetailSection = "permissions" | "limits" | "activity";

const DEFAULT_SECTION: DetailSection = "permissions";

/** Whitelist for `?section=`. Anything else in the URL — a typo, an old link,
 *  a renamed tab — degrades to the default rather than rendering nothing. */
const SECTION_KEYS: DetailSection[] = ["permissions", "limits", "activity"];

const SECTION_LABEL: Record<DetailSection, string> = {
  permissions: "Permissions",
  limits: "Limits",
  activity: "Activity",
};

function formatMeterAmount(unit: MeterDef["unit"], n: number): string {
  if (!Number.isFinite(n)) return "∞";
  return unit === "currency"
    ? `$${Math.round(n).toLocaleString()}`
    : Math.round(n).toLocaleString();
}

/** Never renders "Invalid Date" — a corrupt stamp degrades to a fallback
 *  phrase rather than putting a lie in a security sentence. */
function formatDateSafe(iso: string | null, fallback: string): string {
  if (!iso) return fallback;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return fallback;
  return format(new Date(at), "d MMM yyyy");
}

function formatTimeSafe(iso: string | null, fallback: string): string {
  if (!iso) return fallback;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return fallback;
  return format(new Date(at), "h:mm a");
}

function pluralise(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** "Reports → Duplicate campaign, adset or ad" — module first, so a list of
 *  actions from different modules is scannable. */
function actionPath(actionId: WriteActionId): string {
  const def = getWriteAction(actionId);
  return `${getModuleDef(def.moduleId).label} → ${def.label}`;
}

/* ------------------------------------------------------------------ */
/*  Status strip                                                       */
/* ------------------------------------------------------------------ */

type StripTone = "muted" | "amber" | "red" | "info";

/**
 * Amber and red are COMPOSED — a `bg-card` base with a `warning-text` /
 * `error-text` tint at low alpha layered over it. There are no tinted-fill
 * tokens in this design system, only the accessible *text* tokens, and a
 * literal pastel would be a light-mode value burned into a dark-mode surface.
 * "info" borrows `primary-text` for the same reason: it is a real per-theme
 * token, unlike any hex an info banner would otherwise reach for.
 */
const TONE_CLASSES: Record<StripTone, { border: string; fill: string; icon: string }> = {
  muted: { border: "border-border", fill: "bg-muted/60", icon: "text-muted-foreground" },
  amber: {
    border: "border-warning-text/25",
    fill: "bg-warning-text/10",
    icon: "text-warning-text",
  },
  red: { border: "border-error-text/25", fill: "bg-error-text/10", icon: "text-error-text" },
  info: {
    border: "border-primary-text/25",
    fill: "bg-primary-text/10",
    icon: "text-primary-text",
  },
};

interface StatusStripProps {
  tone: StripTone;
  icon: LucideIcon;
  title: string;
  body: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Icon + text, always. Never colour alone — the tone is a reinforcement of a
 *  sentence that already says the whole thing. */
function StatusStrip({ tone, icon: Icon, title, body, actions, className }: StatusStripProps) {
  const t = TONE_CLASSES[tone];
  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border bg-card", t.border, className)}
    >
      <div className={cn("absolute inset-0", t.fill)} aria-hidden="true" />
      <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.icon)} aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Setup snippet                                                      */
/* ------------------------------------------------------------------ */

interface Snippet {
  filename: string | null;
  code: string;
  pairs: ConfigSnippetPair[] | null;
}

/**
 * The same three shapes the connect wizard writes, built with
 * `JSON.stringify(obj, null, 2)` rather than a template literal so the braces
 * and escaping can't drift from what an agent will actually parse.
 */
function buildSnippet(connection: ConnectorConnection): Snippet {
  const preset = getAgentPreset(connection.agentKind);
  const isOauth = connection.authMethod === "oauth";
  const authHeader = `Bearer ${MASKED_TOKEN}`;

  // An OAuth connection has no pasted token, in ANY of the three shapes. The
  // header has to be dropped from the JSON snippets too, not just from the
  // key/value list — otherwise this dialog shows a `Bearer …` line directly
  // above its own footnote saying there is no token to paste, and sends
  // someone hunting for a credential that never existed.
  if (preset.configShape === "mcpServers") {
    return {
      filename: preset.configPath,
      pairs: null,
      code: JSON.stringify(
        {
          mcpServers: {
            fabads: {
              url: MCP_SERVER_URL,
              ...(isOauth ? {} : { headers: { Authorization: authHeader } }),
            },
          },
        },
        null,
        2,
      ),
    };
  }

  if (preset.configShape === "vscodeServers") {
    return {
      filename: preset.configPath,
      pairs: null,
      code: JSON.stringify(
        {
          servers: {
            fabads: {
              type: "http",
              url: MCP_SERVER_URL,
              ...(isOauth ? {} : { headers: { Authorization: authHeader } }),
            },
          },
        },
        null,
        2,
      ),
    };
  }

  // urlAndHeader — nothing to save to a file; the agent asks for these values
  // in its own UI. Key/value split matches the JSON shapes above and the
  // wizard's own pane: the key is the literal header name, the value is the
  // literal header value. A user who set this up in the wizard and comes back
  // here must not be shown a differently-worded version of the same thing.
  const pairs: ConfigSnippetPair[] = isOauth
    ? [{ key: "Server URL", value: MCP_SERVER_URL }]
    : [
        { key: "Server URL", value: MCP_SERVER_URL },
        { key: "Authorization", value: authHeader },
      ];

  return {
    filename: null,
    pairs,
    code: pairs.map((p) => `${p.key}: ${p.value}`).join("\n"),
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface ConnectionDetailProps {
  connection: ConnectorConnection;
  /**
   * Accepted and ignored, on purpose.
   *
   * This component no longer renders a back button — the connection rail to
   * its left is the back affordance (see decision 5 in the file header). The
   * prop stays in the interface, optional, so `ConnectorPanel` can keep
   * passing `backToList` without a wiring change, and so a future non-embedded
   * host has a documented slot to fill. Do NOT re-add a back button here.
   */
  onBack?: () => void;
  /** Called after revoke+delete so the caller can return to the list. */
  onDeleted: () => void;
  className?: string;
}

export function ConnectionDetail({ connection, onDeleted, className }: ConnectionDetailProps) {
  const { toast } = useToast();

  /** ONE clock for the whole render — health, every limit status and every
   *  relative timestamp have to agree with each other. */
  const now = Date.now();

  /**
   * No local mirror of the connection — the store IS the source of truth.
   *
   * Permission edits persist immediately through `setConnectionPermissions`
   * (see `handlePermissionsChange`), and `ConnectorPanel` re-renders this
   * component from the store's own hook, so `connection` is always current.
   * Holding a shadow copy here would put the limits card and the health strip
   * one render behind the matrix sitting right below them.
   */
  const view = connection;

  const preset = getAgentPreset(connection.agentKind);
  const health = connectionHealth(view, now);
  const isRevoked = health === "revoked";
  const writeAccess = hasAnyWriteAccess(view);

  /* ---------------- dialogs + transient UI state ---------------- */

  const [setupOpen, setSetupOpen] = React.useState(false);
  const [issueOpen, setIssueOpen] = React.useState(false);
  const [issuedToken, setIssuedToken] = React.useState<string | null>(null);
  const [issuedExpiry, setIssuedExpiry] = React.useState<string | null>(null);
  const [revokeOpen, setRevokeOpen] = React.useState(false);
  const [pendingWindow, setPendingWindow] = React.useState<LimitWindow | null>(null);
  const [overLimitDismissed, setOverLimitDismissed] = React.useState(false);

  // "Leave it" is a dismissal of THIS block, not a permanent preference — the
  // moment the connection stops being blocked (or starts again) the strip is
  // meaningful once more.
  React.useEffect(() => {
    if (health !== "over_limit") setOverLimitDismissed(false);
  }, [health]);

  // A different connection that happens to be blocked too is a NEW piece of
  // news, not the one that was already waved away.
  React.useEffect(() => {
    setOverLimitDismissed(false);
  }, [connection.id]);

  /* ---------------- which panel is showing ---------------- */

  /** Namespaces the tab/panel ids. Two ConnectionDetails could never be on
   *  screen at once today, but duplicate `aria-controls` targets are the kind
   *  of bug you only find with a screen reader. */
  const uid = React.useId();

  /**
   * The active panel lives in the URL under `?section=` (see decision 6). It
   * is read straight from the params rather than mirrored into state, so a
   * deep link, a Back press and a tab click all resolve through one code path
   * — and so `ConnectorPanel` can put someone on the Limits tab from outside
   * this component just by navigating.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get("section") as DetailSection | null;
  const section: DetailSection =
    sectionParam && SECTION_KEYS.includes(sectionParam) ? sectionParam : DEFAULT_SECTION;

  const setSection = React.useCallback(
    (next: DetailSection) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === DEFAULT_SECTION) sp.delete("section");
          else sp.set("section", next);
          return sp;
        },
        // Looking around one screen is not travelling. Without this, Back
        // walks the user through every tab they glanced at instead of
        // returning them to the list.
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const limitsRef = React.useRef<HTMLElement>(null);

  /**
   * "Raise the limit" from anywhere — the over-limit strip, the unlimited
   * strip, a refused row in the activity table.
   *
   * A plain `scrollIntoView` used to be enough because the limits card was
   * always in the DOM. It isn't any more: when Limits is not the active tab
   * the element does not exist, and scrolling to it is a silent no-op — the
   * worst possible outcome for a button whose whole job is to take you to the
   * fix. So this switches the section FIRST and scrolls on the frame after
   * React has mounted the panel. The second attempt is insurance for a commit
   * that misses the first frame; it is a no-op once the node is found.
   */
  const goToLimits = React.useCallback(() => {
    setSection("limits");
    let tries = 2;
    const attempt = () => {
      const el = limitsRef.current;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      tries -= 1;
      if (tries > 0) requestAnimationFrame(attempt);
    };
    requestAnimationFrame(attempt);
  }, [setSection]);

  /* ---------------- permissions ---------------- */

  /**
   * `PermissionMatrix` hands back a fully-computed next connection — it has
   * already run every dependency rule and, where a rule bit, already got the
   * user's explicit confirmation in the amber note.
   *
   * So this persists the map as-is via `setConnectionPermissions`, which
   * deliberately does NOT re-derive the closure. Routing through
   * `setModuleReadTier` / `setWriteAction` here would re-run those rules and
   * could REFUSE a grant the user just confirmed, or double-apply one.
   */
  const handlePermissionsChange = (next: ConnectorConnection) => {
    setConnectionPermissions(connection.id, next.permissions);
  };

  /* ---------------- limits ---------------- */

  /**
   * Returns the human sentence for a limit patch, or null when nothing
   * actually moved. `LimitRow` commits on blur, so a user who tabs through the
   * field without typing must not generate an audit row and a toast claiming a
   * change that never happened.
   */
  const describeLimitChange = (
    def: MeterDef,
    before: LimitRule,
    patch: Partial<LimitRule>,
    windowLabel: LimitWindow,
  ): string | null => {
    if (patch.enabled !== undefined && patch.enabled !== before.enabled) {
      return patch.enabled
        ? `Limited "${def.label}" to ${formatMeterAmount(def.unit, before.max)} per ${windowLabel}.`
        : `Removed the limit on "${def.label}".`;
    }
    if (patch.max !== undefined && patch.max !== before.max) {
      return `Set "${def.label}" to ${formatMeterAmount(def.unit, patch.max)} per ${windowLabel}.`;
    }
    if (patch.maxSinglePct !== undefined && patch.maxSinglePct !== (before.maxSinglePct ?? 0)) {
      return patch.maxSinglePct > 0
        ? `Capped any single budget change at ${Math.round(patch.maxSinglePct)}% of the current budget.`
        : "Removed the cap on how large a single budget change can be.";
    }
    return null;
  };

  const handleLimitChange = (meter: LimitMeterId, patch: Partial<LimitRule>) => {
    const def = getMeterDef(meter);
    const before = view.limits.rules[meter];
    const detail = describeLimitChange(def, before, patch, view.limits.window);

    setLimitRule(connection.id, meter, patch);
    if (!detail) return;

    // Auto-save: the log has to answer "who gave it that access", so a human
    // edit is recorded the same way an agent call is.
    recordConfigChange({
      connectionId: connection.id,
      actionId: `limit.${meter}`,
      actionLabel: "Limit changed",
      detail,
      meter,
    });
    toast({ title: "Limit updated", description: detail });
  };

  const requestWindowChange = (value: string) => {
    // ToggleGroup emits "" when the active segment is clicked again.
    if (!value || value === view.limits.window) return;
    setPendingWindow(value as LimitWindow);
  };

  const confirmWindowChange = () => {
    if (!pendingWindow) return;
    const detail = `Limits now reset every ${pendingWindow}. Usage counters were reset to zero.`;
    setLimitWindow(connection.id, pendingWindow);
    recordConfigChange({
      connectionId: connection.id,
      actionId: "limit.window",
      actionLabel: "Limit window changed",
      detail,
    });
    toast({ title: "Limits reset", description: detail });
    setPendingWindow(null);
  };

  /* ---------------- lifecycle ---------------- */

  const handleIssueToken = () => {
    const token = issueConnectionToken(connection.id);
    if (!token) {
      toast({
        variant: "destructive",
        title: "Couldn't issue a token",
        description: "This connection no longer exists. Go back to the list and try again.",
      });
      setIssueOpen(false);
      return;
    }
    recordAuthEvent(connection.id, "token_issued");
    setIssuedToken(token);
    setIssuedExpiry(new Date(Date.now() + TOKEN_TTL_DAYS * DAY_MS).toISOString());
  };

  const closeIssueDialog = () => {
    setIssuedToken(null);
    setIssuedExpiry(null);
    setIssueOpen(false);
  };

  const handleRevoke = () => {
    revokeConnection(connection.id);
    recordAuthEvent(connection.id, "revoked");
    setRevokeOpen(false);
    // NO Undo action. Restoring the row would not restore the agent's access —
    // the token is dead either way — so an Undo would be a button that lies.
    toast({
      title: "Access revoked",
      description: `${connection.name} can't reach FabAds any more. Its history is kept below.`,
    });
  };

  const handleDelete = () => {
    // Recorded BEFORE the delete: `recordAuthEvent` looks the connection up,
    // and the audit store deliberately outlives the record it describes.
    recordAuthEvent(connection.id, "deleted");
    deleteConnection(connection.id);
    onDeleted();
  };

  const handleFixBrokenGrants = () => {
    const broken = brokenGrants(view);
    if (broken.length === 0) return;
    handlePermissionsChange(applyDisableToConnection(connection, broken));

    const named = broken.slice(0, 3).map(actionPath).join(", ");
    const rest = broken.length - Math.min(3, broken.length);
    toast({
      title: `Turned off ${broken.length} ${pluralise(broken.length, "permission", "permissions")}`,
      description: rest > 0 ? `${named} and ${rest} more.` : `${named}.`,
    });
  };

  /* ---------------- activity ---------------- */

  // THE ONLY store hook in this file. A second one that constructs its return
  // value reintroduces the getSnapshot loop that white-screened this repo.
  const { entries } = useConnectorAudit();
  const rows = React.useMemo(
    () => auditForConnection(entries, connection.id),
    [entries, connection.id],
  );

  /* ---------------- derived copy ---------------- */

  const address = MCP_SERVER_URL.replace(/^https?:\/\//, "");
  const tokenCell =
    connection.authMethod === "oauth" ? "OAuth — no token" : connection.tokenPreview;

  const lastUsedAt = connection.lastActiveAt ? Date.parse(connection.lastActiveAt) : NaN;
  const lastUsedValid = Number.isFinite(lastUsedAt);
  const lastUsedLabel = lastUsedValid
    ? formatDistanceToNowStrict(new Date(lastUsedAt), { addSuffix: true })
    : "Never";
  const lastUsedTitle = lastUsedValid ? format(new Date(lastUsedAt), "PPpp") : "Never used";

  const createdAtMs = Date.parse(connection.createdAt);
  const setupIsStale =
    Number.isFinite(createdAtMs) && now - createdAtMs > SETUP_STALE_AFTER_MS;

  const identityLine = [
    preset.label + (connection.customAgentLabel ? ` · ${connection.customAgentLabel}` : ""),
    `added by ${connection.createdBy}`,
  ].join(" · ");

  const snippet = buildSnippet(connection);

  /** The meter actually doing the blocking, for the over-limit strip. */
  const blockedMeter = METERS.find((m) => limitStatus(view, m.id, now).state === "blocked");
  const broken = brokenGrants(view);

  /**
   * Routed through `limitStatus` rather than reading `rules[id].enabled`
   * directly, so this stays correct if the selector's definition of "off" ever
   * grows a second case. The two agree exactly today (`selectors.ts` returns
   * `off` iff `!rule?.enabled`) — which is precisely why the raw read looked
   * safe when it replaced this on the way over from the deleted list, and
   * precisely how the two would silently drift apart later. "Unlimited" is the
   * most dangerous state this screen can report; it does not get to depend on
   * a coincidence.
   */
  const noLimitsAtAll = METERS.every((m) => limitStatus(view, m.id, now).state === "off");
  const showUnlimited = writeAccess && noLimitsAtAll;

  /* ---------------- tab counts ---------------- */

  /**
   * Counts answer "is there anything in there?" without opening the tab, and
   * every one of them counts the thing the panel is actually about:
   *
   *  · Permissions — write actions granted, not modules read. Read access is
   *    the floor of every connection; the number worth putting on a badge is
   *    how many things this agent can CHANGE.
   *  · Limits      — rules switched on. Four rules always exist; "0" here is
   *    the honest reading of an uncapped connection, and it is exactly the
   *    case the Unlimited strip above is shouting about.
   *  · Activity    — rows for THIS connection, over the whole log, not the 20
   *    the table shows.
   *
   * Each is suppressed at 0 (see the strip below) — Catalogue's rule, and the
   * right one: a row of grey zeroes reads as broken, not as empty.
   */
  const grantedWriteCount = writeActionCount(view);
  const enabledLimitCount = METERS.filter((m) => view.limits.rules[m.id]?.enabled).length;

  const sectionTabs: { key: DetailSection; count: number }[] = [
    { key: "permissions", count: grantedWriteCount },
    { key: "limits", count: enabledLimitCount },
    { key: "activity", count: rows.length },
  ];

  /**
   * ONE strip per health, resolved by lookup.
   *
   * `connectionHealth()` has already done the precedence walk, so this is a
   * plain keyed dispatch — not a chain of ternaries whose order silently
   * becomes a second, conflicting specification.
   */
  const buildStrip = (): React.ReactNode => {
    const builders: Record<ConnectionHealth, () => React.ReactNode> = {
      revoked: () => (
        <StatusStrip
          tone="muted"
          icon={XCircle}
          title={HEALTH_LABEL.revoked}
          body={`Revoked on ${formatDateSafe(connection.revokedAt, "an earlier date")} by ${
            connection.revokedBy ?? "someone on your team"
          }. Its access is shown below as it was.`}
          actions={
            <Button variant="outline" size="sm" onClick={handleDelete}>
              Delete from list
            </Button>
          }
        />
      ),

      expired: () => (
        <StatusStrip
          tone="amber"
          icon={AlertTriangle}
          title={HEALTH_LABEL.expired}
          body={`This token expired on ${formatDateSafe(
            connection.tokenExpiresAt,
            "an earlier date",
          )}. ${preset.label} can't do anything until you issue a new one. Everything you set up below is kept.`}
          actions={
            <Button variant="outline" size="sm" onClick={() => setIssueOpen(true)}>
              Issue a new token
            </Button>
          }
        />
      ),

      over_limit: () => {
        if (overLimitDismissed || !blockedMeter) return null;
        const status = limitStatus(view, blockedMeter.id, now);
        const since = formatTimeSafe(
          view.usage?.[blockedMeter.id]?.lastEventAt ?? null,
          "earlier today",
        );
        return (
          <StatusStrip
            tone="red"
            icon={Ban}
            title={HEALTH_LABEL.over_limit}
            body={`Blocked since ${since}. ${connection.name} has used its whole ${
              WINDOW_ADJECTIVE[view.limits.window]
            } ${METER_NOUN[blockedMeter.id]} allowance (${formatMeterAmount(
              blockedMeter.unit,
              status.used,
            )} of ${formatMeterAmount(blockedMeter.unit, status.max)}). It can still read.`}
            actions={
              <>
                <Button variant="outline" size="sm" onClick={goToLimits}>
                  Raise the limit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOverLimitDismissed(true)}>
                  Leave it
                </Button>
              </>
            }
          />
        );
      },

      needs_attention: () => (
        <StatusStrip
          tone="amber"
          icon={AlertTriangle}
          title={HEALTH_LABEL.needs_attention}
          body={`${broken.length} ${pluralise(
            broken.length,
            "permission",
            "permissions",
          )} can't work as set.`}
          actions={
            <Button variant="outline" size="sm" onClick={handleFixBrokenGrants}>
              {broken.length === 1 ? "Fix it" : broken.length === 2 ? "Fix both" : "Fix all"}
            </Button>
          }
        />
      ),

      pending: () => (
        <StatusStrip
          tone="info"
          icon={Clock}
          // Same state, more urgent voice — deliberately NOT a second status.
          title={setupIsStale ? "Setup not finished" : HEALTH_LABEL.pending}
          // Split on auth method: an OAuth connection has no snippet to paste,
          // and this strip sat directly above a dialog that says so. Telling
          // someone to paste a token that was never issued is how they end up
          // convinced the product is broken.
          body={
            connection.authMethod === "oauth"
              ? `Waiting for ${preset.label} to approve the connection. Finish the sign-in in ${preset.label} and it'll show as active within a few seconds.`
              : `Waiting for ${preset.label} to connect. Paste the setup snippet into ${preset.label} and it'll show as active within a few seconds.`
          }
          actions={
            <Button variant="outline" size="sm" onClick={() => setSetupOpen(true)}>
              Show setup
            </Button>
          }
        />
      ),

      no_access: () => (
        <StatusStrip
          tone="muted"
          icon={EyeOff}
          title={HEALTH_LABEL.no_access}
          body="This connection can't see anything. It'll connect fine, then fail every request."
        />
      ),

      active: () => null,
    };

    return builders[health]();
  };

  /* ---------------- render ---------------- */

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* 1 — identity. ALWAYS visible; never behind a tab. Taller than
             Catalogue's hero on purpose: Address and Token are the two things
             people come here to copy when a connection is misbehaving, and a
             click to reach them is a click too many. */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <AgentAvatar
              monogram={preset.monogram}
              brandHex={preset.brandHex}
              size="lg"
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {/* Clamped to two lines, never ellipsised on one — the name is
                    how you tell one connection from another. */}
                <h1 className="line-clamp-2 break-words text-xl font-semibold text-foreground">
                  {connection.name}
                </h1>
                <ConnectorStatusPill health={health} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{identityLine}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {/* A revoked connection has no live token to configure — the
                snippet would show a masked value that no longer authenticates
                anything. Same gate as "Revoke access" beside it: the revoked
                strip's "Delete from list" is the only action left once a
                connection is dead. */}
            {!isRevoked && (
              <Button variant="outline" size="sm" onClick={() => setSetupOpen(true)}>
                Setup snippet
              </Button>
            )}
            {!isRevoked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevokeOpen(true)}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Revoke access
              </Button>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 md:grid-cols-4">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Address</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-foreground">{address}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Token</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-foreground">{tokenCell}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Created</dt>
            <dd className="mt-0.5 text-xs text-foreground">
              {formatDateSafe(connection.createdAt, "—")}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Last used</dt>
            <dd className="mt-0.5 text-xs text-foreground" title={lastUsedTitle}>
              {lastUsedLabel}
            </dd>
          </div>
        </dl>
      </div>

      {/* 2 — status. ALWAYS visible, and deliberately ABOVE the tab strip
             rather than inside a panel: someone reading the activity log has
             to keep seeing "Limit reached" while they read it. At most one
             health strip; the Unlimited warning is its own, independent line
             (see the file header). */}
      {buildStrip()}

      {showUnlimited && (
        <StatusStrip
          tone="amber"
          icon={AlertTriangle}
          title="No limits set"
          body="This connection can change anything, with no limits set."
          actions={
            <Button variant="outline" size="sm" onClick={goToLimits}>
              Set limits
            </Button>
          }
        />
      )}

      {/* 3 — section tabs. Container, trigger and badge classes are lifted
             verbatim from CatalogueDetailPage's BrandDetail strip: this and
             Catalogue are the same master-detail shape, and two hand-tuned
             pill strips that are nearly-but-not-quite alike is how a product
             starts feeling assembled from parts. */}
      <div
        role="tablist"
        aria-label="Connection sections"
        className="flex flex-wrap gap-1 self-start rounded-full border border-border/60 bg-background/40 p-0.5"
      >
        {sectionTabs.map((t) => {
          const active = section === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${uid}-tab-${t.key}`}
              aria-selected={active}
              aria-controls={`${uid}-panel-${t.key}`}
              onClick={() => setSection(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {SECTION_LABEL[t.key]}
              {/* Suppressed at zero, never rendered as "0". A row of grey
                  zeroes reads as a broken counter, not as an empty tab. */}
              {t.count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold",
                    active ? "bg-primary/20 text-primary" : "bg-foreground/[0.08] text-foreground",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4 — the active panel. Exactly one is mounted at a time, which is why
             `goToLimits` has to switch the section before it scrolls. */}

      {section === "permissions" && (
        <div
          role="tabpanel"
          id={`${uid}-panel-permissions`}
          aria-labelledby={`${uid}-tab-permissions`}
        >
          <PermissionMatrix
            connection={connection}
            onChange={handlePermissionsChange}
            readOnly={isRevoked}
          />
        </div>
      )}

      {/* The id is a stable anchor for hand-written links only. Nothing in the
          app resolves it any more: PermissionMatrix's "Skip to limits" links
          were removed when Limits became a sibling tab (the target is not
          mounted while Permissions is open), and the scroll below goes through
          `limitsRef`, not `getElementById` — a ref cannot go stale the way an
          id lookup against an unmounted node silently does. */}
      {section === "limits" && (
        <section
          id="connector-limits"
          ref={limitsRef}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-limits`}
          className="scroll-mt-24"
        >
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-base">Limits</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ceilings on what this connection can spend and change. One window, shared by
                  all four.
                </p>
              </div>

              {writeAccess && (
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">Reset every</span>
                  <ToggleGroup
                    type="single"
                    value={view.limits.window}
                    onValueChange={requestWindowChange}
                    disabled={isRevoked}
                    className="justify-start gap-0 rounded-md border border-input p-0.5"
                    aria-label="How often limits reset"
                  >
                    {WINDOW_SEGMENTS.map((seg) => (
                      <ToggleGroupItem
                        key={seg.value}
                        value={seg.value}
                        size="sm"
                        className="h-7 rounded-sm px-2.5 text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
                      >
                        {seg.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}
            </CardHeader>

            <CardContent className={cn(writeAccess && "divide-y divide-border")}>
              {writeAccess ? (
                METERS.map((m) => (
                  <LimitRow
                    key={m.id}
                    meter={m.id}
                    label={m.label}
                    description={m.description}
                    unit={m.unit}
                    rule={view.limits.rules[m.id]}
                    status={limitStatus(view, m.id, now)}
                    windowLabel={view.limits.window}
                    onChange={(patch) => handleLimitChange(m.id, patch)}
                    readOnly={isRevoked}
                    actionsGranted={meterActionsGranted(view, m.id)}
                    // Via normalizedUsage, NOT `view.usage[m.id].blocked` — a
                    // meter whose window has rolled over must report zero
                    // refusals, not last week's. Reading the raw field would
                    // leave "Refused 3 times this day" on screen the morning
                    // after, which is the one thing a refusal count must never
                    // get wrong.
                    blockedCount={normalizedUsage(view, m.id, now).blocked}
                  />
                ))
              ) : (
                // A four-meter form for a connection that cannot consume any
                // of them is a wall of controls that can never matter.
                <p className="text-sm text-muted-foreground">
                  Nothing to limit yet. This connection can only look, not change.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {section === "activity" && (
        <section
          role="tabpanel"
          id={`${uid}-panel-activity`}
          aria-labelledby={`${uid}-tab-activity`}
          className="flex flex-col gap-3"
        >
          <div>
            <h2 className="text-base font-semibold text-foreground">Activity</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Everything {preset.label} has asked FabAds for, and what it was told.
            </p>
          </div>
          <ActivityTable
            entries={rows.slice(0, 20)}
            totalCount={rows.length}
            emptyTitle={`${preset.label} hasn't asked FabAds for anything yet`}
            emptyDescription="Activity shows up here the first time it makes a request."
            // Switches to the Limits tab first, then scrolls — the card this
            // used to jump to is no longer in the DOM from here.
            onRaiseLimit={goToLimits}
          />
        </section>
      )}

      {/* ---------------- Setup snippet ---------------- */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Set up {preset.label}</DialogTitle>
            <DialogDescription>
              {snippet.filename
                ? `Paste this into ${snippet.filename}, then restart ${preset.label}.`
                : `Add these values in ${preset.label}'s own connector settings.`}
            </DialogDescription>
          </DialogHeader>

          <ConfigSnippetBlock
            filename={snippet.filename}
            code={snippet.code}
            pairs={snippet.pairs}
          />

          {connection.authMethod === "oauth" ? (
            <p className="text-xs text-muted-foreground">
              This connection signs in with {preset.label} — there's no token to paste.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Replace the dots with your token. Lost it?{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => {
                  setSetupOpen(false);
                  setIssueOpen(true);
                }}
              >
                Issue a new one.
              </Button>
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Issue a new token ---------------- */}
      <Dialog
        open={issueOpen}
        onOpenChange={(next) => {
          // While the token is on screen this is the ONLY chance to copy it —
          // the store never keeps the full value. Closing is blocked (Escape,
          // the X, everything) until the user says they have it.
          if (!next && issuedToken) return;
          if (!next) closeIssueDialog();
          else setIssueOpen(true);
        }}
      >
        <DialogContent
          className="max-w-lg"
          onEscapeKeyDown={(event) => {
            if (issuedToken) event.preventDefault();
          }}
        >
          {issuedToken ? (
            <>
              <DialogHeader>
                <DialogTitle>Your new token</DialogTitle>
                <DialogDescription>
                  Paste it into {preset.label}'s config in place of the old one.
                </DialogDescription>
              </DialogHeader>

              <div className="relative overflow-hidden rounded-lg border border-warning-text/25 bg-card">
                <div className="absolute inset-0 bg-warning-text/10" aria-hidden="true" />
                <div className="relative flex items-start gap-3 p-3">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-warning-text"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Copy your token now</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      FabAds never stores it. Once this closes, the only way to get one is to
                      issue another.
                    </p>
                  </div>
                </div>
              </div>

              <CopyField
                value={issuedToken}
                label="Access token"
                ariaLabel="Copy access token"
                monospace
                toastLabel="Token"
              />

              <p className="text-xs text-muted-foreground">
                Expires in {TOKEN_TTL_DAYS} days, on {formatDateSafe(issuedExpiry, "its expiry date")}
                . The previous token stopped working the moment this one was issued.
              </p>

              <DialogFooter>
                <Button onClick={closeIssueDialog}>I've copied it</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Issue a new token?</DialogTitle>
                <DialogDescription>
                  The current token stops working straight away. {preset.label} won't be able to
                  reach FabAds until you paste the new one into its config. Permissions and limits
                  are kept exactly as they are.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={closeIssueDialog}>
                  Cancel
                </Button>
                <Button onClick={handleIssueToken}>Issue a new token</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------------- Change the limit window ---------------- */}
      <AlertDialog
        open={pendingWindow !== null}
        onOpenChange={(next) => {
          if (!next) setPendingWindow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pendingWindow ? WINDOW_NOUN[pendingWindow] : "a new window"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Usage counters reset to zero — {connection.name} gets a fresh allowance straight
              away.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmWindowChange}>Switch and reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------------- Revoke ---------------- */}
      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {/* NEVER truncated. Identifying the right connection is this
                dialog's entire function. */}
            <AlertDialogTitle className="break-words">
              Revoke {connection.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {preset.label} loses access straight away. Your campaigns, reports and creatives
              aren't touched. To use it again you'll have to connect it from scratch with a new
              token.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
