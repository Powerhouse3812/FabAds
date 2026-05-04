import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Paperclip,
  Coins,
  Minus,
  Plus,
  X,
  ImagePlus,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * PromptBar — shared floating bottom-bar for Generate flows (A-11.2).
 *
 * Rebuild of the Genie 5 / Genie 6 PromptBar with a CLEAN props contract.
 * Caller owns all state (prompt, count, mode, brand, references, model);
 * this component is purely presentational + emits events. Lets the same
 * instance power Brand Ad / Product Ad / Affiliate Ad / Variation forms
 * via different prop wiring.
 *
 * Restyled with global Geist tokens (bg-card, border-border, text-foreground,
 * text-muted-foreground, bg-primary, etc.) per Maalik's "keep Geist for
 * entire FabAds project" lock. No g6-* tokens.
 *
 * History:
 *   - The Genie 6 PromptBar (`src/genie6/components/PromptBar/PromptBarContent.tsx`)
 *     was heavily coupled to genie6 state stores (`useDraft`, `useUserBrands`),
 *     Genie 6 mock data, and the legacy modeConfigs. Extracting it cleanly
 *     would have been a 5-7 day refactor.
 *   - Per Rule 3 fallback approved by Maalik upfront: "build minimal new
 *     PromptBar with TODO to backport features when extraction is possible."
 *   - This file is that minimal rebuild. Visual + interaction patterns
 *     mirror the existing Genie 6 PromptBar; props-driven so it has zero
 *     genie6 coupling.
 *
 * TODO (backport from Genie 6 PromptBarContent):
 *   - tryChipsFor() / REFINE_CHIPS — currently caller passes chips as prop;
 *     should be a smart utility once mode-config is decoupled from genie6.
 *   - modelsFor() / defaultModelFor() — same; caller passes models as prop
 *     for now.
 *   - Cost preview math — currently a simple `count * costPerUnit` callable;
 *     real model has per-model pricing + output-type multipliers.
 *   - Cheaper-alternative link logic — when a cheaper model can produce
 *     similar quality, surface it.
 *   - Refs popover: currently URL input + remove. Upload-from-device wiring
 *     lands with assets-storage backend.
 */

export interface PromptBarChip {
  /** Visible label */
  label: string;
  /** What gets appended/replaced into the prompt when clicked */
  insert: string;
}

export interface PromptBarModel {
  id: string;
  label: string;
  /** Optional short tag (e.g. "fast" / "pro" / "experimental") */
  tag?: string;
  /** Cost per output unit, in credits. Used for the credit-estimate chip. */
  costPerUnit?: number;
}

export interface PromptBarReference {
  /** Human-readable label (URL, filename) */
  label: string;
  /** Original input — URL or local file reference */
  value: string;
}

export interface PromptBarContextChip {
  /** Short text shown inside the pill */
  label: string;
  /** Optional avatar / logo URL */
  logo?: string | null;
  /** Optional tone — "default" muted vs "active" colored */
  tone?: "default" | "active";
  /** If present, renders an X button that calls this handler */
  onClear?: () => void;
}

export interface PromptBarProps {
  /** Bound prompt text */
  prompt: string;
  onPromptChange: (next: string) => void;

  /** Output count + bounds + setter */
  count: number;
  onCountChange: (next: number) => void;
  minCount?: number;
  maxCount?: number;

  /** Suggestion chips — prefixed with chipPrefix (e.g. "Try:" or "Refine:") */
  chips?: PromptBarChip[];
  chipPrefix?: string;
  /** How chips behave when clicked: append to existing prompt, or replace it */
  chipInsertMode?: "append" | "replace";

  /** Available AI models + selected id */
  models?: PromptBarModel[];
  selectedModelId?: string;
  onModelChange?: (id: string) => void;

  /** Reference attachments */
  references?: PromptBarReference[];
  onAddReference?: (ref: PromptBarReference) => void;
  onRemoveReference?: (index: number) => void;

  /** Context pills shown in row 3 (e.g. mode pill, brand pill) */
  contextChips?: PromptBarContextChip[];

  /** Generate handler — boolean arg signals "test first" (smaller batch) */
  onGenerate: (testFirst: boolean) => void;
  /** Disabled state — typically true when required inputs are missing */
  disabled?: boolean;
  /** Custom Generate button label */
  generateLabel?: string;
  /** Whether to show the "Test 4" small-batch button (default true) */
  showTestButton?: boolean;

  /** Display density — "tight" used by floating / glass containers */
  density?: "default" | "tight";
}

export function PromptBar({
  prompt,
  onPromptChange,
  count,
  onCountChange,
  minCount = 1,
  maxCount = 50,
  chips = [],
  chipPrefix = "Try:",
  chipInsertMode = "append",
  models = [],
  selectedModelId,
  onModelChange,
  references = [],
  onAddReference,
  onRemoveReference,
  contextChips = [],
  onGenerate,
  disabled = false,
  generateLabel = "Generate",
  showTestButton = true,
  density = "default",
}: PromptBarProps) {
  // Auto-grow textarea
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [prompt]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onGenerate(false);
    }
  };

  const handleChipClick = (chip: PromptBarChip) => {
    if (chipInsertMode === "replace") {
      onPromptChange(chip.insert);
    } else {
      onPromptChange(prompt ? `${prompt} ${chip.insert}` : chip.insert);
    }
  };

  // Cost preview = count × costPerUnit of selected model (fallback 1 credit each)
  // TODO: backport real per-output-type multipliers from Genie 6 aiModels.
  const activeModel = models.find((m) => m.id === selectedModelId) ?? models[0];
  const creditsEstimate = count * (activeModel?.costPerUnit ?? 1);

  // Cheaper alternative — naive: pick lowest-cost model that isn't selected.
  // TODO: backport real "similar quality" check.
  const cheaper = models
    .filter((m) => m.id !== activeModel?.id && (m.costPerUnit ?? 1) < (activeModel?.costPerUnit ?? 1))
    .sort((a, b) => (a.costPerUnit ?? 1) - (b.costPerUnit ?? 1))[0];

  const gap = density === "tight" ? "gap-1.5" : "gap-2";
  const py = density === "tight" ? "py-2" : "py-2.5";

  return (
    <div className={cn("space-y-2 px-3", py)}>
      {/* Row 1 — refs + chips */}
      <div className={cn("flex min-w-0 items-center", gap)}>
        <RefsPopover
          references={references}
          onAddReference={onAddReference}
          onRemoveReference={onRemoveReference}
        />
        {chips.length > 0 && (
          <div className="scrollbar-none flex min-w-0 items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
              {chipPrefix}
            </span>
            {chips.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleChipClick(c)}
                className="shrink-0 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Row 2 — textarea */}
      <textarea
        ref={taRef}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Describe what you want to generate…  (Cmd+Enter to send)"
        rows={1}
        aria-label="Prompt"
        className="w-full resize-none rounded-md bg-transparent px-1 py-1 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        style={{ minHeight: 32, maxHeight: 120 }}
      />

      {/* Row 3 — controls */}
      <div className={cn("flex flex-wrap items-center justify-between", gap)}>
        <div className={cn("flex min-w-0 flex-wrap items-center", gap)}>
          {/* Context chips — caller-supplied (mode pill, brand pill, etc.) */}
          {contextChips.map((c, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                c.tone === "active"
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {c.logo && <img src={c.logo} alt="" className="h-3.5 w-3.5 rounded-full" />}
              {c.label}
              {c.onClear && (
                <button
                  type="button"
                  onClick={c.onClear}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Clear ${c.label}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          ))}

          {/* AI model picker */}
          {models.length > 0 && onModelChange && (
            <select
              value={selectedModelId ?? activeModel?.id ?? ""}
              onChange={(e) => onModelChange(e.target.value)}
              aria-label="AI model"
              title={activeModel?.tag ? `${activeModel.label} · ${activeModel.tag}` : activeModel?.label}
              className="h-7 max-w-[140px] truncate rounded-full border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground focus:border-primary/40 focus:outline-none"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          )}

          {/* Count stepper */}
          <CountStepper
            value={count}
            onChange={onCountChange}
            min={minCount}
            max={maxCount}
          />
        </div>

        <div className={cn("flex items-center", gap)}>
          {/* Credit estimate */}
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Coins className="h-3 w-3" />~{creditsEstimate} cr
          </span>

          {/* Cheaper alternative — only renders when one exists */}
          {cheaper && onModelChange && (
            <button
              type="button"
              onClick={() => onModelChange(cheaper.id)}
              className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              title={`Switch to ${cheaper.label} (${cheaper.costPerUnit ?? 1} cr/unit)`}
            >
              cheaper?
            </button>
          )}

          {showTestButton && (
            <button
              type="button"
              onClick={() => onGenerate(true)}
              disabled={disabled}
              className="h-8 rounded-full border border-border bg-card px-3 text-[11px] font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Test 4
            </button>
          )}

          <button
            type="button"
            onClick={() => onGenerate(false)}
            disabled={disabled}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-all",
              "hover:-translate-y-0.5 active:translate-y-0",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generateLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

interface CountStepperProps {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}

function CountStepper({ value, onChange, min, max }: CountStepperProps) {
  const set = (n: number) => {
    const clamped = Math.max(min, Math.min(max, Math.round(n) || min));
    onChange(clamped);
  };
  return (
    <div className="inline-flex h-7 items-center rounded-full border border-border bg-card">
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label="Fewer"
        className="flex h-7 w-7 items-center justify-center rounded-l-full text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Output count"
        className="h-7 w-9 bg-transparent text-center font-mono text-[12px] font-bold tabular-nums text-foreground focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label="More"
        className="flex h-7 w-7 items-center justify-center rounded-r-full text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

interface RefsPopoverProps {
  references: PromptBarReference[];
  onAddReference?: (ref: PromptBarReference) => void;
  onRemoveReference?: (index: number) => void;
}

function RefsPopover({ references, onAddReference, onRemoveReference }: RefsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const addUrl = () => {
    const v = urlInput.trim();
    if (!v || !onAddReference) return;
    onAddReference({ label: v, value: v });
    setUrlInput("");
  };

  const triggerActive = references.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={triggerActive ? `Manage ${references.length} reference${references.length === 1 ? "" : "s"}` : "Add references"}
          className={cn(
            "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed transition-colors",
            triggerActive
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          <Paperclip className="h-3.5 w-3.5" />
          {triggerActive && (
            <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground">
              {references.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 border-border bg-popover p-3 text-popover-foreground"
      >
        <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Reference media
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() =>
              alert(
                "Upload-from-device wiring lands with the assets-storage backend (TODO)."
              )
            }
            className="flex w-full items-center gap-2 rounded-md border border-dashed border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Upload from device
          </button>
          <div className="flex items-center gap-1.5">
            <LinkIcon className="h-3 w-3 text-muted-foreground" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
              placeholder="Paste a reference URL"
              aria-label="Reference URL"
              className="h-7 flex-1 rounded-md border border-border bg-card px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={addUrl}
              disabled={!urlInput.trim()}
              className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {references.length > 0 && (
            <ul className="space-y-1">
              {references.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center gap-1.5 rounded-md bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground"
                >
                  <span className="flex-1 truncate">{r.label}</span>
                  {onRemoveReference && (
                    <button
                      type="button"
                      onClick={() => onRemoveReference(i)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove reference"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
