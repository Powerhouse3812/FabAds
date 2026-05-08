import type { BrandId, ProductId, CategoryId, AngleId } from "@/genie6/types/entities";

/**
 * Knowledge Base instructions — entity-keyed.
 *
 * Distinct from `src/genie6/studio-v4/data/kbInstructions.ts` (which is
 * angle-keyed and powers the prompt-bar warning). This file is the
 * Catalogue-side source of truth: instructions belong to a Brand /
 * Product / Category, and can be the entity's "main" instruction (1
 * per entity), an angle-specific override, or a "custom" rule set
 * (campaigns / festivals / specific product lines).
 *
 * Sync rule: when the user creates a custom or main instruction from
 * the Catalogue Detail page, push to this list. The angle-keyed
 * instructions in `studio-v4/data/kbInstructions.ts` continue to drive
 * the in-Studio "Using:" hint until they're folded into this entity-
 * level model in a future iteration.
 */

export type EntityType = "brand" | "product" | "category";
export type EntityId = BrandId | ProductId | CategoryId;

export interface KbInstruction {
  id: string;
  /** Owning entity. */
  entityType: EntityType;
  entityId: EntityId;
  /** Whether this is the "main" instruction for the entity (1 per entity), a
   *  user-created custom set, or an angle-specific override. */
  kind: "main" | "custom" | "angle";
  /** For angle-specific (kind: "angle"), which angles this covers. Empty otherwise. */
  anglesCovered: AngleId[];
  name: string;
  description: string;
  content: string;
  source: "default" | "manual" | "uploaded" | "ai-generated";
  createdAt: Date;
}

/** Seed data — at least 2-3 brands and 2-3 products with main + custom + angle instructions. */
export const KB_INSTRUCTIONS: KbInstruction[] = [
  // Brand main + custom + angle
  {
    id: "ki-mamaearth-main",
    entityType: "brand",
    entityId: "mamaearth",
    kind: "main",
    anglesCovered: [],
    name: "Mamaearth — main",
    description: "Mamaearth tone of voice and messaging guardrails.",
    content:
      "Lead with 'natural', 'gentle', 'safe for the family'. Emphasise toxin-free + dermatologically tested. Avoid medical claims.",
    source: "default",
    createdAt: new Date("2026-04-01"),
  },
  {
    id: "ki-mamaearth-custom-1",
    entityType: "brand",
    entityId: "mamaearth",
    kind: "custom",
    anglesCovered: [],
    name: "Festive campaigns — Mamaearth",
    description: "Diwali / Raksha Bandhan / Mother's Day messaging.",
    content:
      "Frame products as gifts. Open with relationship moment. Close with offer + free shipping.",
    source: "manual",
    createdAt: new Date("2026-04-15"),
  },
  {
    id: "ki-mamaearth-custom-2",
    entityType: "brand",
    entityId: "mamaearth",
    kind: "custom",
    anglesCovered: [],
    name: "Performance ads — Mamaearth",
    description: "Direct-response performance creative rules.",
    content:
      "Lead with the problem in frame 1. Show the product solving it by frame 3. Price + offer + free-trial overlay in last second.",
    source: "manual",
    createdAt: new Date("2026-04-22"),
  },
  {
    id: "ki-mamaearth-angle-hero",
    entityType: "brand",
    entityId: "mamaearth",
    kind: "angle",
    anglesCovered: ["hero"],
    name: "Mamaearth — Hero shot",
    description: "Studio packshot guidance for Mamaearth hero ads.",
    content:
      "Center the bottle on a soft beige bg. Add 1 ingredient (onion / argan) flat-lay next to it. Brand colors = forest green + cream.",
    source: "default",
    createdAt: new Date("2026-04-02"),
  },

  // Plum brand main
  {
    id: "ki-plum-main",
    entityType: "brand",
    entityId: "plum",
    kind: "main",
    anglesCovered: [],
    name: "Plum — main",
    description: "Plum tone — clean, ingredient-forward, science-backed.",
    content:
      "Hero the ingredient (Vit C, niacinamide, retinol). Use clinical-feeling type. Keep palette pastel + clean white.",
    source: "default",
    createdAt: new Date("2026-04-03"),
  },
  {
    id: "ki-plum-custom-1",
    entityType: "brand",
    entityId: "plum",
    kind: "custom",
    anglesCovered: [],
    name: "First-time buyer — Plum",
    description: "New customer acquisition messaging.",
    content:
      "Lead with the ₹50-off-first-order chip. Pair with 'why thousands switched to Plum' framing. Soft CTA.",
    source: "manual",
    createdAt: new Date("2026-04-18"),
  },

  // Product main + custom
  {
    id: "ki-onion-shampoo-main",
    entityType: "product",
    entityId: "mamaearth-onion-shampoo",
    kind: "main",
    anglesCovered: [],
    name: "Onion Shampoo — main",
    description: "Onion Shampoo product guardrails.",
    content:
      "Hero benefit = reduces hair fall in 4 weeks. Hero ingredient = onion. Hero proof = 5,000+ verified reviews.",
    source: "default",
    createdAt: new Date("2026-04-01"),
  },
  {
    id: "ki-onion-shampoo-custom-1",
    entityType: "product",
    entityId: "mamaearth-onion-shampoo",
    kind: "custom",
    anglesCovered: [],
    name: "Bundle promo — Onion Shampoo",
    description: "Buy-2-get-1 messaging variant.",
    content:
      "Lead with 'Buy 2 Get 1 Free'. Show 3 bottles in a single packshot. Yellow-highlight the offer chip.",
    source: "manual",
    createdAt: new Date("2026-04-25"),
  },
  {
    id: "ki-vc-facewash-main",
    entityType: "product",
    entityId: "mamaearth-vc-facewash",
    kind: "main",
    anglesCovered: [],
    name: "VC Facewash — main",
    description: "Vitamin C facewash product rules.",
    content:
      "Lead with '20% Vit C complex'. Show texture / glow shot, never a face shot first. Pair with brightening claim.",
    source: "default",
    createdAt: new Date("2026-04-04"),
  },

  // Category main
  {
    id: "ki-haircare-main",
    entityType: "category",
    entityId: "hair-care",
    kind: "main",
    anglesCovered: [],
    name: "Hair Care — main",
    description: "Hair Care category messaging baseline.",
    content:
      "Lead with the most-frustrating problem (fall / dandruff / dryness). Show before/after where compliant. Cite verified reviews.",
    source: "default",
    createdAt: new Date("2026-03-15"),
  },
  {
    id: "ki-haircare-custom-1",
    entityType: "category",
    entityId: "hair-care",
    kind: "custom",
    anglesCovered: [],
    name: "Monsoon hair-care — category",
    description: "Seasonal monsoon hair-fall + frizz messaging.",
    content:
      "Open on humidity / monsoon visual. Pivot to anti-frizz / scalp-care benefit. Close with seasonal-bundle CTA.",
    source: "manual",
    createdAt: new Date("2026-04-12"),
  },
  {
    id: "ki-skincare-main",
    entityType: "category",
    entityId: "skin-care",
    kind: "main",
    anglesCovered: [],
    name: "Skin Care — main",
    description: "Skin Care category messaging baseline.",
    content:
      "Visible-claims first (X% reduction in fine lines, dark spots in 4 weeks). Texture shots > face shots.",
    source: "default",
    createdAt: new Date("2026-03-15"),
  },
];

/** Find KB instructions for a given entity. */
export function getInstructionsForEntity(
  entityType: EntityType,
  entityId: EntityId,
  customInstructions: KbInstruction[] = [],
): { main: KbInstruction | null; custom: KbInstruction[]; angles: KbInstruction[] } {
  const all = [...KB_INSTRUCTIONS, ...customInstructions].filter(
    (i) => i.entityType === entityType && i.entityId === entityId,
  );
  return {
    main: all.find((i) => i.kind === "main") ?? null,
    custom: all.filter((i) => i.kind === "custom"),
    angles: all.filter((i) => i.kind === "angle"),
  };
}

/** Find an instruction matching a given angle for an entity, falling back to main. */
export function findEntityInstructionForAngle(
  entityType: EntityType,
  entityId: EntityId,
  angleId: AngleId | null,
  customInstructions: KbInstruction[] = [],
): KbInstruction | null {
  const { main, angles } = getInstructionsForEntity(
    entityType,
    entityId,
    customInstructions,
  );
  if (!angleId) return main;
  return angles.find((a) => a.anglesCovered.includes(angleId)) ?? main;
}
