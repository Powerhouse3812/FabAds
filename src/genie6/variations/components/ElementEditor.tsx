import { useState } from "react";
import { AlertTriangle, Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getVariationElement } from "../data/variationElements";
import type {
  AdAnalysis,
  EditScope,
  VariationEdit,
  VariationElementId,
} from "../types";

/**
 * ElementEditor — the MANUAL path of Generate Variations.
 *
 * The locked disclosure order (spec §5): going manual on an element raises the
 * scope question and NOTHING else. Only once a scope is picked does that
 * element's underlying prompt become editable text. The scope question must
 * never appear on the frictionless quick-action path, which is why this
 * component is the only place it lives.
 *
 * Layout-agnostic on purpose: Version A wraps it in a popover/drawer, Version B
 * renders it inside a step. It paints no outer surface and owns no width.
 */

interface ElementEditorProps {
  element: VariationElementId;
  /** N — how many variations the run will produce. */
  count: number;
  analysis: AdAnalysis;
  /** undefined = not yet in manual mode, so only the scope question shows. */
  edit: VariationEdit | undefined;
  onBeginEdit: (element: VariationElementId, scope: EditScope) => void;
  onScopeChange: (element: VariationElementId, scope: EditScope) => void;
  onPromptChange: (element: VariationElementId, prompt: string) => void;
  onIndexesChange: (element: VariationElementId, indexes: number[]) => void;
  onPromptForIndexChange: (
    element: VariationElementId,
    index: number,
    prompt: string,
  ) => void;
  onCancel: (element: VariationElementId) => void;
  className?: string;
}

const SCOPE_ORDER: EditScope[] = ["all", "multiple", "individual"];

const SCOPE_COPY: Record<EditScope, { label: string; desc: (n: number) => string }> = {
  all: {
    label: "All variations",
    desc: (n) => `One instruction, used for every one of the ${n}.`,
  },
  multiple: {
    label: "Multiple variations",
    desc: () => "One instruction, but only for the ones you pick.",
  },
  individual: {
    label: "Individually",
    desc: (n) => `A separate instruction for each of the ${n}, written one by one.`,
  },
};

/** Multiple/Individual are meaningless when there is only one variation. */
function scopeDisabled(scope: EditScope, count: number): boolean {
  return count < 2 && scope !== "all";
}

function VariationChip({
  n,
  selected,
  edited,
  onClick,
  ariaLabel,
  role,
}: {
  n: number;
  selected: boolean;
  edited?: boolean;
  onClick: () => void;
  ariaLabel: string;
  role?: "checkbox" | "radio";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role={role}
      aria-checked={selected}
      aria-label={ariaLabel}
      className={cn(
        "relative h-8 min-w-8 rounded-g6-sm border px-2 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary focus-visible:ring-offset-1",
        selected
          ? "border-g6-primary-border bg-g6-primary-bg text-g6-primary"
          : "border-g6-border bg-g6-bg-container text-g6-text-secondary hover:bg-g6-bg-muted",
      )}
    >
      {n}
      {edited ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-g6-primary"
        />
      ) : null}
    </button>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-warning-text">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function ElementEditor({
  element,
  count,
  analysis,
  edit,
  onBeginEdit,
  onScopeChange,
  onPromptChange,
  onIndexesChange,
  onPromptForIndexChange,
  onCancel,
  className,
}: ElementEditorProps) {
  const def = getVariationElement(element);
  const seed = def.promptFrom(analysis);
  const detected = analysis[def.field];

  // Which variation the "individually" editor pane is currently showing.
  // Clamped on read so a shrinking N can never leave it pointing past the end.
  const [activeRaw, setActiveRaw] = useState(0);
  const active = Math.min(activeRaw, Math.max(0, count - 1));

  const scope = edit?.scope;
  const inManualMode = !!edit;
  const indexes = edit?.variationIndexes ?? [];
  const byIndex = edit?.byIndex ?? {};

  const detectedText =
    detected?.provenance === "not-found" || !detected?.value
      ? "N/F"
      : String(detected.value);

  const handleScopePick = (next: string) => {
    const nextScope = next as EditScope;
    if (inManualMode) onScopeChange(element, nextScope);
    else onBeginEdit(element, nextScope);
  };

  const toggleIndex = (i: number) => {
    onIndexesChange(
      element,
      indexes.includes(i) ? indexes.filter((x) => x !== i) : [...indexes, i].sort((a, b) => a - b),
    );
  };

  const allIndexes = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={cn("flex flex-col gap-4 text-g6-text", className)}>
      {/* ------------------------------------------------------------ header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-g6-sm bg-g6-bg-muted">
            <def.Icon className="h-4 w-4 text-g6-text-secondary" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold leading-tight">Edit {def.label}</h3>
            <p className="mt-0.5 text-xs text-g6-text-secondary">{def.desc}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onCancel(element)}
          className="h-7 shrink-0 gap-1 px-2 text-xs text-g6-text-secondary hover:bg-g6-bg-muted hover:text-g6-text"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Cancel
        </Button>
      </div>

      {/* -------------------------------------------------------- the scope Q */}
      {/* Pre-manual this is the ONLY question on screen and carries its full
          explanation. Once a scope is committed it collapses to a compact row
          so the prompt — the thing being worked on — is the focus. */}
      <fieldset className="min-w-0">
        <legend className="mb-2 text-xs font-medium text-g6-text">
          {inManualMode ? "Applies to" : `Where should this ${def.label.toLowerCase()} change apply?`}
        </legend>
        <RadioGroup
          value={scope ?? ""}
          onValueChange={handleScopePick}
          className={cn(inManualMode ? "flex flex-wrap gap-x-5 gap-y-2" : "grid gap-2")}
        >
          {SCOPE_ORDER.map((s) => {
            const disabled = scopeDisabled(s, count);
            const id = `scope-${element}-${s}`;
            return (
              <div
                key={s}
                className={cn(
                  "flex items-start gap-2.5",
                  // Selected styling is driven off `scope`, not `:checked` —
                  // Radix only emits a real input inside a <form>.
                  !inManualMode && "rounded-g6-base border p-3",
                  !inManualMode && scope === s
                    ? "border-g6-primary-border bg-g6-primary-bg"
                    : !inManualMode && "border-g6-border bg-g6-bg-container",
                  disabled && "opacity-55",
                )}
              >
                <RadioGroupItem
                  id={id}
                  value={s}
                  disabled={disabled}
                  className="mt-0.5 border-g6-border text-g6-primary focus-visible:ring-g6-primary data-[state=checked]:border-g6-primary"
                />
                <label htmlFor={id} className={cn("min-w-0", !disabled && "cursor-pointer")}>
                  <span className="block text-sm font-medium leading-tight">
                    {SCOPE_COPY[s].label}
                  </span>
                  {!inManualMode ? (
                    <span className="mt-0.5 block text-xs text-g6-text-secondary">
                      {disabled
                        ? "Needs at least 2 variations."
                        : SCOPE_COPY[s].desc(count)}
                    </span>
                  ) : null}
                </label>
              </div>
            );
          })}
        </RadioGroup>

        {count < 2 ? (
          <p className="mt-2 text-xs text-g6-text-tertiary">
            You asked for 1 variation, so there is nothing to split across — the
            instruction below applies to it.
          </p>
        ) : null}
      </fieldset>

      {/* Nothing below the scope question until a scope exists. */}
      {!inManualMode || !scope ? null : (
        <div className="flex flex-col gap-3 border-t border-g6-border-secondary pt-4">
          {/* N dropped to 1 after a per-variation scope was chosen. Say so
              rather than quietly treating it as "all". */}
          {count < 2 && scope !== "all" ? (
            <div className="flex flex-col items-start gap-2 rounded-g6-base bg-g6-bg-muted p-3">
              <Notice>
                This edit is still set to <strong>{SCOPE_COPY[scope].label}</strong>, but
                there is only 1 variation now.
              </Notice>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 border-g6-border bg-g6-bg-container px-2 text-xs text-g6-text hover:bg-g6-bg-muted hover:text-g6-text"
                onClick={() => onScopeChange(element, "all")}
              >
                Switch to All variations
              </Button>
            </div>
          ) : null}

          {/* -------------------------------------------- detected context */}
          <div className="rounded-g6-base bg-g6-bg-muted px-3 py-2">
            <p className="text-xs text-g6-text-secondary">
              Detected {def.label.toLowerCase()}:{" "}
              <span className="font-medium text-g6-text">{detectedText}</span>
              {detected?.provenance === "detected" ? (
                <span className="ml-1.5 text-g6-text-tertiary">(inferred)</span>
              ) : null}
            </p>
            {detected?.detail ? (
              <p className="mt-0.5 text-xs text-g6-text-tertiary">{detected.detail}</p>
            ) : null}
          </div>

          {/* ------------------------------------------- scope: all / multiple */}
          {scope !== "individual" ? (
            <>
              {scope === "multiple" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">
                      Which variations? ({indexes.length} of {count})
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-g6-text-secondary hover:bg-g6-bg-muted hover:text-g6-text"
                        onClick={() => onIndexesChange(element, allIndexes)}
                      >
                        Select all
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-g6-text-secondary hover:bg-g6-bg-muted hover:text-g6-text"
                        onClick={() => onIndexesChange(element, [])}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div role="group" aria-label="Variations this edit applies to" className="flex flex-wrap gap-1.5">
                    {allIndexes.map((i) => (
                      <VariationChip
                        key={i}
                        n={i + 1}
                        role="checkbox"
                        selected={indexes.includes(i)}
                        onClick={() => toggleIndex(i)}
                        ariaLabel={`Variation ${i + 1}`}
                      />
                    ))}
                  </div>
                  {indexes.length === 0 ? (
                    <Notice>
                      Nothing selected, so this edit will not be applied to any variation.
                      Pick at least one, or switch to All variations.
                    </Notice>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`prompt-${element}`}
                  className="text-xs font-medium text-g6-text"
                >
                  {def.label} instruction
                </label>
                <Textarea
                  id={`prompt-${element}`}
                  value={edit.prompt ?? ""}
                  onChange={(e) => onPromptChange(element, e.target.value)}
                  placeholder={seed}
                  rows={4}
                  className="resize-y border-g6-border bg-g6-bg-container text-sm text-g6-text placeholder:text-g6-text-tertiary focus-visible:ring-g6-primary"
                />
                <p className="text-xs text-g6-text-tertiary">
                  {scope === "all"
                    ? `Used for all ${count} variation${count === 1 ? "" : "s"}.`
                    : indexes.length === 0
                      ? "Used for no variations until you pick some."
                      : `Used for variation${indexes.length === 1 ? "" : "s"} ${indexes
                          .map((i) => i + 1)
                          .join(", ")}.`}
                </p>
              </div>
            </>
          ) : null}

          {/* ---------------------------------------------- scope: individual */}
          {/* Master-detail, not N stacked textareas: at N=20 a stack has no
              overview, no way to see which ones you already touched, and 20
              scroll-heights. The chip rail is a constant-height map (dot = it
              differs from the detection) over one editor pane. */}
          {scope === "individual" ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium">
                Pick a variation to write its instruction
              </span>
              <div
                role="radiogroup"
                aria-label="Variation being edited"
                className="flex flex-wrap gap-1.5"
              >
                {allIndexes.map((i) => (
                  <VariationChip
                    key={i}
                    n={i + 1}
                    role="radio"
                    selected={i === active}
                    edited={(byIndex[i] ?? seed) !== seed}
                    onClick={() => setActiveRaw(i)}
                    ariaLabel={`Edit variation ${i + 1}`}
                  />
                ))}
              </div>

              <div className="mt-1 flex flex-col gap-1.5">
                <div className="flex items-end justify-between gap-2">
                  <label
                    htmlFor={`prompt-${element}-${active}`}
                    className="text-xs font-medium text-g6-text"
                  >
                    Variation {active + 1} of {count}
                  </label>
                  {count > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs text-g6-text-secondary hover:bg-g6-bg-muted hover:text-g6-text"
                      onClick={() => {
                        const value = byIndex[active] ?? seed;
                        allIndexes.forEach((i) => {
                          if (i !== active) onPromptForIndexChange(element, i, value);
                        });
                      }}
                    >
                      <Check className="h-3 w-3" aria-hidden />
                      Copy to all {count}
                    </Button>
                  ) : null}
                </div>
                <Textarea
                  id={`prompt-${element}-${active}`}
                  value={byIndex[active] ?? seed}
                  onChange={(e) => onPromptForIndexChange(element, active, e.target.value)}
                  placeholder={seed}
                  rows={4}
                  className="resize-y border-g6-border bg-g6-bg-container text-sm text-g6-text placeholder:text-g6-text-tertiary focus-visible:ring-g6-primary"
                />
                <p className="flex items-center gap-1 text-xs text-g6-text-tertiary">
                  <Pencil className="h-3 w-3" aria-hidden />
                  {allIndexes.filter((i) => (byIndex[i] ?? seed) !== seed).length} of {count}{" "}
                  changed from the detection.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default ElementEditor;
