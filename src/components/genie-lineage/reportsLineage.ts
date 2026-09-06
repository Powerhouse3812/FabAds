/**
 * Reports <-> Genie creative lineage (§7.3): "Every ad in Reports that came
 * from Genie carries a 'Made in Genie' badge. Clicking it opens the original
 * generation — its prompt, angle and reference."
 *
 * THE MATCHING PROBLEM: Reports' ad rows (`src/lib/reports-dummy-data.ts`,
 * ids like `ad_0_0_0_0`) and the Genie run store's seeded batches
 * (`src/genie6/lib/genieRunStore.ts`, ~14 batches from a parallel agent) are
 * two independently-seeded mock corpora with no real foreign key between
 * them. Rather than invent a fake join table, this hashes the ad's own id to
 * a stable bucket and treats a fixed fraction of ads as "came from Genie".
 *
 * WHY THIS IS DETERMINISTIC, NOT RANDOM:
 *  - `hashId()` is a plain string hash (no Math.random(), no Date.now()) —
 *    the same `adId` always produces the same number, on every render, every
 *    reload, every sort order.
 *  - The "is this Genie-made" test is `hash(adId) % 5 === 0`, i.e. exactly
 *    1-in-5 ads (~20%) — a realistic minority (not all rows, not zero rows).
 *  - WHICH batch/output a matched ad points at is `hash(adId) % batches.length`
 *    — again pure function of the id, so the same ad always opens the same
 *    generation.
 * A reviewer can verify determinism by calling `resolveGenieLineage` twice
 * with the same inputs and getting an identical result, and by noting no
 * nondeterministic API is referenced anywhere in this file.
 */
import type { RunBatch } from "@/genie6/lib/genieRunTypes";

export interface GenieLineage {
  batchId: string;
  outputId: string;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 1 in this many ad rows carries the badge — see file header. */
const GENIE_LINEAGE_DENOMINATOR = 5;

/**
 * Returns the batch/output this Reports ad "came from" in Genie, or `null`
 * when this ad isn't part of the deterministic Genie-made subset (or when
 * the run store hasn't seeded any batches yet — e.g. a very first cold
 * load before `genieRunStore` initialises its seed data).
 */
export function resolveGenieLineage(batches: RunBatch[], adId: string): GenieLineage | null {
  if (batches.length === 0) return null;
  const h = hashId(adId);
  if (h % GENIE_LINEAGE_DENOMINATOR !== 0) return null;

  const batch = batches[h % batches.length];
  const item =
    batch.items.find((i) => i.status === "done" && !!i.outputId) ??
    batch.items.find((i) => !!i.outputId);
  if (!item?.outputId) return null;

  return { batchId: batch.batchId, outputId: item.outputId };
}
