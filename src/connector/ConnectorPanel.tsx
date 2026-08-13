/**
 * Connector (AI access) — the panel that lives inside Settings' `?tab=connector`.
 *
 * A Catalogue-style master-detail: a 260px connection rail on the left, one
 * detail surface on the right. Two search params drive it, layered on top of
 * the settings shell's own `?tab=`:
 *   `?tab=connector`                 → first connection, auto-selected
 *   `?tab=connector&connection=<id>` → that connection's detail
 *   `?tab=connector&view=activity`   → the cross-connection roll-up
 *
 * WHY THE RAIL REPLACED THE TABLE
 * The old landing was a full-width table that a row click REPLACED with the
 * detail — so moving between two connections meant detail → back → list →
 * detail, and the list you came from vanished while you worked. The rail keeps
 * every app one click away and never leaves the screen, which is the whole
 * point of the pattern in Catalogue and Creative Library. What the table did
 * better was letting you compare six connections at a glance across four
 * columns; the rail buys that back partially by carrying status and last-used
 * on every row, and that is a deliberate trade, not an oversight.
 *
 * WHY "ALL ACTIVITY" IS A RAIL ROW AND NOT A SEPARATE VIEW
 * It used to be a two-segment Connections/Activity control above the table.
 * With a permanent rail that control would be a second navigation model
 * stacked on the first. Making it a pinned row at the top of the rail means
 * one list answers "where am I", the layout never changes shape, and the
 * roll-up keeps the rail visible beside it.
 *
 * AUTO-SELECT, NOT AN EMPTY RIGHT PANE
 * `CatalogueFinder` pre-selects its first item so the detail pane is never
 * blank on arrival, and this follows it. The URL is left alone while doing so
 * — an auto-selection is not a navigation the user made, and writing it into
 * the address bar would put an id in a link they never chose.
 *
 * Store hooks are called ONCE here and passed down as plain props; every child
 * is presentational. Each store exposes exactly one hook, and subscribing
 * per-child would multiply subscriptions for nothing.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ConnectorAuditEntry } from "@/connector/model";
import { bootstrapConnector } from "@/connector/bootstrap";
import {
  clearAllConnections,
  markAuditSeen,
  useConnectorConnections,
} from "@/connector/connectionsStore";
import { clearAudit, useConnectorAudit } from "@/connector/auditStore";
import { ConnectionRail } from "@/connector/components/ConnectionRail";
import { ConnectionDetail } from "@/connector/components/ConnectionDetail";
import { ConnectWizard } from "@/connector/components/ConnectWizard";
import { ConnectorActivityView } from "@/connector/components/ConnectorActivityView";

export function ConnectorPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { toast } = useToast();

  /** The right pane's scroll container — one node reused across every
   *  selection, so anything that swaps what it contains has to say where the
   *  viewport should end up. */
  const paneRef = useRef<HTMLDivElement>(null);

  // Seeding happens in an effect, so the FIRST render of a cold browser sees
  // zero connections. `seeded` gates the stale-id guard below, which would
  // otherwise bounce a perfectly valid deep link back to the list before the
  // seed had a chance to land — and the first visit is exactly when someone
  // follows a pasted link.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    bootstrapConnector();
    setSeeded(true);
  }, []);

  const { connections, auditLastSeenAt } = useConnectorConnections();
  const { entries } = useConnectorAudit();

  const connectionId = searchParams.get("connection");
  const activityActive = searchParams.get("view") === "activity";

  const explicit = useMemo(
    () => (connectionId ? connections.find((c) => c.id === connectionId) : undefined),
    [connections, connectionId],
  );

  /**
   * The connection the right pane shows. Falls back to the first in the list
   * so the pane is never blank — but ONLY when the user hasn't asked for the
   * activity view, which is a deliberate choice of "no connection".
   */
  const active = activityActive ? undefined : (explicit ?? connections[0]);

  /**
   * Unread = blocked and failed events since the roll-up was last opened.
   * Counting successful reads too would peg the badge at the store's 400-entry
   * cap within a day and make it meaningless — the number has to mean "things
   * that went wrong and you haven't looked at them".
   */
  const unreadCount = useMemo(() => {
    const since = auditLastSeenAt ? Date.parse(auditLastSeenAt) : null;
    return entries.filter((e) => {
      if (e.outcome === "allowed") return false;
      if (since === null || !Number.isFinite(since)) return true;
      const at = Date.parse(e.at);
      return Number.isFinite(at) && at > since;
    }).length;
  }, [entries, auditLastSeenAt]);

  /* ── Navigation ─────────────────────────────────────────────── */

  const go = useCallback(
    (
      next: { connection?: string | null; view?: "activity" | null; section?: string | null },
      /**
       * `replace` is for CORRECTIONS, not travel. Stripping an id that no
       * longer resolves, or landing on the list because the record you were
       * reading is gone, is the app fixing an invalid URL — pushing that is
       * how you build a back-button trap: Back returns to the bad URL, the
       * guard effect fires again, and it pushes a fresh entry forward. The
       * user can never get past it, and history grows on every press.
       */
      opts: { replace?: boolean } = {},
    ) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("tab", "connector");
          if (next.connection === null) sp.delete("connection");
          else if (next.connection) sp.set("connection", next.connection);
          if (next.view === null) sp.delete("view");
          else if (next.view) sp.set("view", next.view);
          // `section` belongs to ConnectionDetail's tab strip. Cross-navigating
          // to a different connection must not carry the previous one's tab.
          if (next.section === null) sp.delete("section");
          else if (next.section) sp.set("section", next.section);
          return sp;
        },
        { replace: opts.replace === true },
      );
    },
    [setSearchParams],
  );

  const openConnection = useCallback(
    (id: string) => go({ connection: id, view: null, section: null }),
    [go],
  );
  const openActivity = useCallback(
    () => go({ connection: null, view: "activity", section: null }),
    [go],
  );
  /**
   * Every live caller of this is a correction, never a user's own "go back":
   * the stale-id guard, "Reset demo data", and a connection being
   * deleted out from under the detail pane. It is also handed to the children
   * as `onBack`, which both of them deliberately ignore — the rail is the back
   * affordance now. So it replaces rather than pushes. See `go`.
   */
  const backToList = useCallback(
    () => go({ connection: null, view: null, section: null }, { replace: true }),
    [go],
  );

  // A `connection` id that no longer resolves — a stale bookmark, or a record
  // deleted in another tab. Strip it rather than rendering an empty shell; the
  // auto-select fallback then takes over.
  useEffect(() => {
    if (seeded && connectionId && !explicit) backToList();
  }, [seeded, connectionId, explicit, backToList]);

  // Opening the roll-up IS reviewing the log — that is what marks it seen, and
  // what the bell's unread badge reads back.
  useEffect(() => {
    if (activityActive) markAuditSeen();
  }, [activityActive, entries.length]);

  /**
   * From the roll-up's "Raise the limit" — a CROSS-connection jump, so it
   * changes both the connection and the tab. Limits is no longer the detail's
   * default tab, so a bare scroll would be a no-op against an unmounted node.
   *
   * Note what this does NOT do: it does not scroll. `ConnectionDetail`'s
   * `goToLimits` only runs from click handlers inside that component, and
   * nothing there watches `section` on mount — so arriving this way puts the
   * Limits tab up but leaves the viewport wherever it was. Hence the scroll
   * reset below: the right pane is one long-lived scroll container reused
   * across every selection, and without this the user lands deep inside a new
   * connection at the roll-up's old offset, quite possibly below the very card
   * this button promised to take them to.
   */
  const handleRaiseLimit = useCallback(
    (entry: ConnectorAuditEntry) => {
      go({ connection: entry.connectionId, view: null, section: "limits" });
      paneRef.current?.scrollTo({ top: 0 });
    },
    [go],
  );

  const handleCreated = useCallback(
    (id: string) => {
      setWizardOpen(false);
      openConnection(id);
    },
    [openConnection],
  );

  const handleClearAll = useCallback(() => {
    clearAllConnections();
    // `clearAudit()` (no argument) wipes the WHOLE log. That looks like the
    // exact thing auditStore.ts's header says never to do — but that comment
    // is about `deleteConnection()` leaving one connection's history behind
    // so its record still explains itself. This button is a reset of the
    // entire demo surface, not the removal of one record whose history has
    // to outlive it: the rail is about to say "No apps connected yet", so a
    // roll-up still listing 28 events from apps that no longer exist isn't
    // surviving evidence, it's a stale leftover contradicting the empty rail.
    clearAudit();
    backToList();
    toast({
      title: "Demo data reset",
      description: "Connections and activity cleared. Nothing real was touched.",
    });
  }, [backToList, toast]);

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <ConnectionRail
        connections={connections}
        selectedId={active?.id ?? null}
        activityActive={activityActive}
        onSelect={openConnection}
        onSelectActivity={openActivity}
        onConnect={() => setWizardOpen(true)}
        unreadCount={unreadCount}
      />

      {/* The right pane owns its own scroll so the rail stays put while the
          detail scrolls — the whole reason the panel is a split and not a
          single tall page. */}
      <div ref={paneRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 pb-16 pt-5">
          {activityActive ? (
            <ConnectorActivityView
              entries={entries}
              connections={connections.map((c) => ({ id: c.id, name: c.name }))}
              onRaiseLimit={handleRaiseLimit}
              onBack={backToList}
            />
          ) : active ? (
            <ConnectionDetail
              connection={active}
              onBack={backToList}
              onDeleted={backToList}
            />
          ) : (
            /* Reachable only with zero connections — auto-select covers every
               other case. The rail's "Connect an app" is the primary CTA, so
               this repeats it rather than inventing a second one. */
            <div className="rounded-lg border border-dashed border-border/60 bg-card/40 p-12 text-center">
              <p className="text-sm font-medium text-foreground">No apps connected yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Connect Claude, ChatGPT, Cursor or any tool that speaks MCP, and ask it
                things like &ldquo;which adsets spent the most last week?&rdquo; — in plain
                English. You choose exactly what it can see and do.
              </p>
              <Button className="mt-5" onClick={() => setWizardOpen(true)}>
                Connect an app
              </Button>
            </div>
          )}

          {/* Stated plainly rather than hidden: every record here is simulated
              and lives in this browser only. The reset is the honest way to
              reach the zero state, and it persists across reloads by design. */}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span>
              Prototype — connections and activity are simulated and stored in this browser only.
            </span>
            {connections.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClearAll}>
                Reset demo data
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConnectWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={handleCreated} />
    </div>
  );
}
