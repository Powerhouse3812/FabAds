import { cn } from "@/lib/utils";

/**
 * AffiliateAdAdvancedFields — Affiliate-Ad-specific Advanced fields per
 * Form Specs §3.
 *
 * Sits below CommonAdvancedFields. Adds:
 *   - Funnel emphasis (Hard-sell / Curiosity / Soft-CTA)
 *   - Compliance presets (Nutra / Sweepstakes / Finance — each stricter)
 *   - LP-emphasis (Use exact LP visual / Stylize / Re-create from scratch)
 *   - Geo-target (free text — geo-locked offers)
 */

const FUNNEL_EMPHASIS = [
  { id: "hard-sell", label: "Hard-sell" },
  { id: "curiosity", label: "Curiosity" },
  { id: "soft-cta", label: "Soft-CTA" },
] as const;
const COMPLIANCE_PRESETS = [
  { id: "none", label: "None", sub: "Standard" },
  { id: "nutra", label: "Nutra", sub: "Stricter — banned-claims list" },
  { id: "sweepstakes", label: "Sweepstakes", sub: "Sweeps + giveaway disclosure" },
  { id: "finance", label: "Finance", sub: "FinTech / FCA-style guardrails" },
] as const;
const LP_EMPHASIS = [
  { id: "exact", label: "Use exact LP visual" },
  { id: "stylize", label: "Stylize" },
  { id: "scratch", label: "Re-create from scratch" },
] as const;

export type FunnelEmphasis = typeof FUNNEL_EMPHASIS[number]["id"];
export type CompliancePreset = typeof COMPLIANCE_PRESETS[number]["id"];
export type LpEmphasis = typeof LP_EMPHASIS[number]["id"];

export interface AffiliateAdAdvancedState {
  funnelEmphasis: FunnelEmphasis;
  compliancePreset: CompliancePreset;
  lpEmphasis: LpEmphasis;
  geoTarget: string;
}

export interface AffiliateAdAdvancedFieldsProps {
  state: AffiliateAdAdvancedState;
  onChange: (next: AffiliateAdAdvancedState) => void;
}

export function AffiliateAdAdvancedFields({ state, onChange }: AffiliateAdAdvancedFieldsProps) {
  const set = <K extends keyof AffiliateAdAdvancedState>(k: K, v: AffiliateAdAdvancedState[K]) => {
    onChange({ ...state, [k]: v });
  };

  return (
    <div className="space-y-3">
      <ChipBlock
        label="Funnel emphasis"
        options={FUNNEL_EMPHASIS as readonly { id: string; label: string }[]}
        value={state.funnelEmphasis}
        onChange={(v) => set("funnelEmphasis", v as FunnelEmphasis)}
      />

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-foreground">Compliance preset</p>
        <p className="text-[10px] text-muted-foreground">
          Stricter presets shrink the allowed-claims list and bias toward soft-CTA copy.
        </p>
        <div className="flex flex-wrap items-stretch gap-1.5">
          {COMPLIANCE_PRESETS.map((c) => {
            const active = state.compliancePreset === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => set("compliancePreset", c.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-md border px-2 py-1 text-left transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-card hover:border-foreground/30",
                )}
              >
                <p className="text-xs font-medium text-foreground">{c.label}</p>
                <p className="text-[10px] text-muted-foreground">{c.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      <ChipBlock
        label="LP emphasis"
        options={LP_EMPHASIS as readonly { id: string; label: string }[]}
        value={state.lpEmphasis}
        onChange={(v) => set("lpEmphasis", v as LpEmphasis)}
        sub="How closely to mirror the landing page visual"
      />

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-foreground">Geo target</p>
        <p className="text-[10px] text-muted-foreground">
          Geo-locked offers — affects compliance check + creative.
        </p>
        <input
          type="text"
          value={state.geoTarget}
          onChange={(e) => set("geoTarget", e.target.value)}
          placeholder="e.g. India, UAE, EU-7"
          className="block h-9 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
        />
      </div>
    </div>
  );
}

function ChipBlock({
  label,
  sub,
  options,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      <div className="flex flex-wrap items-center gap-1">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const DEFAULT_AFFILIATE_AD_ADVANCED: AffiliateAdAdvancedState = {
  funnelEmphasis: "curiosity",
  compliancePreset: "none",
  lpEmphasis: "stylize",
  geoTarget: "",
};
