/** Item model + AttachedRef mapping for the V2 section of Genie's Industry Insights picker. */
import type { AttachedRef, ReferenceContext } from "@/genie6/studio-v4/state/useWizard";
import { DEFAULT_SCOPE, type Ad, type ElementType, type SavableType } from "@/lib/insights-v3/types";
import { ELEMENT_TYPE_LABEL, getElement } from "@/lib/insights-v3/data";
import { v2InsightsRefId } from "@/genie6/flows/data/flowSources";
import { elementValueOf, exampleAdForElement } from "./genieHandoff";

export type PickType = "ad" | ElementType;
export type Filter = "all" | PickType;

export const PICK_TYPES: PickType[] = ["ad", "framework", "hook", "angle", "concept"];
export const ELEMENT_TYPES: ElementType[] = ["framework", "hook", "angle", "concept"];
export const MARKET_PER_TYPE = 5;

export const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  ad: "Ads",
  framework: "Frameworks",
  hook: "Hooks",
  angle: "Angles",
  concept: "Concepts",
};

const CONTEXT_FOR: Record<PickType, ReferenceContext> = {
  ad: "whole-ad",
  framework: "structure",
  hook: "copy",
  angle: "copy",
  concept: "concept",
};

export interface V2PickItem {
  key: string;
  type: PickType;
  id: string;
  title: string;
  /** Second line: provenance / evidence. */
  meta: string;
  thumbnail: string | null;
  /** Ads using it (elements only). */
  adsUsing?: number;
  /** Verbatim hook line from the example ad (hooks only). */
  quote?: string | null;
}

export const isPickType = (t: SavableType): t is PickType => (PICK_TYPES as string[]).includes(t);

/** Ads using each element value, over the whole universe. */
export function usageCounts(ads: Ad[]): Record<ElementType, Map<string, number>> {
  const out = { framework: new Map(), hook: new Map(), angle: new Map(), concept: new Map() } as Record<ElementType, Map<string, number>>;
  for (const a of ads) {
    for (const t of ELEMENT_TYPES) {
      const v = elementValueOf(a, t);
      if (v) out[t].set(v, (out[t].get(v) ?? 0) + 1);
    }
  }
  return out;
}

export function adItem(ad: Ad, meta: string): V2PickItem {
  return {
    key: `ad:${ad.id}`,
    type: "ad",
    id: ad.id,
    title: ad.headline,
    meta: `${ad.pageName} · ${meta}`,
    thumbnail: ad.thumbnailUrl,
  };
}

export function elementItem(type: ElementType, id: string, meta: string, counts: Record<ElementType, Map<string, number>>): V2PickItem | null {
  const el = getElement(type, id);
  if (!el) return null;
  const ex = exampleAdForElement(type, id, DEFAULT_SCOPE);
  return {
    key: `${type}:${id}`,
    type,
    id,
    title: el.label,
    meta,
    thumbnail: ex?.thumbnailUrl ?? null,
    adsUsing: counts[type].get(id) ?? 0,
    quote: type === "hook" ? (ex?.analysis.hookText ?? null) : null,
  };
}

/** Builds the attachable reference for one picked item. */
export function toAttachedRef(item: V2PickItem): AttachedRef {
  if (item.type === "ad") {
    return {
      id: v2InsightsRefId(item.id),
      source: "industry-insights",
      label: item.title,
      ...(item.thumbnail ? { thumbnail: item.thumbnail } : {}),
      context: CONTEXT_FOR.ad,
    };
  }
  const head = `${ELEMENT_TYPE_LABEL[item.type]} · ${item.title}`;
  return {
    id: `iiv2-${item.type}:${item.id}`,
    source: "industry-insights",
    label: item.quote ? `${head} — “${item.quote}”` : head,
    ...(item.thumbnail ? { thumbnail: item.thumbnail } : {}),
    context: CONTEXT_FOR[item.type],
  };
}
