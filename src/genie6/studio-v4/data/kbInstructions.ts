export interface KbInstruction {
  id: string;
  name: string;
  description: string;
  /** Which angles this instruction covers. Empty array = generic / fallback. */
  anglesCovered: string[];
  content: string;
  source: "default" | "manual" | "uploaded" | "ai-generated";
}

/**
 * Mock KB instructions. Coverage is intentionally INCOMPLETE so the warning
 * flow can be demonstrated:
 *   - hero / lifestyle / social-proof / ugc-style / infographic — covered
 *   - urgency / comparison / unboxing — INTENTIONALLY UNCOVERED so the
 *     "create instruction" warning shows when those angles are picked.
 */
export const KB_INSTRUCTIONS: KbInstruction[] = [
  {
    id: "ki-hero-shot",
    name: "Hero shot guide",
    description: "Centered packshot, premium lighting, brand-clean.",
    anglesCovered: ["hero", "lifestyle"],
    content:
      "Place product center-frame on a neutral background. Use soft directional light from upper-left at 45°. Avoid clutter.",
    source: "default",
  },
  {
    id: "ki-social-proof",
    name: "Social proof framing",
    description: "Lead with reviews, ratings, or customer counts.",
    anglesCovered: ["social-proof"],
    content:
      "Open with a 5-star review quote overlay. Mention exact customer count (e.g. 12,000+ reviews). Show real customer photo if possible.",
    source: "default",
  },
  {
    id: "ki-ugc-style",
    name: "UGC creator voice",
    description: "Casual, hand-held, authentic Gen Z tone.",
    anglesCovered: ["ugc-style"],
    content:
      "Speak in first person. Mention what surprised you. Use 1 light, fast cut every 2 seconds. End with 'link in bio'.",
    source: "default",
  },
  {
    id: "ki-infographic",
    name: "Infographic format",
    description: "Iconographic feature breakdown.",
    anglesCovered: ["infographic"],
    content:
      "Use 3 icon rows with 1-line benefit each. Brand colors only. No prose copy.",
    source: "default",
  },
];

/** Returns the instruction matching the given angle, or null if none covers it. */
export function findInstructionForAngle(
  angleId: string | null,
  customInstructions: KbInstruction[] = [],
): KbInstruction | null {
  if (!angleId) {
    // No angle picked — Genie picks a default instruction (first one).
    return KB_INSTRUCTIONS[0] ?? null;
  }
  const all = [...KB_INSTRUCTIONS, ...customInstructions];
  return all.find((i) => i.anglesCovered.includes(angleId)) ?? null;
}
