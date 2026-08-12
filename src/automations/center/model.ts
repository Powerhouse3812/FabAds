/**
 * center/model.ts — vocabulary for the Automation Center's cross-module views.
 *
 * THE GAP THIS FILE CLOSES: every research pass flagged that no shared
 * "what automations exist" registry existed — ReportingAutomationsTab hardcoded
 * v3's two action summaries, and nothing could enumerate automations across
 * modules. `CenterRow` is that registry's row shape: each module ADAPTS its own
 * store into rows; the Overview renders rows without knowing any module's
 * internals.
 *
 * TWO KINDS, per the settled vocabulary (Neeraj, Slack 2026-08-03):
 *   automation — one condition set -> one action, a dead end.
 *   workflow   — multiple conditions/modules/actions chained (the canvas).
 *
 * REAL vs SIMULATED, per Maalik's scope call (2026-08-12): Creative Report
 * rules and canvas workflows are REAL rows (live stores, working toggles/runs —
 * their *effects* are simulated, as everywhere in this prototype). Launch, RRM
 * and Genie rows are PREVIEW rows from a seeded mock store — they exist to show
 * what the center looks like populated, and every surface that renders one must
 * carry its `preview` flag visibly. A preview row that looked live would be
 * exactly the fabrication the honesty layer forbids.
 */
import type { LucideIcon } from "lucide-react";
import { BarChart3, GitBranch, HeartPulse, Rocket, Sparkles } from "lucide-react";

export type AutomationKind = "automation" | "workflow";

export const KIND_LABELS: Record<AutomationKind, string> = {
  automation: "Automation",
  workflow: "Workflow",
};

/** Modules the center federates. Order = display order everywhere. */
export const CENTER_MODULES = [
  "workflows",
  "creative-report",
  "launch",
  "rrm",
  "genie",
] as const;
export type CenterModuleKey = (typeof CENTER_MODULES)[number];

export interface CenterModuleMeta {
  label: string;
  icon: LucideIcon;
  /** The center sub-route that owns this module's rows. */
  href: string;
  /** True when the module's rows come from the seeded preview store rather
   *  than a live store — the sub-screen says so in its header. */
  preview: boolean;
  blurb: string;
}

export const CENTER_MODULE_META: Record<CenterModuleKey, CenterModuleMeta> = {
  workflows: {
    label: "Workflows",
    icon: GitBranch,
    href: "/automation/workflows",
    preview: false,
    blurb: "Multi-step chains built on the canvas",
  },
  "creative-report": {
    label: "Creative Report",
    icon: BarChart3,
    href: "/automation/creative-report",
    preview: false,
    blurb: "Reporting rules — one condition set, one action",
  },
  launch: {
    label: "Launch",
    icon: Rocket,
    href: "/automation/launch",
    preview: true,
    blurb: "Scheduled re-launches and launch guardrails",
  },
  rrm: {
    label: "RRM",
    icon: HeartPulse,
    href: "/automation/rrm",
    preview: true,
    blurb: "Account-health triggers — dilution, replacement, recovery",
  },
  genie: {
    label: "Genie",
    icon: Sparkles,
    href: "/automation/genie",
    preview: true,
    blurb: "Generation triggers feeding folders and launches",
  },
};

/**
 * One row in the consolidated list. Adapters produce these; the Overview
 * renders them. Everything display-ready — the Overview must never reach back
 * into a module's store to "enrich" a row.
 */
export interface CenterRow {
  /** Unique across modules — prefix with the module key. */
  id: string;
  module: CenterModuleKey;
  kind: AutomationKind;
  name: string;
  /** One-line what-it-does, past-tense-free ("ROAS ≥ 3 → generate 2 variations → Winners"). */
  summary: string;
  /** Honest state line ("Watching · Any time" / "Manual only" / "Off" / "Preview"). */
  statusLine: string;
  enabled: boolean;
  /** Rows from live stores get a working toggle; preview rows may also toggle
   *  (persisted in the preview store) but stay labeled preview. */
  canToggle: boolean;
  /** True = seeded preview row, not a live store's row. Must be rendered as a
   *  visible chip wherever the row appears. */
  preview: boolean;
  /** Deep link — the owning sub-screen (or module surface) for this row. */
  href: string;
  lastRunAt?: string;
}
