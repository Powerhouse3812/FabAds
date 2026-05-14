import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight, Check, Sparkles, Play, LayoutGrid, Image as ImageIcon,
  TrendingUp, Zap, Telescope, Star, Boxes, Radio, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Welcome / Celebration screen — plays before Step 1 (Choose Mode).
 *
 * Two variants (toggleable in-app):
 *   - "creative"  — Genie / Creative Generation framing
 *   - "insights"  — Industry Intelligence framing
 *
 * Both ported from the ff.ai wireframe `WelcomeCelebrate` /
 * `InsightsCelebrate` components but converted to LIGHT mode with
 * restrained lime accent — only on the highlighted word in the
 * headline, the check ring, and the primary CTA. Stat numbers and
 * icons stay in foreground/muted colors so the page reads as a
 * professional SaaS welcome, not a lime poster.
 *
 * Animation polish: gentle dot-grid background, soft glow pulse on
 * the check, counter-up tickers, restrained confetti burst.
 *
 * `printMode` skips all setTimeout-driven phase progression and
 * renders the final phase directly so /onboarding-print/welcome
 * captures the full composition for html.to.design.
 */

type Variant = "creative" | "insights";

interface WelcomeProps {
  onContinue: () => void;
  printMode?: boolean;
  /**
   * Controlled variant (preferred). When provided together with
   * `onVariantChange`, toggling syncs to the parent (e.g. URL state
   * in OnboardingShell). Falls back to internal state if omitted —
   * useful for the print page where there's no parent to wire to.
   */
  variant?: Variant;
  onVariantChange?: (next: Variant) => void;
  /** Initial variant when uncontrolled. Defaults to "creative". */
  initialVariant?: Variant;
}

interface StatDef {
  icon: typeof Sparkles;
  target: number;
  format: (v: number) => string;
  label: string;
}

interface VariantConfig {
  headlineLead: string;
  headlineHighlight: string;
  headlineTrail: string;
  sub: string;
  stats: StatDef[];
  /** Optional feature pills (only the Creative variant shows these). */
  features?: { icon: typeof Sparkles; label: string }[];
  ctaLabel: string;
  footnote: string;
}

const CONFIGS: Record<Variant, VariantConfig> = {
  creative: {
    headlineLead: "Your journey from Affiliate to ",
    headlineHighlight: "Super Affiliate",
    headlineTrail: " begins.",
    sub: "You just unlocked the most powerful creative engine in performance marketing.",
    stats: [
      { icon: Telescope, target: 50, format: (v) => `${Math.round(v)}M+`, label: "Ads analyzed" },
      { icon: Star, target: 12, format: (v) => `${Math.round(v)}K+`, label: "Marketers trust us" },
      { icon: TrendingUp, target: 4.2, format: (v) => `${v.toFixed(1)}×`, label: "Avg. ROAS lift" },
      { icon: Zap, target: 60, format: (v) => `<${Math.round(v)}s`, label: "First creative ready" },
    ],
    features: [
      { icon: Sparkles, label: "AI Creative Generation" },
      { icon: Play, label: "Video Sage Analysis" },
      { icon: LayoutGrid, label: "Industry Intelligence" },
      { icon: ImageIcon, label: "Creative Library" },
    ],
    ctaLabel: "Let's set up your account",
    footnote: "Takes under 2 minutes · You'll generate your first creative today",
  },
  insights: {
    headlineLead: "Your ",
    headlineHighlight: "competitive edge",
    headlineTrail: " is now active.",
    sub: "You just unlocked the most comprehensive ad intelligence platform in the market.",
    stats: [
      { icon: Boxes, target: 50, format: (v) => `${Math.round(v)}M+`, label: "Ads indexed" },
      { icon: Telescope, target: 8, format: (v) => `${Math.round(v)}`, label: "Platforms tracked" },
      { icon: Radio, target: 24, format: () => "24/7", label: "Real-time monitoring" },
      { icon: RefreshCw, target: 6, format: (v) => `<${Math.round(v)}h`, label: "Feed refresh cycle" },
    ],
    ctaLabel: "Set up your tracking",
    footnote: "Takes under 2 minutes",
  },
};

/* ── Counter-up hook (ease-out cubic, 1200ms default) ── */
function useCountUp(target: number, start: boolean, durationMs = 1200) {
  const [value, setValue] = useState(start ? 0 : 0);
  useEffect(() => {
    if (!start) return;
    setValue(0);
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - t0;
      const p = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, durationMs]);
  return value;
}

/* ── Restrained confetti — fewer pieces, softer colours, tighter spread ── */
interface ConfettiPiece {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  delay: number;
  size: number;
  tone: "primary" | "muted";
}

function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
      const distance = 60 + Math.random() * 35;
      return {
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance - 12,
        rot: 120 + Math.random() * 360,
        delay: i * 28,
        size: 4 + Math.random() * 3,
        tone: i % 3 === 0 ? "muted" : "primary",
      };
    });
  }, []);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={cn(
            "absolute rounded-sm",
            p.tone === "primary" ? "bg-primary" : "bg-foreground/40",
          )}
          style={
            {
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `ff-confetti-fly 1.0s ease-out ${p.delay}ms forwards`,
              "--ff-tx": `${p.tx}px`,
              "--ff-ty": `${p.ty}px`,
              "--ff-rot": `${p.rot}deg`,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}
    </div>
  );
}

/* ── Phase fade-in helper ── */
function phaseStyle(phase: number, atPhase: number): CSSProperties {
  return {
    opacity: phase >= atPhase ? 1 : 0,
    transform: phase >= atPhase ? "translateY(0)" : "translateY(16px)",
    transition: "opacity 0.55s ease-out, transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1)",
  };
}

/* ── Variant toggle (segmented pill) ── */
function VariantToggle({
  variant,
  onChange,
}: {
  variant: Variant;
  onChange: (v: Variant) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 backdrop-blur p-1 shadow-sm">
      {(["creative", "insights"] as const).map((v) => {
        const active = v === variant;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "px-3 py-1 rounded-full text-[12px] transition-colors font-medium",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={active}
          >
            {v === "creative" ? "Creative" : "Insights"}
          </button>
        );
      })}
    </div>
  );
}

/* ── Counter-aware stat card ── */
function StatCard({
  stat,
  start,
}: {
  stat: StatDef;
  start: boolean;
}) {
  const value = useCountUp(stat.target, start);
  const Icon = stat.icon;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 flex flex-col items-center text-center shadow-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mb-1.5" />
      <div className="text-[26px] font-bold text-foreground leading-none tabular-nums font-mono">
        {stat.format(value)}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5 leading-tight">
        {stat.label}
      </div>
    </div>
  );
}

export function Welcome({
  onContinue,
  printMode = false,
  variant: controlledVariant,
  onVariantChange,
  initialVariant = "creative",
}: WelcomeProps) {
  // Controlled-when-prop / uncontrolled-otherwise.
  const [internalVariant, setInternalVariant] =
    useState<Variant>(initialVariant);
  const variant = controlledVariant ?? internalVariant;
  const setVariant = (next: Variant) => {
    if (onVariantChange) onVariantChange(next);
    else setInternalVariant(next);
  };
  const [phase, setPhase] = useState(printMode ? 5 : 0);
  const config = CONFIGS[variant];

  useEffect(() => {
    if (printMode) return;
    const timers = [
      setTimeout(() => setPhase(1), 350),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2300),
      setTimeout(() => setPhase(5), 2900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [printMode]);

  const tickStart = phase >= 3;

  return (
    <div
      className="relative flex flex-col items-center min-h-[640px] overflow-hidden px-6 pt-7 pb-10"
      style={{
        // Soft cream-to-paper gradient + subtle lime radial top — light + warm.
        background:
          "radial-gradient(ellipse 640px 280px at 50% 0%, rgba(195,235,66,0.10), transparent 70%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.4) 100%)",
        // Subtle dot-grid texture for depth without floating particles.
        backgroundImage:
          "radial-gradient(ellipse 640px 280px at 50% 0%, rgba(195,235,66,0.10), transparent 70%), radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "auto, 18px 18px",
        backgroundPosition: "0 0, 0 0",
      }}
    >
      {/* Toggle row */}
      <div className="relative z-10 mb-6">
        <VariantToggle variant={variant} onChange={setVariant} />
      </div>

      <div className="relative z-10 w-full max-w-[600px] text-center">
        {/* Phase 0 → 1 : Check + eyebrow + confetti */}
        <div style={phaseStyle(phase, 0)} className="mb-6 relative">
          <div className="relative inline-flex items-center justify-center">
            <ConfettiBurst active={phase >= 1} />
            <div
              className="relative h-[64px] w-[64px] rounded-full border-[2.5px] border-primary inline-flex items-center justify-center bg-primary/10"
              style={{
                animation: printMode
                  ? undefined
                  : "ff-welcome-glow-pulse 2.6s ease-in-out infinite",
                animationDelay: "0.5s",
              }}
            >
              <Check
                className="h-8 w-8 text-foreground"
                strokeWidth={2.5}
              />
            </div>
          </div>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground mt-3 font-mono uppercase">
            Payment confirmed
          </p>
        </div>

        {/* Phase 2 : Headline + sub */}
        <div style={phaseStyle(phase, 2)} className="mb-8">
          <h1 className="text-[32px] md:text-[38px] font-bold tracking-tight leading-[1.08] text-foreground">
            {config.headlineLead}
            <span className="relative inline-block">
              <span className="relative z-10">{config.headlineHighlight}</span>
              <span
                aria-hidden
                className="absolute left-0 right-0 bottom-0.5 h-[10px] rounded-sm bg-primary/40"
              />
            </span>
            {config.headlineTrail}
          </h1>
          <p className="text-[14px] text-muted-foreground mt-3.5 max-w-[480px] mx-auto leading-relaxed">
            {config.sub}
          </p>
        </div>

        {/* Phase 3 : 4 brag stats with counter-up tickers */}
        <div style={phaseStyle(phase, 3)} className="mb-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {config.stats.map((s, i) => (
              <StatCard key={`${variant}-${i}`} stat={s} start={tickStart} />
            ))}
          </div>
        </div>

        {/* Phase 4 : feature pills (Creative variant only) */}
        {config.features && (
          <div style={phaseStyle(phase, 4)} className="mb-7">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2.5">
              {config.features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="inline-flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 text-foreground bg-primary/10">
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="text-[12px] text-foreground">
                      {f.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase 5 : CTA + footnote */}
        <div style={phaseStyle(phase, 5)}>
          <button
            onClick={onContinue}
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-6 py-3",
              "bg-primary text-primary-foreground font-semibold text-[14px]",
              "hover:bg-primary/90 active:translate-y-px transition-all",
              "shadow-[0_6px_20px_-8px_rgba(195,235,66,0.45)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            {config.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-[11px] text-muted-foreground mt-3">
            {config.footnote}
          </p>
        </div>
      </div>
    </div>
  );
}
