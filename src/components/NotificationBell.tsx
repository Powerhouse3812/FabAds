import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Wand2, X } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { bootstrapConnector } from "@/connector/bootstrap";
import { useConnectorAudit } from "@/connector/auditStore";
import { useConnectorConnections } from "@/connector/connectionsStore";
import { getAgentPreset } from "@/connector/catalogue";
import { AgentAvatar } from "@/connector/components/AgentAvatar";
import type { AgentKind, AuditOutcome, ConnectorAuditEntry } from "@/connector/model";
import { useBatches } from "@/genie6/lib/genieRunStore";
import { batchStatus, type RunBatch } from "@/genie6/lib/genieRunTypes";

/* ------------------------------------------------------------------ */
/*  NotificationBell — the connector audit log, condensed                */
/*                                                                      */
/*  This popover is a thin, recent-8 view onto the SAME data as the     */
/*  full "Activity" roll-up at /settings?tab=connector&view=activity —  */
/*  every row here is a `ConnectorAuditEntry` from `useConnectorAudit`, */
/*  the one hook that store exports (see auditStore.ts — a second hook  */
/*  that constructs its own return value reintroduces the getSnapshot   */
/*  infinite loop that once white-screened this repo).                  */
/*                                                                      */
/*  SIMULATED. Every `ConnectorAuditEntry` carries `simulated: true` —  */
/*  nothing rendered here ever reached a real system. That is a         */
/*  property of the data, not something this component needs to argue  */
/*  for separately.                                                     */
/*                                                                      */
/*  There used to be a second "Notifications" tab here. It was a        */
/*  permanently empty state pretending something would eventually       */
/*  arrive — no code path ever populated it. Removed rather than        */
/*  reworded: a tab that can never have content is a lie in the UI.     */
/*  With only one tab left, the tab strip itself is gone too — the      */
/*  header goes straight into the feed.                                 */
/* ------------------------------------------------------------------ */

interface NotificationBellProps {
  /** compact = icon-only in the collapsed rail */
  compact?: boolean;
}


/** Recent-8, matching the roll-up's own "most recent" framing rather than
 *  trying to be a second full table crammed into a popover. */
const MAX_VISIBLE = 8;

/** Short status word for the rows that matter. `allowed` gets no word at
 *  all — a feed where every successful read shouts for attention next to a
 *  genuine refusal is the exact failure this column exists to avoid. */
const OUTCOME_LABEL: Record<AuditOutcome, string | null> = {
  allowed: null,
  blocked_permission: "Blocked",
  blocked_limit: "Blocked",
  error: "Failed",
};

/** Severity colour per outcome, kept in lockstep with `OUTCOME_CONFIG` in
 *  `src/connector/components/ActivityTable.tsx` — that table is the source of
 *  truth and this popover is a condensed view of the same rows. Painting every
 *  non-allowed row red here told the user a permission refusal (the guardrail
 *  they configured, working) was as serious as a limit block or a failure. Two
 *  surfaces disagreeing about the severity of one event is worse than either
 *  choice on its own. */
const OUTCOME_CLASS: Record<AuditOutcome, string> = {
  allowed: "",
  blocked_permission: "text-warning-text",
  blocked_limit: "text-error-text",
  error: "text-error-text",
};

const ALL_AGENTS = "all";

/**
 * §16 — "The prototype shows generation started · in progress · done. Every
 * one of them carries a Genie logo, so a single glance tells the user this
 * notification is Genie's — without reading it." Derived from useBatches()'s
 * CURRENT state (there's no persisted notification log for batches) — each
 * batch contributes exactly one row reflecting where it stands right now,
 * newest batch first (the store's own order).
 */
type GenieNotificationTone = "info" | "success" | "warning" | "error";

interface GenieNotification {
  id: string;
  label: string;
  detail: string;
  tone: GenieNotificationTone;
  at: number;
  href: string;
}

function genieNotificationFor(batch: RunBatch): GenieNotification {
  const status = batchStatus(batch);
  const doneCount = batch.items.filter((i) => i.status === "done").length;
  let label: string;
  let tone: GenieNotificationTone;
  if (status === "running") {
    // The two "in-flight" kinds §16 asks for: nothing finished yet vs. partway.
    label = doneCount === 0 ? "Generation started" : "Generation in progress";
    tone = "info";
  } else if (status === "done") {
    label = "Generation done";
    tone = "success";
  } else if (status === "partial") {
    label = "Generation done — some items failed";
    tone = "warning";
  } else if (status === "failed") {
    label = "Generation failed";
    tone = "error";
  } else {
    label = "Generation cancelled";
    tone = "warning";
  }
  const firstOutputId = batch.items.find((i) => i.outputId)?.outputId;
  return {
    id: `genie-${batch.batchId}`,
    label,
    detail: batch.label,
    tone,
    at: batch.createdAt,
    href: firstOutputId ? `/iq/genie6/library?ad=${firstOutputId}` : "/iq/genie6/library",
  };
}

const GENIE_NOTIFICATION_CLASS: Record<GenieNotificationTone, string> = {
  info: "text-muted-foreground",
  success: "text-primary",
  warning: "text-warning-text",
  error: "text-error-text",
};

/** Recent-3 — this is a glance strip, not a second full log; "See all
 *  events" below still covers the connector audit trail. */
const MAX_GENIE_VISIBLE = 3;

export function NotificationBell({ compact = false }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [agentFilter, setAgentFilter] = useState<AgentKind | typeof ALL_AGENTS>(ALL_AGENTS);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  /**
   * This bell renders in the global nav on EVERY page, but `ConnectorPanel` —
   * which lives behind /settings — used to be the only caller of the seed. So
   * a cold browser showed "Nothing yet" and no badge everywhere, and the log
   * sprang into existence the moment you happened to open Settings. A surface
   * that reads a store has to be willing to seed it. `bootstrapConnector` is
   * latched and per-store guarded, so the second caller is free (and its own
   * docblock invites exactly this).
   */
  useEffect(() => {
    bootstrapConnector();
  }, []);

  const { entries } = useConnectorAudit();
  const { auditLastSeenAt } = useConnectorConnections();

  // §16 — Genie's own notification rows, always real (driven off the run
  // store), rendered in the same panel as the connector activity feed below.
  const genieBatches = useBatches();
  const genieNotifications = useMemo(
    () => genieBatches.slice(0, MAX_GENIE_VISIBLE).map(genieNotificationFor),
    [genieBatches],
  );

  /**
   * Distinct agents present in the log, in first-seen order (entries are
   * already newest-first, so this reads as "most recently active agent
   * first"). An "AI agents only" toggle would be a no-op here — every
   * `ConnectorAuditEntry` comes from a connected agent by construction —
   * so the only filter axis worth offering is WHICH agent.
   */
  const agentKinds = useMemo(() => {
    const seen = new Set<AgentKind>();
    const ordered: AgentKind[] = [];
    for (const entry of entries) {
      if (!seen.has(entry.agentKind)) {
        seen.add(entry.agentKind);
        ordered.push(entry.agentKind);
      }
    }
    return ordered;
  }, [entries]);

  const visibleEntries = useMemo(() => {
    const filtered =
      agentFilter === ALL_AGENTS ? entries : entries.filter((e) => e.agentKind === agentFilter);
    return filtered.slice(0, MAX_VISIBLE);
  }, [entries, agentFilter]);

  /**
   * Unread = blocked/failed events since the last time the roll-up page was
   * opened. Deliberately excludes `allowed` — counting every successful
   * read would sit permanently near the 400-entry cap and mean nothing;
   * the rows worth surfacing unread are the ones that need a look.
   *
   * `auditLastSeenAt === null` (never visited the roll-up) treats every
   * non-allowed entry as unread rather than showing a false zero.
   */
  const unreadCount = useMemo(() => {
    // Compared as INSTANTS, not as strings. Every writer happens to emit
    // canonical `toISOString()` today, which sorts lexicographically the same
    // way — but nothing enforces that: `markAuditSeen(at)` takes any string,
    // and sanitize only checks `typeof === "string"`. A second-precision or
    // offset stamp ("…T12:00:00Z", "…+05:30") makes string `>` disagree with
    // the identical count ConnectorPanel renders on the rail from the same
    // two inputs. Two badges for one number must not be able to differ.
    const since = auditLastSeenAt ? Date.parse(auditLastSeenAt) : null;
    return entries.filter((e) => {
      if (e.outcome === "allowed") return false;
      if (since === null || !Number.isFinite(since)) return true;
      const at = Date.parse(e.at);
      return Number.isFinite(at) && at > since;
    }).length;
  }, [entries, auditLastSeenAt]);

  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  // Deliberately NOT calling `markAuditSeen()` anywhere in this component.
  // Opening this popover is a glance, not a review — `auditLastSeenAt` is
  // owned by the full roll-up at /settings?tab=connector&view=activity
  // (ConnectorPanel calls `markAuditSeen()` when that view mounts), and
  // letting a quick peek here silently clear the unread count would make
  // the badge lie about whether anything was actually reviewed.


  function handleSeeAll() {
    setOpen(false);
    navigate("/settings?tab=connector&view=activity");
  }

  const trigger = (
    <button
      type="button"
      className={cn(
        "relative flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors",
        compact ? "w-10 h-10" : "w-9 h-9"
      )}
      aria-label="Notifications"
    >
      <Bell className={cn(compact ? "h-5 w-5" : "h-4 w-4")} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold leading-none text-destructive-foreground">
          {unreadLabel}
        </span>
      )}
    </button>
  );

  // Container branch ONLY — the panel body below is shared verbatim between the
  // desktop Popover and the mobile Sheet, so the connector audit feed, filters
  // and unread logic can never drift between the two. A phone viewport is 375px
  // and this popover is a fixed 340px, so after Radix's collision padding it
  // clips; below `md` it becomes a bottom sheet instead.
  const panel = (
    <>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Activity</p>
            {/* Said here, not just in a code comment. ConnectorPanel carries
                the prototype disclaimer, but this popover opens from the
                global nav on EVERY page — a user can read "Tried to publish
                'Winter Sale'" and "Blocked" without ever going near Settings.
                Fabricated events that look like a real audit trail have to
                admit it where they are read. */}
            <p className="text-[10px] leading-tight text-muted-foreground">
              Simulated — this prototype stores activity in this browser only.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* §16 — Genie notifications. Own visual slot (Wand2 in a lime-tinted
            chip, not just a word) so these read as Genie's at a glance, same
            spirit as AgentAvatar's monogram chip below but never confusable
            with a connected agent. Mounted regardless of whether the
            connector feed below is empty — the two are independent. */}
        {genieNotifications.length > 0 && (
          <div className="divide-y divide-border border-b border-border bg-background">
            {genieNotifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(n.href);
                }}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
              >
                <span
                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15"
                  aria-hidden="true"
                >
                  <Wand2 className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[12px] font-medium leading-snug", GENIE_NOTIFICATION_CLASS[n.tone])}>
                    {n.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 truncate">
                    {n.detail}
                  </p>
                  <time
                    dateTime={new Date(n.at).toISOString()}
                    title={new Date(n.at).toLocaleString()}
                    className="block text-[10px] text-muted-foreground/60 mt-1"
                  >
                    {formatDistanceToNowStrict(n.at, { addSuffix: true })}
                  </time>
                </div>
              </button>
            ))}
          </div>
        )}

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="h-7 w-7 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nothing yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Activity appears here once a connected app makes its first request.
            </p>
          </div>
        ) : (
          <>
            {agentKinds.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 border-b border-border bg-background">
                <button
                  type="button"
                  onClick={() => setAgentFilter(ALL_AGENTS)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    // NOT `bg-g6-primary-active`: that token is only defined
                    // under `[data-theme]`, which the app shell never sets
                    // outside /iq/genie6/*. Here the var resolved to nothing,
                    // so the SELECTED chip rendered transparent with white
                    // text — invisible on the light popover. `primary` is the
                    // app-wide token and is defined on every route.
                    agentFilter === ALL_AGENTS
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  All apps
                </button>
                {agentKinds.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setAgentFilter(kind)}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                      agentFilter === kind
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {getAgentPreset(kind).label}
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-[340px] overflow-y-auto divide-y divide-border">
              {visibleEntries.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No activity from this app yet.
                </p>
              ) : (
                visibleEntries.map((entry) => <ActivityRow key={entry.id} entry={entry} />)
              )}
            </div>

            <button
              type="button"
              onClick={handleSeeAll}
              className="block w-full px-4 py-2.5 text-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors border-t border-border"
            >
              {/* The count is only claimed when it describes what is actually
                  above it. With an agent filter on, this button used to read
                  "See all 400 events" directly under "No activity from this
                  app yet." — and the roll-up it opens drops the filter
                  anyway, so the number described neither this list nor the
                  next one. Filtered, it just says where it goes. */}
              {agentFilter === ALL_AGENTS ? `See all ${entries.length} events` : "See all activity"}
            </button>
          </>
        )}
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        {/* Built-in X suppressed — the panel header already has an explicit
            close, and two close controls in one sheet is noise. Sheets in this
            app never dismiss on outside click, so an explicit one is required. */}
        <SheetContent
          side="bottom"
          className="flex max-h-[75dvh] flex-col gap-0 rounded-t-2xl p-0 [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Activity</SheetTitle>
          {panel}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        // min() so even a narrow desktop window can't clip it.
        className="w-[min(340px,calc(100vw-1.5rem))] p-0 shadow-lg border border-border rounded-xl overflow-hidden"
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}

function ActivityRow({ entry }: { entry: ConnectorAuditEntry }) {
  const preset = getAgentPreset(entry.agentKind);
  const statusLabel = OUTCOME_LABEL[entry.outcome];
  const statusClass = OUTCOME_CLASS[entry.outcome];

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
      <AgentAvatar monogram={preset.monogram} brandHex={preset.brandHex} size="sm" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-foreground leading-snug line-clamp-2">
          {entry.detail}
        </p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 truncate">
          {entry.connectionName} · {entry.moduleLabel ?? "Account"}
        </p>
        <time
          dateTime={entry.at}
          title={new Date(entry.at).toLocaleString()}
          className="block text-[10px] text-muted-foreground/60 mt-1"
        >
          {formatDistanceToNowStrict(entry.at, { addSuffix: true })}
        </time>
      </div>
      {statusLabel && (
        <span className={cn("mt-1 shrink-0 text-[10px] font-semibold", statusClass)}>{statusLabel}</span>
      )}
    </div>
  );
}
