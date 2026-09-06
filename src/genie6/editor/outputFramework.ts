/**
 * Resolves the video editor's THREE non-crash outcomes for /iq/genie6/editor/:outputId
 * plus the two Framework-instance states the design system requires (§14, brief Task 5):
 *
 *  - "unknown"       — the id isn't in sampleOutputs at all (bad/stale link).
 *  - "no-video"      — the output exists but has no video to edit (image / text-only,
 *                       or the deliberate zero-data seed row `var_zerocase`).
 *  - "no-framework"  — the output IS a video, but no structure was detected on it
 *                       (§14's "no framework detected on this output" zero-data case).
 *  - "ready"         — a Framework INSTANCE for this specific output, in either the
 *                       "populated" or "partial" state.
 *
 * WHY AN "INSTANCE", NOT ONE OF THE SHARED `FRAMEWORKS` DIRECTLY
 * `FRAMEWORKS` (frameworks.ts) is the Catalogue's reusable TEMPLATE pool —
 * templates stay fully populated, because that's what a browsable asset
 * library should show. A single generated video's OWN breakdown is a clone
 * of one template with its thumbnails re-pointed at that video's actual
 * creative, and — for a deterministic subset, so "partial" is a real state
 * and not just a claim — its last section(s) missing a shot entirely
 * ("not generated yet"). Cloning also means editing one output's sections
 * (swap/regenerate) never mutates the shared template other outputs derive
 * from.
 */
import type { OutputData } from "../types/output";
import { FRAMEWORKS, type Framework, type FrameworkSection } from "./frameworks";

export type EditorAvailability =
  | { kind: "unknown" }
  | { kind: "no-video"; output: OutputData }
  | { kind: "no-framework"; output: OutputData }
  | { kind: "ready"; output: OutputData; framework: Framework; state: "populated" | "partial" };

/** Real templates only — Carousel Reveal (image-sequence) isn't a video breakdown. */
const VIDEO_TEMPLATES = FRAMEWORKS.filter((f) => f.mediaKind !== "image-sequence");

/** Deterministic (not `Math.random()`) so a given output ALWAYS resolves the
 *  same framework + state on every visit/refresh — same reasoning as
 *  appPickerData.ts's `pseudoDuration`. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function resolveEditorFramework(output: OutputData | undefined): EditorAvailability {
  if (!output) return { kind: "unknown" };
  if (output.mediaType !== "video") return { kind: "no-video", output };

  const h = hashId(output.id);
  // ~1 in 13 video outputs: no structure detected at all (e.g. var_bd_1).
  if (h % 13 === 0) return { kind: "no-framework", output };

  const template = VIDEO_TEMPLATES[h % VIDEO_TEMPLATES.length];
  // ~1 in 5 of the remainder: a real PARTIAL instance (e.g. var_sugar_1).
  const isPartial = h % 5 === 0;
  const lastIdx = template.sections.length - 1;

  const sections: FrameworkSection[] = template.sections.map((s, i) => {
    if (isPartial && i >= lastIdx - 1) {
      // Last two beats not generated yet — the honest "partial" reading.
      return { ...s, thumbnail: undefined, note: "Not generated yet — swap in a clip or regenerate this section." };
    }
    // A-roll beats re-point at the output's own creative (the same take
    // realistically recurs across hook/solution/cta on a short UGC ad);
    // b-roll beats keep the template's illustrative seed art.
    return s.roll === "a-roll" && output.thumbnail ? { ...s, thumbnail: output.thumbnail } : { ...s };
  });

  const framework: Framework = { ...template, id: `${template.id}--${output.id}`, sections };
  return { kind: "ready", output, framework, state: isPartial ? "partial" : "populated" };
}
