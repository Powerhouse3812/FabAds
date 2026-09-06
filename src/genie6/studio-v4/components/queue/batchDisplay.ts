import type { RunBatch, RunItem } from "@/genie6/lib/genieRunTypes";
import type { CreditLine } from "@/genie6/lib/credits";
import { buildCreditLines as wizardCreditLines, type WizardState } from "../../state/useWizard";
import { RETRY_MODEL_OPTIONS } from "./RetryModelPicker";

/**
 * Shared display helpers for the Results Queue's `RunBatch`-based surfaces.
 *
 * RunBatch (genieRunTypes.ts, a fixed cross-agent contract) has no arbitrary
 * `tags: string[]` field the way the old local `QueueBatch` mock did — every
 * surface that used to read `batch.tags` now derives a couple of short
 * labels from `batch.config` instead (format / approach / aspect ratio).
 */

const APPROACH_LABELS: Record<string, string> = {
  scratch: "From scratch",
  "create-variations": "Create Variations",
  "ugc-video": "UGC Video",
  "image-to-video": "Image to Video",
  broll: "B-Roll",
  "bg-remover": "BG Remover",
  resize: "Resize",
};

export function approachLabel(approach: string | undefined): string | undefined {
  if (!approach) return undefined;
  return APPROACH_LABELS[approach] ?? approach;
}

export function modelLabel(modelId: string | undefined): string | undefined {
  if (!modelId) return undefined;
  return RETRY_MODEL_OPTIONS.find((m) => m.id === modelId)?.label ?? modelId;
}

/** Small chip row derived from the batch's config snapshot. */
export function batchConfigChips(batch: RunBatch): string[] {
  const c = batch.config;
  if (!c) return [];
  const chips: string[] = [];
  if (c.format) chips.push(c.format === "video" ? "Video" : "Image");
  const approach = approachLabel(c.approach);
  if (approach) chips.push(approach);
  if (c.aspectRatio) chips.push(c.aspectRatio);
  return chips;
}

/**
 * §12 — concepts multi-select produces ONE batch with concept-grouped rows.
 * RunItem has no dedicated `conceptId` field (a deliberately lean contract —
 * see genieRunTypes.ts), so concept grouping is encoded in `RunItem.tags[0]`
 * at seed time (see Step5ResultsQueue's item seeding) and read back here.
 * Falls back to a single "Generation" group for non-concept runs (incl.
 * Product Shoot, which §12 explicitly excludes from concept fan-out).
 */
export function groupItemsByConcept(
  items: RunItem[],
): { label: string; items: RunItem[] }[] {
  const groups: { label: string; items: RunItem[] }[] = [];
  const indexByLabel = new Map<string, number>();
  for (const item of items) {
    const label = item.tags?.[0] ?? "Generation";
    let idx = indexByLabel.get(label);
    if (idx === undefined) {
      idx = groups.length;
      indexByLabel.set(label, idx);
      groups.push({ label, items: [] });
    }
    groups[idx].items.push(item);
  }
  return groups;
}

/**
 * §21.2 — "Credits need a breakdown, not just a number" / §7's credit
 * util-sharing fix: builds the SAME `CreditLine[]` shape Configure feeds into
 * `computeBreakdown()`, from wizard state, so Results can never show a
 * number Configure wouldn't also produce from the same inputs. Multiplier
 * grammar per spec: outputs × concepts × model × duration.
 */
export function buildCreditLines(
  state: Pick<WizardState, "count" | "selectedConceptIds" | "format" | "videoResolution" | "modelId">,
  isProductShoot: boolean,
): CreditLine[] {
  // ONE formula. This used to be a second copy that hardcoded the Model factor
  // to 1 while useWizard.ts's copy (Configure's Generate button) applied
  // MODEL_CREDIT_MULTIPLIER — so Genie 2.0 Pro quoted 12 on Configure and
  // charged 8 on Results, §21.2's exact complaint. Results, the dock and the
  // batch charge now all read the wizard's own line builder.
  // Product Shoot has no concept axis (§12) — zero it before pricing.
  return wizardCreditLines({
    ...(state as WizardState),
    selectedConceptIds: isProductShoot ? [] : state.selectedConceptIds,
  });
}

/** Stage names for StageProgress/BatchProgressHeader — §18 stage-wise, no fixed ETA. */
export function stagesForFormat(format: WizardState["format"]): string[] {
  return format === "video"
    ? ["Queued", "Scripting", "Rendering", "Encoding", "Finalizing"]
    : ["Queued", "Composing", "Rendering", "Finalizing"];
}
