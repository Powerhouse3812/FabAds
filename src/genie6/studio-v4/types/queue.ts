import type { OutputData } from "../../types/output";

/**
 * QueueStatus — lifecycle of a generation batch on the Results Queue screen.
 *
 *   queued     → submitted, waiting on the 10-concurrent throttle
 *   generating → actively computing on the backend
 *   ready      → all variations done, results browsable
 *   failed     → backend returned an error for this batch
 *
 * The Results Queue caps simultaneous generation at 10 — Maalik's spec. An
 * 11th submit lands in `queued` and promotes to `generating` when a slot
 * opens. Mock data carries a mix of statuses so every visual state has
 * coverage at first paint.
 */
export type QueueStatus = "queued" | "generating" | "ready" | "failed";

/**
 * QueueBatch — a single user-submitted generation request, surfaced as a card
 * in the queue strip at the top of the Results Queue screen.
 *
 * Each batch holds N outputs (typically 12 — 4 concepts × 3 variations or
 * similar). When `status === "ready"`, those outputs render below in the
 * concept-grouped rows.
 */
export interface QueueBatch {
  id: string;
  /** Human label — what the user is generating ("Home insurance ad", etc.). */
  title: string;
  /** Submission timestamp — drives the "02:30pm" caption. */
  submittedAt: Date;
  /** Status pill copy + behaviour. */
  status: QueueStatus;
  /** Categorisation chips on the queue card (e.g. ["Performance", "Story Ad"]). */
  tags: string[];
  /** Total variation count — the third chip ("12 generations"). */
  generationCount: number;
  /**
   * How many variations have finished computing so far. Powers the
   * progress bar + "10/50" count chip across the Studio queue strip,
   * V3 list rows, BatchDetailsAccordion, and the new LibraryQueueStrip.
   *
   * Conventions:
   *   - queued    → 0
   *   - generating → 0..generationCount-1 (partial)
   *   - ready     → equals generationCount (100%)
   *   - failed    → whatever was reached when it broke
   *
   * Falls back to deriving from `outputs.length || (status === "ready" ?
   * generationCount : 0)` when missing, so legacy batches stay correct.
   */
  completedCount?: number;
  /** The brand this batch is for (drives the small thumbnail on the card). */
  brandId?: string;
  /**
   * The actual generated outputs. Only populated when `status === "ready"`.
   * Drives the concept-grouped result rows below the queue strip when this
   * batch is the active selection.
   */
  outputs?: OutputData[];
  /**
   * Concept groupings the outputs belong to (e.g. "Hero Shot", "Lifestyle").
   * Same length as the number of concept rows rendered. Each entry references
   * the slice of `outputs` belonging to that concept.
   */
  concepts?: {
    id: string;
    label: string;
    variationCount: number;
  }[];
  /** Free-text prompt that triggered this batch — surfaced in the dock chip. */
  prompt?: string;
}

export const MAX_CONCURRENT_GENERATING = 10;

/**
 * Resolve "how many variations done" for a batch in a way that's robust
 * to legacy mock data missing `completedCount`. Used by every surface
 * that renders the progress bar.
 */
export function resolveCompleted(batch: QueueBatch): number {
  if (typeof batch.completedCount === "number") {
    return Math.min(batch.completedCount, batch.generationCount);
  }
  if (batch.outputs && batch.outputs.length > 0) return batch.outputs.length;
  if (batch.status === "ready") return batch.generationCount;
  return 0;
}
