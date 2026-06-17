/**
 * NomenclatureBuilder — collapsible naming & nomenclature section (Decision 27).
 *
 * Top of Step 4 overview. Collapsed by default. Contains:
 *   • Launch name field → plan.name
 *   • Per-level token template builder (Account / Campaign / Ad Set / Ad)
 *     - Token chips (clickable, insert into template)
 *     - Live preview resolved against mock/first-real values
 * Writes to plan.namingPatterns.campaign / .adset / .ad via flow.patch.
 */
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanV2 } from "../../types";
import type { UseFlowV2 } from "../../state/useFlowV2";

const TODAY = "2026-06-16";

const AVAILABLE_TOKENS = [
  { key: "{brand}", label: "{brand}" },
  { key: "{objective}", label: "{objective}" },
  { key: "{format}", label: "{format}" },
  { key: "{n}", label: "{n}" },
  { key: "{date}", label: "{date}" },
  { key: "{adset_n}", label: "{adset_n}" },
  { key: "{campaign_n}", label: "{campaign_n}" },
  { key: "{page}", label: "{page}" },
  { key: "{creative}", label: "{creative}" },
];

/** Resolve tokens for a live preview given a template string. */
function resolveTokens(template: string, plan: PlanV2): string {
  const brand = "Mamaearth";
  const objective = (plan.objective ?? "OUTCOME_SALES").replace("OUTCOME_", "");
  const format = (plan.format ?? "single_image").replace(/_/g, "-");
  const page = plan.targets[0]?.pageName ?? "Mamaearth";
  const creative = plan.creatives[0]?.name ?? "Creative-01";

  return template
    .replace(/\{brand\}/g, brand)
    .replace(/\{objective\}/g, objective)
    .replace(/\{format\}/g, format)
    .replace(/\{n\}/g, "1")
    .replace(/\{date\}/g, TODAY)
    .replace(/\{adset_n\}/g, "1")
    .replace(/\{campaign_n\}/g, "1")
    .replace(/\{page\}/g, page)
    .replace(/\{creative\}/g, creative);
}

/* ------------------------------------------------------------------ */
/*  Token template input row                                            */
/* ------------------------------------------------------------------ */
function TemplateRow({
  levelLabel,
  value,
  onChange,
  plan,
}: {
  levelLabel: string;
  value: string;
  onChange: (v: string) => void;
  plan: PlanV2;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = value.trim() ? resolveTokens(value, plan) : "—";

  const insertToken = (token: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value + token);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    // Move caret after insertion
    requestAnimationFrame(() => {
      el.setSelectionRange(start + token.length, start + token.length);
      el.focus();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
          {levelLabel}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`e.g. {brand}_{objective}_{n}`}
          className="h-7 min-w-0 flex-1 rounded-full border border-border bg-background px-3 font-mono text-[11px] outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {/* Token chips */}
      <div className="ml-22 flex flex-wrap gap-1.5 pl-[5.5rem]">
        {AVAILABLE_TOKENS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => insertToken(t.key)}
            title={`Insert ${t.key}`}
            className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary transition-colors hover:bg-primary/20 cursor-pointer"
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Live preview */}
      {value.trim() && (
        <div className="ml-[5.5rem] flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground/50">Preview:</span>
          <span className="font-mono text-[11px] text-foreground">{preview}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function NomenclatureBuilder({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [open, setOpen] = useState(false);

  const patterns = plan.namingPatterns ?? { campaign: "", adset: "", ad: "" };

  const setPlanName = (name: string) => flow.patch({ name });

  const setPattern = (level: keyof typeof patterns, value: string) => {
    flow.patch({
      namingPatterns: { ...patterns, [level]: value },
    });
  };

  return (
    <div className="rounded-2xl border border-border">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="fab-focus flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open ? "rotate-0" : "-rotate-90",
            )}
          />
          <span className="text-[13px] font-medium text-foreground">Naming &amp; Nomenclature</span>
          {(patterns.campaign || patterns.adset || patterns.ad || plan.name) && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
              configured
            </span>
          )}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/50">
          {open ? "Collapse" : "Expand"}
        </span>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-border px-4 py-4 space-y-5">
          {/* Launch name */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
              Launch name
            </label>
            <input
              type="text"
              value={plan.name ?? ""}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. Mamaearth June Brand Push"
              className="h-8 w-full rounded-full border border-border bg-background px-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="font-mono text-[10px] text-muted-foreground/50">
              Used as the launch identifier in reports and history.
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* Per-level templates */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                Naming templates
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/50">
                Click tokens to insert
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <TemplateRow
              levelLabel="Campaign"
              value={patterns.campaign}
              onChange={(v) => setPattern("campaign", v)}
              plan={plan}
            />
            <TemplateRow
              levelLabel="Ad set"
              value={patterns.adset}
              onChange={(v) => setPattern("adset", v)}
              plan={plan}
            />
            <TemplateRow
              levelLabel="Ad"
              value={patterns.ad}
              onChange={(v) => setPattern("ad", v)}
              plan={plan}
            />
          </div>

          <p className="font-mono text-[10px] text-muted-foreground/50">
            Tokens resolve at launch time. {"{n}"} = sequence number per level.
          </p>
        </div>
      )}
    </div>
  );
}
