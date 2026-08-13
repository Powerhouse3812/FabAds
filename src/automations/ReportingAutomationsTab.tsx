/**
 * ReportingAutomationsTab — the "one consolidated list" half of the Automations
 * home (Neeraj, Slack 2026-08-03: "automations k under 2 tabs -> reporting
 * automations and integrated(full) workflows ... but one consolidated list").
 *
 * These are AUTOMATIONS in the vocabulary we settled: one condition set -> one
 * action, a dead end. They are the Creative Report v3 rule engine's rules, read
 * from `@/creative-report/automations/rulesStore` — the SAME store, not a copy.
 * So a rule created in the report appears here immediately and a toggle flipped
 * here shows up there. Duplicating the list into its own store would have given
 * two sources of truth for one user-visible thing.
 *
 * Read-mostly on purpose: the enable/disable toggle is here (it's the one
 * control you want from a cross-module list), but authoring stays in the report,
 * where the rule builder and its live match-count already live. Every row links
 * back rather than reimplementing that editor.
 */
import { Link } from "react-router-dom";
import { ArrowUpRight, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { describeSchedule, scheduleState } from "@/workflows/core";
import {
  setRuleEnabled,
  useAutomationRules,
} from "@/creative-report/automations/rulesStore";
import { CREATIVE_REPORT_V3_BASE } from "@/creative-report/state/ReportBasePathContext";
import type { AutomationRule } from "@/creative-report/automations/model";

/** Where a rule is authored — the report's own Automations screen. */
const RULES_HOME = `${CREATIVE_REPORT_V3_BASE}/automations`;

function ruleStatusLine(rule: AutomationRule, now: Date): string {
  if (!rule.enabled) return "Off";
  if (!rule.autoRun) return "Manual runs only";
  // An enabled rule that can't fire must say why — a switch that reads "on"
  // while the schedule silently blocks it would be a lie.
  const sched = scheduleState(rule.schedule, now);
  if (!sched.active) return sched.reason ?? "Out of schedule";
  return `Watching · ${describeSchedule(rule.schedule)}`;
}

function actionSummary(rule: AutomationRule): string {
  if (rule.actions.length === 0) return "No action set";
  return rule.actions
    .map((a) =>
      a.type === "addToFolder"
        ? `File into "${a.folderName}"`
        : `Sync to ${a.accountIds.length} ad account${a.accountIds.length === 1 ? "" : "s"}`,
    )
    .join(" · ");
}

export function ReportingAutomationsTab() {
  const rules = useAutomationRules();
  // Read once per render, not per row — and never inside a child's render path.
  const now = new Date();

  return (
    <div className="space-y-4">
      {/* The written-recommendation surface Neeraj asked for ("kuch chije likhni
          pdegi in automation — recommendations"). Static advice for now; it is
          honest as guidance and claims no analysis of this account. */}
      <div className="flex gap-2 rounded-lg border border-border bg-card p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Recommended when you run multiple niches</p>
          <p className="mt-0.5">
            Add a brand or naming condition to each rule — otherwise creatives from different
            products can be filed into the same folder.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Reporting automations</h2>
            <p className="text-xs text-muted-foreground">
              One condition set, one action. Authored in the Creative Report.
            </p>
          </div>
          <Link
            to={RULES_HOME}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-primary-text hover:underline"
          >
            Open in Creative Report
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {rules.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No reporting automations yet.</p>
            <Link
              to={RULES_HOME}
              className="mt-1 inline-block text-xs text-primary-text hover:underline"
            >
              Create one in the Creative Report
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground" title={rule.name}>
                    {rule.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {rule.conditions.length} condition
                    {rule.conditions.length === 1 ? "" : "s"} · {actionSummary(rule)}
                  </p>
                </div>

                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {ruleStatusLine(rule, now)}
                </span>

                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(v) => setRuleEnabled(rule.id, v)}
                  aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
