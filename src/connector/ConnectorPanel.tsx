/**
 * Connector (AI access) — the panel that lives inside Settings' `?tab=connector`.
 *
 * Owns the three views and the routing between them. Two extra search params
 * layer on top of the tab param:
 *   `?tab=connector`                      → the list
 *   `?tab=connector&connection=<id>`      → one connection's detail
 *   `?tab=connector&view=activity`        → the cross-connection roll-up
 *
 * WHY IN-PAGE VIEW SWAP RATHER THAN A SHEET OR A NESTED ROUTE
 * A sheet is 480–560px, which stacks the permission row into three lines per
 * module — 27 lines of scroll inside a focus trap, with the limits card that
 * caps those very actions below the fold. And a nested route would mean the
 * tab identity lives in a query param while the sub-view lives in a path
 * segment: two competing answers to "where am I". The swap gets full panel
 * width, deep-linkability (an admin can paste "here is exactly what Claude
 * can do"), working browser Back, and the Settings tab bar stays visible so
 * the user never loses their place.
 *
 * Store hooks are called ONCE here and the results are passed down as plain
 * props. Every child is presentational. That is deliberate: each store
 * exposes exactly one hook, and calling them per-child would multiply
 * subscriptions for no benefit.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { ConnectorAuditEntry } from "@/connector/model";
import { bootstrapConnector } from "@/connector/bootstrap";
import {
  clearAllConnections,
  markAuditSeen,
  useConnectorConnections,
} from "@/connector/connectionsStore";
import { useConnectorAudit } from "@/connector/auditStore";
import { ConnectionsList } from "@/connector/components/ConnectionsList";
import { ConnectionDetail } from "@/connector/components/ConnectionDetail";
import { ConnectWizard } from "@/connector/components/ConnectWizard";
import { ConnectorActivityView } from "@/connector/components/ConnectorActivityView";

type SubView = "connections" | "activity";

export function ConnectorPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { toast } = useToast();

  // Idempotent, and latched inside bootstrap itself so StrictMode's double
  // mount in development can't duplicate the seed.
  //
  // `seeded` is not decoration. Seeding happens in an effect, so the FIRST
  // render of a cold browser sees zero connections — and the stale-id guard
  // below runs in that same commit and would bounce a perfectly valid deep
  // link back to the list before the seed had a chance to land. Deep-linking
  // to one connection is the whole reason this view is URL-backed, and the
  // first visit is exactly when someone follows a pasted link.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    bootstrapConnector();
    setSeeded(true);
  }, []);

  const { connections } = useConnectorConnections();
  const { entries } = useConnectorAudit();

  const connectionId = searchParams.get("connection");
  const subView: SubView = searchParams.get("view") === "activity" ? "activity" : "connections";

  const active = useMemo(
    () => (connectionId ? connections.find((c) => c.id === connectionId) : undefined),
    [connections, connectionId],
  );

  /* ── Navigation ─────────────────────────────────────────────── */

  const go = useCallback(
    (next: { connection?: string | null; view?: SubView | null }) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("tab", "connector");
          if (next.connection === null) sp.delete("connection");
          else if (next.connection) sp.set("connection", next.connection);
          if (next.view === null || next.view === "connections") sp.delete("view");
          else if (next.view) sp.set("view", next.view);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const openConnection = useCallback((id: string) => go({ connection: id, view: null }), [go]);
  const backToList = useCallback(() => go({ connection: null, view: null }), [go]);
  const openActivity = useCallback(() => go({ connection: null, view: "activity" }), [go]);

  // A connection id that no longer resolves — a stale bookmark, or the record
  // was deleted in another tab. Fall back to the list rather than rendering an
  // empty shell that looks broken.
  useEffect(() => {
    if (seeded && connectionId && !active) backToList();
  }, [seeded, connectionId, active, backToList]);

  // Seeing the roll-up is what "seen" means; anything else would leave the
  // unread count stuck on.
  useEffect(() => {
    if (subView === "activity") markAuditSeen();
  }, [subView]);

  const handleRaiseLimit = useCallback(
    (entry: ConnectorAuditEntry) => {
      go({ connection: entry.connectionId, view: null });
      // The limits card owns this id; the detail view mounts in the same
      // commit, so defer one frame before scrolling to it.
      requestAnimationFrame(() => {
        document.getElementById("connector-limits")?.scrollIntoView({ block: "start" });
      });
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
    backToList();
    toast({
      title: "Connections cleared",
      description: "Demo data only — this doesn't touch anything real.",
    });
  }, [backToList, toast]);

  /* ── Render ─────────────────────────────────────────────────── */

  if (active) {
    return (
      <div className="px-5 pb-16 pt-5">
        <ConnectionDetail connection={active} onBack={backToList} onDeleted={backToList} />
      </div>
    );
  }

  if (subView === "activity") {
    return (
      <div className="px-5 pb-16 pt-5">
        <ConnectorActivityView
          entries={entries}
          connections={connections.map((c) => ({ id: c.id, name: c.name }))}
          onRaiseLimit={handleRaiseLimit}
          onBack={backToList}
        />
      </div>
    );
  }

  return (
    <div className="px-5 pb-16 pt-5">
      {/* Sub-view switcher. A two-segment control, NOT a second tab strip —
          twelve tabs above a two-tab strip is a hierarchy nobody can parse. */}
      <div
        role="tablist"
        aria-label="Connector views"
        className="mb-5 inline-flex rounded-md border border-border bg-muted p-0.5"
      >
        {(
          [
            { id: "connections" as const, label: "Connections", onSelect: backToList },
            { id: "activity" as const, label: "Activity", onSelect: openActivity },
          ]
        ).map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={subView === s.id}
            onClick={s.onSelect}
            className={cn(
              "rounded px-3 py-1 text-sm transition-colors",
              subView === s.id
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <ConnectionsList
        connections={connections}
        onOpen={openConnection}
        onConnect={() => setWizardOpen(true)}
      />

      {/* Stated plainly rather than hidden: every record here is simulated and
          lives in this browser only. The reset is the honest way to reach the
          zero state, and it persists across reloads by design. */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <span>Prototype — connections and activity are simulated and stored in this browser only.</span>
        {connections.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClearAll}>
            Clear all connections
          </Button>
        )}
      </div>

      <ConnectWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={handleCreated} />
    </div>
  );
}
