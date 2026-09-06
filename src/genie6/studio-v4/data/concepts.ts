import { sampleOutputs } from "../../mocks/sample-outputs";
import { concepts as sharedConcepts } from "@/mocks/shared/concepts";
import { KB_CONCEPTS } from "@/mocks/shared/kbConcepts";

export type ConceptCategory = "hero" | "story" | "lifestyle" | "promo";

export interface Concept {
  id: string;
  emoji: string;
  name: string;
  /** 1-line, ~10-15 words, what this concept does */
  desc: string;
  category: ConceptCategory;
  /**
   * Reference to a representative sample output (from
   * `src/genie6/mocks/sample-outputs.ts`). The thumbnail + brand metadata
   * come from looking up this ID — keeps Studio v4 visually synced with
   * the rest of Genie 6's data (Catalogue ↔ Genie ↔ Workspace).
   */
  sampleOutputId: string;
}

export const CONCEPT_CATEGORIES: { id: ConceptCategory; label: string; emoji: string }[] = [
  { id: "hero",      label: "Hero",      emoji: "🎯" },
  { id: "story",     label: "Story",     emoji: "📖" },
  { id: "lifestyle", label: "Lifestyle", emoji: "🌅" },
  { id: "promo",     label: "Promo",     emoji: "🔥" },
];

export const CONCEPTS: Concept[] = [
  // Hero (3) — clean, product-forward
  { id: "c-hero-pack",      emoji: "📦", name: "Hero Pack",        desc: "Clean studio shot with the product front and center on a minimal backdrop.",            category: "hero",      sampleOutputId: "var_mama_2" },
  { id: "c-detail-macro",   emoji: "🔬", name: "Detail Macro",     desc: "Tight close-up showcasing texture, finish, and craftsmanship.",                          category: "hero",      sampleOutputId: "var_plum_2" },
  { id: "c-bundle-stack",   emoji: "🎁", name: "Bundle Stack",     desc: "Product range arranged together — communicates variety and value.",                     category: "hero",      sampleOutputId: "var_boat_2" },

  // Story (3) — narrative-led
  { id: "c-founder-note",   emoji: "✍️", name: "Founder Note",     desc: "Personal voice from the founder — origin, purpose, conviction.",                        category: "story",     sampleOutputId: "var_mama_4" },
  { id: "c-before-after",   emoji: "🔄", name: "Before / After",   desc: "Side-by-side transformation showing the product's effect over time.",                   category: "story",     sampleOutputId: "var_wake_2" },
  { id: "c-heritage",       emoji: "🏛️", name: "Heritage Craft",   desc: "Roots, materials, and process — slow-build trust through provenance.",                   category: "story",     sampleOutputId: "var_s8m1q5z" },

  // Lifestyle (3) — context + mood
  { id: "c-morning-ritual", emoji: "☕", name: "Morning Ritual",   desc: "Product in a daily routine — relaxed, aspirational, real-feel.",                        category: "lifestyle", sampleOutputId: "var_mama_5" },
  { id: "c-fest-scene",     emoji: "🎊", name: "Festive Scene",    desc: "Festival-coded styling for Diwali, Raksha Bandhan, weddings.",                          category: "lifestyle", sampleOutputId: "var_noise_2" },
  { id: "c-ugc-creator",    emoji: "📱", name: "UGC Creator Look", desc: "Phone-shot, authentic-creator framing — high relate, low polish.",                      category: "lifestyle", sampleOutputId: "var_mama_3" },

  // Promo (3) — urgency + offer
  { id: "c-flash-sale",     emoji: "⚡", name: "Flash Sale",       desc: "Hard offer with timer / limited-stock framing.",                                         category: "promo",     sampleOutputId: "var_boat_5" },
  { id: "c-bogo",           emoji: "🎯", name: "Buy 1 Get 1",      desc: "Stack-the-deal framing — emphasize quantity + savings.",                                category: "promo",     sampleOutputId: "var_boat_3" },
  { id: "c-launch-tease",   emoji: "🚀", name: "Launch Tease",     desc: "New-drop reveal — countdown, waitlist, exclusivity.",                                   category: "promo",     sampleOutputId: "var_n9k3v1m" },
];

/**
 * Resolve a concept id to Studio's `Concept` shape — from EITHER universe.
 *
 * WHY THIS FALLBACK EXISTS
 * Genie has two concept id spaces that were never bridged:
 *   - Studio's own curated 12 (`CONCEPTS` above, ids `c-*`)
 *   - the shared Catalogue/KB universe that the Concepts page, the Catalogue
 *     and Genie Brain all browse (`concepts` → `concept-*`, `KB_CONCEPTS` →
 *     `kc-*`)
 * §12 requires "Use concept to generate" and multi-select ("one ad per
 * concept, all in a single batch") to hand a chosen concept to Studio. Those
 * hand-offs carry shared ids, so before this fallback existed they resolved to
 * nothing and the whole §12 flow was inert — the URL param arrived, matched no
 * `c-*` id, and Configure showed zero concepts selected.
 *
 * Rather than duplicate 50+ shared concepts into Studio's file (two sources of
 * truth for the same asset type, the exact thing §21.1's Catalogue merge
 * exists to stop), this adapts a shared concept on read. Studio-native
 * concepts still win, so nothing about the existing 12 changes.
 */
export function getConceptById(id: string): Concept | undefined {
  const native = CONCEPTS.find((c) => c.id === id);
  if (native) return native;
  return adaptSharedConcept(id);
}

/** Maps a shared concept's free-text angle/tone onto Studio's 4 categories.
 *  Deliberately coarse — the category only drives grouping in the picker. */
function categoryForText(text: string): ConceptCategory {
  const t = text.toLowerCase();
  if (/offer|discount|sale|deal|urgen|scarcit|fomo|promo|bundle/.test(t)) return "promo";
  if (/story|founder|origin|heritage|journey|testimonial|before/.test(t)) return "story";
  if (/lifestyle|ritual|routine|everyday|in.use|aspiration|moment/.test(t)) return "lifestyle";
  return "hero";
}

/**
 * Adapts a Catalogue (`concept-*`) or KB (`kc-*`) concept into Studio's shape.
 * Returns undefined for an unknown id so a hand-edited URL degrades to "no
 * concept selected" rather than throwing.
 */
export function adaptSharedConcept(id: string): Concept | undefined {
  const cat = sharedConcepts.find((c) => c.id === id);
  if (cat) {
    return {
      id: cat.id,
      // No emoji glyph for adapted concepts — the Studio-native 12 carry one
      // as legacy data, but DS §7 bans emoji in product UI, so anything
      // rendering these must fall back to a lucide icon on an empty string.
      emoji: "",
      name: cat.name,
      desc: cat.visualDirection,
      category: categoryForText(`${cat.angle} ${cat.tone} ${cat.format}`),
      // Adapted concepts have no curated sample output; getConceptVisuals()
      // returns null for them, which its callers already handle.
      sampleOutputId: "",
    };
  }
  const kb = KB_CONCEPTS.find((c) => c.id === id);
  if (kb) {
    return {
      id: kb.id,
      emoji: "",
      name: kb.name,
      desc: kb.visualDirection || kb.description,
      category: categoryForText(`${kb.angle ?? ""} ${kb.tone}`),
      sampleOutputId: "",
    };
  }
  return undefined;
}

/** Every id that `getConceptById` can resolve — used to filter a `?concepts=`
 *  param down to real concepts before it reaches wizard state. */
export function isKnownConceptId(id: string): boolean {
  return getConceptById(id) !== undefined;
}

export function getConceptsByCategory(category: ConceptCategory): Concept[] {
  return CONCEPTS.filter((c) => c.category === category);
}

/**
 * Resolve a concept's thumbnail + brand metadata via its `sampleOutputId`.
 * Returns `{ thumbnail, brand }` or `null` if the sample-output isn't
 * found (defensive — should always resolve in mock mode).
 */
export function getConceptVisuals(concept: Concept): {
  thumbnail: string | undefined;
  brand: string | undefined;
} | null {
  const sample = sampleOutputs.find((s) => s.id === concept.sampleOutputId);
  if (!sample) return null;
  return {
    thumbnail: sample.thumbnail,
    brand: sample.brand?.name,
  };
}
