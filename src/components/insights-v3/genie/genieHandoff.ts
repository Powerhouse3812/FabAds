/**
 * Industry Insights V2 → Genie hand-off (Q11).
 *
 * Uses the EXISTING flow contract of the `industry-insights` module
 * (src/genie6/flows): `?src=industry-insights&ref=iiv2:<adId>&act=<action>`.
 * - Ad      → the ad itself. Default `winner-as-reference` only when the ad
 *             passes the Winner rule, else `generate-variation`; an explicit
 *             `action` always wins.
 * - Element → the element's top example ad in the current scope, `use-<type>`,
 *             ref `iiv2:<adId>@<type>` so the banner names the element.
 *             The element value travels on that ad's own analysis (`hook`,
 *             `elements.angle|framework|concept` on the resolved ref).
 * Every action fired here must be listed by the module, or resolveFlowContext
 * returns null and Studio opens bare — so this checks the resolver before
 * handing out a path, and reports a reason instead.
 */
import { ALL, type Ad, type ElementType, type SavedItemRef, type Scope } from "@/lib/insights-v3/types";
import { ELEMENT_TYPE_LABEL, MODULE_NOW, getAd, getAds } from "@/lib/insights-v3/data";
import { adsInScope, isWinner, pickExampleAd, type UserPrefs } from "@/lib/insights-v3/selectors";
import { flowSearchParams, type FlowActionId } from "@/genie6/flows/flowTypes";
import { FLOW_ACTIONS, getFlowModule } from "@/genie6/flows/data/flowRegistry";
import { v2InsightsRefId } from "@/genie6/flows/data/flowSources";
import { resolveFlowContext } from "@/genie6/flows/data/resolveFlowContext";

export const GENIE_FLOW_MODULE = "industry-insights" as const;

/**
 * Default action for an AD target. "Winner ad as reference" is only true of an
 * ad that passes THE Winner rule (`isWinner`: active + days + clones, never
 * likes) — one definition everywhere. Any other ad goes as a neutral
 * "make a variation of this ad".
 */
export const AD_GENIE_ACTION = {
  winner: "winner-as-reference",
  other: "generate-variation",
} as const satisfies Record<string, FlowActionId>;

export function defaultAdAction(ad: Ad): FlowActionId {
  return isWinner(ad) ? AD_GENIE_ACTION.winner : AD_GENIE_ACTION.other;
}

/** Default action per element type. */
export const DEFAULT_GENIE_ACTION: Record<ElementType, FlowActionId> = {
  framework: "use-framework",
  hook: "use-hook",
  angle: "use-angle",
  concept: "use-concept",
};

export type GenieHandoff =
  | { ok: true; path: string; adId: string; action: FlowActionId }
  | { ok: false; reason: string };

/** The ad's value for one element type. */
export function elementValueOf(ad: Ad, type: ElementType): string | null {
  switch (type) {
    case "framework": return ad.analysis.framework;
    case "hook": return ad.analysis.hookStyle;
    case "angle": return ad.analysis.angle;
    case "concept": return ad.analysis.concept;
  }
}

/**
 * The element's top example ad: in scope first, then anywhere (so a narrow
 * scope never kills the hand-off). For a hook, only ads that quote a hook
 * line qualify — that line is what `use-hook` carries.
 */
export function exampleAdForElement(
  type: ElementType,
  id: string,
  scope: Scope,
  prefs?: UserPrefs,
  ads: Ad[] = getAds(),
): Ad | null {
  const usable = (a: Ad) => elementValueOf(a, type) === id && (type !== "hook" || !!a.analysis.hookText?.trim());
  const scoped = adsInScope(ads, scope, { now: MODULE_NOW, prefs }).filter(usable);
  return pickExampleAd(scoped) ?? pickExampleAd(ads.filter(usable));
}

/** Studio route slug for a landing step (mirrors SendToGenieMenu's private helper). */
function landingSlug(step: number | undefined): "format" | "product" | "configure" {
  if (step === 1) return "format";
  if (step === 4) return "configure";
  return "product";
}

/** Builds the Genie path for a V2 target, or the reason it can't. Pure. */
export function buildGenieHandoff(
  target: SavedItemRef,
  opts: { action?: string; scope?: Scope; prefs?: UserPrefs } = {},
): GenieHandoff {
  const scope: Scope = opts.scope ?? { industry: ALL, category: ALL, period: "all", myPrefsOnly: false };
  let ad: Ad | null | undefined;
  let fallback: FlowActionId;
  if (target.type === "ad") {
    ad = getAd(target.id);
    if (!ad) return { ok: false, reason: "This ad is no longer available." };
    fallback = defaultAdAction(ad);
  } else if (target.type === "framework" || target.type === "hook" || target.type === "angle" || target.type === "concept") {
    ad = exampleAdForElement(target.type, target.id, scope, opts.prefs);
    fallback = DEFAULT_GENIE_ACTION[target.type];
    if (!ad) {
      return {
        ok: false,
        reason:
          target.type === "hook"
            ? "No ad quotes a hook line in this style yet, so there's nothing to hand to Genie."
            : `No ad uses this ${ELEMENT_TYPE_LABEL[target.type].toLowerCase()} yet, so there's nothing to hand to Genie.`,
      };
    }
  } else {
    return { ok: false, reason: "Genie has no flow for this item." };
  }

  const action = (opts.action ?? fallback) as FlowActionId;
  const mod = getFlowModule(GENIE_FLOW_MODULE);
  const flowAction = FLOW_ACTIONS[action];
  if (!mod || !flowAction || !mod.actions.includes(action)) {
    return { ok: false, reason: "Genie can't take this action from Industry Insights." };
  }

  // An element hand-off names the element in the ref, so Genie's banner shows
  // what was handed ("Hook · Callout — from …"), not only the example ad.
  const refId = target.type === "ad" ? v2InsightsRefId(ad.id) : v2InsightsRefId(ad.id, target.type);
  const sp = flowSearchParams(GENIE_FLOW_MODULE, refId, action);
  if (flowAction.toOtherApps) return { ok: true, path: `/iq/genie6/apps?${sp.toString()}`, adId: ad.id, action };
  const ctx = resolveFlowContext(sp);
  if (!ctx) return { ok: false, reason: "Genie couldn't open this item. Try another ad." };
  return { ok: true, path: `/iq/genie6/studio-alpha/${landingSlug(ctx.landingStep)}?${sp.toString()}`, adId: ad.id, action };
}
