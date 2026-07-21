/**
 * RuleList — every automation rule, flat (iter-2 P4).
 *
 * Self-contained: owns its own RuleBuilder open/close + editing state and
 * reads its own data (rules, rollups) via hooks, so a parent screen can drop
 * `<RuleList />` in with zero props.
 *
 * "Run now" is the only way a rule ever executes here — there is no real
 * cron in this prototype (see engine.ts) — so every bit of copy below says
 * "Run now" / "Last run …", never anything implying a background schedule.
 */
import { useState } from "react";
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
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useBoardsStore } from "@/creative-report/automations/boards";
import { runRule } from "@/creative-report/automations/engine";
import { deleteRule, setRuleEnabled, useAutomationRules } from "@/creative-report/automations/rulesStore";
import type { AutomationRule, RuleType } from "@/creative-report/automations/model";
import { RuleBuilder } from "@/creative-report/automations/components/RuleBuilder";

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

function RuleRow({
  rule,
  boardBroken,
  onRunNow,
  onEdit,
  onDelete,
}: {
  rule: AutomationRule;
  /** True when a categorise rule's target board no longer exists. */
  boardBroken: boolean;
  onRunNow: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">{rule.name}</span>
          <TypeBadge type={rule.type} />
        </div>
        <p className="text-xs text-muted-foreground">
          {rule.conditions.length} condition{rule.conditions.length === 1 ? "" : "s"} ·{" "}
          {lastRunLabel(rule)}
        </p>
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
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onRunNow}
          disabled={!rule.enabled}
          title={rule.enabled ? undefined : "Rule is turned off"}
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
    const result = runRule(rule, rollups);
    toast({ title: rule.name, description: result.summary });
  }

  const pendingDeleteRule = rules.find((r) => r.id === pendingDeleteId);

  return (
    <div className="space-y-3">
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
