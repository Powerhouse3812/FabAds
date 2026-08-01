/**
 * Element composer — cross-creative element picking inside Compare
 * (replaces the standalone Brief Builder screen, deleted alongside this).
 *
 * Same prefill contract Brief Builder used (BLOCK_META there): each
 * text-based element maps to one real `Creative` field, never a fabricated
 * string. "Media only" and "Framework" are handled outside this table since
 * neither is a plain text prefill (media has no text; framework is
 * analysis-gated — see frameworkGate.ts).
 */
import type { Creative } from "@/data/model";
import type { ElementKey } from "./types";

export interface TextElementMeta {
  key: Extract<
    ElementKey,
    "hook" | "headline" | "primaryText" | "cta" | "visualDirection" | "offer"
  >;
  label: string;
  rows: number;
  prefill: (c: Creative) => string;
}

/** The six plain-text elements, in the order they're offered/reviewed. */
export const TEXT_ELEMENT_META: TextElementMeta[] = [
  { key: "hook", label: "Hook", rows: 2, prefill: (c) => c.script.sections.hookLine },
  { key: "headline", label: "Headline", rows: 1, prefill: (c) => c.components.headline },
  {
    key: "primaryText",
    label: "Primary text",
    rows: 3,
    prefill: (c) => c.components.primaryText,
  },
  { key: "cta", label: "CTA", rows: 1, prefill: (c) => c.script.sections.ctaLine },
  {
    key: "visualDirection",
    label: "Visual direction",
    rows: 2,
    prefill: (c) => `${c.tags.visualFormat} — ${c.components.visualStyle}`,
  },
  { key: "offer", label: "Offer", rows: 1, prefill: (c) => c.tags.offerType },
];

export function frameworkPrefill(c: Creative): string {
  return c.script.framework;
}
