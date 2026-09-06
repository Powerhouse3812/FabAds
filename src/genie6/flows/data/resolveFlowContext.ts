/**
 * Other Flows — URL → FlowContext resolver (Genie 2.0 §5, §6, §7).
 *
 * WHY THIS DEGRADES INSTEAD OF THROWING
 * A flow's whole identity lives in three URL params (see flowTypes.ts's file
 * header). That means a bookmarked link, a stale share, or someone hand-
 * editing the address bar can point at a module/ref/action combination that
 * no longer exists — a ref that got pruned from the catalogue, an action a
 * module never actually offered, a typo. None of that should ever crash
 * Studio; it should just fall back to plain Studio, unbannered. Every lookup
 * below is written to return `null` on the first thing that doesn't check
 * out, never to throw.
 *
 * This file does NOT decide what the highlight/preselect/caveat RULES are on
 * a case-by-case basis per module — those decisions already live on the data
 * (FlowModule.competitorOwned, FlowAction.preselectEntity, FlowModule.
 * staticOnlyNote, FlowSourceRef.detectedEntity/sourceFormat). This file is
 * just the one place that reads them in the right order.
 */
import type { FlowActionId, FlowContext, FlowModuleKey, FlowSourceRef } from "../flowTypes";
import { FLOW_PARAM_ACT, FLOW_PARAM_REF, FLOW_PARAM_SRC } from "../flowTypes";
import { FLOW_ACTIONS, getFlowModule } from "./flowRegistry";
import { DEFAULT_BRAND_ID, DEFAULT_BRAND_NAME, getFlowSource } from "./flowSources";
import type { WizardState } from "../../studio-v4/state/useWizard";

/**
 * Rule 1's variation family — asks nothing, pre-filled, lands on Configure.
 * "Refresh a fatigued creative" (§7.3) belongs here too: it re-runs THIS
 * SAME running ad, it does not seed a new one for a possibly different
 * brand, so it behaves like a variation, not like "Use X". flowRegistry.ts's
 * FLOW_ACTIONS comment documents the identical list for anyone reading that
 * file instead of this one — this is the only place the classification is
 * actually USED (for the format-caveat rule below), so it's kept local
 * rather than exported as a second source of truth.
 */
const VARIATION_ACTION_IDS = new Set<FlowActionId>([
  "vary-script",
  "vary-concept",
  "vary-whole-video",
  "generate-variation",
  "refresh-fatigued",
]);

export function resolveFlowContext(sp: URLSearchParams): FlowContext | null {
  const srcRaw = sp.get(FLOW_PARAM_SRC);
  const refRaw = sp.get(FLOW_PARAM_REF);
  const actRaw = sp.get(FLOW_PARAM_ACT);
  if (!srcRaw || !refRaw || !actRaw) return null;

  const module = getFlowModule(srcRaw as FlowModuleKey);
  if (!module) return null;

  const action = FLOW_ACTIONS[actRaw as FlowActionId];
  if (!action) return null;
  // The action has to be one this module actually lists — a hand-edited URL
  // pairing a real module with an action it never carries (e.g. Campaign
  // URLs + "vary-script") degrades to plain Studio, not to a banner for a
  // combination nobody designed.
  if (!module.actions.includes(action.id)) return null;

  const ref = getFlowSource(refRaw);
  if (!ref || ref.module !== module.key) return null;

  const landingStep: 2 | 4 = action.asksNothing ? 4 : 2;

  // §7.2's critical rule overrides everything else: a competitor-owned
  // module (Industry Insights) NEVER highlights the source's own brand, no
  // matter what the ref's detectedEntity says — getting this wrong would
  // suggest the user build an ad for a rival. Every other module falls back
  // to the ref's detected entity, and finally to the user's own default
  // brand when nothing was detected (Campaign URLs' "no match" branch, and
  // most of Video Sage's fictional-product titles).
  // Ref-level too: Dashboard carries Insights' competitor rows ("boAt ·
  // Competitor") under a module that is NOT competitor-owned as a whole.
  const competitorOwned = !!module.competitorOwned || !!ref.competitorOwned;
  const highlight = competitorOwned
    ? { kind: "brand" as const, id: DEFAULT_BRAND_ID, name: DEFAULT_BRAND_NAME }
    : (ref.detectedEntity ?? { kind: "brand" as const, id: DEFAULT_BRAND_ID, name: DEFAULT_BRAND_NAME });

  // Rule 4's one documented exception (§7.5) — Campaign URLs actually
  // pre-selects when the extraction matched a catalogue product. Every other
  // action only ever highlights, never selects outright.
  const preselect = action.preselectEntity && !!ref.extraction?.matchedProductId;

  // §7.3 — varying a flexible/carousel ad is static-only for now, and the
  // banner has to say so plainly, not bury it in fine print. Reports carries
  // its own worded note (module.staticOnlyNote); anything else that happens
  // to combine a variation action with a carousel/flexible source gets a
  // plain generic version instead of silently dropping the warning.
  const caveat =
    VARIATION_ACTION_IDS.has(action.id) && (ref.sourceFormat === "carousel" || ref.sourceFormat === "flexible")
      ? (module.staticOnlyNote ??
        `This creative is a ${ref.sourceFormat} ad — the variation Genie produces will be a single static creative.`)
      : undefined;

  return {
    module,
    action,
    ref,
    landingStep,
    highlight,
    preselect,
    competitorOwned,
    produces: action.produces,
    caveat,
  };
}

function applyHighlight(patch: Partial<WizardState>, highlight: NonNullable<FlowContext["highlight"]>): void {
  if (highlight.kind === "brand") patch.brandId = highlight.id;
  else if (highlight.kind === "product") patch.productId = highlight.id;
  else patch.categoryId = highlight.id;
}

/**
 * Rule-1 pre-fill for a resolved flow. Everything here is either "continuing
 * the exact same thing" (variation family — safe to set entity ids and mode
 * directly) or "context to seed the prompt with" (reference/trend/url
 * families — never an entity id, Step 2 still has to ask per Rule 2).
 */
export function flowInitialPatch(ctx: FlowContext): Partial<WizardState> {
  const { action, ref, highlight, preselect } = ctx;
  const patch: Partial<WizardState> = { step: ctx.landingStep };

  // Format — Carousel/Flexible aren't real Studio formats (Format is
  // image|video only); both fold to "image", which is also exactly what
  // §7.3 says the output will be for those two source formats.
  if (ref.sourceFormat) {
    patch.format = ref.sourceFormat === "video" ? "video" : "image";
  }

  // Rule 1 — only the variation family (and Campaign URLs' documented
  // pre-select exception) are allowed to set an entity id directly, because
  // only they are continuing something that already has one. Every other
  // action leaves brandId/productId/categoryId untouched (null) so Step 2
  // still makes the user choose explicitly — ctx.highlight is what shows the
  // suggestion there; this function is what would silently skip asking.
  if (action.asksNothing && highlight) {
    applyHighlight(patch, highlight);
    if (VARIATION_ACTION_IDS.has(action.id)) patch.mode = "create-variations";
  }
  if (action.id === "generate-from-url" && preselect && highlight) {
    applyHighlight(patch, highlight);
    patch.mode = "scratch";
  }

  // vary-script — the script came FROM this source and has already been
  // seen once; approving it outright stops §21.2's script gate from
  // re-blocking a flow that isn't touching the script at all.
  if (action.id === "vary-script") {
    patch.scriptApproved = true;
  }

  // §6 Rule 1 — "A variation asks nothing. Everything carries over, the user
  // just generates." Configure's Generate button is gated on a non-empty
  // prompt, so a variation that carried over everything EXCEPT the prompt
  // still landed on a disabled button — which is the flow asking for
  // something, i.e. exactly what Rule 1 forbids. Seeding the prompt from the
  // source is what makes "just generates" literally true. Editable, of course
  // — it's a head start, not a lock.
  if (VARIATION_ACTION_IDS.has(action.id)) {
    patch.prompt = variationPrompt(action.id, ref);
  }

  // Reference-family actions attach the source as a REFERENCE, never as a
  // selected entity — Step 2 still asks who the new ad is for, same as any
  // other Rule-2 flow.
  // §7.2 — "What travels to Genie: the WHOLE AD as a reference." Industry
  // Insights refs deliberately carry no detectedEntity (nothing of ours to
  // detect in a rival's ad), so the attach must not be gated on it — the
  // old `&& ref.detectedEntity` guard meant the one module this action was
  // specified for attached nothing ("Attached · 0").
  if (
    action.id === "winner-as-reference" ||
    (action.id === "generate-against-trend" && ctx.competitorOwned)
  ) {
    patch.attachedReferences = [
      {
        id: ref.id,
        source: ctx.competitorOwned
          ? "industry-insights"
          : ref.detectedEntity?.kind === "product"
            ? "product-winner-ads"
            : "brand-winner-ads",
        label: ref.title,
        thumbnail: ref.thumbnail,
      },
    ];
  }
  if (action.id === "reference-for-new-ad" || action.id === "top-performer-as-reference") {
    // AttachSource (useWizard.ts) has no dedicated "reports" or
    // "creative-library" value yet — "library" is the closest existing fit
    // for both (a running or saved ad that plausibly already lives in the
    // Library). Not a perfect model; called out in the build report as a
    // contract gap worth a real value rather than silently added here.
    patch.attachedReferences = [{ id: ref.id, source: "library", label: ref.title, thumbnail: ref.thumbnail }];
  }

  // Trends — the trend fills the angle as free text (§7.4). Trends' angles
  // aren't catalogue angle ids, so angleId can't carry this; it rides in the
  // prompt as a head start instead, same as Campaign URLs' extraction below.
  if (action.id === "generate-against-trend" || action.id === "script-from-trend") {
    // Industry Insights offers "generate against this trend" too (§7.2) but
    // its refs have no trendAngle — without this fallback that action seeded
    // nothing at all and opened a bare Step 2.
    patch.prompt = ref.trendAngle
      ? `${ref.trendAngle} — inspired by "${ref.title}"`
      : `Build a new ad around the angle behind "${ref.title}".`;
  }

  // Campaign URLs — the extraction is visible and editable in its own card
  // (§7.5); this is just the prompt head start built from the same data.
  if (action.id === "generate-from-url" && ref.extraction) {
    const { product, offer, claims } = ref.extraction;
    patch.prompt = `${product} — ${offer}. ${claims.join(", ")}.`;
  }

  // §5 / BRIEF: count is NEVER hardcoded here, even for entry points that
  // name a number (e.g. "Make 10 more") — the stepper on Configure always
  // owns it. No `patch.count = …` anywhere in this function, on purpose.

  return patch;
}

/**
 * The carried-over prompt for each variation level. Each says what is being
 * KEPT and what is being changed, because that distinction is the whole
 * difference between the three named actions (§7.1 splits variation into three
 * deliberately — there is no generic "generate variation" for these sources).
 */
function variationPrompt(id: FlowActionId, ref: FlowSourceRef): string {
  const subject = `"${ref.title}"`;
  switch (id) {
    case "vary-script":
      return `Keep the visuals of ${subject}. Write a new script with the same offer and proof.`;
    case "vary-concept":
      return `Keep the script of ${subject}. Take it to a new visual concept.`;
    case "vary-whole-video":
      return `Remake ${subject} end to end — new script and new visuals, same product and promise.`;
    case "refresh-fatigued":
      return `${subject} is fatiguing. Same offer, fresh hook and visuals.`;
    default:
      return `A new take on ${subject} — same core idea, fresh execution.`;
  }
}
