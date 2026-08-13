/**
 * ConnectWizard — the four-step "connect an AI app" flow for the Connector.
 *
 * FOUR DECISIONS WORTH KNOWING BEFORE YOU EDIT THIS FILE
 *
 * 1. THE WIZARD HOLDS A FULL `ConnectorConnection` AS ITS DRAFT.
 *    Not a bag of wizard-shaped fields — a real connection object, built from
 *    `presetPermissionMap(DEFAULT_ACCESS_CHOICE)` / `defaultLimits()` /
 *    `emptyUsage(...)` with
 *    placeholder identity fields, and only handed to `createConnection()` at
 *    the very end. That is what lets `PermissionMatrix` and `LimitRow` run
 *    here EXACTLY as they run on the detail page — same props, same
 *    dependency plans, same "what does enabling this imply" answer. Two
 *    implementations of that answer would drift, and the wizard's is the one
 *    users meet first, so it is the one that must not be a simplified copy.
 *    The draft's `id` is the literal string "draft" and never reaches the
 *    store; `createConnection()` mints the real id.
 *
 * 2. THE CLAUDE SURFACE FORK IS ASKED, NEVER INFERRED.
 *    Claude is the one preset with `hasSurfaceChoice`, and that answer decides
 *    the entire last step: Desktop app → a bearer token in a config file,
 *    claude.ai → an OAuth approval. Defaulting the segment (or guessing from
 *    the user agent) would mean someone can reach step 4 and be handed an
 *    unrecoverable secret for a surface they never said they used. So the
 *    segmented control starts empty and `Continue` stays disabled until it is
 *    answered — the same reason no tile is pre-selected. Every other preset
 *    takes `preset.authMethods[0]`, which is honest per agent rather than
 *    aspirational.
 *
 * 3. ESCAPE IS BLOCKED ON EXACTLY ONE PANE.
 *    Outside-click dismissal is already blocked for every dialog in this repo
 *    at the primitive (`src/components/ui/dialog.tsx`), so Escape is the only
 *    lever left here — and it is used once. On the token pane the full token
 *    exists in this component's local state and NOWHERE else: not in the
 *    store, not in localStorage, not recoverable from any server. Losing it to
 *    a stray Escape means making a new one and breaking the old, so error
 *    PREVENTION wins over error recovery and both Escape and the corner X are
 *    withheld until `I've copied it`. Every other pane — steps 1-3, the OAuth
 *    wait, the done pane — closes normally, with a discard confirmation on
 *    1-3 if anything was actually typed. Blocking escape anywhere else would
 *    be a trap, not a safeguard.
 *
 * 4. THE OAUTH WAIT IS A 3500ms SIMULATION, SAID OUT LOUD.
 *    A real implementation would poll a callback endpoint (or hold a
 *    websocket) until the provider reports approval. This prototype resolves
 *    on a timer instead, deliberately short: a faithful 30-second wait would
 *    make the pane untestable and teach nobody anything. The pane says so on
 *    screen — a muted line next to the spinner states plainly that the
 *    approval is simulated, so nobody can watch this pane resolve and walk
 *    away believing a real OAuth handshake just happened. The `Set it up
 *    with a token instead` escape hatch is visible IMMEDIATELY rather than
 *    after a timeout, so the pane can never become a dead end — that matters
 *    more in a real implementation than in this one, and it is cheaper to
 *    build it right the first time. The timer is cleared in the effect
 *    cleanup so closing the dialog mid-wait never sets state on an unmounted
 *    component.
 */
import * as React from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { AgentAvatar } from "@/connector/components/AgentAvatar";
import { ConfigSnippetBlock } from "@/connector/components/ConfigSnippetBlock";
import { CopyField } from "@/connector/components/CopyField";
import { LimitRow } from "@/connector/components/LimitRow";
import { PermissionMatrix } from "@/connector/components/PermissionMatrix";
import {
  AGENT_BUCKETS,
  AGENT_PRESETS,
  MCP_SERVER_URL,
  METERS,
  TOKEN_TTL_DAYS,
  defaultLimits,
  emptyUsage,
  getAgentPreset,
  getMeterDef,
  presetPermissionMap,
} from "@/connector/catalogue";
import { createConnection, issueConnectionToken, updateConnection } from "@/connector/connectionsStore";
import { recordAuthEvent } from "@/connector/recorder";
import {
  accessSummaryLine,
  hasAnyWriteAccess,
  limitStatus,
  meterActionsGranted,
  windowStartOf,
} from "@/connector/selectors";
import type {
  AgentKind,
  AgentPreset,
  AgentSurface,
  AuthMethod,
  ConnectorConnection,
  LimitRule,
  LimitWindow,
} from "@/connector/model";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** See decision 4 in the header. A real build polls a callback; this does not. */
const OAUTH_SIMULATION_MS = 3500;

/** The counter appears only when the 60-char ceiling is actually in view.
 *  Showing "3/60" from the first keystroke is noise on a field nobody
 *  overruns. */
const NAME_COUNTER_FROM = 45;

const STEP_LABELS = ["Choose app", "Name & access", "Limits", "Connect"];

const WINDOW_OPTIONS: { value: LimitWindow; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const WINDOW_NOUN: Record<LimitWindow, string> = {
  day: "day",
  week: "week",
  month: "month",
};

/**
 * Which pane step 4 is showing. A STRING discriminant, not a boolean pair —
 * `tsconfig.app.json` runs with `strict: false`, so TypeScript will not narrow
 * boolean-literal unions, and a `{ kind: true }` shape would silently lose its
 * type safety here.
 */
type ConnectPane = "token" | "oauth_summary" | "oauth_waiting" | "done";

/** Which of the three access shapes step 2 is on. */
type AccessChoice = "view" | "view_export" | "custom";

/**
 * The preset step 2 opens on — and the ONE place it is decided.
 *
 * This constant exists because the two halves of "which preset is selected"
 * used to live apart: `accessChoice` initialised to "view" (so the radio
 * rendered as **Read only — Views every module**) while `makeDraft()` started
 * from `emptyPermissionMap()` (so every module was actually Off). A user who
 * accepted the default and pressed Continue created a connection that could
 * see nothing, having just been told it could see everything. That is exactly
 * the kind of lie the dependency-block design exists to prevent, and it sat on
 * the default path of the primary creation flow.
 *
 * `makeDraft()` and the reset effect both read from here. Do not re-inline
 * either one.
 */
const DEFAULT_ACCESS_CHOICE: Extract<AccessChoice, "view" | "view_export"> = "view";

const ACCESS_CHOICES: { value: AccessChoice; label: string; description: string }[] = [
  {
    value: "view",
    label: "Read only",
    description: "Views every module. Can't download, can't change anything.",
  },
  {
    value: "view_export",
    label: "Read and download",
    description: "Views every module and pulls data out as files.",
  },
  {
    value: "custom",
    label: "Set it up myself",
    description: "Pick module by module, including what it's allowed to change.",
  },
];

/* ------------------------------------------------------------------ */
/*  Draft construction                                                 */
/* ------------------------------------------------------------------ */

/**
 * A complete, valid `ConnectorConnection` that has never been stored.
 *
 * Identity fields are placeholders and are all replaced by `createConnection()`
 * — only `permissions` and `limits` survive the handoff. Everything else exists
 * so the shared components can read the object without a single optional
 * chain, exactly as they do on the detail page.
 */
function makeDraft(): ConnectorConnection {
  const now = Date.now();
  const limits = defaultLimits();
  return {
    id: "draft",
    agentKind: "custom",
    agentSurface: null,
    name: "",
    customAgentLabel: null,
    authMethod: "token",
    status: "pending",
    tokenPreview: "ff_mcp_••••••••",
    createdAt: new Date(now).toISOString(),
    tokenExpiresAt: null,
    createdBy: "You",
    lastActiveAt: null,
    // Must match DEFAULT_ACCESS_CHOICE — the radio and the grant are one fact.
    permissions: presetPermissionMap(DEFAULT_ACCESS_CHOICE),
    limits,
    usage: emptyUsage(windowStartOf(limits.window, now)),
    enabled: true,
    revokedAt: null,
    revokedBy: null,
    simulated: true,
  };
}

/** Desktop → a token in a config file, claude.ai → OAuth. Everything else
 *  takes the preset's own first (preferred) method. */
function resolveAuthMethod(preset: AgentPreset, surface: AgentSurface | null): AuthMethod {
  if (preset.hasSurfaceChoice) return surface === "web" ? "oauth" : "token";
  return preset.authMethods[0];
}

/**
 * The paste-ready config for a given agent shape.
 *
 * JSON is produced with `JSON.stringify(obj, null, 2)`, never hand-assembled:
 * the token is user-facing text that ends up inside a JSON string, and a
 * hand-built snippet is exactly where a stray quote turns into a config file
 * the agent silently refuses to load.
 */
function buildSnippet(
  preset: AgentPreset,
  token: string,
): { filename: string | null; code: string; pairs: { key: string; value: string }[] | null } {
  const authorization = `Bearer ${token}`;

  if (preset.configShape === "vscodeServers") {
    return {
      filename: ".vscode/mcp.json",
      code: JSON.stringify(
        {
          servers: {
            fabads: {
              type: "http",
              url: MCP_SERVER_URL,
              headers: { Authorization: authorization },
            },
          },
        },
        null,
        2,
      ),
      pairs: null,
    };
  }

  if (preset.configShape === "urlAndHeader") {
    return {
      filename: null,
      code: "",
      // Key = the literal header name, value = the literal header value. Must
      // stay identical to `ConnectionDetail`'s snippet for the same agent —
      // a user comparing the two screens has no way to tell which is right.
      pairs: [
        { key: "Server URL", value: MCP_SERVER_URL },
        { key: "Authorization", value: authorization },
      ],
    };
  }

  return {
    filename: preset.configPath,
    code: JSON.stringify(
      {
        mcpServers: {
          fabads: {
            url: MCP_SERVER_URL,
            headers: { Authorization: authorization },
          },
        },
      },
      null,
      2,
    ),
    pairs: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ConnectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after Create with the new connection id, so the caller can open it. */
  onCreated: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ConnectWizard({ open, onOpenChange, onCreated }: ConnectWizardProps) {
  const [step, setStep] = React.useState(1);
  const [agentKind, setAgentKind] = React.useState<AgentKind | null>(null);
  const [surface, setSurface] = React.useState<AgentSurface | null>(null);
  const [draft, setDraft] = React.useState<ConnectorConnection>(makeDraft);
  const [accessChoice, setAccessChoice] = React.useState<AccessChoice>(DEFAULT_ACCESS_CHOICE);

  /** Only "did the user actually put something in" — drives the discard
   *  confirmation. Picking a tile alone is not worth a confirmation. */
  const [touched, setTouched] = React.useState(false);

  const [createdId, setCreatedId] = React.useState<string | null>(null);
  const [pane, setPane] = React.useState<ConnectPane>("oauth_summary");
  /**
   * The full token. Local state, this dialog only, cleared on every open.
   * It is never written to the store, to localStorage, or to an audit row —
   * `issueConnectionToken()` keeps only the mask.
   */
  const [token, setToken] = React.useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = React.useState<string | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [discardOpen, setDiscardOpen] = React.useState(false);

  const preset = agentKind ? getAgentPreset(agentKind) : null;
  const authMethod = preset ? resolveAuthMethod(preset, surface) : "token";
  const now = Date.now();

  /* --- Reset on open ------------------------------------------------ */

  /**
   * Same shape as `ReportWizard`'s reset effect, for the same reason plus one
   * bigger one: a reopened wizard showing a previous run's step or permissions
   * is confusing, but a reopened wizard showing a previous run's TOKEN is a
   * secret leaking across two unrelated connections.
   */
  React.useEffect(() => {
    if (!open) return;
    setStep(1);
    setAgentKind(null);
    setSurface(null);
    setDraft(makeDraft());
    setAccessChoice(DEFAULT_ACCESS_CHOICE);
    setTouched(false);
    setCreatedId(null);
    setPane("oauth_summary");
    setToken(null);
    setTokenExpiresAt(null);
    setElapsed(0);
    setDiscardOpen(false);
  }, [open]);

  /* --- OAuth simulation --------------------------------------------- */

  React.useEffect(() => {
    if (pane !== "oauth_waiting" || !createdId) return;

    const startedAt = Date.now();
    setElapsed(0);

    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    // A real implementation would poll a callback endpoint here until the
    // provider reports the approval (or the user cancels). The fixed timer is
    // a prototype stand-in — and it is 3.5s rather than a realistic ~30s
    // because a realistic one would be untestable.
    const settle = setTimeout(() => {
      recordAuthEvent(createdId, "oauth_approved");
      updateConnection(createdId, { status: "connected" });
      setPane("done");
    }, OAUTH_SIMULATION_MS);

    // Closing the dialog mid-wait unmounts this — both handles must go, or
    // the timeout fires into a dead component.
    return () => {
      clearInterval(tick);
      clearTimeout(settle);
    };
  }, [pane, createdId]);

  /* --- Close / escape ----------------------------------------------- */

  const tokenPaneLocked = step === 4 && pane === "token";

  const requestClose = React.useCallback(() => {
    // Defence in depth: `onEscapeKeyDown` already blocks the only remaining
    // dismissal path on this pane, and the corner X is hidden.
    if (step === 4 && pane === "token") return;
    if (step <= 3 && touched) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }, [step, pane, touched, onOpenChange]);

  /* --- Step 1 ------------------------------------------------------- */

  function pickAgent(kind: AgentKind) {
    const next = getAgentPreset(kind);
    setAgentKind(kind);
    // Surface is never carried over from a previously-highlighted tile, and
    // never defaulted — see decision 2.
    setSurface(null);
    setDraft((d) => ({ ...d, agentKind: kind, name: next.defaultName }));
  }

  const step1Complete = Boolean(agentKind) && (!preset?.hasSurfaceChoice || surface !== null);

  /* --- Step 2 ------------------------------------------------------- */

  function pickAccess(choice: AccessChoice) {
    setAccessChoice(choice);
    setTouched(true);
    if (choice === "custom") return; // Reveals the matrix; changes nothing.
    setDraft((d) => ({ ...d, permissions: presetPermissionMap(choice) }));
  }

  /* --- Step 3 ------------------------------------------------------- */

  function setWindow(next: LimitWindow) {
    setTouched(true);
    setDraft((d) => ({
      ...d,
      limits: { ...d.limits, window: next },
      // The stored usage belongs to the OLD bucket. Re-stamping rather than
      // keeping it means the meters on this page describe the window the user
      // just chose, not the one they left.
      usage: emptyUsage(windowStartOf(next, Date.now())),
    }));
  }

  function patchRule(meter: (typeof METERS)[number]["id"], patch: Partial<LimitRule>) {
    setTouched(true);
    setDraft((d) => ({
      ...d,
      limits: {
        ...d.limits,
        rules: { ...d.limits.rules, [meter]: { ...d.limits.rules[meter], ...patch } },
      },
    }));
  }

  /* --- Create ------------------------------------------------------- */

  function handleCreate() {
    if (!preset) return;

    const id = createConnection({
      agentKind: preset.kind,
      agentSurface: preset.hasSurfaceChoice ? surface : null,
      name: draft.name,
      authMethod,
      permissions: draft.permissions,
      limits: draft.limits,
    });
    recordAuthEvent(id, "connected");
    setCreatedId(id);
    setStep(4);

    if (authMethod === "token") {
      issueToken(id);
      return;
    }
    setPane("oauth_summary");
  }

  /**
   * The one place a full token enters this component. `issueConnectionToken()`
   * returns it exactly once and stores only the mask — so it is held here and
   * written nowhere.
   */
  function issueToken(id: string) {
    const issued = issueConnectionToken(id);
    if (!issued) return;
    setToken(issued);
    setTokenExpiresAt(new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString());
    setPane("token");
  }

  /** The OAuth pane's escape hatch, available from the first frame. */
  function switchToToken() {
    if (!createdId) return;
    recordAuthEvent(createdId, "token_issued");
    issueToken(createdId);
  }

  function finishOpen() {
    if (!createdId) return;
    onCreated(createdId);
    onOpenChange(false);
  }

  /* --- Derived ------------------------------------------------------ */

  const writeAccess = hasAnyWriteAccess(draft);
  const windowNoun = WINDOW_NOUN[draft.limits.window];
  const connectedName = draft.name.trim() || preset?.defaultName || "This connection";
  const snippet = preset && token ? buildSnippet(preset, token) : null;

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            onOpenChange(true);
            return;
          }
          requestClose();
        }}
      >
        <DialogContent
          className={cn(
            // Wider than this repo's usual 540 because the permission matrix
            // needs the room — a matrix that wraps is a matrix nobody reads.
            "sm:max-w-[760px] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden",
            // The corner X is baked into DialogContent. On the token pane it
            // would be a one-click path to losing an unrecoverable secret, so
            // it is hidden there — and only there. (ui/* is not modified.)
            tokenPaneLocked && "[&>button:last-child]:hidden",
          )}
          onEscapeKeyDown={(event) => {
            if (tokenPaneLocked) event.preventDefault();
          }}
        >
          {/* ---- Header (pinned) ---- */}
          <DialogHeader className="space-y-1 border-b border-border px-6 pb-4 pt-6 text-left">
            <DialogTitle>Connect an app</DialogTitle>
            <DialogDescription>
              Give an AI app access to FabAds — you choose what it can see and what it can
              change.
            </DialogDescription>
          </DialogHeader>

          {/* ---- Stepper strip (pinned) ---- */}
          <ol className="flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-3">
            {STEP_LABELS.map((label, index) => {
              const n = index + 1;
              const isActive = n === step;
              const isDone = n < step;
              return (
                <li key={label} className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium",
                      isDone && "border-success-text/40 bg-success-text/10 text-success-text",
                      isActive && "border-primary bg-primary text-primary-foreground",
                      !isDone && !isActive && "border-border text-muted-foreground",
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : n}
                  </span>
                  <span
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "truncate text-xs",
                      isActive ? "font-medium text-foreground" : "text-muted-foreground",
                      // Below 540px only the active label survives; four
                      // truncated labels are four unreadable labels.
                      !isActive && "hidden min-[540px]:inline",
                    )}
                  >
                    {label}
                  </span>
                  {n < STEP_LABELS.length && (
                    <span aria-hidden="true" className="h-px w-3 shrink-0 bg-border sm:w-6" />
                  )}
                </li>
              );
            })}
          </ol>

          {/* ---- Body (the only scroller) ---- */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
            {step === 1 && (
              <div className="space-y-6">
                {AGENT_BUCKETS.map((bucket) => {
                  const presets = AGENT_PRESETS.filter((p) => p.bucket === bucket.id);
                  if (presets.length === 0) return null;
                  return (
                    <section key={bucket.id} className="space-y-2">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {bucket.label}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {presets.map((p) => {
                          const selected = agentKind === p.kind;
                          return (
                            <div
                              key={p.kind}
                              className={cn(
                                "overflow-hidden rounded-lg border transition-colors",
                                selected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-muted/50",
                              )}
                            >
                              {/* The tile itself is the button. The surface
                                  radiogroup sits OUTSIDE it — a button inside
                                  a button is invalid and unreachable by
                                  keyboard. */}
                              <button
                                type="button"
                                aria-pressed={selected}
                                onClick={() => pickAgent(p.kind)}
                                className="flex w-full items-center gap-3 px-3 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                              >
                                <AgentAvatar monogram={p.monogram} brandHex={p.brandHex} size="md" />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-foreground">
                                    {p.label}
                                  </span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {p.tagline}
                                  </span>
                                </span>
                                {selected && (
                                  <Check
                                    aria-hidden="true"
                                    className="h-4 w-4 shrink-0 text-primary"
                                  />
                                )}
                              </button>

                              {selected && p.hasSurfaceChoice && (
                                <div className="border-t border-border px-3 py-3">
                                  <p className="mb-2 text-xs text-muted-foreground">
                                    Where will you use it? This decides how it signs in.
                                  </p>
                                  <div
                                    role="radiogroup"
                                    aria-label="Which Claude surface"
                                    className="inline-flex rounded-md border border-input p-0.5"
                                  >
                                    {(
                                      [
                                        { value: "desktop", label: "Desktop app" },
                                        { value: "web", label: "claude.ai" },
                                      ] as { value: AgentSurface; label: string }[]
                                    ).map((option) => (
                                      <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={surface === option.value}
                                        onClick={() => setSurface(option.value)}
                                        className={cn(
                                          "rounded-sm px-3 py-1 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                          surface === option.value
                                            ? "bg-secondary text-secondary-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                        )}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="connector-name">Name this connection</Label>
                  <Input
                    id="connector-name"
                    value={draft.name}
                    maxLength={60}
                    onChange={(e) => {
                      setTouched(true);
                      setDraft((d) => ({ ...d, name: e.target.value }));
                    }}
                    placeholder={preset?.defaultName ?? "My MCP client"}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      You'll see this name in the connection list and in every activity row.
                    </p>
                    {draft.name.length >= NAME_COUNTER_FROM && (
                      <span
                        aria-live="polite"
                        className={cn(
                          "shrink-0 text-xs tabular-nums",
                          draft.name.length >= 60 ? "text-warning-text" : "text-muted-foreground",
                        )}
                      >
                        {draft.name.length}/60
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">What can it access?</p>
                  <div role="radiogroup" aria-label="Access preset" className="flex flex-col gap-2">
                    {ACCESS_CHOICES.map((choice) => {
                      const selected = accessChoice === choice.value;
                      return (
                        <button
                          key={choice.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => pickAccess(choice.value)}
                          className={cn(
                            "flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                              selected ? "border-primary" : "border-input",
                            )}
                          >
                            {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground">
                              {choice.label}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {choice.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {accessChoice === "custom" ? "Pick what it can do" : "What that gives it"}
                    </p>
                    <p className="text-xs text-muted-foreground">{accessSummaryLine(draft)}</p>
                  </div>
                  {/*
                    Mounted in BOTH modes on purpose. Under a preset it is
                    read-only — it shows what the preset actually did, so the
                    two words on the card are never the only description of the
                    grant. Editing it under a preset would make the card's
                    label a lie, so editing means choosing "Set it up myself".
                  */}
                  <PermissionMatrix
                    connection={draft}
                    onChange={(next) => {
                      setTouched(true);
                      setDraft(next);
                    }}
                    readOnly={accessChoice !== "custom"}
                    // Nothing has been created yet, let alone revoked. The
                    // explanation for why this is locked lives right below the
                    // card, in the wizard's own words.
                    readOnlyNote={null}
                    dense
                  />
                  {accessChoice !== "custom" && (
                    <p className="text-xs text-muted-foreground">
                      To change any of this, pick “Set it up myself” above.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Reset every</p>
                    <p className="text-xs text-muted-foreground">
                      One window for all four limits. They all reset together.
                    </p>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={draft.limits.window}
                    onValueChange={(value) => {
                      if (!value) return;
                      setWindow(value as LimitWindow);
                    }}
                    className="justify-start gap-0 rounded-md border border-input p-0.5"
                    aria-label="Limit window"
                  >
                    {WINDOW_OPTIONS.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        size="sm"
                        className="h-7 rounded-sm px-3 text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
                      >
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="rounded-lg border border-border px-4 py-4">
                  {writeAccess ? (
                    <div className="divide-y divide-border">
                      {METERS.map((meter) => {
                        const def = getMeterDef(meter.id);
                        return (
                          <LimitRow
                            key={meter.id}
                            meter={meter.id}
                            label={def.label}
                            description={def.description}
                            unit={def.unit}
                            rule={draft.limits.rules[meter.id]}
                            status={limitStatus(draft, meter.id, now)}
                            windowLabel={windowNoun}
                            onChange={(patch) => patchRule(meter.id, patch)}
                            actionsGranted={meterActionsGranted(draft, meter.id)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    // Four dead controls would imply there is something here to
                    // decide. There isn't — nothing this connection can do
                    // draws on any meter.
                    <p className="text-sm text-muted-foreground">
                      Nothing to limit yet. This connection can only look, not change.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 4 && pane === "token" && preset && token && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-lg border border-warning-text/30 bg-warning-text/10 px-4 py-3">
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-warning-text"
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-warning-text">Copy your token now</p>
                    <p className="text-xs text-warning-text/90">
                      This is the only time we'll show it. If you lose it, you'll have to make a
                      new one — the old one stops working.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <CopyField
                    value={token}
                    label="Access token"
                    ariaLabel="Copy access token"
                    monospace
                    toastLabel="Token"
                  />
                  {tokenExpiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expires {format(new Date(tokenExpiresAt), "d MMM yyyy")} ({TOKEN_TTL_DAYS}{" "}
                      days).
                    </p>
                  )}
                </div>

                {snippet && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-foreground">
                      {snippet.filename
                        ? `Add this to ${preset.label}`
                        : `Paste these into ${preset.label}`}
                    </p>
                    <ConfigSnippetBlock
                      filename={snippet.filename}
                      code={snippet.code}
                      pairs={snippet.pairs}
                    />
                  </div>
                )}
              </div>
            )}

            {step === 4 && pane === "oauth_summary" && preset && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <AgentAvatar monogram={preset.monogram} brandHex={preset.brandHex} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {preset.label} will ask you to approve this
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You'll approve it in {preset.label}, then come back here.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border px-4 py-4">
                  <p className="text-sm font-medium text-foreground">What it's asking for</p>
                  <p className="text-sm text-muted-foreground">{accessSummaryLine(draft)}</p>
                  {!writeAccess && (
                    <p className="text-sm text-muted-foreground">It can't change anything yet.</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={switchToToken}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Set it up with a token instead
                </button>
              </div>
            )}

            {step === 4 && pane === "oauth_waiting" && preset && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground" role="status" aria-live="polite">
                    Waiting for {preset.label}…
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {elapsed}s — approve it in {preset.label}, this page will catch up on its own.
                  </p>
                  {/* The one place a fake OAuth handshake could pass as a real
                      one. Every other simulated thing in this prototype says
                      so out loud (the connections list footer, `simulated:
                      true` on every record) — this pane must too. */}
                  <p className="text-xs text-muted-foreground">
                    Prototype — this approval is simulated and completes on its own.
                  </p>
                </div>
                {/* Visible from the first frame, not after a timeout: a waiting
                    pane with no way out is a dead end whether it lasts three
                    seconds or three minutes. */}
                <button
                  type="button"
                  onClick={switchToToken}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Set it up with a token instead
                </button>
              </div>
            )}

            {step === 4 && pane === "done" && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-success-text" />
                <p className="text-sm font-medium text-foreground">{connectedName} is connected.</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  You can change what it can see, what it can do, and its limits at any time — or
                  cut it off entirely.
                </p>
              </div>
            )}
          </div>

          {/* ---- Footer (pinned) ---- */}
          <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-between">
            {step === 1 && (
              <>
                <Button type="button" variant="ghost" onClick={requestClose}>
                  Cancel
                </Button>
                <Button type="button" disabled={!step1Complete} onClick={() => setStep(2)}>
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                  <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button type="button" onClick={handleCreate}>
                  Create connection
                </Button>
              </>
            )}

            {step === 4 && pane === "token" && (
              // One button, deliberately. Anything else here is a way to lose
              // the token.
              <Button type="button" className="sm:ml-auto" onClick={() => setPane("done")}>
                I've copied it
              </Button>
            )}

            {step === 4 && pane === "oauth_summary" && preset && (
              <Button
                type="button"
                className="sm:ml-auto"
                onClick={() => setPane("oauth_waiting")}
              >
                Connect {preset.label}
              </Button>
            )}

            {step === 4 && pane === "done" && (
              <>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
                <Button type="button" onClick={finishOpen}>
                  Open connection
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Steps 1-3 only. Past Create there is a real record, so "nothing's been
          created yet" would stop being true. */}
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this connection?</AlertDialogTitle>
            <AlertDialogDescription>
              Nothing's been created yet. What you've set up here will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false);
                onOpenChange(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
