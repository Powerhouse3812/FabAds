import { useRef, useState } from "react";
import { BookOpen, ChevronDown, Database, Plus, Sparkles, X, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CtaLayoutToggle } from "./CtaLayoutToggle";
import { AttachPopover } from "./AttachPopover";
import type {
  UseWizardReturn,
  AttachSource,
  AttachedRef,
} from "../state/useWizard";

/**
 * PromptReferenceBar — Step 4 merged prompt + reference dock (Track C).
 *
 * Single textarea + clip/+ icon to attach references. Heavy sources
 * (library / pinterest / *-winner-ads) open a right-rail column drawer.
 * Lighter sources (upload / url) fire inline (file picker / URL popover).
 *
 * Handles BOTH CTA-layout variants:
 *   - "inline":  inline Send button on the right of the bar (Variant A)
 *   - "footer":  no Send here — WizardNav owns the Generate button (Variant B)
 *
 * The CtaLayoutToggle dev pill always renders far-right so Maalik can flip
 * layouts at runtime.
 *
 * Pinterest note: v3's `PinterestColumnDrawer` requires a deep query/selection
 * contract (PinterestPin[], onReplaceSelection, brand/concept ctx) that
 * doesn't fit Track C's clean { onSave, onCancel } pattern. For first ship
 * we render a minimal mock-pin grid inside our RightRail. Integration with
 * the v3 component (or a v4-native rewrite) is a follow-up.
 */

export type ChipKind = "concept-angle" | "avatar-voice" | "style-brand";

interface PromptReferenceBarProps {
  wizard: UseWizardReturn;
  /**
   * Called when the attach popover routes the user to a heavy attach source
   * (library / pinterest / brand-winner-ads / product-winner-ads). The parent
   * (Step4Configure) handles opening the right-rail picker for that source.
   *
   * Upload + URL still fire inline (file dialog / URL popover) and don't use
   * this callback.
   */
  onAttachPickerOpen?: (source: AttachSource) => void;
  /**
   * Called when one of the top-row chips (Concept·Angle / Avatar·Voice /
   * Style·Brand) is clicked. The parent opens the corresponding rail
   * picker (each is a tabbed / single picker with edit semantics).
   */
  onChipOpen?: (chip: ChipKind) => void;
  /**
   * When true: forces inline Send (Layout A) and hides the CtaLayoutToggle
   * dev pill. Used by Studio Alpha's Configure step.
   */
  hideLayoutToggle?: boolean;
}

const SOURCE_ICON: Record<AttachSource, string> = {
  upload: "🖼",
  library: "🗂",
  pinterest: "📌",
  "brand-winner-ads": "🏆",
  "product-winner-ads": "📦",
  url: "🔗",
};

const MODELS: { id: string; emoji: string; name: string; hint?: string }[] = [
  { id: "genie-1.0", emoji: "✨", name: "Genie 1.0", hint: "Fast" },
  { id: "genie-2.0-pro", emoji: "🚀", name: "Genie 2.0 Pro", hint: "Higher quality" },
  { id: "genie-flash", emoji: "⚡", name: "Genie Flash", hint: "Ultra-fast" },
  { id: "genie-video", emoji: "🎬", name: "Genie Video" },
  { id: "genie-labs", emoji: "🧪", name: "Genie Labs", hint: "Experimental" },
];

const COUNTS = [1, 2, 4, 8] as const;

const ANGLE_CHIP_LABEL: Record<string, string> = {
  hero: "Hero",
  lifestyle: "Lifestyle",
  "social-proof": "Social Proof",
  urgency: "Urgency",
  comparison: "Comparison",
  "ugc-style": "UGC",
  unboxing: "Unboxing",
  infographic: "Infographic",
};

const ANGLE_HINT: Record<string, string> = {
  hero: "Hero shot",
  lifestyle: "Lifestyle scene",
  "social-proof": "Social-proof framing",
  urgency: "Urgency / sale framing",
  comparison: "Comparison setup",
  "ugc-style": "UGC creator look",
  unboxing: "Unboxing reveal",
  infographic: "Infographic style",
};

export function PromptReferenceBar({
  wizard,
  onAttachPickerOpen,
  onChipOpen,
  hideLayoutToggle = false,
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
    // library / pinterest / brand-winner-ads / product-winner-ads
    // — delegate to Step 4's right-rail (it owns the rail mode state)
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

  const submitUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    let host = trimmed;
    try {
      host = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      ).hostname;
    } catch {
      // fall back to raw input
    }
    const ref: AttachedRef = {
      id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: "url",
      label: `URL · ${host}`,
    };
    wizard.set("attachedReferences", [...state.attachedReferences, ref]);
    setUrlInput("");
    setUrlPopoverOpen(false);
  };

  // Layout A = inline Send. Forced always in Alpha (hideLayoutToggle=true).
  const showInlineSend = hideLayoutToggle || state.ctaLayout === "inline";

  // UGC mode — show Avatar/Voice chip, hide Style/Brand chip.
  const isUgcMode = state.mode === "ugc-video" || state.angleId === "ugc-style";

  // Generate-CTA math: derive concept count from credits / count (mirrors WizardNav).
  const totalOutputs = state.credits;
  const variations = state.count;
  const conceptCount = Math.max(
    1,
    Math.round(totalOutputs / Math.max(variations, 1)),
  );

  // Active model for the dropdown trigger
  const activeModel = MODELS.find((m) => m.id === state.modelId) ?? MODELS[0];

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border border-border bg-card shadow-sm",
          "px-4 py-3",
        )}
      >
        <div className="flex w-full flex-col gap-2">
          {/* Row 0 — chip row (Concept·Angle / Avatar·Voice / Style·Brand)
              UGC mode: show Avatar·Voice, hide Style·Brand. */}
          {onChipOpen && (
            <div className="flex flex-wrap items-center gap-1.5">
              <ChipBtn
                icon="🎯"
                label="Concept · Angle"
                value={
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
                    : "Auto"
                }
                onClick={() => onChipOpen("concept-angle")}
              />
              {isUgcMode ? (
                <ChipBtn
                  icon="🎬"
                  label="Avatar · Voice"
                  value={
                    state.avatarId || state.voiceId
                      ? [
                          state.avatarId ? "Avatar set" : "Auto",
                          state.voiceId ? "Voice set" : "Auto",
                        ].join(" · ")
                      : "Auto · Auto"
                  }
                  onClick={() => onChipOpen("avatar-voice")}
                />
              ) : (
                <ChipBtn
                  icon="✨"
                  label="Style · Brand"
                  value="Auto"
                  onClick={() => onChipOpen("style-brand")}
                />
              )}
              <ToggleChip
                icon={<BookOpen className="h-3.5 w-3.5" />}
                label="Brand Guidelines"
                active={state.useBrandGuidelines}
                onClick={() => wizard.set("useBrandGuidelines", !state.useBrandGuidelines)}
              />
              <ToggleChip
                icon={<Database className="h-3.5 w-3.5" />}
                label="Knowledge Base"
                active={state.useKnowledgeBase}
                onClick={() => wizard.set("useKnowledgeBase", !state.useKnowledgeBase)}
              />
            </div>
          )}

          {/* Row 1 — attached refs chips */}
          {state.attachedReferences.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Attached
              </span>
              {state.attachedReferences.map((ref) => (
                <span
                  key={ref.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground"
                >
                  <span aria-hidden>{SOURCE_ICON[ref.source]}</span>
                  <span className="max-w-[160px] truncate">{ref.label}</span>
                  <button
                    type="button"
                    onClick={() => removeRef(ref.id)}
                    aria-label={`Remove ${ref.label}`}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Row 2 — clip + textarea + char counter */}
          <div className="relative flex items-end gap-2">
            {/* + icon — wraps the AttachPopover */}
            <AttachPopover
              open={attachOpen}
              onOpenChange={setAttachOpen}
              onPick={handleAttachPick}
            >
              <button
                type="button"
                aria-label="Attach reference"
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background transition-colors",
                  "hover:border-primary/40",
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            </AttachPopover>

            {/* URL inline popover — hidden anchor near the + button so it
                doesn't conflict with the AttachPopover on the same trigger. */}
            <Popover open={urlPopoverOpen} onOpenChange={setUrlPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="pointer-events-none absolute left-0 top-0 h-9 w-9 opacity-0"
                />
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-80 p-3">
                <div className="space-y-2">
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

            {/* Textarea */}
            <textarea
              value={state.prompt}
              onChange={(e) => wizard.set("prompt", e.target.value)}
              rows={2}
              placeholder="Describe what you want to generate…"
              className="block w-full flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            />

            {/* Char counter only */}
            <span className="shrink-0 self-end pb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {state.prompt.length} chars
            </span>
          </div>

          {/* Row 3 — meta toolbar: Model · Variations · Credits · (Variant A: inline Send) · CtaLayoutToggle */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
            {/* Model dropdown — no eyebrow label, dropdown is self-explanatory */}
            <Popover open={modelOpen} onOpenChange={setModelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-[11px] font-medium text-foreground hover:border-primary/40"
                >
                  <span>{activeModel.emoji}</span>
                  <span>{activeModel.name}</span>
                  {activeModel.hint && (
                    <span className="text-[10px] text-muted-foreground">
                      · {activeModel.hint}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-72 p-1">
                {MODELS.map((m) => {
                  const active = state.modelId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        wizard.set("modelId", m.id);
                        setModelOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                        active ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span className="font-semibold">{m.name}</span>
                      {m.hint && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {m.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>

            {/* Variations pills — no eyebrow label, the pills self-explain */}
            <div className="inline-flex rounded-full border border-border bg-background p-0.5">
              {COUNTS.map((n) => {
                const active = state.count === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => wizard.set("count", n)}
                    className={cn(
                      "inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 font-mono text-[11px] font-semibold transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            {/* Credits chip */}
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
              ⚡ <span className="font-mono">{state.credits}</span> credits
            </span>

            {/* Aspect ratio pills */}
            {(["1:1", "4:5", "9:16", "16:9"] as const).map((ratio) => {
              const active = state.aspectRatio === ratio;
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => wizard.set("aspectRatio", ratio)}
                  className={cn(
                    "rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold transition-colors",
                    active
                      ? "bg-foreground/90 text-background"
                      : "border border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {ratio}
                </button>
              );
            })}

            {/* Variant A — inline Send */}
            {showInlineSend && (
              <button
                type="button"
                onClick={() => wizard.goTo(5)}
                disabled={!state.prompt.trim()}
                className={cn(
                  "ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition-transform",
                  "hover:scale-[1.02]",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100",
                )}
              >
                <Sparkles className="h-4 w-4" />
                Generate
                <span className="font-mono text-[10px] opacity-80">
                  {conceptCount === 1
                    ? `· ${variations}× · ${totalOutputs} cr`
                    : `· ${conceptCount}×${variations} = ${totalOutputs} · ${totalOutputs} cr`}
                </span>
              </button>
            )}

            {/* Dev toggle — hidden in Alpha (hideLayoutToggle=true) */}
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

      {/* Heavy attach sources (library / pinterest / brand-WA / product-WA)
          are now hosted by Step4Configure's persistent right-rail column —
          PromptReferenceBar delegates the open via `onAttachPickerOpen`. */}
    </>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  ChipBtn — top-row picker chip (Concept·Angle / Avatar·Voice
 *  / Style·Brand). Click → onChipOpen → rail opens for editing.
 *  Pattern matches the reference image: small icon circle +
 *  value (top, semibold) + label (bottom, muted, smaller).
 * ────────────────────────────────────────────────────────── */
function ChipBtn({
  icon,
  label,
  value,
  onClick,
}: {
  icon: string;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 text-left transition-colors",
        "hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <span
        aria-hidden
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[12px]"
      >
        {icon}
      </span>
      <span className="leading-tight">
        <span className="block text-[11px] font-semibold text-foreground">
          {value}
        </span>
        <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </span>
    </button>
  );
}

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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        active
          ? "border-foreground/20 bg-foreground/90 text-background"
          : "border-border text-muted-foreground/60 line-through hover:text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
