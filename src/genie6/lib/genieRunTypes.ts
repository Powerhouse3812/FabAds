/**
 * Genie run store — contract types (Genie 2.0 §10, §18).
 *
 * ONE store for every output Genie produces, from Studio, from an Other Flow,
 * and from every Other App. §8: "All app output goes to the central Genie
 * Library. Per-app history is a view, not a separate store." So per-app history
 * is `useRunsForApp(key)` over this same store, never a parallel array.
 *
 * §10: Batch ID = Job ID. ONE identifier. It lives in the generation's
 * properties and is displayed above the batch.
 *
 * §18: progress is stage-wise with an UPDATING estimate — never a fixed ETA,
 * because a fixed estimate becomes a promise and a missed promise costs more
 * than no estimate. On failure the item STAYS VISIBLE in the list in an error
 * state with Retry — never a toast that disappears.
 */
import type { FlowActionId, FlowModuleKey } from "../flows/flowTypes";
import type { AppKey } from "../apps/appTypes";

/** Where a batch came from. "studio" = a plain Studio run with no flow. */
export type RunOrigin =
  | { kind: "studio" }
  | { kind: "flow"; module: FlowModuleKey; action: FlowActionId; refTitle: string }
  | { kind: "app"; app: AppKey }
  | { kind: "upload" }
  | { kind: "imported"; module: FlowModuleKey };

/** §21.2 — every asset carries provenance so nobody confuses "FabFunnel gave
 *  me this" with "I made this". */
export type Provenance = "fabfunnel-seeded" | "client-created";

export type RunItemStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "cancelling"
  | "cancelled";

/**
 * §21.3 failure modes. A generic "something went wrong" collapses the whole
 * failure matrix to one screen, so each item carries a specific reason.
 */
export type FailureReason =
  | "model-unavailable"
  | "content-policy"
  | "timeout"
  | "credits-exhausted"
  | "brand-guideline-conflict"
  | "render-error";

export const FAILURE_COPY: Record<FailureReason, { title: string; detail: string }> = {
  "model-unavailable": {
    title: "Model unavailable",
    detail: "Genie Video was at capacity. Retry, or switch model and retry.",
  },
  "content-policy": {
    title: "Blocked by content policy",
    detail: "The claim \"clinically proven\" needs a source. Edit the prompt and retry.",
  },
  timeout: {
    title: "Timed out",
    detail: "The render passed 40 minutes with no frame returned. Retry at 720p.",
  },
  "credits-exhausted": {
    title: "Out of credits",
    detail: "The batch stopped part-way. Top up, then retry the failed items.",
  },
  "brand-guideline-conflict": {
    title: "Brand guideline conflict",
    detail: "Requested palette clashes with the locked brand colours. Retry unlocked.",
  },
  "render-error": {
    title: "Render failed",
    detail: "The pipeline dropped this frame. Retry — siblings in this batch are fine.",
  },
};

/** Retry granularity (§21.3). Button copy must state the credit consequence. */
export type RetryScope = "this-item" | "all-failed" | "whole-batch" | "different-model";

export interface RunItem {
  id: string;
  status: RunItemStatus;
  /** 0-100. Only meaningful while `running`. */
  progress: number;
  /** Which stage of `RunBatch.stages` is active. */
  stageIndex: number;
  /** Seconds remaining — RECOMPUTED as stages complete, never fixed up front. */
  etaSeconds?: number;
  thumbnail?: string;
  title: string;
  /** One-line summary shown in the results list. */
  summary?: string;
  tags?: string[];
  failure?: FailureReason;
  /** Done → what this item was charged. Failed / cancelled → its RATE, i.e.
   *  what "Retry this ad" costs (never charged — see `RunBatch.credits`).
   *  0 while pending / running. */
  credits: number;
  /** Which output in the batch — "3 of 16". */
  index: number;
  /**
   * Join key back into `sampleOutputs` (src/genie6/mocks/sample-outputs.ts).
   *
   * RunItem deliberately carries only what a progress/results tile needs.
   * The rich creative record — headline, body, aiVerdict, comparison, coach
   * recommendations — already lives on OutputData and is consumed by the
   * OutputCard and the AdDetailDrawer. Copying it here would fork it. So a
   * historical item points at its OutputData instead, and the Library joins.
   * Absent on items produced by an Other App (no ad copy to point at).
   */
  outputId?: string;
}

export interface RunBatch {
  /** §10 — Batch ID = Job ID. Displayed above the batch, e.g. "BATCH-8F2K41". */
  batchId: string;
  createdAt: number;
  origin: RunOrigin;
  provenance: Provenance;
  /** §17 — ads output carries "Created By". Admin gets a user filter. */
  createdBy: string;
  /** Human label above the batch, e.g. "Mamaearth Onion Oil · UGC Video". */
  label: string;
  /** Stage names in order. §18 — stage-wise progress, no fixed ETA. */
  stages: string[];
  items: RunItem[];
  /** Total credits CHARGED — sum over DONE items only. Failed and cancelled
   *  items carry a rate on `RunItem.credits` but were never charged. */
  credits: number;
  /** Snapshot of the config, so Library detail can explain how it was made. */
  config?: {
    format?: string;
    approach?: string;
    model?: string;
    angle?: string;
    language?: string;
    aspectRatio?: string;
    promptSnippet?: string;
    brandName?: string;
    productName?: string;
  };
}

/** Derived batch status — what the Library card and progress header show. */
export type BatchStatus =
  | "running"
  | "done"
  | "failed"
  | "partial"
  | "cancelled";

export function batchStatus(b: RunBatch): BatchStatus {
  const s = b.items.map((i) => i.status);
  if (s.some((x) => x === "running" || x === "pending" || x === "cancelling")) return "running";
  if (s.every((x) => x === "cancelled")) return "cancelled";
  if (s.every((x) => x === "failed")) return "failed";
  if (s.some((x) => x === "failed")) return "partial";
  return "done";
}

/** "19/20" for the partial state (§21.3). */
export function batchDoneCount(b: RunBatch): string {
  const done = b.items.filter((i) => i.status === "done").length;
  return `${done}/${b.items.length}`;
}
