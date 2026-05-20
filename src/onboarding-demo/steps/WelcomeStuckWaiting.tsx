import { useEffect, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  Hourglass,
  Check,
  Loader2,
  Mail,
  Shield,
  Phone,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WelcomeStuckWaiting — post-signup landing screen when the payment
 * is stuck in verification limbo (no bank confirmation yet, but no
 * decline either). Sits in the same slot as `Welcome.tsx` but conveys
 * a calm "we don't know yet, and that's okay" mood — not warning, not
 * celebration.
 *
 * Visual language references (locked with Maalik):
 *   - Apple Pay's pending state — single quiet pulse, no spinner.
 *   - Stripe's "Processing — this can take a few minutes" — patient.
 *   - Mercury's pending-charge — concentric breathing rings.
 *
 * Patience illustration: a slowly-rotating Hourglass icon (one half-turn
 * every 8s) inside a 64x64 lime-tinted card, wrapped in a soft lime
 * pulse halo (scale 1 → 1.06, 3s loop). NOT a spinner — that reads as
 * "loading", which would imply progress. The hourglass + halo reads as
 * "time is passing, nothing is broken."
 *
 * `printMode` jumps straight to the final settled phase so the print
 * route can capture a static composition without waiting for the
 * staggered reveal.
 */

const SUPPORT_EMAIL = "hello@fabfunnel.com";

interface WelcomeStuckWaitingProps {
  /** When set, the screen jumps to the final "settled" phase immediately
   *  (skips the staggered reveal). Used by print routes for static export. */
  printMode?: boolean;
  /** Click handler for the "Check back later" CTA. Defaults to no-op (or
   *  could link back to a status page). */
  onCheckLater?: () => void;
  /** Click handler for the "Contact us" CTA. */
  onContactUs?: () => void;
}

/* ── Phase fade-in helper (matches Welcome's API) ─────────────────────── */
function phaseStyle(phase: number, atPhase: number): CSSProperties {
  return {
    opacity: phase >= atPhase ? 1 : 0,
    transform: phase >= atPhase ? "translateY(0)" : "translateY(14px)",
    transition:
      "opacity 0.65s ease-out, transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)",
  };
}

/* ── Patience illustration ────────────────────────────────────────────── */
/**
 * 64x64 lime-tinted card holding a slowly rotating Hourglass icon.
 * Two layered halos behind it pulse on a 3s loop, offset by 1.5s so the
 * outer halo is always opposite-phase from the inner one. The result is
 * a breathing, never-syncing rhythm — the visual signature of "waiting."
 */
function PatienceIllustration({ printMode }: { printMode?: boolean }) {
  const noAnim = printMode;
  return (
    <div className="relative inline-flex items-center justify-center h-[120px] w-[120px]">
      {/* Outer halo — softest, widest pulse */}
      <motion.span
        aria-hidden
        className="absolute rounded-full bg-primary/20"
        style={{ width: 96, height: 96, filter: "blur(2px)" }}
        animate={noAnim ? undefined : { scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={
          noAnim
            ? undefined
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      />
      {/* Inner halo — tighter, offset phase */}
      <motion.span
        aria-hidden
        className="absolute rounded-full bg-primary/25"
        style={{ width: 76, height: 76 }}
        animate={
          noAnim ? undefined : { scale: [1, 1.06, 1], opacity: [0.55, 0.8, 0.55] }
        }
        transition={
          noAnim
            ? undefined
            : { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
        }
      />
      {/* Tinted card holding the hourglass */}
      <div
        className="relative h-[64px] w-[64px] rounded-2xl border border-primary/40 bg-primary/10 inline-flex items-center justify-center"
        style={{
          boxShadow: "0 6px 18px -10px rgba(195,235,66,0.35)",
        }}
      >
        <motion.div
          animate={noAnim ? undefined : { rotate: [0, 180, 360] }}
          transition={
            noAnim
              ? undefined
              : {
                  duration: 16,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                }
          }
        >
          <Hourglass
            className="h-7 w-7 text-foreground/80"
            strokeWidth={1.8}
          />
        </motion.div>
      </div>
    </div>
  );
}

/* ── Status timeline ──────────────────────────────────────────────────── */
interface StepDef {
  state: "done" | "running" | "queued";
  label: string;
}
const TIMELINE: StepDef[] = [
  { state: "done", label: "Card validated" },
  { state: "running", label: "Confirming with bank" },
  { state: "queued", label: "Activating workspace" },
];

function StatusTimeline({ phase }: { phase: number }) {
  return (
    <div className="inline-flex items-center gap-2.5 md:gap-3.5 flex-wrap justify-center">
      {TIMELINE.map((s, i) => {
        const ready = phase >= 2;
        const delay = i * 120;
        return (
          <div
            key={i}
            className="inline-flex items-center gap-2"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "translateY(0)" : "translateY(8px)",
              transition: `opacity 0.5s ease-out ${delay}ms, transform 0.5s cubic-bezier(0.2,0.8,0.2,1) ${delay}ms`,
            }}
          >
            <StepIndicator state={s.state} />
            <span
              className={cn(
                "text-[11.5px] font-medium tracking-tight",
                s.state === "queued"
                  ? "text-muted-foreground/70"
                  : "text-foreground/85",
              )}
            >
              {s.label}
            </span>
            {i < TIMELINE.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "hidden md:inline-block h-px w-6",
                  s.state === "done"
                    ? "bg-primary/50"
                    : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepIndicator({ state }: { state: StepDef["state"] }) {
  if (state === "done") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 border border-primary/50 text-foreground">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/60 bg-primary/[0.05] text-primary">
        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-border bg-card">
      <Lock className="h-2.5 w-2.5 text-muted-foreground/50" strokeWidth={2} />
    </span>
  );
}

/* ── Reassurance tile (mirrors Welcome's StatCard density) ────────────── */
interface ReassureTile {
  value: string;
  label: string;
}
const TILES: ReassureTile[] = [
  { value: "30 min", label: "Typical verification time" },
  { value: "60 days", label: "Refund guarantee" },
  { value: "0", label: "Action needed from you" },
  { value: "24h", label: "Support response" },
];

function ReassuranceTile({ tile }: { tile: ReassureTile }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 flex flex-col items-center text-center shadow-sm">
      <div className="text-[22px] font-bold text-foreground leading-none tabular-nums font-mono">
        {tile.value}
      </div>
      <div className="text-[10.5px] text-muted-foreground mt-1.5 leading-tight">
        {tile.label}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * Main component
 * ═══════════════════════════════════════════════════════════════════════ */
export function WelcomeStuckWaiting({
  printMode = false,
  onCheckLater,
  onContactUs,
}: WelcomeStuckWaitingProps): JSX.Element {
  // Phases:
  //   0 = illustration + eyebrow (immediate)
  //   1 = headline + sub (~600ms)
  //   2 = status timeline (~1400ms)
  //   3 = tiles + reassurance lines + CTAs (~2100ms)
  const [phase, setPhase] = useState(printMode ? 3 : 0);

  useEffect(() => {
    if (printMode) return;
    setPhase(0);
    const timers = [
      window.setTimeout(() => setPhase(1), 600),
      window.setTimeout(() => setPhase(2), 1400),
      window.setTimeout(() => setPhase(3), 2100),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [printMode]);

  const contactHref = onContactUs ? undefined : `mailto:${SUPPORT_EMAIL}`;

  return (
    <div
      className="relative flex flex-col items-center min-h-[640px] overflow-hidden px-6 pt-10 pb-12"
      style={{
        // Calm cream + faintest lime radial — half the saturation of
        // Welcome.tsx because this is patience, not celebration.
        background:
          "radial-gradient(ellipse 640px 280px at 50% 0%, rgba(195,235,66,0.06), transparent 70%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.35) 100%)",
        backgroundImage:
          "radial-gradient(ellipse 640px 280px at 50% 0%, rgba(195,235,66,0.06), transparent 70%), radial-gradient(circle, rgba(0,0,0,0.035) 1px, transparent 1px)",
        backgroundSize: "auto, 18px 18px",
        backgroundPosition: "0 0, 0 0",
      }}
    >
      <div className="relative z-10 w-full max-w-[600px] text-center">
        {/* Phase 0 — illustration + eyebrow */}
        <div style={phaseStyle(phase, 0)} className="mb-6">
          <PatienceIllustration printMode={printMode} />
          <div className="mt-3 inline-flex items-center gap-2">
            {/* Pulsing lime dot — single, calm, every 2s */}
            <motion.span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              animate={
                printMode
                  ? undefined
                  : { opacity: [0.45, 1, 0.45], scale: [1, 1.15, 1] }
              }
              transition={
                printMode
                  ? undefined
                  : { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }
            />
            <span className="text-[11px] tracking-[0.2em] text-primary font-mono uppercase font-medium">
              Payment in verification
            </span>
          </div>
        </div>

        {/* Phase 1 — headline + sub */}
        <div style={phaseStyle(phase, 1)} className="mb-8">
          <h1 className="text-[32px] md:text-[38px] font-semibold tracking-tight leading-[1.1] text-foreground">
            <span className="relative inline-block">
              <span className="relative z-10">Still</span>
              <span
                aria-hidden
                className="absolute left-0 right-0 bottom-0.5 h-[10px] rounded-sm bg-primary/40"
              />
            </span>{" "}
            verifying your payment.
          </h1>
          <p className="text-[14px] text-muted-foreground mt-3.5 max-w-[520px] mx-auto leading-relaxed">
            Your bank is taking longer than usual to confirm. We won't
            email you about this — but if your card was charged, you'll
            be refunded automatically.
          </p>
        </div>

        {/* Phase 2 — status timeline */}
        <div style={phaseStyle(phase, 2)} className="mb-8">
          <StatusTimeline phase={phase} />
        </div>

        {/* Phase 3 — tiles + reassurance lines + CTAs + footnote */}
        <div style={phaseStyle(phase, 3)}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {TILES.map((t, i) => (
              <ReassuranceTile key={i} tile={t} />
            ))}
          </div>

          {/* Reassurance lines */}
          <div className="flex flex-col items-center gap-2 mb-7">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <Shield
                className="h-3 w-3 text-primary/80"
                strokeWidth={2}
              />
              If your card was charged, refund processes automatically.
            </p>
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <Mail
                className="h-3 w-3 text-muted-foreground"
                strokeWidth={2}
              />
              We won't email you about this status — check this page or
              contact us.
            </p>
          </div>

          {/* CTAs — both outline, equal weight. No urgent primary action. */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            {contactHref ? (
              <a
                href={contactHref}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                  "bg-card border border-border text-foreground font-medium text-[13px]",
                  "hover:border-primary/50 hover:bg-primary/[0.04]",
                  "active:translate-y-px transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Contact us
              </a>
            ) : (
              <button
                type="button"
                onClick={onContactUs}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                  "bg-card border border-border text-foreground font-medium text-[13px]",
                  "hover:border-primary/50 hover:bg-primary/[0.04]",
                  "active:translate-y-px transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Contact us
              </button>
            )}
            <button
              type="button"
              onClick={onCheckLater}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                "bg-card border border-border text-foreground font-medium text-[13px]",
                "hover:border-primary/50 hover:bg-primary/[0.04]",
                "active:translate-y-px transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Contact your bank
            </button>
          </div>

          {/* Beneath the bank CTA — short tooltip-equivalent instruction */}
          <p className="mt-3 text-[10.5px] text-muted-foreground/80 font-mono uppercase tracking-[0.1em]">
            Call the number on the back of your card
          </p>

          {/* Footnote */}
          <p className="text-[11px] text-muted-foreground mt-5">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            · We typically respond within a working day. Your patience
            matters.
          </p>
        </div>
      </div>
    </div>
  );
}
