/**
 * RuleList — every automation rule, flat (iter-2 P4; v3 workflows added
 * iter-3).
 *
 * Self-contained: owns its own RuleBuilder open/close + editing state and
 * reads its own data (rules, rollups) via hooks, so a parent screen can drop
 * `<RuleList />` in with zero props.
 *
 * Scoped down (Maalik, 2026-07-31) to exactly ONE action: "file into folder"
 * against real Creative Library folders. There's only one action shape now
 * (`AddToFolderAction`), so every row's summary reads the same way — no more
 * board/sync/pause/queue-specific branches. The sync-to-ad-account feature
 * (and its history/reset UI) moved out of Creative Report entirely, so this
 * file no longer touches the sync store at all.
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
 * switch that does nothing is a lie). The same honesty principle covers the
 * folder a rule files into: `useClFolders()` gives a live read of which
 * folders still exist, so a rule pointing at one that's since been deleted
 * says so rather than pretending the file-in will succeed.
 */
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { useClFolders } from "@/hooks/use-cl-folders";
import { runRule } from "@/creative-report/automations/engine";
import { deleteRule, setRuleEnabled, useAutomationRules } from "@/creative-report/automations/rulesStore";
import type { AddToFolderAction, AutomationRule } from "@/creative-report/automations/model";
import { RuleBuilder } from "@/creative-report/automations/components/RuleBuilder";
import { useReportWorkflowsEnabled } from "@/creative-report/state/ReportBasePathContext";
import { describeSchedule, scheduleState } from "@/workflows/core";

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

function folderAction(rule: AutomationRule): AddToFolderAction | undefined {
  return rule.actions.find((a): a is AddToFolderAction => a.type === "addToFolder");
}

/** Plain-language summary of the rule's one action. There's only one shape
 *  now, so this never branches on type — a rule with no valid action left
 *  (e.g. every field failed the store's sanitiser) says so honestly instead
 *  of rendering a blank line. */
function actionSummary(rule: AutomationRule): string {
  const action = folderAction(rule);
  if (!action) return "No action configured";
  return `File into folder: "${action.folderName}"`;
}

function RuleRow({
  rule,
  folderMissing,
  workflowsEnabled,
  now,
  onRunNow,
  onEdit,
  onDelete,
}: {
  rule: AutomationRule;
  /** True when the rule's target folder no longer exists in the live
   *  Creative Library folder list (nice-to-have honesty check). */
  folderMissing: boolean;
  /** v3 vs v2 — see the file header. */
  workflowsEnabled: boolean;
  now: Date;
  onRunNow: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const runDisabled = !rule.enabled;
  const runTitle = rule.enabled ? undefined : "Rule is turned off";

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-[13px] font-medium text-foreground">{rule.name}</span>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <WhyDot id="automations.rule.match" />
          {rule.conditions.length} condition{rule.conditions.length === 1 ? "" : "s"} ·{" "}
          {lastRunLabel(rule)}
        </p>
        <p className="text-xs text-muted-foreground">{actionSummary(rule)}</p>
        {workflowsEnabled && (
          <p className="text-xs text-muted-foreground">{autoStateLabel(rule, now)}</p>
        )}
        {folderMissing && (
          <p className="text-xs text-destructive">This folder may have been deleted.</p>
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
  const { rollups } = useCreativeData();
  const { toast } = useToast();
  const workflowsEnabled = useReportWorkflowsEnabled();
  const { data: folderData, isLoading: foldersLoading, isError: foldersError } = useClFolders();

  // "Today" for schedule-window checks — cheap to recompute per render, and
  // this list re-renders on every rules-store tick anyway (v3's runner ticks
  // roughly every 10s), so it never goes stale for long.
  const now = new Date();

  const liveFolderIds = useMemo(
    () => new Set((folderData ?? []).map((f) => f.id)),
    [folderData],
  );

  // Only claim a folder is gone once the live query has actually settled —
  // while it's still loading (or failed), an empty/partial set would falsely
  // flag every rule as broken.
  const isFolderMissing = (rule: AutomationRule) => {
    if (foldersLoading || foldersError) return false;
    const action = folderAction(rule);
    if (!action) return false;
    return !liveFolderIds.has(action.folderId);
  };

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
    const result = runRule(rule, rollups);
    toast({ title: rule.name, description: result.summary });
  }

  const pendingDeleteRule = rules.find((r) => r.id === pendingDeleteId);

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No automations yet — set conditions once, then hit Run now to file whatever matches
            into a folder.
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
                folderMissing={isFolderMissing(rule)}
                workflowsEnabled={workflowsEnabled}
                now={now}
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
              This removes the rule permanently. Creatives it already filed won&apos;t be undone.
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
