/**
 * NomenclatureBuilder — D27 nomenclature token builder + live resolved-name preview.
 *
 * Uses plan.namingPattern (single string) and resolves via resolveName() from
 * planUnits.ts — the same function the launch engine uses. What you see in the
 * preview is exactly what launches.
 *
 * Tokens available:
 *   {brand}     — account brand prefix (first target account name, before "—")
 *   {intent}    — test / scale / custom
 *   {objective} — e.g. "sales" (OUTCOME_ stripped + lowercased)
 *   {date}      — plan.createdAt sliced to YYYY-MM-DD
 *   {adset}     — ad set number (01, 02…)
 *   {n}         — sequential ad number
 *
 * Props: { flow: UseFlowV2 }
 * Writes to plan.namingPattern via flow.patch.
 */
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../state/useFlowV2";
import { resolveName } from "../../planUnits";

const DEFAULT_PATTERN = "{brand}_{intent}_{date}";

const TOKENS = [
  { key: "{brand}", desc: "account brand prefix" },
  { key: "{intent}", desc: "test / scale / custom" },
  { key: "{objective}", desc: "e.g. sales" },
  { key: "{date}", desc: "launch date YYYY-MM-DD" },
  { key: "{adset}", desc: "ad set number (01, 02…)" },
  { key: "{n}", desc: "sequential ad number" },
] as const;

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

interface Props {
  flow: UseFlowV2;
}

export function NomenclatureBuilder({ flow }: Props) {
  const { plan } = flow;

  // Local draft — only committed when user hits Save
  const [draftPattern, setDraftPattern] = useState<string>(
    plan.namingPattern || DEFAULT_PATTERN,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // Insert token at cursor position
  const insertToken = (token: string) => {
    const el = inputRef.current;
    if (!el) {
      setDraftPattern((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? draftPattern.length;
    const end = el.selectionEnd ?? draftPattern.length;
    const next = draftPattern.slice(0, start) + token + draftPattern.slice(end);
    setDraftPattern(next);
    requestAnimationFrame(() => {
      el.setSelectionRange(start + token.length, start + token.length);
      el.focus();
    });
  };

  // Compute live preview using the real resolveName function
  const firstTarget = plan.targets[0];
  const brand = firstTarget
    ? firstTarget.accountName.split("—")[0].trim()
    : "Brand";

  const previewCtx = { brand, adset: "01", n: 1 };
  // Temporarily swap the pattern in for preview
  const previewPlan = { ...plan, namingPattern: draftPattern };
  const preview = resolveName(previewPlan, previewCtx);

  const isDirty = draftPattern !== (plan.namingPattern || DEFAULT_PATTERN);

  const handleSave = () => {
    flow.patch({ namingPattern: draftPattern });
  };

  const handleReset = () => {
    setDraftPattern(DEFAULT_PATTERN);
  };

  return (
    <div className="space-y-3">
      {/* Token chips */}
      <div className="flex flex-wrap gap-1.5">
        {TOKENS.map((t) => (
          <button
            key={t.key}
            type="button"
            title={t.desc}
            onClick={() => insertToken(t.key)}
            className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 font-mono text-[11px] cursor-pointer hover:bg-primary/20 transition-colors"
          >
            {t.key}
          </button>
        ))}
      </div>

      {/* Pattern input */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draftPattern}
          onChange={(e) => setDraftPattern(e.target.value)}
          placeholder={DEFAULT_PATTERN}
          className="h-8 min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 font-mono text-[12px] outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Naming pattern"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-colors",
            isDirty
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="shrink-0 rounded-full px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Live preview */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-muted-foreground/60">Preview:</span>
        <span className="font-mono text-[11px] text-muted-foreground">{preview}</span>
      </div>
    </div>
  );
}
