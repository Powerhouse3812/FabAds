import { angles } from "@/mocks/shared/angles";
import { ANGLE_CHIP_LABEL } from "../../studio-v4/components/PromptReferenceBar";

/**
 * Resolve an angle id to something a human should read.
 *
 * WHY THIS EXISTS: there are two angle-id universes, and Studio's own summary
 * falls through to printing the raw id when it meets one it doesn't know
 * (`ANGLE_CHIP_LABEL[id] ?? id` in `useContextSummary.ts`). The variations
 * flow seeds its cards from the analysis, which uses `angles.ts` ids — so a
 * card rendered "ANGLE ang-asp-lifestyle" on screen. A slug is never an
 * acceptable label, so this checks both universes and, failing both,
 * humanises rather than leaking the id verbatim.
 */

const BY_ID = new Map(angles.map((a) => [a.id, a.label]));

/** Strips a known id prefix and title-cases the rest: "ang-asp-lifestyle" → "Lifestyle". */
function humanise(id: string): string {
  const tail = id.replace(/^ang[-_](asp[-_])?/i, "").replace(/[-_]+/g, " ").trim();
  if (!tail) return "Auto";
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

export function angleLabel(angleId: string | null | undefined): string | null {
  if (!angleId) return null;
  return ANGLE_CHIP_LABEL[angleId] ?? BY_ID.get(angleId) ?? humanise(angleId);
}
