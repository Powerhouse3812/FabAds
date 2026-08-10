import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { ReadTierControl } from "@/connector/components/ReadTierControl";
import { WriteActionRow } from "@/connector/components/WriteActionRow";
import {
  CONNECTOR_MODULE_IDS,
  EXCLUDED_MODULE_NOTES,
  getModuleDef,
  getWriteAction,
} from "@/connector/catalogue";
import {
  accessSummaryLine,
  buildDisablePlanForAction,
  buildDisablePlanForRead,
  buildEnablePlan,
  groupedGrants,
} from "@/connector/selectors";
import {
  applyDisableToConnection,
  applyEnableToConnection,
  withAllReadTiers,
  withDisablePlanApplied,
  withReadTier,
} from "@/connector/connectionsStore";
import type {
  ConnectorConnection,
  ConnectorModuleId,
  DisablePlan,
  EnablePlan,
  ReadTier,
  WriteActionId,
} from "@/connector/model";

/**
 * PermissionMatrix — the whole permission grant for one connection: nine module
 * rows across three group cards, each with a read tier and an expandable list of
 * named write actions.
 *
 * WHY ONE COMPONENT SERVES BOTH THE WIZARD AND THE DETAIL PAGE
 * The connect wizard edits a DRAFT connection that lives in local React state —
 * no store record exists until the user presses Create — while the detail page
 * edits a saved record. Both are a plain `ConnectorConnection`, so both go
 * through this one component and through the same PURE appliers exported by
 * `connectionsStore` (`applyEnableToConnection`, `applyDisableToConnection`,
 * `withReadTier`, `withAllReadTiers`, `withDisablePlanApplied`). The component
 * never touches the store itself; it hands the FULL next connection to
 * `onChange` and the caller decides whether that means `setState` or `persist`.
 * Two implementations of "what does enabling this action imply" would drift, and
 * the one users meet first is the wizard's.
 *
 * WHY BLOCK, NOT DISABLE
 * When an action's prerequisites are unmet the toggle is REFUSED and an amber
 * note appears under that exact row naming every consequence, with one button
 * that does the whole grant. It is not greyed out: a `disabled` control is
 * skipped by screen-reader form navigation, and it states a refusal with no
 * reason and no route forward. Clicking a blocked toggle is precisely HOW the
 * user gets the explanation. The reverse direction is blocked the same way —
 * turning a prerequisite off while dependents are on would leave a grant that
 * references a permission the connection no longer has, and an inconsistent
 * grant is worse than a refused one.
 *
 * WHY COLLAPSED BY DEFAULT, ALWAYS
 * Every row mounts collapsed and nothing ever auto-expands. Nine modules whose
 * heights change between visits destroys the muscle memory of where a module
 * sits — the user relearns the list every time. Expansion is local, transient
 * and multi-select: opening Reports does not close Launch.
 *
 * WHY "SET ALL TO" NEVER TOUCHES WRITE ACTIONS
 * It calls `withAllReadTiers`, which is read tiers only. A bulk control that can
 * silently grant write access is exactly the silent grant this entire design
 * exists to prevent — every write action must be granted by name, once, with its
 * consequences visible. Setting everything to Off does drop write actions,
 * because the universal invariant makes write-without-read impossible, and that
 * direction only ever removes power (and is confirmed first).
 *
 * AUTO-SAVE, NO DIRTY BAR
 * Every change calls `onChange` immediately and fires a toast with an Undo that
 * restores the pre-change connection captured in the handler closure. The
 * alternative — an unsaved-changes bar over nine modules — lets a user wander
 * off believing they granted or revoked WRITE access when they did neither.
 */

export interface PermissionMatrixProps {
  /** A real store record OR a draft held in wizard local state. Both go
   *  through the same code path so the two can never diverge. */
  connection: ConnectorConnection;
  /** Called with the FULL next connection. Wizard sets local state; the
   *  detail page persists via the store. */
  onChange: (next: ConnectorConnection) => void;
  readOnly?: boolean;
  /**
   * Why it is read-only, in the user's words. `readOnly` has two callers with
   * two different reasons: the detail page uses it for a revoked connection,
   * the wizard uses it to preview a preset the user hasn't chosen to customise
   * yet. Hardcoding the revoked sentence here told someone creating a brand
   * new connection that it "was revoked" — so the reason belongs to the caller.
   * Pass `null` to render no note (the wizard states its own, below the card).
   */
  readOnlyNote?: string | null;
  /** Compact spacing for the wizard modal. */
  dense?: boolean;
  className?: string;
}

/**
 * ONE block at a time. String discriminant, not a boolean literal: this project
 * compiles with `"strict": false`, so `strictNullChecks` is off and TypeScript
 * will not narrow a union discriminated by `true` / `false`. Every read below
 * branches on `kind`.
 */
type BlockState =
  | { kind: "enable"; actionId: WriteActionId; plan: EnablePlan }
  | { kind: "disableAction"; actionId: WriteActionId; plan: DisablePlan }
  | { kind: "disableRead"; moduleId: ConnectorModuleId; plan: DisablePlan }
  | null;

const TIER_LABEL: Record<ReadTier, string> = {
  off: "Off",
  view: "View",
  view_export: "View + Export",
};

/**
 * Counted, not templated. `count` is every consequence PLUS the action the user
 * actually asked for, because "Turn on all three" has to include the thing they
 * clicked or the number contradicts the list above it. Past four we stop
 * counting out loud — a specific number that nobody verifies is worse than an
 * honest "all of them".
 */
function enableConfirmLabel(plan: EnablePlan): string {
  const count = plan.enablesWrites.length + plan.raisesReads.length + 1;
  if (count === 2) return "Turn on both";
  if (count === 3) return "Turn on all three";
  if (count === 4) return "Turn on all four";
  return "Turn them all on";
}

function disableConfirmLabel(plan: DisablePlan): string {
  return `Turn off all ${plan.alsoDisables.length + 1}`;
}

/** The block note's body. Identical markup to WriteActionRow's, because the
 *  read-tier block is the same refusal at a different anchor point and must not
 *  read as a different kind of event. */
function BlockNote({
  id,
  summary,
  confirmLabel,
  onConfirm,
  onDismiss,
}: {
  id: string;
  summary: string[];
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      id={id}
      role="alert"
      className={cn(
        "mb-3 rounded-md border border-warning-text/30 bg-warning-text/10 p-3",
        "text-xs text-warning-text",
      )}
    >
      <ul className="space-y-1">
        {summary.map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}

/** Every consequence, one line each. Never truncated — this is a permission
 *  grant, so a "+2 more" would turn an informed change back into a silent one. */
function summaryList(lines: string[]) {
  if (lines.length === 0) return undefined;
  return (
    <ul className="mt-1 space-y-0.5">
      {lines.map((line, index) => (
        <li key={`${index}-${line}`}>{line}</li>
      ))}
    </ul>
  );
}

export function PermissionMatrix({
  connection,
  onChange,
  readOnly = false,
  readOnlyNote = "This connection was revoked. Its access is shown as it was.",
  dense = false,
  className,
}: PermissionMatrixProps) {
  const uid = React.useId();
  const { toast } = useToast();

  const [expanded, setExpanded] = React.useState<Set<ConnectorModuleId>>(() => new Set());
  const [block, setBlock] = React.useState<BlockState>(null);
  const [confirmAllOff, setConfirmAllOff] = React.useState(false);

  const groups = groupedGrants(connection);
  const moduleCount = CONNECTOR_MODULE_IDS.length;

  const toggleExpanded = (moduleId: ConnectorModuleId) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  /**
   * One place that commits. Undo restores the connection EXACTLY as it was
   * before this change — captured by the caller before it built `next`, so a
   * multi-step grant undoes as one step rather than leaving the user to
   * reverse four toggles by hand.
   */
  const commit = (
    previous: ConnectorConnection,
    next: ConnectorConnection,
    title: string,
    lines: string[],
  ) => {
    onChange(next);
    setBlock(null);
    toast({
      title,
      description: summaryList(lines),
      action: (
        <ToastAction altText="Undo this permission change" onClick={() => onChange(previous)}>
          Undo
        </ToastAction>
      ),
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Write actions                                                    */
  /* ---------------------------------------------------------------- */

  const handleToggleAction = (actionId: WriteActionId, currentlyOn: boolean) => {
    if (readOnly) return;
    const previous = connection;
    const def = getWriteAction(actionId);
    const moduleLabel = getModuleDef(def.moduleId).label;

    if (!currentlyOn) {
      const plan = buildEnablePlan(connection, actionId);
      // Blocked: change NOTHING. The switch must not move — the note under this
      // row is the whole explanation, and the grant happens only on confirm.
      if (plan.blocked) {
        setBlock({ kind: "enable", actionId, plan });
        return;
      }
      commit(
        previous,
        applyEnableToConnection(connection, plan, actionId),
        `Turned on "${def.label}"`,
        [`${moduleLabel} — nothing else changed`],
      );
      return;
    }

    const plan = buildDisablePlanForAction(connection, actionId);
    if (plan.blocked) {
      setBlock({ kind: "disableAction", actionId, plan });
      return;
    }
    commit(
      previous,
      applyDisableToConnection(connection, [actionId]),
      `Turned off "${def.label}"`,
      [`${moduleLabel} — nothing else changed`],
    );
  };

  const confirmEnable = (actionId: WriteActionId, plan: EnablePlan) => {
    const previous = connection;
    const def = getWriteAction(actionId);
    commit(
      previous,
      applyEnableToConnection(connection, plan, actionId),
      `Turned on "${def.label}" and ${plan.summary.length} more`,
      plan.summary,
    );
  };

  const confirmDisableAction = (actionId: WriteActionId, plan: DisablePlan) => {
    const previous = connection;
    const def = getWriteAction(actionId);
    commit(
      previous,
      withDisablePlanApplied(connection, plan),
      `Turned off "${def.label}" and ${plan.alsoDisables.length} more`,
      plan.summary,
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Read tiers                                                       */
  /* ---------------------------------------------------------------- */

  const handleReadTier = (moduleId: ConnectorModuleId, tier: ReadTier) => {
    if (readOnly) return;
    const previous = connection;
    const label = getModuleDef(moduleId).label;

    // Raising a tier can never break a grant — only Off removes power.
    if (tier !== "off") {
      commit(previous, withReadTier(connection, moduleId, tier), `${label} set to ${TIER_LABEL[tier]}`, []);
      return;
    }

    const plan = buildDisablePlanForRead(connection, moduleId, "off");
    // Anything OUTSIDE this module is a consequence the user has not seen —
    // refuse and anchor the note to the module row that caused it.
    const external = plan.alsoDisables.filter((a) => getWriteAction(a).moduleId !== moduleId);
    if (external.length > 0) {
      setBlock({ kind: "disableRead", moduleId, plan });
      return;
    }

    commit(previous, withReadTier(connection, moduleId, "off"), `${label} set to Off`, plan.summary);
  };

  const confirmDisableRead = (moduleId: ConnectorModuleId, plan: DisablePlan) => {
    const previous = connection;
    const label = getModuleDef(moduleId).label;
    commit(previous, withDisablePlanApplied(connection, plan), `${label} set to Off`, plan.summary);
  };

  /* ---------------------------------------------------------------- */
  /*  Bulk read tier — READ TIERS ONLY                                 */
  /* ---------------------------------------------------------------- */

  const applyAllReadTiers = (tier: ReadTier) => {
    if (readOnly) return;
    const previous = connection;
    commit(
      previous,
      withAllReadTiers(connection, tier),
      `All ${moduleCount} modules set to ${TIER_LABEL[tier]}`,
      tier === "off"
        ? ["Write actions were dropped too — nothing can act on what it can't see"]
        : ["Read access only — no write actions were changed"],
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const blockNoteFor = (actionId: WriteActionId) => {
    if (!block) return null;
    if (block.kind === "enable" && block.actionId === actionId) {
      return {
        summary: block.plan.summary,
        confirmLabel: enableConfirmLabel(block.plan),
        onConfirm: () => confirmEnable(actionId, block.plan),
        onDismiss: () => setBlock(null),
      };
    }
    if (block.kind === "disableAction" && block.actionId === actionId) {
      return {
        summary: block.plan.summary,
        confirmLabel: disableConfirmLabel(block.plan),
        onConfirm: () => confirmDisableAction(actionId, block.plan),
        onDismiss: () => setBlock(null),
      };
    }
    return null;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {readOnly && readOnlyNote !== null ? (
        <p className="text-sm text-muted-foreground">{readOnlyNote}</p>
      ) : null}

      {/* Running sentence + the one bulk control. aria-live so a keyboard user
          hears the roll-up change without hunting for it. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="min-w-0 text-sm text-muted-foreground" aria-live="polite">
          {accessSummaryLine(connection)}
        </p>

        {!readOnly ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                Set all to
                <ChevronDown aria-hidden="true" className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => setConfirmAllOff(true)}>Off</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => applyAllReadTiers("view")}>View</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => applyAllReadTiers("view_export")}>
                View + Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {groups.map((group) => (
        <Card key={group.group}>
          <CardHeader className={cn("relative", dense ? "px-4 py-2.5" : "px-4 py-3")}>
            {/* With three modules expanded the tab distance to the limits
                section is punishing. Visually hidden until focused. */}
            <a
              href="#connector-limits"
              className="sr-only rounded-md focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-10 focus:bg-background focus:px-2 focus:py-1 focus:text-xs focus:font-medium focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Skip to limits
            </a>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.group}
            </h3>
          </CardHeader>

          <CardContent className="divide-y divide-border p-0">
            {group.modules.map((row) => {
              const { def, grant, actions, onCount } = row;
              const Icon = def.icon;
              const labelId = `${uid}-label-${def.id}`;
              const descId = `${uid}-desc-${def.id}`;
              const panelId = `${uid}-panel-${def.id}`;
              const noteId = `${uid}-note-${def.id}`;
              const isOpen = expanded.has(def.id);
              const readBlock =
                block && block.kind === "disableRead" && block.moduleId === def.id ? block : null;

              return (
                <div key={def.id} className="px-4">
                  {/* Collapsed row: exactly TWO tab stops — the ReadTierControl
                      (one, via roving tabindex) and the expand button. Nothing
                      else in here is focusable. */}
                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-x-4 gap-y-2",
                      dense ? "min-h-[3rem] py-2" : "min-h-[3.5rem] py-2.5",
                    )}
                  >
                    <div className="flex min-w-0 basis-full items-start gap-2.5 sm:flex-1 sm:basis-0">
                      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p id={labelId} className="text-sm font-medium text-foreground">
                          {def.label}
                        </p>
                        <p id={descId} className="text-xs text-muted-foreground">
                          {def.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                      <ReadTierControl
                        value={grant.read}
                        onChange={(tier) => handleReadTier(def.id, tier)}
                        moduleLabelId={labelId}
                        describedById={descId}
                        disabled={readOnly}
                        size={dense ? "sm" : "md"}
                        className={cn("w-full", dense ? "sm:w-[13rem]" : "sm:w-[16rem]")}
                      />

                      {actions.length === 0 ? (
                        // Dashboard genuinely has no write actions. A disabled
                        // chevron here would promise something that isn't there.
                        <span className="shrink-0 text-xs text-muted-foreground">Read only</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(def.id)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          // The accessible name carries the summary — without it
                          // a screen-reader user never learns the actions exist.
                          aria-label={`Show ${actions.length} ${actions.length === 1 ? "action" : "actions"} for ${def.label}, ${onCount} currently on`}
                          className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                            onCount === 0 ? "text-muted-foreground" : "text-foreground",
                          )}
                        >
                          <span aria-hidden="true">
                            {onCount === 0
                              ? "No actions"
                              : `${onCount} of ${actions.length} actions on`}
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Read-tier block: anchored to the MODULE row, because the
                      module row is what the user acted on. */}
                  {readBlock ? (
                    <BlockNote
                      id={noteId}
                      summary={readBlock.plan.summary}
                      confirmLabel={disableConfirmLabel(readBlock.plan)}
                      onConfirm={() => confirmDisableRead(def.id, readBlock.plan)}
                      onDismiss={() => setBlock(null)}
                    />
                  ) : null}

                  {isOpen && actions.length > 0 ? (
                    <div id={panelId} className="border-t border-border pb-2 pl-6 pr-0">
                      {actions.map((action) => (
                        <WriteActionRow
                          key={action.id}
                          action={action}
                          checked={grant.write.includes(action.id)}
                          onToggle={() =>
                            handleToggleAction(action.id, grant.write.includes(action.id))
                          }
                          blockNote={blockNoteFor(action.id)}
                          readOnly={readOnly}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Someone comparing this list to the sidebar will notice Copilot is
          missing. Saying it out loud beats letting them guess. */}
      <div className="space-y-1">
        {EXCLUDED_MODULE_NOTES.map((note) => (
          <p key={note.label} className="text-xs text-muted-foreground">
            <span className="font-medium">Not available over MCP: {note.label}</span> — {note.reason}
          </p>
        ))}
      </div>

      <AlertDialog open={confirmAllOff} onOpenChange={setConfirmAllOff}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn off access to all {moduleCount} modules?</AlertDialogTitle>
            <AlertDialogDescription>
              The connection will still connect, and then every request it makes will be refused.
              Every write action comes off too — nothing can act on what it cannot see.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current access</AlertDialogCancel>
            <AlertDialogAction onClick={() => applyAllReadTiers("off")}>
              Turn everything off
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
