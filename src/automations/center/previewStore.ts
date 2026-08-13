/**
 * center/previewStore.ts — seeded PREVIEW automations for Launch, RRM and Genie.
 *
 * WHY THIS EXISTS: Maalik's scope call (2026-08-12) for the Automation Center
 * pitch was "real + simulated previews" — Creative Report rules and canvas
 * workflows are live, and the modules that have no live automation store yet
 * (Launch's Auto-launch is a 56-line stub, v1 AutoPilot is dummy useState, RRM's
 * real engine lives in fab-funnel-fe, Genie has nothing) get seeded preview rows
 * so the center demos populated rather than empty.
 *
 * HONESTY BOUNDARY: every row here is `preview: true` and every surface that
 * renders one must show that. Nothing in this store evaluates, fires, schedules
 * or writes to any other store — the ONLY mutable state is the enabled toggle,
 * which exists so the demo's switches feel real without claiming a runner that
 * doesn't exist. The seed vocabulary is borrowed from the real surfaces it
 * previews (AutoPilot's strategy fields, RRM's event log types, Genie's
 * generation language) so the pitch describes plausible product, not invented
 * concepts.
 *
 * Store discipline: same as every store in this repo — exactly ONE hook whose
 * snapshot returns the module-cached reference and constructs nothing (a fresh
 * object per getSnapshot has white-screened this app before), persist() =
 * rebuild ref -> guarded setItem -> emit, sanitize() never throws. Seeds are
 * static literals — no Math.random, no clock at module scope.
 */
import { useSyncExternalStore } from "react";
import type { AutomationKind, CenterModuleKey } from "@/automations/center/model";

export interface PreviewAutomation {
  id: string;
  module: Extract<CenterModuleKey, "launch" | "rrm" | "genie">;
  kind: AutomationKind;
  name: string;
  summary: string;
  /** What would trigger it, in the owning module's own vocabulary. */
  trigger: string;
  /** What it would do. */
  action: string;
  enabled: boolean;
  /** Always true — this store holds nothing else. */
  preview: true;
}

export interface PreviewStoreState {
  automations: PreviewAutomation[];
}

const KEY = "workflows-center-preview";

/** Fixed seed timestamp convention shared with templates.ts — no clock values
 *  in static seed data. */
const SEEDS: PreviewAutomation[] = [
  {
    id: "pv-launch-relaunch-winners",
    module: "launch",
    kind: "workflow",
    name: "Re-launch winners weekly",
    summary: "Winners folder → re-launch with saved strategy → warm-up pacing",
    trigger: "Every Monday, creatives in the Winners folder",
    action: "Queue a re-launch using the saved strategy, capped at 3 launches/day",
    enabled: true,
    preview: true,
  },
  {
    id: "pv-launch-pause-rejections",
    module: "launch",
    kind: "automation",
    name: "Pause on rejection spike",
    summary: "Rejection rate > 20% in a launch → pause remaining ads",
    trigger: "A running launch crosses 20% rejected ads",
    action: "Pause the launch's remaining ad sets and notify",
    enabled: true,
    preview: true,
  },
  {
    id: "pv-rrm-dilution-guard",
    module: "rrm",
    kind: "automation",
    name: "Dilution guard",
    summary: "Account health drops below warning threshold → plan dilution",
    trigger: "Health snapshot crosses the warning threshold",
    action: "Plan a dilution run for the affected account",
    enabled: true,
    preview: true,
  },
  {
    id: "pv-rrm-replacement",
    module: "rrm",
    kind: "workflow",
    name: "Replace rejected pages",
    summary: "Rejection ratio breach → spin up replacement → re-link offers",
    trigger: "An account's rejection ratio breaches its guardrail",
    action: "Create a replacement page, re-link its offers, log the swap",
    enabled: false,
    preview: true,
  },
  {
    id: "pv-genie-refresh-hooks",
    module: "genie",
    kind: "workflow",
    name: "Refresh fatiguing hooks",
    summary: "Fatiguing creatives → generate 3 hook variants → Refresh queue folder",
    trigger: "A creative enters the Fatiguing bucket",
    action: "Ask Genie for 3 hook variants and file them into Refresh queue",
    enabled: true,
    preview: true,
  },
];

const VALID_MODULES = new Set(["launch", "rrm", "genie"]);
const VALID_KINDS = new Set(["automation", "workflow"]);

function isValidRow(r: unknown): r is PreviewAutomation {
  if (!r || typeof r !== "object") return false;
  const row = r as PreviewAutomation;
  return (
    typeof row.id === "string" &&
    VALID_MODULES.has(row.module) &&
    VALID_KINDS.has(row.kind) &&
    typeof row.name === "string" &&
    typeof row.summary === "string" &&
    typeof row.trigger === "string" &&
    typeof row.action === "string" &&
    typeof row.enabled === "boolean" &&
    row.preview === true
  );
}

/**
 * Only `enabled` is user state; everything else always comes from SEEDS. A
 * hand-edited name/summary in localStorage would otherwise let a stale payload
 * misdescribe what a preview row claims to do after we reword a seed.
 */
function sanitize(raw: unknown): PreviewStoreState {
  const persisted = new Map<string, boolean>();
  if (raw && typeof raw === "object" && Array.isArray((raw as PreviewStoreState).automations)) {
    for (const item of (raw as PreviewStoreState).automations) {
      if (isValidRow(item)) persisted.set(item.id, item.enabled);
    }
  }
  return {
    automations: SEEDS.map((s) => ({ ...s, enabled: persisted.get(s.id) ?? s.enabled })),
  };
}

function readInitial(): PreviewStoreState {
  if (typeof window === "undefined") return { automations: SEEDS };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : { automations: SEEDS };
  } catch {
    return { automations: SEEDS };
  }
}

const DEFAULT_STATE: PreviewStoreState = { automations: SEEDS };
let state: PreviewStoreState = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable — in-memory state still serves this session.
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): PreviewStoreState {
  return state;
}

/** THE ONLY HOOK — per-module views are the consumer's useMemo filter. */
export function usePreviewAutomations(): PreviewStoreState {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}

/** Non-hook accessor for symmetry with the repo's other stores. */
export function getPreviewAutomations(): PreviewStoreState {
  return state;
}

/** The one mutation: the demo's toggle. Toggling a preview row arms nothing —
 *  there is no runner behind these rows, and the UI says so. */
export function setPreviewEnabled(id: string, enabled: boolean): void {
  if (!state.automations.some((a) => a.id === id && a.enabled !== enabled)) return;
  state = {
    automations: state.automations.map((a) => (a.id === id ? { ...a, enabled } : a)),
  };
  persist();
}
