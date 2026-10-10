/** Creative Element Insights — tab vocabulary shared by the page, table and overlay. */
import type { ElementType } from "@/lib/insights-v3/types";

export const ELEMENT_TAB_KEYS: ElementType[] = ["framework", "hook", "angle", "concept"];

/** Plural nouns for chips, counts and empty copy. The tab is "Hook", so the noun is "hooks". */
export const ELEMENT_NOUN: Record<ElementType, string> = {
  framework: "frameworks",
  hook: "hooks",
  angle: "angles",
  concept: "concepts",
};

export const ELEMENT_NOUN_SINGULAR: Record<ElementType, string> = {
  framework: "framework",
  hook: "hook",
  angle: "angle",
  concept: "concept",
};
