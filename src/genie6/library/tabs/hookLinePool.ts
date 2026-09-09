import { useMemo } from "react";
import { angles } from "@/mocks/shared/angles";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type { OutputData } from "../../types/output";
import { useLocalOutputs } from "../libraryActionsStore";
import { useOutputBatchIndex } from "../useOutputBatchIndex";
import { originLabel } from "../originLabels";

/**
 * hookLinePool — the hook LINES Genie has produced, derived from the ad pool.
 *
 * Deliberately NOT a fifth array alongside `generatedAssetPool.ts`'s
 * GENERATED_SCRIPTS / CONCEPTS / STORYBOARDS. The four generation targets are
 * ad / script / concept / storyboard, so nothing in Genie emits a hook as a
 * standalone artefact — inventing a pool of "generated hooks" would be
 * fabricating content that does not exist.
 *
 * What DOES exist is the line itself, carried on every generated ad as
 * `OutputData.headline`. That field is demonstrably the hook line in this
 * data model rather than a separate headline concept: twenty of the fifty
 * seeded outputs carry a headline that is character-for-character an existing
 * seeded `Hook.text` in `src/mocks/shared/hooks.ts` — `var_4a2k7q9` ↔
 * `hook-1` ("Hair fall is real. This is not."), `var_b7t4h2x` ↔ `hook-2`,
 * `var_sugar_1` ↔ `hook-sugar-1`, and seventeen more. So the Library's Hooks
 * tab is a PROJECTION of the ad pool, and a Save there writes a real `Hook`.
 *
 * Do NOT use `OutputData.priorConfig.hookId` as the join instead: it is a
 * broken reference. `sample-outputs.ts` backfills `hook-${idx % 18}`, but the
 * only numeric hook ids that exist are `hook-1,2,3,4,5,7,8` — most resolve to
 * nothing.
 *
 * `GeneratedConceptItem.hook` was the other candidate and was rejected as the
 * source: four of its seven values read as a hook fused with a proof clause
 * ("Hair fall is real. This is not — clinically tested, 6-week visible
 * change.") rather than a clean opening line. A tagline, not a hook.
 *
 * Read-only over `sampleOutputs` — never forks or mutates it (15+ modules
 * depend on that array's reference identity).
 */
export interface GeneratedHookLine {
  /** The SOURCE OUTPUT's id — one hook line per generated ad, and the save
   *  store's idempotency key. */
  id: string;
  text: string;
  brandId?: string;
  brandName?: string;
  /** `brandId` when the ad carries one, else the brand name — every output
   *  has a name, only mapped brands have a slug, and the filter must offer
   *  both rather than silently dropping the unmapped ones. */
  brandKey: string;
  angleId?: string;
  angleLabel?: string;
  /** The body copy that ran under this line — context for judging it. */
  supportingCopy?: string;
  thumbnail?: string;
  generatedAt: Date;
  /** Undefined for outputs older than batch tracking — rendered as
   *  "Earlier generation", never as a fabricated Batch ID. */
  batchId?: string;
  batchLabel?: string;
  module?: string;
  createdBy?: string;
}

function angleLabelFor(angleId?: string): string | undefined {
  if (!angleId) return undefined;
  return angles.find((a) => a.id === angleId)?.label;
}

/**
 * Every distinct hook line across the ad pool, newest first.
 *
 * Deduped case-insensitively on the line itself: a batch that produced four
 * variants of one line is one hook decision, not four, and four identical
 * rows each with its own Save button is how you end up with four identical
 * Assets entries. The newest occurrence wins, so the provenance shown is the
 * most recent ad that used the line.
 */
export function useGeneratedHookLines(): GeneratedHookLine[] {
  const localOutputs = useLocalOutputs();
  const batchIndex = useOutputBatchIndex();

  return useMemo(() => {
    const all: OutputData[] = [...localOutputs, ...sampleOutputs].sort(
      (a, b) => b.generatedAt.getTime() - a.generatedAt.getTime(),
    );
    const seen = new Set<string>();
    const rows: GeneratedHookLine[] = [];

    for (const output of all) {
      const text = output.headline?.trim();
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const batch = batchIndex.get(output.id);
      const brandId = output.priorConfig?.brandId;
      const brandName = output.brand?.name;

      rows.push({
        id: output.id,
        text,
        brandId,
        brandName,
        brandKey: brandId ?? brandName ?? "unattributed",
        angleId: output.angleId,
        angleLabel: angleLabelFor(output.angleId),
        supportingCopy: output.body,
        thumbnail: output.thumbnail,
        generatedAt: output.generatedAt,
        batchId: batch?.batchId,
        batchLabel: batch?.label,
        module: batch ? originLabel(batch.origin) : undefined,
        createdBy: batch?.createdBy,
      });
    }
    return rows;
  }, [localOutputs, batchIndex]);
}
