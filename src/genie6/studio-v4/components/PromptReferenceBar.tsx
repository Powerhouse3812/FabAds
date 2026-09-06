import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Coins,
  Database,
  Globe,
  Info,
  Plus,
  Search,
  Sparkles,
  X,
  Link as LinkIcon,
  // A-12.73: source + model icons (replacing emoji maps)
  Upload,
  Library,
  Pin,
  Trophy,
  Package,
  FileText,
  Zap,
  Rocket,
  Video,
  FlaskConical,
  ExternalLink,
  Image as ImageIcon,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { avatars, voices } from "../../mocks/library";
import {
  CREDITS_LIMIT,
  CREDITS_REMAINING,
  computeBreakdown,
  exceedsBalance,
  formatCredits,
} from "../../lib/credits";
import { languageLabel, searchLanguages } from "../../lib/languages";
import { MODEL_CREDIT_MULTIPLIER } from "../data/modelPricing";
import { buildCreditLines } from "../state/useWizard";
// CHANGE #3: saved reference-URLs surfaced inside the URL-attach popover.
// Mirrors ContextRail.tsx, which imports the same helpers from "@/mocks/shared"
// (barrel re-exports src/mocks/shared/referenceUrls.ts).
import {
  getReferenceUrlsForEntity,
  shortUrl,
  type EntityType,
} from "@/mocks/shared";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CtaLayoutToggle } from "./CtaLayoutToggle";
import { AttachPopover } from "./AttachPopover";
import { getModelVisual } from "../data/studio-visuals";
import { PreviewVideo } from "./PreviewVideo";
import type {
  UseWizardReturn,
  AttachSource,
  AttachedRef,
  WizardState,
} from "../state/useWizard";

/**
 * PromptReferenceBar — Step 4 prompt + reference dock.
 *
 * A-12.18 redesign (Maalik feedback):
 *   - Glass-effect container (backdrop-blur-xl, translucent bg, soft shadow).
 *   - Unified pill visual language across ALL controls — single shape, single
 *     muted-tinted active state. Lime is reserved exclusively for Generate CTA.
 *   - Aspect ratio + variations are both segmented controls (same DNA).
 *   - Brand Guidelines + Knowledge Base are subtle toggles (no solid black fills).
 *   - Char counter, big credits chip, two-line ChipBtn → all stripped down.
 *
 * Prompt ideas live ABOVE the bar (rendered by AlphaStep3Configure), not inside.
 *
 * Pinterest note (preserved): v3's column drawer is a follow-up integration.
 */

export type ChipKind =
  | "concept-angle"
  | "avatar-voice"
  | "style-brand"
  | "script"
  | "kb-instruction";

interface PromptReferenceBarProps {
  wizard: UseWizardReturn;
  onAttachPickerOpen?: (source: AttachSource) => void;
  onChipOpen?: (chip: ChipKind) => void;
  /** Forces inline Send + hides the dev CtaLayoutToggle. Used by Studio Alpha. */
  hideLayoutToggle?: boolean;
  /** Optional slot rendered in the footer row, just before the Generate button.
   *  Used by Studio Alpha to inject the Generation-settings popover trigger. */
  footerExtras?: React.ReactNode;
}

// A-12.73: emoji map → lucide icon map. DS §7 #10 (no emojis in product UI).
const SOURCE_ICON: Record<AttachSource, React.ElementType> = {
  upload: Upload,
  library: Library,
  pinterest: Pin,
  "brand-winner-ads": Trophy,
  "product-winner-ads": Package,
  url: LinkIcon,
  instruction: FileText,
  "industry-insights": Database,
  "seed-image": ImageIcon,
  template: LayoutTemplate,
};

const MODELS: { id: string; Icon: React.ElementType; name: string; hint?: string }[] = [
  { id: "genie-1.0", Icon: Sparkles, name: "Genie 1.0", hint: "Fast" },
  { id: "genie-2.0-pro", Icon: Rocket, name: "Genie 2.0 Pro", hint: "Higher quality" },
  { id: "genie-flash", Icon: Zap, name: "Genie Flash", hint: "Ultra-fast" },
  { id: "genie-video", Icon: Video, name: "Genie Video" },
  { id: "genie-labs", Icon: FlaskConical, name: "Genie Labs", hint: "Experimental" },
];

export const RATIOS = ["1:1", "4:5", "9:16", "16:9"] as const;
export type AspectRatio = (typeof RATIOS)[number];

export const ANGLE_CHIP_LABEL: Record<string, string> = {
  hero: "Hero",
  lifestyle: "Lifestyle",
  "social-proof": "Social Proof",
  urgency: "Urgency",
  comparison: "Comparison",
  "ugc-style": "UGC",
  unboxing: "Unboxing",
  infographic: "Infographic",
  testimonial: "Testimonial",
  "before-after": "Before / After",
  "problem-solution": "Problem · Solution",
  "feature-highlight": "Feature",
  "benefit-led": "Benefit-led",
  fomo: "FOMO",
  scarcity: "Scarcity",
  premium: "Premium",
  "value-prop": "Value Prop",
  story: "Story",
  demo: "Demo",
  educational: "Educational",
};

export function PromptReferenceBar({
  wizard,
  onAttachPickerOpen,
  onChipOpen,
  hideLayoutToggle = false,
  footerExtras,
}: PromptReferenceBarProps) {
  const { state } = wizard;

  const [attachOpen, setAttachOpen] = useState(false);
  const [urlPopoverOpen, setUrlPopoverOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachPick = (source: AttachSource) => {
    setAttachOpen(false);
    if (source === "upload") {
      fileInputRef.current?.click();
      return;
    }
    if (source === "url") {
      setUrlPopoverOpen(true);
      return;
    }
    // library / pinterest / brand-winner-ads / product-winner-ads / instruction
    // — all delegate to parent via onAttachPickerOpen
    onAttachPickerOpen?.(source);
  };

  const removeRef = (id: string) => {
    wizard.set(
      "attachedReferences",
      state.attachedReferences.filter((r) => r.id !== id),
    );
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newRefs: AttachedRef[] = files.map((f) => ({
      id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: "upload",
      label: f.name,
    }));
    wizard.set("attachedReferences", [
      ...state.attachedReferences,
      ...newRefs,
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // CHANGE #3: shared url-attach handler. Both the manual paste flow and the
  // one-tap "saved for this brand/product" rows funnel through here so a URL
  // ref is built + appended + the popover closed in exactly one place.
  const attachUrlRef = (label: string, thumbnail?: string) => {
    const ref: AttachedRef = {
      id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: "url",
      label,
      ...(thumbnail ? { thumbnail } : {}),
    };
    wizard.set("attachedReferences", [...state.attachedReferences, ref]);
    setUrlInput("");
    setUrlPopoverOpen(false);
  };

  const submitUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    let host = trimmed;
    try {
      host = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      ).hostname;
    } catch {
      // fall back to raw
    }
    attachUrlRef(`URL · ${host}`);
  };

  // CHANGE #3: resolve the active entity for saved-URL lookup. Wizard selection
  // is XOR across brand / product / category (see WizardState docs); productId
  // is the more specific signal, so prefer it, else fall back to brandId. We do
  // not surface category here — the attach flow is brand/product-scoped per spec.
  const refEntity: { type: EntityType; id: string } | null = state.productId
    ? { type: "product", id: state.productId }
    : state.brandId
      ? { type: "brand", id: state.brandId }
      : null;
  const savedRefUrls = refEntity
    ? getReferenceUrlsForEntity(refEntity.type, refEntity.id)
    : [];

  const showInlineSend = hideLayoutToggle || state.ctaLayout === "inline";
  const isUgcMode = state.mode === "ugc-video" || state.angleId === "ugc-style";

  // §21.2 "Script becomes a gated pre-step" — script-led = the same
  // definition PromptReferenceBar already uses to decide Avatar vs Style
  // (isUgcMode: mode === "ugc-video" OR angleId === "ugc-style"). Script and
  // avatar/voice are coupled features in this file, so reusing isUgcMode
  // rather than inventing a second, narrower check keeps them consistent —
  // a manually-set UGC angle on another approach gets the same Avatar/Voice
  // AND the same script gate. A non-script approach is never gated.
  const isScriptLed = isUgcMode;
  const scriptGateOpen =
    isScriptLed && !state.scriptApproved && !state.skipScriptReview;

  // §21.2 "Credits need a breakdown" — the SAME buildCreditLines() the wizard
  // uses to set state.credits, recomputed fresh here so the Generate button
  // and the hover/click breakdown can never show a different number than the
  // one that gets charged, no matter how state.credits was last set.
  const creditBreakdown = computeBreakdown(buildCreditLines(state));
  const overBudget = exceedsBalance(creditBreakdown.total);
  const shortfall = overBudget ? creditBreakdown.total - CREDITS_REMAINING : 0;

  // §6 Rule 3 — "Generate stays disabled until every required field is
  // filled." A flow that carries no source format (Dashboard's fetched-ad
  // rows) or a hand-edited URL can land here with the Overview reading
  // "PICK A FORMAT" while this button stayed live and started a batch with
  // format undefined. Same for the entity (§4: every ad type needs one).
  const missingFormat = !state.format;
  const missingEntity =
    !state.brandId && !state.productId && !state.categoryId && !state.uploadedProductImage;

  // Concept · Angle compound value
  const conceptAngleValue =
    state.angleId || state.selectedConceptIds.length > 0
      ? [
          state.angleId
            ? ANGLE_CHIP_LABEL[state.angleId] ?? state.angleId
            : null,
          state.selectedConceptIds.length > 0
            ? `${state.selectedConceptIds.length} concept${state.selectedConceptIds.length === 1 ? "" : "s"}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Auto";

  // Avatar · Voice compound value — show the REAL selected names looked up by
  // id (null → "Auto"). Voice names are "Priya — Warm Hindi"; show the descriptor
  // after the em-dash ("Warm Hindi") so it reads distinctly from the avatar name.
  // e.g. "Priya · Warm Hindi", "Auto · Auto".
  const selectedAvatarName = state.avatarId
    ? avatars.find((a) => a.id === state.avatarId)?.name ?? "Auto"
    : "Auto";
  const selectedVoiceName = state.voiceId
    ? (voices.find((v) => v.id === state.voiceId)?.name ?? "Auto").split("—").pop()!.trim()
    : "Auto";
  const avatarVoiceValue = `${selectedAvatarName} · ${selectedVoiceName}`;

  const activeModel = MODELS.find((m) => m.id === state.modelId) ?? MODELS[0];

  return (
    <>
      {/* GLASS container — uses shared .v3-glass utility (light + dark tuned) */}
      <div
        className={cn(
          "v3-glass relative overflow-hidden rounded-3xl px-5 py-4",
        )}
      >
        <div className="flex w-full flex-col gap-3">
          {/* Row 0 — Reference chips (UNIFIED pill style) */}
          {onChipOpen && (
            <div className="flex flex-wrap items-center gap-1.5">
              <RefChip
                label="Concept"
                value={conceptAngleValue}
                onClick={() => onChipOpen("concept-angle")}
              />
              <RefChip
                label="Script"
                value={
                  scriptGateOpen
                    ? "Needs approval"
                    : state.script
                      ? "Custom"
                      : "Auto"
                }
                emphasize={scriptGateOpen}
                onClick={() => onChipOpen("script")}
              />
              {isUgcMode ? (
                <RefChip
                  label="Avatar"
                  value={avatarVoiceValue}
                  onClick={() => onChipOpen("avatar-voice")}
                />
              ) : (
                <RefChip
                  label="Style"
                  value="Auto"
                  onClick={() => onChipOpen("style-brand")}
                />
              )}
              <span aria-hidden className="mx-1 h-3.5 w-px bg-border/50" />
              <ToggleChip
                icon={<BookOpen className="h-3 w-3" />}
                label="Brand Guidelines"
                active={state.useBrandGuidelines}
                onClick={() => wizard.set("useBrandGuidelines", !state.useBrandGuidelines)}
              />
              <ToggleChip
                icon={<Database className="h-3 w-3" />}
                label="Knowledge Base"
                active={state.useKnowledgeBase}
                onClick={() => wizard.set("useKnowledgeBase", !state.useKnowledgeBase)}
              />
              {/* §15 "credits are now also shown in Studio" — a PERSISTENT
                  balance readout, not only inside the Generate button. Static
                  display (no popover) — the button's own breakdown covers the
                  interactive detail. */}
              <span
                title="Genie credit balance"
                className="ml-auto inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-border/40 bg-background/30 px-2.5 text-[11px] font-medium text-muted-foreground"
              >
                <Coins className="h-3 w-3" aria-hidden />
                <span className="font-mono text-foreground/80">
                  {formatCredits(CREDITS_REMAINING)}
                </span>
                <span aria-hidden className="text-muted-foreground/40">/</span>
                <span className="font-mono">{formatCredits(CREDITS_LIMIT)}</span>
              </span>
            </div>
          )}

          {/* Row 1 — attached refs (compact). CHANGE #2: each pill is its own
              component so it can own a per-pill hover state for the thumbnail
              preview without re-rendering the whole row. */}
          {state.attachedReferences.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {state.attachedReferences.map((ref) => (
                <AttachedRefPill
                  key={ref.id}
                  refItem={ref}
                  onRemove={() => removeRef(ref.id)}
                />
              ))}
            </div>
          )}

          {/* Row 2 — paperclip + textarea (NO char counter) */}
          <div className="relative flex items-start gap-2">
            <AttachPopover
              open={attachOpen}
              onOpenChange={setAttachOpen}
              onPick={handleAttachPick}
            >
              <button
                type="button"
                aria-label="Attach reference"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </AttachPopover>

            {/* URL inline popover anchor */}
            <Popover open={urlPopoverOpen} onOpenChange={setUrlPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="pointer-events-none absolute left-0 top-0 h-8 w-8 opacity-0"
                />
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-80 p-3">
                <div className="space-y-2">
                  {/* CHANGE #3: saved reference-URLs for the active brand/product.
                      One-tap rows attach via the shared url-attach handler. When
                      the entity has none, this whole block renders nothing. */}
                  {savedRefUrls.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Saved for this {refEntity?.type === "product" ? "product" : "brand"}
                      </div>
                      <div className="-mx-0.5 max-h-40 space-y-1 overflow-y-auto px-0.5">
                        {savedRefUrls.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => attachUrlRef(r.label, r.thumbnail)}
                            title={`${r.label} · ${r.url}`}
                            className="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/50 px-2 py-1.5 text-left transition-colors hover:border-foreground/20 hover:bg-background/70"
                          >
                            {r.thumbnail ? (
                              <img
                                src={r.thumbnail}
                                alt=""
                                aria-hidden
                                className="h-7 w-7 shrink-0 rounded object-cover"
                              />
                            ) : (
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                                <LinkIcon className="h-3 w-3" aria-hidden />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] font-medium text-foreground">
                                {r.label}
                              </span>
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {shortUrl(r.url)}
                              </span>
                            </span>
                            <Plus className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="h-px flex-1 bg-border/50" aria-hidden />
                        <span className="text-[10px] text-muted-foreground/70">or paste a new one</span>
                        <span className="h-px flex-1 bg-border/50" aria-hidden />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <LinkIcon className="h-3.5 w-3.5" />
                    Paste a URL
                  </div>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitUrl();
                      }
                    }}
                    placeholder="https://example.com/inspiration"
                    className="block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInput("");
                        setUrlPopoverOpen(false);
                      }}
                      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitUrl}
                      disabled={!urlInput.trim()}
                      className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Fetch
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <textarea
              value={state.prompt}
              onChange={(e) => wizard.set("prompt", e.target.value)}
              rows={2}
              placeholder="Describe the script, visual angle, hook… or tap a TRY prompt above to start.  ⌘+Enter to generate."
              className="block w-full flex-1 resize-none bg-transparent px-1 pt-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Row 3 — controls (UNIFIED segmented + pill DNA) */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
            {/* Model dropdown — same pill style */}
            <Popover open={modelOpen} onOpenChange={setModelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 text-[11px] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
                >
                  <activeModel.Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
                  <span>{activeModel.name}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-[420px] p-3">
                {/* Tiny header */}
                <div className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Model
                </div>
                {/* Visual card grid — autoplay-loop preview + name/hint + icon badge */}
                <div className="grid grid-cols-2 gap-2">
                  {MODELS.map((m) => {
                    const active = state.modelId === m.id;
                    const v = getModelVisual(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          wizard.set("modelId", m.id);
                          setModelOpen(false);
                        }}
                        aria-pressed={active}
                        className={cn(
                          "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all",
                          active
                            ? "border-primary ring-2 ring-primary"
                            : "border-border hover:border-foreground/30",
                        )}
                      >
                        {/* Video preview (16:9) */}
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <PreviewVideo src={v.video} poster={v.poster} />
                          {/* Selected check badge */}
                          {active && (
                            <span
                              aria-hidden
                              className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                            >
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        {/* Name + hint + icon badge */}
                        <div className="flex items-center gap-2 bg-card px-2.5 py-2">
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <m.Icon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-semibold text-foreground">
                              {m.name}
                            </span>
                            {m.hint && (
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {m.hint}
                              </span>
                            )}
                          </span>
                          {/* §21.2 — model is one of the priced axes; showing
                              its multiplier right where it's picked means the
                              cost is visible on the action, not just after. */}
                          <span className="shrink-0 font-mono text-[10px] font-semibold text-muted-foreground">
                            ×{MODEL_CREDIT_MULTIPLIER[m.id] ?? 1}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Variations — number stepper input */}
            <NumberStepper
              label="Variations"
              value={state.count}
              onChange={(n) => wizard.set("count", n)}
              min={1}
              max={20}
            />

            {/* Language — added §5 "Language selector added to Configure, for
                choosing the output language of the ad". 175 options → a
                searchable popover, never a <select> scroll (Hick's law).
                Lives alongside Model + Variations — same pill DNA. */}
            <LanguagePopover wizard={wizard} />

            {/* A-12.56 (Maalik): aspect ratio merged into the 3-dot Generation
                Settings popover injected via footerExtras. AspectRatioPopover
                component kept in this file as dead code in case we want to
                revert. */}

            {/* Optional parent-provided slot (e.g. Generation-settings popover
                with Ratio + Quality + Audio sections) */}
            {footerExtras}

            {/* Generate — credits inline in label, gated + breakdown (§21.2) */}
            {showInlineSend && (
              <div className="ml-auto flex items-center gap-1">
                <CreditBreakdownInfo breakdown={creditBreakdown} />
                <button
                  type="button"
                  onClick={() => wizard.goTo(5)}
                  disabled={
                    !state.prompt.trim() || scriptGateOpen || overBudget || missingFormat || missingEntity
                  }
                  title={
                    missingFormat
                      ? "Pick a format (Image or Video) on step 1 to generate"
                      : missingEntity
                        ? "Pick the brand, product or category this ad is for (step 2) to generate"
                        : scriptGateOpen
                      ? "Approve the script (or skip review) to generate — see the Script chip above"
                      : overBudget
                        ? `Short ${formatCredits(shortfall)} credits — top up, or lower Outputs/Concepts`
                        : !state.prompt.trim()
                          ? "Describe what you want, or tap a suggestion above"
                          : undefined
                  }
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-5 text-[12px] font-bold text-primary-foreground transition-all",
                    "shadow-md shadow-primary/20",
                    "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none",
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {/* A disabled button that doesn't say why is a dead end. The
                      script gate and the budget shortfall already explain
                      themselves; the empty prompt did not — it just greyed out,
                      which reads as broken rather than as "your turn". */}
                  {missingFormat ? (
                    "Pick a format to generate"
                  ) : missingEntity ? (
                    "Pick who it's for to generate"
                  ) : scriptGateOpen ? (
                    "Approve script to generate"
                  ) : !state.prompt.trim() ? (
                    "Describe your ad to generate"
                  ) : overBudget ? (
                    <>
                      Need {formatCredits(shortfall)} more
                      <span className="font-mono text-[10px] font-medium opacity-80">
                        credits
                      </span>
                    </>
                  ) : (
                    <>
                      Generate
                      <span className="font-mono text-[10px] font-medium opacity-80">
                        ({formatCredits(creditBreakdown.total)}{" "}
                        {creditBreakdown.total === 1 ? "credit" : "credits"})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Dev toggle — hidden in Alpha */}
            {!hideLayoutToggle && (
              <CtaLayoutToggle
                value={state.ctaLayout}
                onChange={(v) => wizard.set("ctaLayout", v)}
                className={showInlineSend ? "" : "ml-auto"}
              />
            )}
          </div>
        </div>

        {/* Hidden file input for Upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  AttachedRefPill — a single attached-reference chip.
 *  CHANGE #2:
 *    - When refItem.thumbnail exists, a small rounded thumbnail replaces the
 *      source icon at the left (icon stays as the fallback).
 *    - Hovering / focusing a thumbnailed pill reveals a larger (~140px) image
 *      preview in an absolutely-positioned popover above the pill.
 *    - Remove × is preserved.
 * ────────────────────────────────────────────────────────── */
function AttachedRefPill({
  refItem,
  onRemove,
}: {
  refItem: AttachedRef;
  onRemove: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const SourceIcon = SOURCE_ICON[refItem.source];
  const hasThumb = Boolean(refItem.thumbnail);

  return (
    <span
      className="relative inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 py-0.5 pl-1 pr-2 text-[11px] font-medium text-foreground"
      onMouseEnter={() => hasThumb && setPreviewOpen(true)}
      onMouseLeave={() => setPreviewOpen(false)}
    >
      {hasThumb ? (
        <span
          className="inline-flex shrink-0"
          tabIndex={0}
          onFocus={() => setPreviewOpen(true)}
          onBlur={() => setPreviewOpen(false)}
        >
          <img
            src={refItem.thumbnail}
            alt=""
            aria-hidden
            className="h-[18px] w-[18px] rounded-full object-cover"
          />
        </span>
      ) : (
        <SourceIcon className="ml-0.5 h-3 w-3 text-muted-foreground" aria-hidden />
      )}
      <span className="max-w-[140px] truncate">{refItem.label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${refItem.label}`}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <X className="h-2.5 w-2.5" />
      </button>

      {/* Hover preview — larger thumbnail, anchored above the pill. */}
      {hasThumb && previewOpen && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-1.5 block overflow-hidden rounded-lg border border-border/60 bg-popover p-1 shadow-lg"
        >
          <img
            src={refItem.thumbnail}
            alt={refItem.label}
            className="block h-[140px] w-[140px] rounded-md object-cover"
          />
        </span>
      )}
    </span>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  RefChip — picker reference chip (Concept · Avatar · Style).
 *  Single-line, label + value, unified pill DNA.
 * ────────────────────────────────────────────────────────── */
function RefChip({
  label,
  value,
  onClick,
  emphasize = false,
}: {
  label: string;
  value: string;
  onClick: () => void;
  /** §21.2 script gate — flags the chip (e.g. "Needs approval") so the
   *  requirement is visible without opening the rail. */
  emphasize?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors",
        emphasize
          ? "border-primary/50 bg-primary/[0.08] hover:border-primary/70"
          : "border-border/60 bg-background/50 hover:border-foreground/20 hover:bg-background/70",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span aria-hidden className="text-muted-foreground/40">·</span>
      <span className={emphasize ? "font-semibold text-primary" : "text-foreground"}>
        {value}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  ToggleChip — Brand Guidelines / Knowledge Base on-off pill.
 *  Visible state indicators so it reads clearly AS a toggle:
 *    - Tiny status dot (lime-on / muted-off)
 *    - Title attribute reads "{label} · ON" / "{label} · OFF"
 *    - Active = subtle tint; Off = line-through + dimmed
 * ────────────────────────────────────────────────────────── */
function ToggleChip({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={active}
      title={`${label} · ${active ? "ON" : "OFF"} — click to toggle`}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-all",
        active
          ? "border-foreground/20 bg-foreground/[0.06] text-foreground"
          : "border-border/40 bg-background/30 text-muted-foreground/60 hover:text-muted-foreground",
      )}
    >
      {/* Status dot — clear visual signal for ON/OFF */}
      <span
        aria-hidden
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full transition-colors",
          active ? "bg-primary shadow-[0_0_6px_hsl(74_81%_59%/0.6)]" : "bg-muted-foreground/30",
        )}
      />
      {icon}
      <span className={cn(!active && "line-through decoration-muted-foreground/40")}>
        {label}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  NumberStepper — minimal number input with − / + steppers.
 *  Used for variation count. No fixed presets, type any number.
 * ────────────────────────────────────────────────────────── */
function NumberStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div
      className="inline-flex h-7 items-center gap-0.5 rounded-full border border-border/60 bg-background/50 px-1"
      title={label}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[14px] leading-none">−</span>
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        min={min}
        max={max}
        className="w-7 bg-transparent text-center font-mono text-[11px] font-semibold text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Increase"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[12px] leading-none">+</span>
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Aspect ratio SHAPE preview — §5 "show an example of each shape, not just
 *  the ratio name. This is what 'multi aspect ratio' means — a presentation
 *  fix, not a multi-output generation feature."
 *
 *  RATIO_PREVIEW + RatioShapeOption are the ONE ratio presentation in the
 *  codebase (exported so AlphaStep3Configure's Generation-settings popover —
 *  where the ratio picker actually lives today, A-12.56 — reuses this exact
 *  markup instead of a third hand-rolled version). AspectRatioPopover below
 *  is kept as a self-contained trigger+popover for a future standalone use;
 *  both now share the same option row.
 * ────────────────────────────────────────────────────────── */
export const RATIO_PREVIEW: Record<typeof RATIOS[number], { w: number; h: number; hint: string }> = {
  "1:1": { w: 18, h: 18, hint: "Square" },
  "4:5": { w: 16, h: 20, hint: "Portrait" },
  "9:16": { w: 12, h: 20, hint: "Story / Reel" },
  "16:9": { w: 22, h: 12, hint: "Landscape" },
};

/** One selectable row: proportioned shape swatch + ratio + its use. */
export function RatioShapeOption({
  ratio,
  active,
  onSelect,
}: {
  ratio: typeof RATIOS[number];
  active: boolean;
  onSelect: () => void;
}) {
  const { w, h, hint } = RATIO_PREVIEW[ratio];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active ? "bg-primary/[0.08]" : "hover:bg-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-sm border",
          active ? "border-primary bg-primary/10" : "border-foreground/40",
        )}
        style={{ width: "24px", height: "24px" }}
      >
        <span
          aria-hidden
          className={cn(
            "block rounded-[1px]",
            active ? "bg-primary" : "bg-foreground/40",
          )}
          style={{ width: `${w}px`, height: `${h}px` }}
        />
      </span>
      <span className="font-mono text-[11px] font-semibold">{ratio}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">{hint}</span>
      {active && <Check className="h-3 w-3 shrink-0 text-primary" strokeWidth={3} />}
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  AspectRatioPopover — pill trigger + popover with visual previews.
 *  Minimal: shows current ratio in the trigger, dropdown for selection.
 * ────────────────────────────────────────────────────────── */
function AspectRatioPopover({
  value,
  onChange,
}: {
  value: typeof RATIOS[number];
  onChange: (r: typeof RATIOS[number]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 text-[11px] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
          title="Aspect ratio"
        >
          <span className="font-mono">{value}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-44 p-1">
        {RATIOS.map((r) => (
          <RatioShapeOption
            key={r}
            ratio={r}
            active={value === r}
            onSelect={() => {
              onChange(r);
              setOpen(false);
            }}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  LanguagePopover — §5 "Language selector added to Configure, for choosing
 *  the output language of the ad." 175 options (src/genie6/lib/languages.ts)
 *  → a SEARCHABLE popover, never a <select> scroll (Hick's law). Reads/writes
 *  wizard.state.language directly — no new props needed, the wizard is
 *  already threaded through. The Shell agent owns ?lang= in the URL; this
 *  only touches wizard state.
 * ────────────────────────────────────────────────────────── */
function LanguagePopover({ wizard }: { wizard: UseWizardReturn }) {
  const { state } = wizard;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchLanguages(query), [query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Output language"
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 text-[11px] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
        >
          <Globe className="h-3 w-3 text-muted-foreground" aria-hidden />
          <span className="font-mono">{languageLabel(state.language)}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-72 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Globe className="h-3.5 w-3.5" />
          Output language
        </div>
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 175 languages…"
            aria-label="Search output languages"
            autoFocus
            className="h-8 w-full rounded-full border border-border/60 bg-background/50 pl-7 pr-2 text-[12px] outline-none transition-colors focus:border-primary"
          />
        </div>
        <ul className="max-h-64 space-y-0.5 overflow-y-auto pr-0.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5">
          {results.map((l) => {
            const active = state.language === l.code;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => {
                    wizard.set("language", l.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {l.name}{" "}
                    <span className="text-muted-foreground">({l.region})</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
                    {l.code}
                  </span>
                  {active && <Check className="h-3 w-3 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="px-2 py-6 text-center text-[11px] italic text-muted-foreground">
              No languages match "{query}"
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  CreditBreakdownInfo — §21.2 "Credits need a breakdown, not just a
 *  number." Small info trigger next to Generate; click (Popover) or hover
 *  (native title) shows the exact multiplier chain computeBreakdown() will
 *  charge — outputs × concepts × model × quality — so a 6× jump between
 *  Configure and Results never again arrives unexplained.
 * ────────────────────────────────────────────────────────── */
function CreditBreakdownInfo({
  breakdown,
}: {
  breakdown: ReturnType<typeof computeBreakdown>;
}) {
  const [open, setOpen] = useState(false);
  const titleText = breakdown.lines
    .map((l) => `${l.label} ${l.op === "base" ? l.factor : `×${l.factor}`}${l.note ? ` (${l.note})` : ""}`)
    .join(" · ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Credit cost breakdown"
          title={titleText}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-64 p-3">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Credit breakdown
        </p>
        <ul className="space-y-1">
          {breakdown.lines.map((l, i) => (
            <li key={i} className="flex items-center justify-between text-[12px]">
              <span className="text-foreground/80">
                {l.label}
                {l.note ? ` · ${l.note}` : ""}
              </span>
              <span className="font-mono text-foreground">
                {l.op === "base" ? l.factor : `×${l.factor}`}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2">
          <span className="text-[12px] font-semibold text-foreground">Total</span>
          <span className="font-mono text-[13px] font-bold text-primary">
            {formatCredits(breakdown.total)} credits
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
