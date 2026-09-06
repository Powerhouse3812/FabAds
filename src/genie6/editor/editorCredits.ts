/**
 * Editor credit costs — derived, not literal.
 *
 * `VideoEditor` had `REGEN_VIDEO_CREDITS = 18` and `FrameworkEditor` had
 * `regenCost() → a-roll ? 4 : 2`. Two hardcoded figures, unrelated to each
 * other and unrelated to every other price in the product — so regenerating a
 * 20-second clip and a 3-minute film quoted the same 18 credits, and the whole
 * video cost 18 while its five sections summed to ~14. §21.2's complaint is
 * exactly this ("Configure says 4 credits, the Results edit bar says 24 — a 6×
 * jump with no explanation"), and §15 requires the cost to be shown ON the
 * action, which only means something if the figure is derived from something.
 *
 * Everything here goes through `computeBreakdown()` in src/genie6/lib/credits.ts
 * — the single path to a charged total — and returns named `CreditLine`s so the
 * UI can show the multipliers rather than a bare number.
 */
import { computeBreakdown, type CreditBreakdown, type CreditLine } from "../lib/credits";
import type { Framework, FrameworkSection } from "./frameworks";

/**
 * Credits per minute of rendered video.
 *
 * Sits between the two comparable per-minute rates the locked §8 app table
 * already publishes — Upscale Video at 11/minute and Face Swap at 13/minute —
 * because a Genie video render is the same order of work. Picking a number
 * inside that published band keeps the editor consistent with prices the user
 * has already seen elsewhere in the product.
 */
export const VIDEO_CREDITS_PER_MINUTE = 12;

/**
 * A-roll is the performance itself (avatar, dialogue, lip-sync); B-roll is
 * cutaway footage. Regenerating the former is materially more work, which is
 * the real distinction the old `a-roll ? 4 : 2` literal was reaching for.
 */
const A_ROLL_FACTOR = 1;
const B_ROLL_FACTOR = 0.5;

/**
 * Cost for a span of video, PROPORTIONAL to its real length.
 *
 * An earlier version billed in whole minutes with a one-minute floor, which
 * collapsed the very distinction this file exists to draw: these outputs run
 * 30-60 seconds, so a 6-second Hook section and the entire film both rounded
 * to "1 minute" and both quoted 12 credits. Charging the same for a sixth of
 * the work as for all of it is worse than the literals it replaced.
 *
 * So: per-minute is the RATE (the unit §15 wants stated), but the charge is
 * proportional, with a 1-credit floor so nothing is ever free.
 */
function spanCost(seconds: number, factor: number): number {
  return Math.max(1, Math.ceil((seconds / 60) * VIDEO_CREDITS_PER_MINUTE * factor));
}

export function frameworkSeconds(framework: Framework): number {
  return framework.sections.reduce(
    (max, s) => Math.max(max, s.endSec),
    0,
  );
}

/** Whole-video regeneration — the full duration at the per-minute rate. */
export function wholeVideoBreakdown(framework: Framework): CreditBreakdown {
  const secs = frameworkSeconds(framework);
  const lines: CreditLine[] = [
    { label: "Duration", factor: spanCost(secs, 1), op: "base", note: `${secs}s` },
    {
      label: "Rate",
      factor: 1,
      op: "multiply",
      note: `${VIDEO_CREDITS_PER_MINUTE} credits / min`,
    },
  ];
  return computeBreakdown(lines);
}

/**
 * One-section regeneration — the section's own duration, not the film's, times
 * the roll factor. This is what makes five section regenerations cost about
 * what one whole-video regeneration costs, instead of the two prices being
 * unrelated numbers.
 */
export function sectionBreakdown(section: FrameworkSection): CreditBreakdown {
  const secs = Math.max(1, section.endSec - section.startSec);
  const rollFactor = section.roll === "a-roll" ? A_ROLL_FACTOR : B_ROLL_FACTOR;
  const lines: CreditLine[] = [
    { label: "Section", factor: spanCost(secs, rollFactor), op: "base", note: `${secs}s` },
    {
      label: section.roll === "a-roll" ? "A-roll" : "B-roll",
      factor: 1,
      op: "multiply",
      note: section.roll === "a-roll" ? "performance" : "cutaway · half rate",
    },
  ];
  return computeBreakdown(lines);
}
