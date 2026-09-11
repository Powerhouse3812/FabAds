/**
 * Other Flows — URL → FlowContext resolver (Genie 2.0 §5, §6, §7).
 *
 * WHY THIS DEGRADES INSTEAD OF THROWING
 * A flow's whole identity lives in four URL params (see flowTypes.ts's file
 * header). That means a bookmarked link, a stale share, or someone hand-
 * editing the address bar can point at a module/ref/action/target combination
 * that no longer exists — a ref that got pruned from the catalogue, an action
 * a module never actually offered, a target that action can't reach, a typo.
 * None of that should ever crash Studio; it should just fall back to plain
 * Studio, or to the action's default target. Every lookup below is written to
 * return `null` on the first thing that doesn't check out, never to throw.
 *
 * This file does NOT decide what the highlight/preselect/caveat RULES are on
 * a case-by-case basis per module — those decisions already live on the data
 * (FlowModule.competitorOwned, FlowAction.preselectEntity, FlowModule.
 * staticOnlyNote, FlowSourceRef.detectedEntity/sourceFormat). This file is
 * just the one place that reads them in the right order.
 *
 * ASSETS TOO, NOT ONLY ADS (2026-09-08) — `target`/`source`/`isVariation` are
 * new here. Landing step used to be a literal `action.asksNothing ? 4 : 2`;
 * it is now the resolved plan's own first visible step
 * (`resolveGenerationSteps`, useWizard.ts, read-only) — which also correctly
 * handles the one case the old literal couldn't: a target only reachable AS A
 * VARIATION (today, concept ← concept), which must ask nothing and land last,
 * exactly like the original Ad-variation family, even though its action
 * (`use-concept`) has `asksNothing: false`.
 */
import type { FlowAction, FlowActionId, FlowContext, FlowModuleKey, FlowSourceRef } from "../flowTypes";
import {
  FLOW_PARAM_ACT,
  FLOW_PARAM_REF,
  FLOW_PARAM_SRC,
  FLOW_PARAM_TARGET,
  FLOW_PARAM_TWEAK,
} from "../flowTypes";
import { FLOW_ACTIONS, getFlowModule } from "./flowRegistry";
import { DEFAULT_BRAND_ID, DEFAULT_BRAND_NAME, getFlowSource } from "./flowSources";
import type { Format, GenerationTarget, WizardState } from "../../studio-v4/state/useWizard";
import { isFreeGeneration, isValidSourceForTarget, resolveGenerationSteps } from "../../studio-v4/state/useWizard";

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

/**
 * The script gate (2026-09-09). An action whose `source` is "script" makes
 * exactly one promise: the SCRIPT ITSELF travels (`FlowSourceRef.script`).
 * Only Video Sage's analysed videos actually hold one — and only 6 of its 8
 * rows, the other two being the still-analysing and the failed video. Where
 * the hand-off used to arrive with `generationSource: "script"` and an empty
 * `script`, Studio auto-wrote one locally via `deriveScriptText` and
 * Configure labelled that local draft "Same script · <module>". The UI
 * stated a provenance that was false.
 *
 * Industry Insights, Reports and Creative Library USED to list `use-script`
 * against rows that carry ad copy — headline, primary text, description —
 * and never a script, so the action was disabled on every single one of
 * their rows. They no longer list it at all (flowRegistry.ts, 2026-09-09);
 * this gate is what still catches a stale bookmark or a hand-edited URL
 * pointing at one of those combinations.
 *
 * Same fail-closed shape as a hookless trend under `use-hook`: this ONE
 * action is unavailable on that row, everything else the row offers still
 * works, and the sentence gives the truthful reason instead of "needs
 * analysis" (Video Sage's analysing row IS gated on analysis; this gate is
 * for the rows that pass that check and still hold no script).
 *
 * Keyed off `action.source`, never an id list, so any future action that
 * declares it hands the wizard script content is gated by the same rule
 * without a second list to keep in sync.
 *
 * @returns the human sentence when the action can't be honoured on this ref,
 *          else null. Exported because the two surfaces that OFFER actions
 *          (FlowModuleDetail's `isUnpickable`, SendToGenieMenu's `blocked`)
 *          must block the same rows this resolver refuses, or the user picks
 *          a live-looking action and lands in a bare, unbannered Studio.
 */
export function missingCarriedScriptReason(action: FlowAction, ref: FlowSourceRef | undefined): string | null {
  if (action.source !== "script") return null;
  if (hasCarriedScript(ref)) return null;
  return "No script on this one — only an analysed Video Sage video carries one";
}

/**
 * Does this ref actually hold script TEXT? Trimmed, because a truthiness test
 * passes a whitespace-only string — which then travels as "the script", shows
 * a "Same script" chip over nothing, and blocks Studio's auto-writer from
 * filling the empty field (the writer skips any non-null `script`). The value
 * itself is never trimmed on the way through: whitespace inside a real script
 * is its formatting, and rewriting the source's text would be its own small
 * lie about provenance.
 */
function hasCarriedScript(ref: FlowSourceRef | undefined): boolean {
  return typeof ref?.script === "string" && ref.script.trim().length > 0;
}

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

  // Analysis gate. `requiresAnalysis` was UI-only until now — FlowModuleDetail
  // and SendToGenieMenu grey the row out, but a hand-typed or stale URL walked
  // straight past them and Studio rendered a banner promising content the ref
  // does not carry (`?act=use-hook` on a trend with no hook line claimed a
  // hook, then seeded nothing). The gate belongs HERE, next to every other
  // "does this combination actually exist" check, so the UI block and the URL
  // block cannot disagree. Degrades to plain Studio like every other failed
  // lookup in this file — never throws, per the file header's invariant.
  // `ref.blockedReason` is the human sentence for the same condition; it stays
  // a UI concern (this function has no surface to say it on).
  if (action.requiresAnalysis && !ref.analysed) return null;

  // Content gate, for the same reason and in the same place: an action that
  // promises the script travels must not resolve on a ref that has none, or
  // Studio renders a banner and a "Same script" chip over content it never
  // received. See `missingCarriedScriptReason` above for the full note.
  if (missingCarriedScriptReason(action, ref)) return null;

  // Target — `?tgt` when it names one of THIS action's declared targets,
  // else the action's own default (its first entry, always "ad" for every
  // action whose `source` is "none"). A hand-edited `?tgt=storyboard` on an
  // action that can't reach it (e.g. use-script) is exactly the kind of
  // stale/bad URL this file exists to degrade gracefully from, not throw on.
  const targetRaw = sp.get(FLOW_PARAM_TARGET) as GenerationTarget | null;
  const target: GenerationTarget =
    targetRaw && action.targets.includes(targetRaw) ? targetRaw : action.targets[0];

  // Rule 1, fully resolved. `action.asksNothing` covers the original Ad-
  // variation family (vary-script/vary-concept/vary-whole-video/generate-
  // variation/refresh-fatigued) unconditionally. The OR clause covers the
  // one case that's about the (target, source) PAIR rather than the action
  // itself — today, only concept ← concept — via the exact same check
  // `isValidSourceForTarget`'s own `isVariation` branch uses: valid as a
  // variation but NOT valid as a plain pair.
  const isVariation =
    action.asksNothing ||
    (!isValidSourceForTarget(target, action.source) && isValidSourceForTarget(target, action.source, true));

  // Landing step — the resolved plan's OWN first visible step, never a
  // literal. `ref.sourceFormat` seeds the format the same way
  // `flowInitialPatch` below does, so Storyboard's video-only gate sees the
  // same value Configure eventually will. Two rules override everything, in
  // the order `resolveGenerationSteps` itself applies them: a variation asks
  // nothing and lands on the last step (beats even Ad's own rule); otherwise
  // an Ad — and, by the same "start the wizard fresh" logic, any asset
  // target too — starts at Step 1, which is also where the target picker
  // itself lives.
  const format: Format | null = ref.sourceFormat ? (ref.sourceFormat === "video" ? "video" : "image") : null;
  const landingStep = resolveGenerationSteps(target, action.source, { isVariation, format }).visibleSteps[0];

  // Asset generation is free (Script/Concept/Storyboard) — Ad is the only
  // priced target. See `isFreeGeneration` (useWizard.ts) — this file never
  // computes a rate, only echoes whether one applies.
  const free = isFreeGeneration(target);

  // Banner sentence for THIS resolved target — per-target override first,
  // falling back to the action's generic line (also what FlowModuleDetail's
  // action card shows before a target is even chosen).
  const produces = action.producesByTarget?.[target] ?? action.produces;

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
    target,
    source: action.source,
    isVariation,
    landingStep,
    highlight,
    preselect,
    competitorOwned,
    free,
    produces,
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
 *
 * @param ctx The resolved flow context from the URL params (src/ref/act).
 * @param sp The raw URL search params, used to read edited extraction values
 *           for Campaign URLs (xp/xo/xc) that override ref.extraction.
 */
export function flowInitialPatch(ctx: FlowContext, sp?: URLSearchParams): Partial<WizardState> {
  const { action, ref, highlight, preselect } = ctx;
  const patch: Partial<WizardState> = {
    step: ctx.landingStep,
    // NEW (2026-09-08) — the wizard's own generation-target contract
    // (`resolveGenerationStepsForState`, useWizard.ts) reads these three off
    // state, not off the URL, so every flow hand-off has to seed them at
    // construction same as everything else here. `ctx.source`/`ctx.target`
    // already resolved (and validated) in resolveFlowContext — never
    // re-derived here.
    generationTarget: ctx.target,
    generationSource: ctx.source,
    isVariation: ctx.isVariation,
  };

  // §7 — the variation fork's "Customize first" branch. Still a variation, so
  // `isVariation` above stays true and the prompt carry-over further down is
  // untouched; `variationTweak` is what stops `resolveGenerationSteps` from
  // collapsing the wizard to Configure, and Step 2 is where there is actually
  // something to change. Gated on the variation family so a stray `?tweak=1`
  // on any other action is inert rather than quietly re-routing it.
  if (sp?.get(FLOW_PARAM_TWEAK) === "1" && VARIATION_ACTION_IDS.has(action.id)) {
    patch.variationTweak = true;
    patch.step = 2;
  }

  // Format — Carousel/Flexible aren't real Studio formats (Format is
  // image|video only); both fold to "image", which is also exactly what
  // §7.3 says the output will be for those two source formats.
  if (ref.sourceFormat) {
    patch.format = ref.sourceFormat === "video" ? "video" : "image";
  }

  // Rule 1 — only the ORIGINAL Ad-variation family (`action.asksNothing`,
  // not `ctx.isVariation` — see below) are allowed to set an entity id
  // directly and a Mode, because only they are continuing something that
  // already has one and are approach-shaped (`Mode` is an Ad-approach
  // concept — concept ← concept variation isn't). Every other action leaves
  // brandId/productId/categoryId untouched (null) so Step 2 still makes the
  // user choose explicitly — ctx.highlight is what shows the suggestion
  // there; this function is what would silently skip asking.
  if (action.asksNothing && highlight) {
    applyHighlight(patch, highlight);
    if (VARIATION_ACTION_IDS.has(action.id)) patch.mode = "create-variations";
  }
  if (action.id === "generate-from-url" && preselect && highlight) {
    applyHighlight(patch, highlight);
    patch.mode = "scratch";
  }

  // NEW (2026-09-08) — the OTHER way `ctx.isVariation` can be true: the
  // (target, source) pair itself is only valid as a variation (today, only
  // concept ← concept, e.g. "Use concept" with Concept picked as the
  // target). This is deliberately NOT folded into the block above — it must
  // NOT set brandId/mode (asset targets keep the entity optional/Auto, and
  // `Mode` doesn't mean anything for a Concept target) — it only needs a
  // non-empty prompt so Configure's Generate button isn't disabled by an
  // empty field Rule 1 says the flow should never have asked for.
  if (ctx.isVariation && !action.asksNothing) {
    patch.prompt = `Keep the core idea of "${ref.title}". Generate a new variation of this concept — free.`;
  }

  // THE SCRIPT CARRY (2026-09-09) — `use-script` ONLY.
  //
  // `use-script` set `generationSource: "script"` and moved no script, so
  // Studio auto-wrote one locally (`deriveScriptText`) and Configure labelled
  // that local draft "Same script · <module>" — a false provenance. This is
  // the carry that makes the label true. `ref.script` is only ever set where
  // a real script exists (flowSources.ts — Video Sage's analysis, nothing
  // else), and `missingCarriedScriptReason` has already refused this action
  // on a ref without one, so by here the text is guaranteed real.
  //
  // WHY `vary-script` IS NOT IN THIS CARRY (fixed 2026-09-09, same day):
  // it briefly was, and that inverted the action's entire meaning. Its own
  // copy is "Keep the visuals — write a NEW script"; handing it the source's
  // existing script made Studio open holding the OLD one, and Configure's
  // chip — asserted off `flowCtx.ref.script` matching state, not off the
  // action — then badged it "Same script · Video Sage" on the one action
  // whose whole purpose is that the script is not the same. `vary-script` is
  // `source: "none"`: it promises same visuals, new words, and needs no
  // source script to do it. It carries the variation prompt below (which
  // says what is kept and what changes) and nothing else. Adding a second
  // action to this carry means re-checking that its copy actually claims the
  // script travels.
  //
  // WHY scriptOrigin IS null, NOT "user": the union is auto | user | null
  // (WizardState, useWizard.ts — read-only here) and ScriptRail renders
  // "user" as "Edited by you", which would be a second false claim about text
  // nobody edited. A non-null `script` with `scriptOrigin: null` is the
  // documented hand-off shape: the background auto-writer explicitly refuses
  // to overwrite it (`state.script !== null && state.scriptOrigin === null`)
  // and no origin badge is drawn. Written EXPLICITLY rather than left to the
  // default, because `patch()` tags any patch that touches `script` without
  // an origin as "user" — today this object is Object.assign-ed into state at
  // construction (StudioAlpha.tsx), but the explicit key keeps it correct if
  // it ever goes through `patch()` instead.
  if (action.id === "use-script" && hasCarriedScript(ref)) {
    patch.script = ref.script;
    patch.scriptOrigin = null;
  }

  // vary-script — the script came FROM this source and has already been
  // seen once; approving it outright stops §21.2's script gate from
  // re-blocking a flow that isn't touching the script at all.
  // PRE-EXISTING behaviour, deliberately left unconditional: it predates the
  // script carry above and does not depend on it. Not a Rule-1 regression —
  // `scriptNeedsReview` (PromptReferenceBar) only flags the Script chip, it
  // disables nothing.
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

  // Trends — §8.4 "the trend fills the angle *and* brings supporting creatives
  // as references." The angle is free text (not a catalogue id), so it rides in
  // angleDescription (useWizard.ts renders ANGLE_CHIP_LABEL[angleId] ??
  // angleId, so free text works the same as an id string). The prompt also
  // gets a head start (same pattern as Campaign URLs below).
  if (action.id === "generate-against-trend" || action.id === "script-from-trend") {
    if (ref.trendAngle) {
      patch.angleDescription = ref.trendAngle;
    }
    // Industry Insights offers "generate against this trend" too (§7.2) but
    // its refs have no trendAngle — without this fallback that action seeded
    // nothing at all and opened a bare Step 2.
    patch.prompt = ref.trendAngle
      ? `${ref.trendAngle} — inspired by "${ref.title}"`
      : `Build a new ad around the angle behind "${ref.title}".`;
    // §8.4: "brings supporting creatives as references" — TrendItem currently
    // carries no attached creatives field (separate lookup needed). TODO: once
    // backend exposes related creatives or we have a data source for them,
    // populate patch.attachedReferences here with context tags per §8.2.
  }

  // "Use hook" — the one thing this action promises is that the hook LINE
  // travels. `ctx.source` ("hook") already rode in at the top of this patch,
  // which is what makes Step 3 say "Continuing from a hook — pick the angle
  // and concept to build it out"; until now that sentence pointed at nothing,
  // and the action was behaviourally identical to "use this trend's angle".
  //
  // WHERE IT LANDS, AND WHY NOT angleDescription: `WizardState` has no hook
  // field, and `angleDescription` — the only other free-text slot — is wrong
  // twice over. It renders through ANGLE slots (KnownAngleChip and Configure's
  // angle summary/row, Step3Approach), and `SOURCE_SATISFIES.hook`
  // (useWizard.ts) says a hook satisfies NEITHER angle nor concept, so filing
  // it as the angle would contradict the very plan that still asks for one.
  // `prompt` is the carrier every other flow already uses for carried context
  // (the variation family, trends, Campaign URLs below) and Configure renders
  // it verbatim in the prompt bar.
  //
  // The fallback is deliberately quote-free: modules other than Trends list
  // `use-hook` but don't populate `ref.hook` yet, and inventing a hook line is
  // the exact failure this defect was about.
  if (action.id === "use-hook") {
    patch.prompt = ref.hook
      ? `Open with this hook: "${ref.hook}". Build the rest around it.`
      : `Open with the hook from "${ref.title}". Build the rest around it.`;
  }

  // Campaign URLs — the extraction is visible and editable in its own card
  // (§7.5); this is just the prompt head start built from the same data.
  // If the user edited the extraction in FlowModuleDetail, those edits
  // (xp/xo/xc URL params) override the original ref.extraction.
  if (action.id === "generate-from-url" && ref.extraction) {
    const editedProduct = sp?.get("xp");
    const editedOffer = sp?.get("xo");
    const editedClaims = sp?.get("xc");
    const product = editedProduct ?? ref.extraction.product;
    const offer = editedOffer ?? ref.extraction.offer;
    const claims = editedClaims ? editedClaims.split("|") : ref.extraction.claims;
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
