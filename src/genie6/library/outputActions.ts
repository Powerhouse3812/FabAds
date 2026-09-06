/**
 * Output actions — pure helper logic behind the Library's ellipsis/footer
 * actions. Kept framework-free (no React, no navigate/toast) so the wiring
 * hook (`useOutputCardActions.tsx`) stays a thin adapter over this.
 */
import type { FlowActionId } from "../flows/flowTypes";
import { flowSearchParams } from "../flows/flowTypes";
import type { RunOrigin } from "../lib/genieRunTypes";
import { startBatch } from "../lib/genieRunStore";
import { getWinnerAdsForEntity } from "@/mocks/shared/winnerAds";
import { brands } from "@/mocks/shared/brands";
import type { MediaType, OutputData } from "../types/output";

/** §18 stage names for a plain regenerate/forge run — no fixed ETA, just names. */
export const REGENERATE_STAGES = ["Queued", "Generating", "Finishing"];

/** Flat per-item credit estimate for a Library-initiated regenerate/forge.
 *  Studio's real cost preview (src/genie6/lib/credits.ts) drives the
 *  Configure screen; this is the Library's own quick-action, so it uses a
 *  representative flat rate rather than re-deriving Studio's multiplier
 *  chain from a card it has incomplete config for. */
export const REGENERATE_CREDITS_PER_ITEM = 4;

/**
 * Studio entry point that resolves `?src&ref&act` via resolveFlowContext().
 *
 * This pointed at `/iq/genie6/generate` — the LEGACY studio (GenerateLanding),
 * which is deprioritized in the sub-nav and never reads the flow params. So
 * every Library variation action navigated to a screen that silently ignored
 * the context: no banner, no pre-fill, no variation. Only Studio Alpha wires
 * resolveFlowContext.
 *
 * The step slug is per-ACTION, not one constant, because §6 splits the two
 * cases and the slug in the path now wins over the resolved landingStep:
 *   Rule 1, a variation asks nothing        → configure
 *   Rule 2, a "use/reference" asks who for  → product
 * A single constant would have forced Rule-2 actions onto Configure, skipping
 * the mandatory entity question — the precise thing Rule 2 exists to prevent.
 */
const STUDIO_BASE = "/iq/genie6/studio-alpha";

/** Rule 1 actions land on Configure; everything else stops at Step 2. */
const ASKS_NOTHING = new Set<FlowActionId>([
  "vary-script",
  "vary-concept",
  "vary-whole-video",
  "generate-variation",
  "refresh-fatigued",
]);

function studioFlowUrl(output: OutputData, action: FlowActionId): string {
  const sp = flowSearchParams("creative-library", output.id, action);
  const slug = ASKS_NOTHING.has(action) ? "configure" : "product";
  return `${STUDIO_BASE}/${slug}?${sp.toString()}`;
}

/** KB cap from §11 — "Knowledge Base capacity, as built: ... Winner Ads (50 max)". */
export const KB_WINNER_ADS_MAX = 50;

export function startRegenerate(
  output: OutputData,
  opts: { count: number; origin?: RunOrigin; label?: string },
): string {
  const origin: RunOrigin = opts.origin ?? { kind: "studio" };
  const label =
    opts.label ??
    (opts.count > 1
      ? `${output.brand?.name ?? "Untitled"} · ${opts.count} more like this`
      : `${output.brand?.name ?? "Untitled"} · Regenerate`);
  return startBatch({
    origin,
    label,
    stages: REGENERATE_STAGES,
    count: opts.count,
    creditsPerItem: REGENERATE_CREDITS_PER_ITEM,
    config: {
      format: output.format,
      brandName: output.brand?.name,
      productName: output.product?.name,
      promptSnippet: output.priorConfig?.promptSnippet,
    },
  });
}

/** True when the output has media worth downloading (var_zerocase / pure
 *  text-only outputs have nothing to save — the caller should disable the
 *  menu item rather than fire a silent no-op). */
export function canDownloadMedia(output: OutputData): boolean {
  return Boolean(output.thumbnail) && output.mediaType !== "text-only";
}

/** Triggers a real browser download of the output's media. Caller should
 *  have checked `canDownloadMedia` first. */
export function downloadOutputMedia(output: OutputData) {
  if (!output.thumbnail) return;
  const a = document.createElement("a");
  a.href = output.thumbnail;
  a.download = `${output.id}.jpg`;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Builds the Studio URL for a "Vary X" action — Rule 1 (§6): asks nothing,
 *  lands on Configure. Source module is "creative-library" per this task's
 *  brief (the Library's own outputs enter the flow system the same way a
 *  Creative-Library ad does — §7.6 "non-Genie assets get the same actions"
 *  cuts both ways: Genie's own library outputs get flow-grade actions too). */
export function varyActionUrl(
  output: OutputData,
  action: Extract<
    FlowActionId,
    "vary-script" | "vary-concept" | "vary-whole-video" | "generate-variation"
  >,
): string {
  return studioFlowUrl(output, action);
}

export function referenceForNewAdUrl(output: OutputData): string {
  return studioFlowUrl(output, "reference-for-new-ad");
}

/** §11 KB cap check, keyed off the output's brand. Returns null when the
 *  output has no attributable brand (can't check a cap with nothing to key
 *  it on) — caller treats that as "allow" since there's nothing to violate. */
export function kbCapForOutput(
  output: OutputData,
): { atCap: boolean; count: number; max: number } | null {
  const brand = output.brand?.name
    ? brands.find((b) => b.name.toLowerCase() === output.brand?.name.toLowerCase())
    : undefined;
  if (!brand) return null;
  const count = getWinnerAdsForEntity("brand", brand.id).length;
  return { atCap: count >= KB_WINNER_ADS_MAX, count, max: KB_WINNER_ADS_MAX };
}

let cloneSeq = 0;
function nextCloneId(base: string, tag: string): string {
  cloneSeq += 1;
  return `${base}-${tag}-${cloneSeq}`;
}

/** "Save text-only to Library" — a real new card, not a flag: this is the
 *  one Library action whose whole premise is a new item appearing, so it
 *  actually creates one (held in libraryActionsStore.localOutputs, never
 *  written into the immutable sample-outputs.ts array). */
export function cloneTextOnly(output: OutputData): OutputData {
  return {
    ...output,
    id: nextCloneId(output.id, "text"),
    mediaType: "text-only" as MediaType,
    thumbnail: undefined,
    generatedAt: new Date(),
    parentWinnerId: undefined,
    siblings: undefined,
  };
}

/** "Save media-only to Library" — strips copy, keeps the visual. */
export function cloneMediaOnly(output: OutputData): OutputData {
  return {
    ...output,
    id: nextCloneId(output.id, "media"),
    headline: undefined,
    body: undefined,
    cta: undefined,
    generatedAt: new Date(),
    siblings: undefined,
  };
}
