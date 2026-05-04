import { cn } from "@/lib/utils";
import type { StrictnessLevel, FunnelStage } from "../types";

/**
 * CommonAdvancedFields — shared Advanced drawer fields used by Brand /
 * Product / Affiliate forms (A-11.4+).
 *
 * Per Form Specs §1, §2, §3 — every Type CTA's Advanced drawer carries the
 * same baseline fields:
 *   - Audience override
 *   - Tone
 *   - Hook style
 *   - Angle
 *   - Aspect ratios (multi-select)
 *   - Brand-Constitution strictness
 *   - Compliance toggle
 *   - Funnel stage
 *
 * Type-specific fields (Price emphasis on Product Ad, Funnel emphasis on
 * Affiliate Ad, etc.) live alongside this in their respective forms.
 *
 * Each field is a controlled component — caller owns state.
 */

const TONE_OPTIONS = ["Casual", "Aspirational", "Bold", "Professional", "Playful"] as const;
const HOOK_OPTIONS = ["Question", "Stat-led", "Curiosity", "Bold-claim", "Story"] as const;
const ANGLE_OPTIONS = [
  "FOMO",
  "Comparison",
  "Founder-story",
  "Lifestyle",
  "Aspirational",
  "Problem-Solution",
  "Social-proof",
] as const;
const ASPECT_OPTIONS = ["1:1", "4:5", "9:16", "16:9", "1.91:1"] as const;
const STRICTNESS_OPTIONS: { id: StrictnessLevel; label: string; sub: string }[] = [
  { id: "strict", label: "Strict", sub: "Locked palette + fonts + voice" },
  { id: "balanced", label: "Balanced", sub: "Recommended" },
  { id: "loose", label: "Loose", sub: "More creative latitude" },
];
const FUNNEL_OPTIONS: { id: FunnelStage; label: string }[] = [
  { id: "awareness", label: "Awareness" },
  { id: "consideration", label: "Consideration" },
  { id: "conversion", label: "Conversion" },
];

export type ToneOption = typeof TONE_OPTIONS[number];
export type HookOption = typeof HOOK_OPTIONS[number];
export type AngleOption = typeof ANGLE_OPTIONS[number];
export type AspectOption = typeof ASPECT_OPTIONS[number];

export interface CommonAdvancedState {
  audience?: string;
  tone?: ToneOption;
  hook?: HookOption;
  angle?: AngleOption;
  aspectRatios: AspectOption[];
  strictness: StrictnessLevel;
  complianceOn: boolean;
  funnel: FunnelStage;
}

export interface CommonAdvancedFieldsProps {
  state: CommonAdvancedState;
  onChange: (next: CommonAdvancedState) => void;
}

export function CommonAdvancedFields({ state, onChange }: CommonAdvancedFieldsProps) {
  const set = <K extends keyof CommonAdvancedState>(k: K, v: CommonAdvancedState[K]) => {
    onChange({ ...state, [k]: v });
  };

  const toggleAspect = (a: AspectOption) => {
    set(
      "aspectRatios",
      state.aspectRatios.includes(a)
        ? state.aspectRatios.filter((x) => x !== a)
        : [...state.aspectRatios, a],
    );
  };

  return (
    <div className="space-y-3">
      {/* Audience override */}
      <FieldRow label="Audience override">
        <input
          type="text"
          value={state.audience ?? ""}
          onChange={(e) => set("audience", e.target.value)}
          placeholder="e.g. Mums 28-40 in metros, post-natal skincare"
          className="block h-9 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
        />
      </FieldRow>

      {/* Tone */}
      <FieldRow label="Tone">
        <ChipRow
          options={TONE_OPTIONS as readonly string[]}
          value={state.tone}
          onChange={(v) => set("tone", v as ToneOption)}
        />
      </FieldRow>

      {/* Hook */}
      <FieldRow label="Hook style">
        <ChipRow
          options={HOOK_OPTIONS as readonly string[]}
          value={state.hook}
          onChange={(v) => set("hook", v as HookOption)}
        />
      </FieldRow>

      {/* Angle */}
      <FieldRow label="Angle">
        <ChipRow
          options={ANGLE_OPTIONS as readonly string[]}
          value={state.angle}
          onChange={(v) => set("angle", v as AngleOption)}
        />
      </FieldRow>

      {/* Aspect ratios — multi-select for parallel render */}
      <FieldRow label="Aspect ratios" sub="Multi-select for parallel render">
        <div className="flex flex-wrap items-center gap-1">
          {ASPECT_OPTIONS.map((a) => {
            const active = state.aspectRatios.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAspect(a)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-mono transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground font-bold"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30",
                )}
              >
                {a}
              </button>
            );
          })}
        </div>
      </FieldRow>

      {/* Brand-Constitution strictness */}
      <FieldRow label="Brand-Constitution strictness" sub="Defaults from Brand profile">
        <div className="flex flex-wrap items-stretch gap-1.5">
          {STRICTNESS_OPTIONS.map((s) => {
            const active = state.strictness === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => set("strictness", s.id)}
                className={cn(
                  "rounded-md border px-2 py-1 text-left transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-card hover:border-foreground/30",
                )}
              >
                <p className="text-xs font-medium text-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </button>
            );
          })}
        </div>
      </FieldRow>

      {/* Compliance toggle */}
      <FieldRow
        label="Compliance review"
        sub="Geo-aware: EU / CA / India auto-on regardless of toggle"
      >
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.complianceOn}
            onChange={(e) => set("complianceOn", e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs text-foreground">
            {state.complianceOn ? "On — restricted-claims check before render" : "Off"}
          </span>
        </label>
      </FieldRow>

      {/* Funnel stage */}
      <FieldRow label="Funnel stage">
        <ChipRow
          options={FUNNEL_OPTIONS.map((f) => f.label)}
          value={FUNNEL_OPTIONS.find((f) => f.id === state.funnel)?.label}
          onChange={(label) => {
            const match = FUNNEL_OPTIONS.find((f) => f.label === label);
            if (match) set("funnel", match.id);
          }}
        />
      </FieldRow>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function FieldRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="space-y-0.5">
        <p className="text-[11px] font-medium text-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition-colors",
              active
                ? "bg-primary text-primary-foreground font-medium"
                : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

/**
 * Default initial state — caller can spread + override per Type pre-fill matrix.
 */
export const DEFAULT_COMMON_ADVANCED: CommonAdvancedState = {
  audience: "",
  tone: undefined,
  hook: undefined,
  angle: undefined,
  aspectRatios: ["1:1"],
  strictness: "balanced",
  complianceOn: true,
  funnel: "consideration",
};
