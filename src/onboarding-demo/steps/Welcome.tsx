import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight, Check, Sparkles, Play, LayoutGrid, Image as ImageIcon,
  TrendingUp, Zap, Telescope, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Welcome / Celebration screen — plays before Step 1 (Choose Mode).
 *
 * Ported from the ff.ai wireframe (WelcomeCelebrate) with heavier
 * animation polish: lime particle field, glow pulse on the check,
 * counter-up tickers for the brag stats, confetti burst when the
 * check appears.
 *
 * Timeline compressed to ~3.2s (down from 6.2s in the wireframe).
 *
 * `printMode` skips all setTimeouts and renders the final phase
 * directly so /onboarding-print/welcome captures the full state
 * for html.to.design.
 */

interface WelcomeProps {
  onContinue: () => void;
  printMode?: boolean;
}

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

/* ── Background particle field ── */
interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  tx: number;
  ty: number;
  opacity: number;
}

function ParticleField({ count = 30 }: { count?: number }) {
  // Deterministic-ish randomisation via useMemo so SSR / re-renders
  // don't reposition particles mid-animation.
  const particles = useMemo<Particle[]>(() => {
    const rand = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rand(i * 7 + 1) * 100,
      top: rand(i * 13 + 3) * 100,
      size: 2 + rand(i * 5 + 7) * 4,
      duration: 10 + rand(i * 11 + 5) * 12,
      delay: rand(i * 17 + 2) * 8,
      tx: -40 + rand(i * 19 + 9) * 80,
      ty: -80 - rand(i * 23 + 1) * 60,
      opacity: 0.15 + rand(i * 29 + 13) * 0.2,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-primary"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `ff-particle-drift ${p.duration}s linear ${p.delay}s infinite`,
              "--ff-tx": `${p.tx}px`,
              "--ff-ty": `${p.ty}px`,
              "--ff-particle-opacity": p.opacity,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}
    </div>
  );
}

/* ── Confetti burst from the check icon ── */
interface ConfettiPiece {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  delay: number;
  size: number;
}

function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
      const distance = 80 + Math.random() * 60;
      return {
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance - 20,
        rot: 180 + Math.random() * 540,
        delay: i * 20,
        size: 6 + Math.random() * 4,
      };
    });
  }, []);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-sm bg-primary"
          style={
            {
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `ff-confetti-fly 1.2s ease-out ${p.delay}ms forwards`,
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

/* ── Format helpers for the stat tickers ── */
function formatM(v: number) {
  return `${Math.round(v)}M+`;
}
function formatK(v: number) {
  return `${Math.round(v)}K+`;
}
function formatRoas(v: number) {
  return `${v.toFixed(1)}×`;
}
function formatSpeed(v: number) {
  return `<${Math.round(v)}s`;
}

/* ── Phase fade-in helper ── */
function phaseStyle(phase: number, atPhase: number): CSSProperties {
  return {
    opacity: phase >= atPhase ? 1 : 0,
    transform: phase >= atPhase ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
  };
}

export function Welcome({ onContinue, printMode = false }: WelcomeProps) {
  const [phase, setPhase] = useState(printMode ? 5 : 0);
  const confettiTriggered = useRef(false);

  useEffect(() => {
    if (printMode) return;
    confettiTriggered.current = false;
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2500),
      setTimeout(() => setPhase(5), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [printMode]);

  // Stat values — start ticking when phase >= 3 (or instantly in printMode)
  const tickStart = phase >= 3;
  const adsAnalyzed = useCountUp(50, tickStart);
  const marketers = useCountUp(12, tickStart);
  const roas = useCountUp(4.2, tickStart);
  const speed = useCountUp(60, tickStart);

  // Confetti fires when phase 1 starts (one-shot)
  const fireConfetti = phase >= 1;
  if (fireConfetti && !confettiTriggered.current) {
    confettiTriggered.current = true;
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-[640px] overflow-hidden text-zinc-100 px-6 py-10"
      style={{
        background:
          "radial-gradient(ellipse 480px 320px at 50% 30%, rgba(195,235,66,0.08), transparent 70%), linear-gradient(180deg, hsl(80 25% 10%) 0%, hsl(80 15% 7%) 100%)",
      }}
    >
      <ParticleField />

      <div className="relative z-10 w-full max-w-[600px] text-center">
        {/* Phase 0 → 1 : Check + eyebrow + confetti */}
        <div style={phaseStyle(phase, 0)} className="mb-7 relative">
          <div className="relative inline-flex items-center justify-center">
            <ConfettiBurst active={fireConfetti} />
            <div
              className="relative h-[72px] w-[72px] rounded-full border-[2.5px] border-primary inline-flex items-center justify-center bg-primary/15"
              style={{
                animation: printMode
                  ? undefined
                  : "ff-welcome-glow-pulse 2.4s ease-in-out infinite",
                animationDelay: "0.6s",
              }}
            >
              <Check className="h-9 w-9 text-primary" strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-[11px] tracking-[0.2em] text-zinc-400 mt-3 font-mono uppercase">
            Payment confirmed
          </p>
        </div>

        {/* Phase 1 : Headline + sub */}
        <div style={phaseStyle(phase, 2)} className="mb-9">
          <h1 className="text-[36px] md:text-[42px] font-bold tracking-tight leading-[1.08]">
            Your journey from Affiliate
            <br />
            to{" "}
            <span className="relative inline-block">
              <span className="text-primary">Super Affiliate</span>
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-1 h-[4px] rounded-full bg-primary/60"
              />
            </span>{" "}
            begins.
          </h1>
          <p className="text-[15px] text-zinc-400 mt-4 max-w-[460px] mx-auto leading-relaxed">
            You just unlocked the most powerful creative engine in performance
            marketing.
          </p>
        </div>

        {/* Phase 3 : 4 brag stats with counter-up tickers */}
        <div style={phaseStyle(phase, 3)} className="mb-9">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Telescope, num: formatM(adsAnalyzed), label: "Ads analyzed" },
              { icon: Star, num: formatK(marketers), label: "Marketers trust us" },
              { icon: TrendingUp, num: formatRoas(roas), label: "Avg. ROAS lift" },
              { icon: Zap, num: formatSpeed(speed), label: "First creative ready" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm",
                    "px-3 py-3.5 flex flex-col items-center text-center",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 text-zinc-500 mb-1.5" />
                  <div className="text-[28px] font-bold text-primary leading-none tabular-nums font-mono">
                    {s.num}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1.5 leading-tight">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase 4 : feature pills */}
        <div style={phaseStyle(phase, 4)} className="mb-9">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2.5">
            {[
              { icon: Sparkles, label: "AI Creative Generation" },
              { icon: Play, label: "Video Sage Analysis" },
              { icon: LayoutGrid, label: "Industry Intelligence" },
              { icon: ImageIcon, label: "Creative Library" },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="inline-flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/50 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[13px] text-zinc-200">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase 5 : CTA + footnote */}
        <div style={phaseStyle(phase, 5)}>
          <button
            onClick={onContinue}
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-7 py-3.5",
              "bg-primary text-primary-foreground font-bold text-[15px]",
              "hover:bg-primary/90 active:translate-y-px transition-all",
              "shadow-[0_8px_24px_-8px_rgba(195,235,66,0.5)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            Let's set up your account
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-[11px] text-zinc-500 mt-3.5">
            Takes under 2 minutes · You'll generate your first creative today
          </p>
        </div>
      </div>
    </div>
  );
}
