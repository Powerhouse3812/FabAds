/**
 * Studio v3 — Audience mocks.
 *
 * Used by Audience pickers across Studio v3 forms (Brand → Product-focused
 * starts here in A-11.21). When real audience persistence + targeting wires
 * land in iter-8+, replace with a Supabase-backed list.
 *
 * Persona shape locked per Maalik:
 *   - Card UX is icon-led trait viz. No paragraphs.
 *   - Each persona ships a 2-line trait stack used by AudiencePicker.
 *   - Custom user-created audiences are appended to the same array shape.
 */

export type Gender = "f" | "m" | "x";

export interface Audience {
  id: string;
  name: string;
  /** ISO-style 2-letter geo code (rendered as a chip — no flag emoji). */
  geo: string;
  ageMin: number;
  ageMax: number;
  gender: Gender | "any";
  /** Role / life stage — e.g. "mum", "founder", "student". */
  role?: string;
  /** Up to 3 lifestyle / intent tags. */
  tags: string[];
  /** Optional brief — only present when user adds context in create modal. */
  brief?: string;
  language?: string;
  /** True for system-seeded personas; false for user-created. */
  system?: boolean;
}

export const audiences: Audience[] = [
  {
    id: "aud-young-urban-mums",
    name: "Young urban mums",
    geo: "IN",
    ageMin: 28,
    ageMax: 40,
    gender: "f",
    role: "mum",
    tags: ["metro", "premium", "health-led"],
    language: "Hindi · English",
    system: true,
  },
  {
    id: "aud-college-grads",
    name: "College grads, tier-1",
    geo: "IN",
    ageMin: 18,
    ageMax: 24,
    gender: "any",
    role: "student",
    tags: ["value-led", "trend-led", "social-buyer"],
    language: "English · Hindi",
    system: true,
  },
  {
    id: "aud-d2c-founders",
    name: "D2C founders, India",
    geo: "IN",
    ageMin: 28,
    ageMax: 45,
    gender: "any",
    role: "founder",
    tags: ["B2B-buyer", "premium", "ROI-led"],
    language: "English",
    system: true,
  },
  {
    id: "aud-fitness-enthusiasts",
    name: "Fitness enthusiasts",
    geo: "IN",
    ageMin: 22,
    ageMax: 38,
    gender: "any",
    role: "active",
    tags: ["health-led", "premium", "early-adopter"],
    language: "English",
    system: true,
  },
  {
    id: "aud-tier2-aspirational-men",
    name: "Tier-2 aspirational men",
    geo: "IN",
    ageMin: 25,
    ageMax: 38,
    gender: "m",
    role: "salaried",
    tags: ["aspirational", "value-led", "social-buyer"],
    language: "Hindi",
    system: true,
  },
  {
    id: "aud-us-global-shoppers",
    name: "Global shoppers, US",
    geo: "US",
    ageMin: 25,
    ageMax: 45,
    gender: "any",
    role: "professional",
    tags: ["premium", "international", "early-adopter"],
    language: "English",
    system: true,
  },
  {
    id: "aud-gifters-festive",
    name: "Festive gifters",
    geo: "IN",
    ageMin: 26,
    ageMax: 50,
    gender: "any",
    role: "gifter",
    tags: ["seasonal", "premium", "family-led"],
    language: "Hindi · English",
    system: true,
  },
];

/** Convenience: format an audience's age range. */
export function formatAge(a: Audience): string {
  return `${a.ageMin}–${a.ageMax}`;
}
