/**
 * RuleList — every automation rule, flat (iter-2 P4; v3 workflows added
 * iter-3).
 *
 * Self-contained: owns its own RuleBuilder open/close + editing state and
 * reads its own data (rules, rollups) via hooks, so a parent screen can drop
 * `<RuleList />` in with zero props.
 *
 * v2 (`/reports/creative-v2`): "Run now" is the only way a rule ever
 * executes — there is no real cron here — so every bit of v2 copy says
 * "Run now" / "Last run …", never anything implying a background schedule.
 *
 * v3 (`/reports/creative-v3`, gated by `useReportWorkflowsEnabled()`): rules
 * can also self-fire unattended (engine.ts + the runner tick), per-rule gated
 * by `enabled` + `autoRun` + an optional date `schedule`. This file must
 * never claim a rule is "Watching" when it silently can't act — see
 * `autoStateLabel` below, which mirrors the exact honesty guard
 * `BoardsPanel.tsx` already applies to disabled smart boards (an enabled
 * switch that does nothing is a lie).
 *
 * A rule with a `syncToAccounts` action can only have been created in v3
 * (v2's RuleBuilder never offers that action), but the rules store is shared
 * across both versions, so such a rule can still show up here on v2. It's
 * rendered read-only (see `foreignSyncRule` below) rather than hidden — it's
 * the user's data, just not runnable from this version.
 */
import { useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { WhyDot } from "@/creative-report/components/WhyDot";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useBoardsStore } from "@/creative-report/automations/boards";
import { runRule } from "@/creative-report/automations/engine";
import { deleteRule, setRuleEnabled, useAutomationRules } from "@/creative-report/automations/rulesStore";
import type { AutomationRule, RuleType } from "@/creative-report/automations/model";
import { RuleBuilder } from "@/creative-report/automations/components/RuleBuilder";
import { useReportWorkflowsEnabled } from "@/creative-report/state/ReportBasePathContext";
import { describeSchedule, scheduleState } from "@/workflows/core";
import { recordsForRule } from "@/creative-report/automations/sync/selectors";
import { resetSyncHistory, useSyncStore } from "@/creative-report/automations/sync/syncStore";

function TypeBadge({ type }: { type: RuleType }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {type === "categorise" ? "Categorise" : "Launch"}
    </span>
  );
}

function lastRunLabel(rule: AutomationRule): string {
  if (!rule.lastRunAt) return "Never run";
  const when = new Date(rule.lastRunAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const count = rule.lastMatchCount ?? 0;
  return `Last run ${when} · ${count} matched`;
}

/** v3-only: this rule's TRUE auto-fire state right now — never a guess.
 *  `enabled === false` always wins (the manual toggle beats everything else),
 *  then `autoRun`, then the schedule window. Only when all three line up
 *  does this say "Watching" — an enabled switch that silently does nothing
 *  is a lie, the same principle `BoardsPanel.tsx` applies to disabled smart
 *  boards. */
function autoStateLabel(rule: AutomationRule, now: Date): string {
  if (!rule.enabled) return "Off";
  if (rule.autoRun !== true) return "Manual only";
  const sched = scheduleState(rule.schedule, now);
  if (!sched.active) return sched.reason ?? "Not active";
  return `Watching · ${describeSchedule(rule.schedule)}`;
}

function hasSyncAction(rule: AutomationRule): boolean {
  return rule.actions.some((a) => a.type === "syncToAccounts");
}

function RuleRow({
  rule,
  boardBroken,
  workflowsEnabled,
  now,
  syncCount,
  foreignSyncRule,
  onRunNow,
  onEdit,
  onDelete,
}: {
  rule: AutomationRule;
  /** True when a categorise rule's target board no longer exists. */
  boardBroken: boolean;
  /** v3 vs v2 — see the file header. */
  workflowsEnabled: boolean;
  now: Date;
  /** Count of sync records this rule has caused (any status). */
  syncCount: number;
  /** v2 only: a v3-created sync rule showing up here — read-only. */
  foreignSyncRule: boolean;
  onRunNow: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const runDisabled = !rule.enabled || foreignSyncRule;
  const runTitle = foreignSyncRule
    ? "Syncs to ad accounts — only runnable in Creative Report 3.0"
    : rule.enabled
      ? undefined
      : "Rule is turned off";

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">{rule.name}</span>
          <TypeBadge type={rule.type} />
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <WhyDot id="automations.rule.match" />
          {rule.conditions.length} condition{rule.conditions.length === 1 ? "" : "s"} ·{" "}
          {lastRunLabel(rule)}
        </p>
        {workflowsEnabled && (
          <p className="text-xs text-muted-foreground">
            {autoStateLabel(rule, now)}
            {syncCount > 0 && ` · ${syncCount} sync${syncCount === 1 ? "" : "s"} triggered`}
          </p>
        )}
        {foreignSyncRule && (
          <p className="text-xs text-muted-foreground">Available in Creative Report 3.0</p>
        )}
        {boardBroken && (
          <p className="text-xs text-destructive">
            Target board was deleted — edit this rule and pick a new board.
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Switch
          checked={rule.enabled}
          onCheckedChange={(checked) => setRuleEnabled(rule.id, checked)}
          aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
        />
        <WhyDot id="automations.rule.runNow" />
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onRunNow}
          disabled={runDisabled}
          title={runTitle}
        >
          Run now
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete rule"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function RuleList() {
  const rules = useAutomationRules();
  const { boards } = useBoardsStore();
  const { rollups } = useCreativeData();
  const { toast } = useToast();
  const workflowsEnabled = useReportWorkflowsEnabled();
  const syncState = useSyncStore();

  // "Today" for schedule-window checks — cheap to recompute per render, and
  // this list re-renders on every rules/sync-store tick anyway (v3's runner
  // ticks roughly every 10s), so it never goes stale for long.
  const now = new Date();

  // recordsForRule returns a NEW array per call — never call it inside a
  // store's getSnapshot (that's the exact white-screen bug boards.ts:11-16
  // documents). Here it's called from inside this component's own useMemo,
  // which is the safe pattern: useSyncStore() is called exactly once above,
  // and this derives from its snapshot.
  const syncCountByRuleId = useMemo(() => {
    const map = new Map<string, number>();
    for (const rule of rules) {
      map.set(rule.id, recordsForRule(syncState, rule.id).length);
    }
    return map;
  }, [syncState, rules]);

  const boardIds = new Set(boards.map((b) => b.id));
  const isBoardBroken = (rule: AutomationRule) =>
    rule.actions.some((a) => a.type === "addToBoard" && !boardIds.has(a.boardId));

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>(undefined);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function openCreate() {
    setEditingRule(undefined);
    setBuilderOpen(true);
  }
  function openEdit(rule: AutomationRule) {
    setEditingRule(rule);
    setBuilderOpen(true);
  }
  function handleRunNow(rule: AutomationRule) {
    // Defense in depth — the button is already disabled for this case, but a
    // v2 build must never actually execute a sync action either way.
    if (!workflowsEnabled && hasSyncAction(rule)) return;
    const result = runRule(rule, rollups);
    toast({ title: rule.name, description: result.summary });
  }

  const pendingDeleteRule = rules.find((r) => r.id === pendingDeleteId);

  return (
    <div className="space-y-3">
      {workflowsEnabled && (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            onClick={() => resetSyncHistory()}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset sync history
          </Button>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No automations yet — set conditions once, then hit Run now to file or act on whatever
            matches.
          </p>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            New rule
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {rules.length} rule{rules.length === 1 ? "" : "s"}
            </p>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              New rule
            </Button>
          </div>
          <div className="space-y-2">
            {rules.map((rule) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                boardBroken={isBoardBroken(rule)}
                workflowsEnabled={workflowsEnabled}
                now={now}
                syncCount={syncCountByRuleId.get(rule.id) ?? 0}
                foreignSyncRule={!workflowsEnabled && hasSyncAction(rule)}
                onRunNow={() => handleRunNow(rule)}
                onEdit={() => openEdit(rule)}
                onDelete={() => setPendingDeleteId(rule.id)}
              />
            ))}
          </div>
        </>
      )}

      <RuleBuilder open={builderOpen} onOpenChange={setBuilderOpen} existingRule={editingRule} />

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDeleteRule?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the rule permanently. Creatives it already filed, paused, or queued
              won&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId) deleteRule(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
