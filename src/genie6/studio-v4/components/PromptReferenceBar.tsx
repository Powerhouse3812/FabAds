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

export type ChipKind = "concept-angle" | "avatar-voice" | "style-brand";

interface PromptReferenceBarProps {
  wizard: UseWizardReturn;
  onAttachPickerOpen?: (source: AttachSource) => void;
  onChipOpen?: (chip: ChipKind) => void;
  /** Forces inline Send + hides the dev CtaLayoutToggle. Used by Studio Alpha. */
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
const RATIOS = ["1:1", "4:5", "9:16", "16:9"] as const;

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
      // fall back to raw
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

  const showInlineSend = hideLayoutToggle || state.ctaLayout === "inline";
  const isUgcMode = state.mode === "ugc-video" || state.angleId === "ugc-style";

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

  const avatarVoiceValue =
    state.avatarId || state.voiceId
      ? [state.avatarId ? "Set" : "Auto", state.voiceId ? "Set" : "Auto"].join(" · ")
      : "Auto";

  const activeModel = MODELS.find((m) => m.id === state.modelId) ?? MODELS[0];

  return (
    <>
      {/* GLASS container — backdrop-blur, translucent, subtle border + soft shadow */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl",
          "border border-border/40",
          "bg-card/60 backdrop-blur-xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          "px-5 py-4",
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
                label="Brand"
                active={state.useBrandGuidelines}
                onClick={() => wizard.set("useBrandGuidelines", !state.useBrandGuidelines)}
              />
              <ToggleChip
                icon={<Database className="h-3 w-3" />}
                label="KB"
                active={state.useKnowledgeBase}
                onClick={() => wizard.set("useKnowledgeBase", !state.useKnowledgeBase)}
              />
            </div>
          )}

          {/* Row 1 — attached refs (compact) */}
          {state.attachedReferences.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {state.attachedReferences.map((ref) => (
                <span
                  key={ref.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[11px] font-medium text-foreground"
                >
                  <span aria-hidden>{SOURCE_ICON[ref.source]}</span>
                  <span className="max-w-[140px] truncate">{ref.label}</span>
                  <button
                    type="button"
                    onClick={() => removeRef(ref.id)}
                    aria-label={`Remove ${ref.label}`}
                    className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
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
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/40 text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
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
              placeholder="Describe what you want to generate… (Cmd+Enter to generate)"
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
                  <span className="text-[12px] leading-none">{activeModel.emoji}</span>
                  <span>{activeModel.name}</span>
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
                        active ? "bg-foreground/[0.06]" : "hover:bg-muted",
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

            {/* Variations — segmented */}
            <Segmented
              options={COUNTS as unknown as readonly (string | number)[]}
              value={state.count}
              onChange={(n) => wizard.set("count", Number(n))}
              renderLabel={(n) => `${n}×`}
            />

            {/* Aspect ratio — segmented (same DNA as variations) */}
            <Segmented
              options={RATIOS}
              value={state.aspectRatio}
              onChange={(r) => wizard.set("aspectRatio", r as typeof RATIOS[number])}
            />

            {/* Credits — minimal text only, no chip bg */}
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {state.credits} cr
            </span>

            {/* Generate — only colored element */}
            {showInlineSend && (
              <button
                type="button"
                onClick={() => wizard.goTo(5)}
                disabled={!state.prompt.trim()}
                className={cn(
                  "ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-5 text-[12px] font-bold text-primary-foreground transition-all",
                  "shadow-md shadow-primary/20",
                  "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none",
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate
              </button>
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
 *  RefChip — picker reference chip (Concept · Avatar · Style).
 *  Single-line, label + value, unified pill DNA.
 * ────────────────────────────────────────────────────────── */
function RefChip({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 text-[11px] font-medium transition-colors hover:border-foreground/20 hover:bg-background/70"
    >
      <span className="text-muted-foreground">{label}</span>
      <span aria-hidden className="text-muted-foreground/40">·</span>
      <span className="text-foreground">{value}</span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  ToggleChip — Brand Guidelines / KB toggle pill.
 *  Active = subtle muted-tinted bg. Off = line-through, no scream.
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
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-all",
        active
          ? "border-foreground/20 bg-foreground/[0.06] text-foreground"
          : "border-border/40 bg-background/30 text-muted-foreground/60 line-through hover:text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Segmented — generic segmented pill control.
 *  Used for Variations and Aspect Ratio. Same DNA = visual unity.
 * ────────────────────────────────────────────────────────── */
function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (v: T) => string;
}) {
  return (
    <div className="inline-flex rounded-full border border-border/60 bg-background/40 p-0.5">
      {options.map((opt) => {
        const active = value === opt;
        const label = renderLabel ? renderLabel(opt) : String(opt);
        return (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "inline-flex h-6 min-w-[28px] items-center justify-center rounded-full px-2 font-mono text-[10px] font-semibold transition-colors",
              active
                ? "bg-foreground/[0.08] text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
