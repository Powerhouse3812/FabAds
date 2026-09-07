import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_LANGUAGE, languageLabel } from "../../lib/languages";
import { computeBreakdown, type CreditLine } from "../../lib/credits";
import { MODEL_CREDIT_MULTIPLIER, MODEL_LABEL } from "../data/modelPricing";
import type { KbInstruction } from "../data/kbInstructions";
/**
 * §6 "Script as a pre-step" — Product Shoot needs the same pre-step as the
 * script-led approaches, but it's a Studio-home `AlphaMode` (modes.ts), not
 * one of the 7 wizard `Mode` approaches below. Only the TYPE is imported here
 * (erased at build time) — modes.ts is another agent's file, read-only here.
 */
import type { AlphaMode } from "../data/modes";
// Read-only data modules — used to derive realistic script text from the
// ids already sitting in WizardState (brand/product/category/concept/angle
// names) instead of a generic template. None of these import back from this
// file (verified: no cycle), so they're safe to pull in here.
import { getSubType } from "../data/approach-subtypes";
import { getConceptById } from "../data/concepts";
import { getBrand } from "@/mocks/shared/brands";
import { getProduct } from "@/mocks/shared/products";
import { getCategory } from "@/mocks/shared/categories";

export type Category = "asset" | "ad" | "social";
export type Format = "image" | "video";
export type VideoResolution = "720p" | "1080p" | "4K";

export type Mode =
  | "scratch"
  | "create-variations"
  | "ugc-video"
  | "image-to-video"
  | "broll"
  | "bg-remover"
  | "resize";

export type AttachSource =
  | "upload"
  | "library"
  | "pinterest"
  | "brand-winner-ads"
  | "product-winner-ads"
  | "url"
  | "instruction"
  | "industry-insights"
  | "seed-image"
  | "template";

export interface AttachedRef {
  id: string;
  source: AttachSource;
  label: string;
  thumbnail?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  category: Category | null;
  format: Format | null;
  /** Step 2 selection — XOR across brand / product / category. User picks
   *  EITHER a brand, a product, or a category — never more than one.
   *  Picking one clears the other two. */
  brandId: string | null;
  productId: string | null;
  categoryId: string | null;
  mode: Mode;
  /**
   * §6 — the Studio-home `AlphaMode` (Product Shoot / Brand Ad / Product Ad /
   * Social / Performance Ad / Affiliate / Custom-Manual, from data/modes.ts),
   * kept alongside `mode` (the approach) so Product Shoot can be distinguished
   * from the 7 approaches for the script-generation sub-step. null until the
   * caller (StudioAlpha's home-mode picker) starts writing into it — reads
   * that find it null just behave as "not Product Shoot", same as today.
   */
  studioMode: AlphaMode | null;
  /** Sub-type within the chosen approach (e.g. UGC Video → tutorial / unboxing
   *  / talking-head). null = approach has no sub-type or none picked yet. */
  approachSubType: string | null;
  modelId: string;
  angleId: string | null;
  /**
   * DEFECT FIX (adversarial review) — free-text angle description for when a
   * flow hand-off's angle (e.g. Trends' `trendAngle`) doesn't map to any real
   * `ANGLE_IDS` entry. `angleId` must only ever hold a catalogue id — every
   * angle chip (the grid tiles, the collapsed summary row, the Overview /
   * MasterPromptCard, the KB rail) renders `ANGLE_CHIP_LABEL[angleId] ??
   * angleId`, so a raw sentence assigned to `angleId` renders whole through
   * every one of those one-word chip slots. This field is the escape hatch:
   * a full sentence the UI can show in an actual text slot instead. null =
   * nothing to show (the common case).
   */
  angleDescription: string | null;
  /** UGC Video mode — avatar + voice picks. null = AI auto-decides. */
  avatarId: string | null;
  voiceId: string | null;
  /**
   * §6 "Script as a pre-step" — for every script-led generation (incl.
   * Product Shoot's shot plan) this ARRIVES generated: the background effect
   * at the bottom of `useWizard` fills it from brand/product/angle/concept/
   * approach/format/language as soon as there's enough context, on an 800ms
   * simulated delay. null only until that first fill (or before there's any
   * entity context yet) — never the resting state for a script-led approach.
   */
  script: string | null;
  /**
   * Provenance of the current `script` text — null = nothing yet, "auto" =
   * produced by the background effect, "user" = the human wrote, edited, or
   * picked it (via `set`/`patch`, which auto-tag "user" the moment `script`
   * is written through them — see `set`/`patch` below). The background
   * effect refuses to touch a "user" script even when its inputs (angle,
   * concept, brand…) change afterward, so a regeneration never silently
   * discards someone's edit. A script hydrated from a URL/hand-off with no
   * explicit origin also stays untouched (treated the same as "user").
   */
  scriptOrigin: "auto" | "user" | null;
  /**
   * True while the background effect's simulated ~800ms generation is in
   * flight. Lets ScriptRail (or any other surface) show a real shimmer
   * skeleton instead of a dead "Auto" blank while the script is being
   * produced — see ScriptRail's waiting view.
   */
  scriptGenerating: boolean;
  prompt: string;
  uploadedFiles: UploadedFile[];
  selectedTemplateIds: string[];
  selectedLibraryIds: string[];
  selectedConceptIds: string[];
  attachedReferences: AttachedRef[];
  ctaLayout: "inline" | "footer";
  credits: number;
  count: number;
  /**
   * "Vary" amount (0–100) — how MUCH each generated output should differ from
   * the base. This is NOT the variation COUNT (that's `count`). Default 10
   * (safe, close variations). Surfaced via the Generation-settings slider on
   * the Configure screen. (Maalik MOM 06-05: "variation meter, default 10%".)
   * NOTE: not part of the credit recompute — it doesn't change output volume.
   */
  varyAmount: number;
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  /**
   * Output language of the ad (§5 — "Language selector added to Configure").
   * A code from src/genie6/lib/languages.ts, not a display name, so the
   * selector, the URL (?lang=) and the batch config all carry one value.
   */
  language: string;
  /**
   * §9 bulk product selection — applies to Category Ad and Product Ad.
   * Selecting N products produces ONE ad containing all of them, NOT N
   * separate ads. `productId` stays the hero; these are the co-stars.
   * Empty = single-product ad.
   */
  bulkProductIds: string[];
  /**
   * §21.2 — Product Shoot must accept a brand plus ONE UPLOADED IMAGE, not
   * only a Catalogue product, for brands whose product isn't in the Catalogue
   * yet and for one-offs. When set, Step 2 is satisfied by brand + image and
   * the Overview card must stop gating "Ready to generate" on a product id.
   */
  uploadedProductImage: string | null;
  /**
   * §21.2 — script is a GATED pre-step for every script-led approach:
   * generate → review → edit → approve → then generate the ad. Generate stays
   * disabled until this is true. At 30-40 min per video an unseen auto-script
   * is an expensive mistake. `skipScriptReview` is the explicit power-user
   * escape, and it satisfies the gate on its own.
   */
  scriptApproved: boolean;
  skipScriptReview: boolean;
  videoResolution: VideoResolution;
  videoAudio: boolean;
  useKnowledgeBase: boolean;
  useBrandGuidelines: boolean;
  /** User-created KB instructions (additive over the built-in defaults). */
  customKbInstructions: KbInstruction[];
}

export const INITIAL_STATE: WizardState = {
  step: 1,
  category: null,
  format: null,
  brandId: null,
  productId: null,
  categoryId: null,
  mode: "scratch",
  studioMode: null,
  approachSubType: null,
  modelId: "genie-1.0",
  angleId: null,
  angleDescription: null,
  avatarId: null,
  voiceId: null,
  script: null,
  scriptOrigin: null,
  scriptGenerating: false,
  prompt: "",
  uploadedFiles: [],
  selectedTemplateIds: [],
  selectedLibraryIds: [],
  selectedConceptIds: [],
  attachedReferences: [],
  ctaLayout: "inline",
  credits: 4,
  count: 4,
  varyAmount: 10,
  aspectRatio: "1:1",
  language: DEFAULT_LANGUAGE,
  bulkProductIds: [],
  uploadedProductImage: null,
  scriptApproved: false,
  skipScriptReview: false,
  videoResolution: "1080p",
  videoAudio: true,
  useKnowledgeBase: true,
  useBrandGuidelines: true,
  customKbInstructions: [],
};

/**
 * DEFECT FIX (adversarial review) — 1080p was priced ×1.5 on the Configure
 * screen's Quality popover label but charged ×2 by `buildCreditLines` below,
 * both visible on the same screen at the same time (popover: "×1.5" · the
 * Generate breakdown next to it: "Quality ×2 (1080p)"). ONE table now drives
 * both the label AND the formula so they cannot diverge again.
 *
 * Rate chosen for 1080p: **×1.5**, not ×2 — that's the number that has
 * actually been user-facing on this screen (the popover's own label); ×2 was
 * only ever a formula-side value nobody saw next to it until the Generate
 * breakdown shipped. 720p stays the ×1 baseline, 4K the clear top tier at
 * ×3, so the tier ordering (1 / 1.5 / 3) still reads as strictly increasing.
 * `computeBreakdown()` (credits.ts) only `Math.ceil`s the FINAL total, so a
 * fractional per-tier multiplier chains safely — no rounding-drift risk from
 * using 1.5 instead of an integer.
 */
export interface VideoQualityTier {
  value: VideoResolution;
  /** Display tier name, e.g. "High". */
  tier: string;
  /** Credit multiplier for this tier — the ONLY number `buildCreditLines`
   *  and the Quality popover are each allowed to read. */
  multiplier: number;
}

export const VIDEO_QUALITY_TIERS: VideoQualityTier[] = [
  { value: "720p", tier: "Standard", multiplier: 1 },
  { value: "1080p", tier: "High", multiplier: 1.5 },
  { value: "4K", tier: "Premium", multiplier: 3 },
];

export const VIDEO_RESOLUTION_MULTIPLIER: Record<VideoResolution, number> = VIDEO_QUALITY_TIERS.reduce(
  (acc, t) => {
    acc[t.value] = t.multiplier;
    return acc;
  },
  {} as Record<VideoResolution, number>,
);

/**
 * §21.2 "Credits need a breakdown, not just a number" — Configure said
 * `Generate (4 credits)` while the Results edit bar said `Generate (24
 * credits)`, a 6× jump with no explanation. This builds the EXACT line list
 * that `computeBreakdown()` (src/genie6/lib/credits.ts) turns into the
 * charged total, so the number shown on the Generate button and the number
 * actually charged can never diverge — both this recompute and
 * PromptReferenceBar's hover/click breakdown call this same function.
 *
 * Axes: outputs × concepts × model × quality. Model multiplier comes from
 * MODEL_CREDIT_MULTIPLIER (PromptReferenceBar.tsx — one roster, not a second
 * copy). Quality (video-only) reuses the existing resolution multiplier via
 * VIDEO_RESOLUTION_MULTIPLIER above; WizardState has no separate "duration"
 * field, so resolution stands in for it here — see the doc comment on
 * `videoResolution`.
 */
export function buildCreditLines(state: WizardState): CreditLine[] {
  const conceptFactor = Math.max(state.selectedConceptIds.length, 1);
  const modelMultiplier = MODEL_CREDIT_MULTIPLIER[state.modelId] ?? 1;
  const modelName = MODEL_LABEL[state.modelId] ?? state.modelId;

  const lines: CreditLine[] = [
    { label: "Outputs", factor: state.count, op: "base" },
    {
      label: "Concepts",
      factor: conceptFactor,
      op: "multiply",
      note: `${conceptFactor} concept${conceptFactor === 1 ? "" : "s"}`,
    },
    { label: "Model", factor: modelMultiplier, op: "multiply", note: modelName },
  ];

  if (state.format === "video") {
    const resolutionMultiplier = VIDEO_RESOLUTION_MULTIPLIER[state.videoResolution];
    lines.push({
      label: "Quality",
      factor: resolutionMultiplier,
      op: "multiply",
      note: state.videoResolution,
    });
  }

  return lines;
}

/* ────────────────────────────────────────────────────────────────────── *
 * §6 "Script as a pre-step" — the script/shot-plan ARRIVES generated for
 * every script-led generation (UGC Video, or Product Shoot's "what's about
 * to be made" sub-step), derived from state already sitting in the wizard
 * rather than written by the user. Everything below is pure/local to this
 * file: label lookups + a small template, wired to actual writes by the
 * `useEffect` inside `useWizard()` further down.
 * ────────────────────────────────────────────────────────────────────── */

/** Same 7 labels `AlphaStep3Configure.tsx` keeps locally — no central map
 *  exists for `Mode` (its own comment says so), duplicated here rather than
 *  imported to avoid a real runtime cycle (see the file that DOES export one,
 *  `components/queue/batchDisplay.ts`, which imports FROM this file). */
const MODE_LABEL: Record<Mode, string> = {
  scratch: "From scratch",
  "create-variations": "Create variations",
  "ugc-video": "UGC Video",
  "image-to-video": "Image to video",
  broll: "B-roll",
  "bg-remover": "Background remover",
  resize: "Resize",
};

/** Fallback labels for the angle ids `APPROACH_SUBTYPES` actually assigns
 *  (approach-subtypes.ts) — small and local rather than importing
 *  `ANGLE_CHIP_LABEL` from PromptReferenceBar.tsx, which is being actively
 *  edited by another agent in this same release. */
const ANGLE_LABEL_FALLBACK: Record<string, string> = {
  "ugc-style": "UGC style",
  educational: "Educational",
  unboxing: "Unboxing",
  "social-proof": "Social proof",
  testimonial: "Testimonial",
  lifestyle: "Lifestyle",
  hero: "Hero",
  premium: "Premium",
  "benefit-led": "Benefit-led",
};

function humanizeId(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function humanizeAngle(state: WizardState): string {
  if (state.angleDescription?.trim()) return state.angleDescription.trim();
  if (state.angleId) return ANGLE_LABEL_FALLBACK[state.angleId] ?? humanizeId(state.angleId);
  return "Hero";
}

/** True whenever `AlphaMode` is "product-shoot" — kept as a tiny named
 *  predicate so ScriptRail and the effect below read the same check instead
 *  of each re-deriving `state.studioMode === "product-shoot"` inline. */
export function isProductShootState(state: WizardState): boolean {
  return state.studioMode === "product-shoot";
}

/**
 * §6 — which generations get the script/shot-plan pre-step. Today's
 * `isScriptLed`/`isUgcMode` in AlphaStep3Configure.tsx and
 * PromptReferenceBar.tsx both hand-roll `mode === "ugc-video" || angleId ===
 * "ugc-style"` — this is the SAME check plus the Product Shoot leg, exported
 * so those two files can switch to calling this instead of drifting further
 * out of sync (they currently have no way to know about Product Shoot, since
 * `studioMode` didn't exist on WizardState before this change).
 */
export function isScriptLedState(state: WizardState): boolean {
  return (
    state.mode === "ugc-video" ||
    state.angleId === "ugc-style" ||
    isProductShootState(state)
  );
}

/** Is there enough entity context (brand / product / category / an uploaded
 *  product photo) to write a script that reads like it's for THIS ad rather
 *  than a placeholder? Gates the background effect below. */
function hasEntityContext(state: WizardState): boolean {
  return !!(
    state.brandId ||
    state.productId ||
    state.categoryId ||
    state.uploadedProductImage
  );
}

interface ScriptContext {
  brandName: string;
  productName: string;
  priceOrPromo: string;
  angleLabel: string;
  conceptName: string | null;
  approachLabel: string;
  subTypeLabel: string | null;
  formatLabel: string;
  languageName: string;
  categoryName: string | null;
}

function buildScriptContext(state: WizardState): ScriptContext {
  const product = state.productId ? getProduct(state.productId) : undefined;
  const brand = state.brandId
    ? getBrand(state.brandId)
    : product
      ? getBrand(product.brandId)
      : undefined;
  const category = state.categoryId
    ? getCategory(state.categoryId)
    : product
      ? getCategory(product.categoryId)
      : undefined;
  const concept = state.selectedConceptIds[0]
    ? getConceptById(state.selectedConceptIds[0])
    : undefined;
  const subType = getSubType(state.mode, state.approachSubType);

  return {
    brandName: brand?.name ?? "your brand",
    productName:
      product?.name ??
      (state.uploadedProductImage
        ? "your uploaded product shot"
        : (category?.name ?? "your product")),
    priceOrPromo: product?.promo || product?.price || "your current offer",
    angleLabel: humanizeAngle(state),
    conceptName: concept?.name ?? null,
    approachLabel: MODE_LABEL[state.mode] ?? humanizeId(state.mode),
    subTypeLabel: subType?.label ?? null,
    formatLabel: state.format === "video" ? "Video" : "Image",
    languageName: languageLabel(state.language),
    categoryName: category?.name ?? null,
  };
}

/**
 * §6 — produces the text that "arrives generated." Two shapes:
 *  - Product Shoot: a shot list ("what's about to be made"), plain and
 *    literal per the doc's own wording, not a dialogue script.
 *  - Everything else script-led (UGC Video): an actual ad script, in the
 *    same Hook / Problem / Reveal / Proof / CTA shape as the pre-canned
 *    MOCK_SCRIPTS in ScriptRail.tsx, but built from THIS ad's brand/
 *    product/angle/concept/language instead of a fixed template.
 * Pure function — the effect below is the only caller that writes its
 * result into state.
 */
export function deriveScriptText(state: WizardState): string {
  const ctx = buildScriptContext(state);

  if (isProductShootState(state)) {
    const shots = [
      `Hero — full-product beauty shot of ${ctx.productName} on a seamless backdrop, ${ctx.angleLabel.toLowerCase()} lighting.`,
      `Detail macro — cap, texture, or applicator close-up.`,
      ctx.conceptName
        ? `Context insert — styled as a ${ctx.conceptName.toLowerCase()} around the product.`
        : `Context insert — lifestyle styling around the product.`,
      `Closing frame — pack shot with ${ctx.priceOrPromo} called out.`,
    ];
    return (
      `What's about to be made — ${ctx.productName}, ${ctx.brandName}\n\n` +
      shots.map((s, i) => `${i + 1}. ${s}`).join("\n\n") +
      `\n\nFormat: ${ctx.formatLabel} · ${ctx.languageName}.`
    );
  }

  const hook = ctx.subTypeLabel
    ? `Hook: "Why is everyone talking about ${ctx.productName}?"`
    : `Hook: "You need to see this before you buy another ${ctx.categoryName ?? "product"}."`;

  return (
    `${hook}\n\n` +
    `Problem: quick, relatable pain point tied to ${ctx.categoryName ?? "the category"}.\n\n` +
    `Product reveal: ${ctx.productName} by ${ctx.brandName}${
      ctx.conceptName ? ` — shot as a ${ctx.conceptName.toLowerCase()}` : ""
    }.\n\n` +
    `Proof: "Real results, no filters — that's why ${ctx.brandName} has thousands of repeat buyers."\n\n` +
    `CTA: "${ctx.priceOrPromo}. Link in bio — ${ctx.languageName} voiceover."`
  );
}

/** A stable key over every input `deriveScriptText` reads. The background
 *  effect compares this against the signature it last auto-generated FROM to
 *  decide whether an "auto" script has gone stale (inputs changed) — a
 *  "user" script is never compared against it at all (see the effect). */
function scriptSignature(state: WizardState): string {
  return [
    state.mode,
    state.approachSubType ?? "",
    state.angleId ?? "",
    state.angleDescription ?? "",
    state.selectedConceptIds.join(","),
    state.format ?? "",
    state.brandId ?? "",
    state.productId ?? "",
    state.categoryId ?? "",
    state.uploadedProductImage ? "img" : "",
    state.language,
    state.studioMode ?? "",
  ].join("|");
}

/**
 * The exact patch a caller (e.g. a "Regenerate" action wired to
 * `ScriptRail`'s optional `onRegenerate`) hands to `wizard.patch()` to force
 * a fresh auto-script. Passing `scriptOrigin: null` explicitly in the same
 * patch is what stops `patch()`'s own "touching `script` means `user`"
 * auto-tag (below) from firing, so the background effect picks it back up
 * instead of treating the reset as a user edit.
 */
export function scriptResetPatch(): Partial<WizardState> {
  return { script: null, scriptOrigin: null, scriptGenerating: false };
}

export interface UseWizardReturn {
  state: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  patch: (patch: Partial<WizardState>) => void;
  next: () => void;
  back: () => void;
  goTo: (step: WizardState["step"]) => void;
  reset: () => void;
}

export function useWizard(
  initialPatch?: Partial<WizardState>,
): UseWizardReturn {
  // A-12.49 (Maalik): accept an `initialPatch` so the wizard can hydrate from
  // URL params at the very first render — no effect tick required. Used by
  // StudioAlpha to make deep links + hard refresh restore the correct step on
  // first paint (incl. for headless capture tools like HTML.to.design).
  const [state, setState] = useState<WizardState>(() =>
    initialPatch ? { ...INITIAL_STATE, ...initialPatch } : INITIAL_STATE,
  );

  const set = useCallback<UseWizardReturn["set"]>((key, value) => {
    setState((prev) => {
      const updated: WizardState = { ...prev, [key]: value };
      // Recompute credits whenever count, selectedConceptIds, videoResolution,
      // format, or modelId changes — model is one of the four priced axes
      // (§21.2) and was previously missing from this trigger list entirely,
      // so switching models never updated the displayed number.
      if (
        key === "count" ||
        key === "selectedConceptIds" ||
        key === "videoResolution" ||
        key === "format" ||
        key === "modelId"
      ) {
        updated.credits = computeBreakdown(buildCreditLines(updated)).total;
      }
      // §6 — any caller reaching in via `set("script", …)` is a human action
      // (typed it, uploaded it, picked an AI candidate) — tag it "user" so
      // the background auto-fill effect below never overwrites it again.
      // `scriptResetPatch()` deliberately goes through `patch()` (below),
      // not `set`, when it needs to bypass this.
      if (key === "script") {
        updated.scriptOrigin = "user";
      }
      return updated;
    });
  }, []);

  const patch = useCallback((p: Partial<WizardState>) => {
    setState((prev) => {
      const merged: WizardState = { ...prev, ...p };
      if (
        "count" in p ||
        "selectedConceptIds" in p ||
        "videoResolution" in p ||
        "format" in p ||
        "modelId" in p
      ) {
        merged.credits = computeBreakdown(buildCreditLines(merged)).total;
      }
      // §6 — same "touching script means user" tag as `set` above, EXCEPT
      // when the patch itself already specifies `scriptOrigin` (that's
      // `scriptResetPatch()`'s escape hatch: `{ script: null, scriptOrigin:
      // null }` in one patch resets to "nothing yet" instead of "user", so
      // the background effect regenerates instead of staying hands-off).
      if ("script" in p && !("scriptOrigin" in p)) {
        merged.scriptOrigin = "user";
      }
      return merged;
    });
  }, []);

  const next = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.min(5, prev.step + 1) as WizardState["step"],
    }));
  }, []);

  const back = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as WizardState["step"],
    }));
  }, []);

  const goTo = useCallback((step: WizardState["step"]) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // §6 "Script as a pre-step" — background auto-generation. The script/shot
  // plan must ARRIVE generated, not wait for the user to open ScriptRail and
  // click Generate themselves. Runs whenever the approach is script-led
  // (`isScriptLedState` — UGC Video, or Product Shoot via `studioMode`) and
  // there's enough entity context to write something real (`hasEntityContext`).
  //
  // `lastAutoSignatureRef` remembers the inputs the LAST auto-fill was built
  // from, so a change to angle/concept/brand/etc. after an "auto" script
  // exists triggers a fresh one (keeps it matching the ad) — but ONLY for
  // "auto" scripts. A "user" script (typed, uploaded, or AI-candidate picked
  // — anything written through `set`/`patch`, which tag it "user") is never
  // touched by this effect again, so a later input change can't silently
  // discard someone's edit. `inFlightRef` guards against starting a second
  // simulated generation for the same signature while one is already running,
  // and its cleanup cancels a stale in-flight generation the moment the
  // signature changes again (so a fast angle-then-angle change doesn't let
  // the first, now-stale, response land after the second).
  const lastAutoSignatureRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isScriptLedState(state) || state.step < 3) return;
    // A "user" script is off-limits, full stop. A script with NO recorded
    // origin (script !== null, scriptOrigin === null) arrived some other way
    // — e.g. a §7/§8 hand-off that seeded `script` directly via `initialPatch`
    // — and is treated the same way: leave it alone rather than guess.
    if (state.scriptOrigin === "user") return;
    if (state.script !== null && state.scriptOrigin === null) return;
    if (!hasEntityContext(state)) return;

    const signature = scriptSignature(state);
    const isFresh =
      state.script !== null &&
      state.scriptOrigin === "auto" &&
      lastAutoSignatureRef.current === signature;
    if (isFresh) return;
    if (inFlightRef.current === signature) return;

    inFlightRef.current = signature;
    setState((prev) => ({ ...prev, scriptGenerating: true }));

    // Same 800ms-style simulated delay as ScriptRail's manual AI-tab
    // Generate — the point is that it still FEELS generated, not hardcoded.
    const timer = window.setTimeout(() => {
      setState((prev) => {
        if (prev.scriptOrigin === "user") {
          // The user saved their own script while this was in flight — don't
          // clobber it, just clear the in-progress flag.
          inFlightRef.current = null;
          return { ...prev, scriptGenerating: false };
        }
        lastAutoSignatureRef.current = signature;
        inFlightRef.current = null;
        return {
          ...prev,
          script: deriveScriptText(prev),
          scriptOrigin: "auto",
          scriptGenerating: false,
          // A freshly (re)generated script needs a fresh look — an approval
          // of the OLD text shouldn't silently wave through new text.
          scriptApproved: false,
        };
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    state.mode,
    state.approachSubType,
    state.angleId,
    state.angleDescription,
    state.selectedConceptIds,
    state.format,
    state.brandId,
    state.productId,
    state.categoryId,
    state.uploadedProductImage,
    state.language,
    state.studioMode,
    state.step,
    state.scriptOrigin,
    state.script,
  ]);

  return { state, set, patch, next, back, goTo, reset };
}
