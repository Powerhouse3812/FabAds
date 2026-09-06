/**
 * Avatar / voice taxonomy — Genie 2.0 §11, §13.
 *
 * "Avatars are categorised by environment and personality, so choosing one is
 * fast rather than a scroll through a flat list. That same categorisation —
 * or a filter built on it — must also appear in Genie's own avatar-selection
 * step. The two must not diverge."
 *
 * This is the ONE place that categorisation is defined. `GenieBrain` browses
 * it, `AvatarVoicePicker` filters by it — both import from here, neither
 * redefines it. `src/mocks/shared/avatars.ts` tags every avatar with an
 * `environmentId` / `personalityId` from the lists below.
 *
 * Two entries are deliberately sized to exercise edge cases the brief calls
 * out explicitly ("1 avatar in a category · a category with 0 avatars"):
 *  - environment "car-interior" — 0 avatars tagged into it.
 *  - personality "no-nonsense-value" — exactly 1 avatar tagged into it.
 * Don't "fix" these by rebalancing — they're the empty/singleton states a
 * picker has to render correctly, not an authoring gap.
 */
import type { Brand } from "@/genie6/types/entities";

export interface TaxonomyOption {
  id: string;
  label: string;
}

/** Realistic Indian D2C UGC shoot settings — not generic "location A/B/C". */
export const AVATAR_ENVIRONMENTS: TaxonomyOption[] = [
  { id: "home-kitchen", label: "Home kitchen" },
  { id: "studio-seamless", label: "Studio seamless" },
  { id: "office-desk", label: "Office desk" },
  { id: "outdoor-street", label: "Outdoor street" },
  { id: "gym", label: "Gym" },
  { id: "retail-aisle", label: "Retail aisle" },
  { id: "bathroom-vanity", label: "Bathroom vanity" },
  { id: "living-room", label: "Living room" },
  // Deliberately empty (0 avatars tagged) — the "category with 0 avatars" edge case.
  { id: "car-interior", label: "Car interior" },
];

export type EnvironmentId = (typeof AVATAR_ENVIRONMENTS)[number]["id"];

export const AVATAR_PERSONALITIES: TaxonomyOption[] = [
  { id: "warm-friend", label: "Warm friend" },
  { id: "calm-expert", label: "Calm expert" },
  { id: "high-energy-hype", label: "High-energy hype" },
  { id: "dry-deadpan", label: "Dry deadpan" },
  { id: "aspirational", label: "Aspirational" },
  { id: "girl-next-door", label: "Girl-next-door" },
  { id: "trusted-elder", label: "Trusted elder" },
  // Deliberately singleton (1 avatar tagged) — the "1 avatar in a category" edge case.
  { id: "no-nonsense-value", label: "No-nonsense value" },
];

export type PersonalityId = (typeof AVATAR_PERSONALITIES)[number]["id"];

export function environmentLabel(id: string | null | undefined): string {
  return AVATAR_ENVIRONMENTS.find((e) => e.id === id)?.label ?? "Unspecified";
}

export function personalityLabel(id: string | null | undefined): string {
  return AVATAR_PERSONALITIES.find((p) => p.id === id)?.label ?? "Unspecified";
}

/**
 * Voice tones — §13 upgrade 3, "friendly, authoritative, energetic and so on,
 * tied to brand voice." Real descriptions, not label-only chips.
 */
export const VOICE_TONES: { id: string; label: string; desc: string }[] = [
  { id: "friendly", label: "Friendly", desc: "Warm and approachable — reads like a recommendation from someone you trust." },
  { id: "authoritative", label: "Authoritative", desc: "Confident and credential-led — earns trust through expertise, not volume." },
  { id: "energetic", label: "Energetic", desc: "High-tempo, upbeat delivery built for short-form hooks and drops." },
  { id: "calm", label: "Calm", desc: "Measured pace, reassuring — for premium, wellness, or design-led reads." },
  { id: "playful", label: "Playful", desc: "Light, witty, a little cheeky — for Gen Z and lifestyle-first reads." },
  { id: "empathetic", label: "Empathetic", desc: "Soft, understanding — leads with the customer's problem before the pitch." },
  { id: "premium", label: "Premium", desc: "Polished, unhurried — for luxury, heritage, and clinical positioning." },
  { id: "direct", label: "Direct", desc: "No-frills, price-and-fact forward — for performance and DR creative." },
];

export type ToneId = (typeof VOICE_TONES)[number]["id"];

export function toneLabel(id: string | null | undefined): string {
  return VOICE_TONES.find((t) => t.id === id)?.label ?? "Unspecified";
}

export function toneDesc(id: string | null | undefined): string | undefined {
  return VOICE_TONES.find((t) => t.id === id)?.desc;
}

/**
 * Keyword → tone classifier. Shared by `src/mocks/shared/voices.ts` (tags
 * each voice's `tones[]` straight off its already-authored description, so
 * the tags never drift from the copy a human wrote) and `matchBrandTone`
 * below (reads the SAME signal off a brand's `voice`/`tone` text so "tied to
 * brand voice" is one mechanism, not two guesses that can disagree).
 */
const TONE_KEYWORDS: Record<string, RegExp> = {
  friendly: /warm|friendly|caring|motherly|relatable|approachable|honest|family/i,
  authoritative: /authorit|deep|expert|credential|clinical|documentary|wise|dermatolog|no-nonsense/i,
  energetic: /energetic|sharp|fast-paced|bright|upbeat|gen ?z|streetwear|hype|bold/i,
  calm: /calm|soft-spoken|narrative|soothing|measured|design-led|quiet/i,
  playful: /witty|cheeky|slang|expressive|fun|playful|stylish|fashion-forward|fashion-savvy/i,
  empathetic: /soft\b|soothing|understanding|gentle|intimate|caring/i,
  premium: /premium|refined|polished|luxury|heritage|elegant|received pronunciation/i,
  direct: /direct|confident|no-nonsense|crisp|bold|performance|straightforward/i,
};

export function classifyTones(text: string): string[] {
  const matches = Object.entries(TONE_KEYWORDS)
    .filter(([, re]) => re.test(text))
    .map(([id]) => id);
  return matches.length > 0 ? matches : ["friendly"];
}

/** Tone pairs that read as contradictory when both are true at once. Not
 *  exhaustive — just the pairs a brand-voice mismatch actually surfaces. */
export const TONE_CONFLICTS: [string, string][] = [
  ["authoritative", "playful"],
  ["calm", "energetic"],
  ["premium", "direct"],
  ["empathetic", "energetic"],
];

export interface BrandToneMatch {
  /** Tones the brand's own voice/tone copy reads as. */
  matchedIds: string[];
  /** Tones that conflict with at least one matched tone. */
  conflictIds: string[];
}

/**
 * §13: "tone selection ... tied to brand voice." Reads the SAME keyword
 * signal used to tag every voice (`classifyTones`) off the brand's own
 * `voice`/`tone` copy, so a brand and a voice are compared on one scale
 * instead of two independent guesses.
 *
 * Never blocks a choice — a conflicting tone is still selectable. This is
 * information, not a gate (NN/g #3 user control and freedom).
 */
export function matchBrandTone(
  brand: Pick<Brand, "voice" | "tone"> | null | undefined,
): BrandToneMatch {
  if (!brand) return { matchedIds: [], conflictIds: [] };
  const matched = classifyTones(`${brand.voice ?? ""} ${brand.tone ?? ""}`);
  const conflictSet = new Set<string>();
  for (const id of matched) {
    for (const [a, b] of TONE_CONFLICTS) {
      if (a === id) conflictSet.add(b);
      if (b === id) conflictSet.add(a);
    }
  }
  matched.forEach((m) => conflictSet.delete(m));
  return { matchedIds: matched, conflictIds: Array.from(conflictSet) };
}
