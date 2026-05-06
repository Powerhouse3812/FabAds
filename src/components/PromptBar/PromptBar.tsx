import { useEffect, useRef } from "react";
import {
  Sparkles,
  Coins,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  /**
   * Source category — drives the chip icon + tint so the various reference
   * sources are scannable at a glance.
   *   - "upload"    — user uploaded a local file
   *   - "pinterest" — selected from auto-fetched Pinterest grid
   *   - "product"   — auto-attached existing product imagery
   *   - "url"       — legacy URL paste (kept for backwards-compat;
   *                    Studio v3 forms drop this in A-11.23)
   * Defaults to "url" when omitted.
   */
  kind?: "url" | "upload" | "pinterest" | "product";
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
  // References props are kept for backwards-compat with legacy 4-Type Studio
  // callers, but no longer rendered — references are managed inline in the
  // form section above the prompt bar.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  references: _references = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAddReference: _onAddReference,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemoveReference: _onRemoveReference,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  contextChips = [],
  onGenerate,
  disabled = false,
  generateLabel = "Generate",
  showTestButton = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // A-11.12: slim 2-row glass design.
  //   Row 1 (only renders if chips exist) — chips strip
  //   Row 2 — main bar: refs + textarea + model + count + credit + Generate
  // Removed: contextChips, showTestButton (default false), Test button row.

  return (
    <div className="px-3 py-2.5">
      {/* Row 1 — chips (optional) */}
      {chips.length > 0 && (
        <div className="scrollbar-none mb-1.5 flex min-w-0 items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 shrink-0">
            {chipPrefix}
          </span>
          {chips.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleChipClick(c)}
              className="shrink-0 rounded-full border border-border/60 bg-background/40 px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground backdrop-blur-sm"
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Row 2 — main bar */}
      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe what you want to generate…  (⌘+Enter)"
          rows={1}
          aria-label="Prompt"
          className="flex-1 min-w-0 resize-none rounded-md bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          style={{ minHeight: 32, maxHeight: 120 }}
        />
        {/* AI model picker */}
        {models.length > 0 && onModelChange && (
          <select
            value={selectedModelId ?? activeModel?.id ?? ""}
            onChange={(e) => onModelChange(e.target.value)}
            aria-label="AI model"
            title={activeModel?.tag ? `${activeModel.label} · ${activeModel.tag}` : activeModel?.label}
            className="h-8 max-w-[120px] truncate rounded-full border border-border/60 bg-background/40 px-2 text-[11px] font-medium text-muted-foreground backdrop-blur-sm hover:text-foreground focus:border-primary/40 focus:outline-none"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        )}
        <CountStepper
          value={count}
          onChange={onCountChange}
          min={minCount}
          max={maxCount}
        />
        <span className="inline-flex h-8 items-center gap-1 rounded-full border border-border/60 bg-background/40 px-2 font-mono text-[11px] text-muted-foreground backdrop-blur-sm">
          <Coins className="h-3 w-3" />
          {creditsEstimate}
        </span>
        {cheaper && onModelChange && (
          <button
            type="button"
            onClick={() => onModelChange(cheaper.id)}
            className="hidden md:inline text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
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
            className="h-8 rounded-full border border-border/60 bg-background/40 px-3 text-[11px] font-medium text-muted-foreground backdrop-blur-sm hover:border-foreground/30 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Test 4
          </button>
        )}
        <button
          type="button"
          onClick={() => onGenerate(false)}
          disabled={disabled}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-md transition-all shrink-0",
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
  );
}

/* contextChips intentionally not rendered — A-11.12: brand / mode info
   already lives in the form's body picker section, no need to duplicate in
   the prompt bar. The `contextChips` prop is kept on the type for
   backward-compat but unused. Linter may flag the destructure as unused. */

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

