import { useMemo, type CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  RefreshCw,
  ShieldCheck,
  Mail,
  ArrowRight,
  Sparkles,
  Clock,
  CreditCard,
  Wallet,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WelcomeFailed — context-rich landing screen for the post-signup case
 * where payment didn't go through.
 *
 * Sits in the same slot as Welcome.tsx but for the failed-payment case.
 * Mood: "your signup got far enough, but payment didn't land." Honest
 * about state, framed as "account paused" rather than alarm-bell red.
 *
 * Visual identity (deliberately distinct from Welcome.tsx so the screen
 * doesn't feel like Welcome-with-amber-paint):
 *   - Padlock with crack overlay as the focal illustration (lifted from
 *     PaymentVerificationPage failed state — same SVG crack path approach)
 *   - Amber glow halo + frozen sparkles at low opacity around the padlock
 *     (the orbiting motion is stopped — visually "paused")
 *   - Cream-to-amber-tinted gradient ground vs Welcome's lime-tinted top
 *   - Stats grid framed as REASSURANCE signals (refund window, charges
 *     held, money-back, support response) instead of brag numbers
 *
 * `printMode` skips the framer-motion phased reveal so /onboarding-print
 * routes can capture the final composition for html.to.design.
 */

interface WelcomeFailedProps {
  /** When set, the screen jumps to the final "settled" phase immediately
   *  (skips the staggered reveal). Used by print routes for static export. */
  printMode?: boolean;
  /** Click handler for the primary "Try payment again" CTA. */
  onRetry?: () => void;
  /** Click handler for the secondary "Talk to sales" CTA. */
  onContactSales?: () => void;
}

interface StatTile {
  icon: typeof Clock;
  value: string;
  label: string;
}

const STATS: StatTile[] = [
  { icon: Clock, value: "5 days", label: "Automatic refund window" },
  { icon: CreditCard, value: "0", label: "Charges held" },
  { icon: Wallet, value: "100%", label: "Money-back guarantee" },
  { icon: Headphones, value: "24h", label: "Support response" },
];

const SUPPORT_EMAIL = "hello@fabfunnel.com";

/* ── Frozen sparkles — orbit positions are deterministic and static ──
   Echo the Vibe-C sparkle ring from PaymentVerificationPage but stopped
   in place at low opacity, reinforcing the "paused" mood. */
interface FrozenSparkle {
  id: number;
  angle: number;
  radius: number;
  size: number;
  opacity: number;
}

const FROZEN_SPARKLES: FrozenSparkle[] = [
  { id: 1, angle: 18, radius: 62, size: 11, opacity: 0.28 },
  { id: 2, angle: 72, radius: 78, size: 10, opacity: 0.22 },
  { id: 3, angle: 138, radius: 90, size: 13, opacity: 0.3 },
  { id: 4, angle: 196, radius: 68, size: 11, opacity: 0.2 },
  { id: 5, angle: 252, radius: 84, size: 12, opacity: 0.26 },
  { id: 6, angle: 312, radius: 94, size: 10, opacity: 0.18 },
  { id: 7, angle: 348, radius: 56, size: 11, opacity: 0.24 },
];

/* ── Cracked padlock illustration — replaces the success check ring.
   64×64 base (matches Welcome's check ring size) wrapped in a 200×200
   halo region so frozen sparkles and the amber pulse have room. ── */
function CrackedPadlock({ printMode }: { printMode: boolean }) {
  // Position helpers — keep all sparkles + halo inside a 200×200 box so
  // they don't push the page layout around.
  const center = 100;

  return (
    <div className="relative h-[200px] w-[200px] mx-auto" aria-hidden>
      {/* Soft amber radial aura */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.14), transparent 68%)",
        }}
      />

      {/* Slow amber pulse halo — gentle "paused" breath, not the success bounce */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 140,
          height: 140,
          border: "1px dashed rgba(245,158,11,0.30)",
        }}
        initial={printMode ? { opacity: 0.6, scale: 1 } : { opacity: 0.0, scale: 0.94 }}
        animate={
          printMode
            ? { opacity: 0.6, scale: 1 }
            : { opacity: [0.35, 0.6, 0.35], scale: [0.96, 1.02, 0.96] }
        }
        transition={
          printMode
            ? undefined
            : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Frozen sparkles — positioned by angle/radius, no motion */}
      {FROZEN_SPARKLES.map((s) => {
        const x = center + Math.cos((s.angle * Math.PI) / 180) * s.radius;
        const y = center + Math.sin((s.angle * Math.PI) / 180) * s.radius;
        return (
          <Sparkles
            key={s.id}
            className="absolute"
            style={{
              left: x - s.size / 2,
              top: y - s.size / 2,
              width: s.size,
              height: s.size,
              color: "rgb(245 158 11)",
              opacity: s.opacity,
              filter: "drop-shadow(0 0 3px rgba(245,158,11,0.35))",
            }}
            strokeWidth={2}
            aria-hidden
          />
        );
      })}

      {/* Central padlock — 64×64 to match Welcome's check ring exactly */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className={cn(
            "relative h-[64px] w-[64px] rounded-full inline-flex items-center justify-center",
            "border-[2.5px] border-amber-500/70 bg-amber-50",
          )}
          style={{
            boxShadow: "0 0 20px rgba(245,158,11,0.18)",
          }}
        >
          <Lock
            className="h-8 w-8 text-amber-600"
            strokeWidth={2.25}
          />

          {/* Crack overlay — same SVG path approach as PaymentVerificationPage
              failed state, drawn in via pathLength 0→1 (0.6s) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden
          >
            <motion.path
              d="M 22 26 L 30 34 L 26 40 L 36 44 L 32 52"
              stroke="rgb(245 158 11)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={
                printMode
                  ? { pathLength: 1, opacity: 0.85 }
                  : { pathLength: 0, opacity: 0 }
              }
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={
                printMode
                  ? undefined
                  : { duration: 0.6, delay: 0.15, ease: "easeOut" }
              }
            />
            <motion.path
              d="M 40 22 L 36 30 L 42 32"
              stroke="rgb(245 158 11)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={
                printMode
                  ? { pathLength: 1, opacity: 0.7 }
                  : { pathLength: 0, opacity: 0 }
              }
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={
                printMode
                  ? undefined
                  : { duration: 0.45, delay: 0.5, ease: "easeOut" }
              }
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Phase reveal helper using framer-motion props ── */
function fadeUp(delay: number, printMode: boolean) {
  if (printMode) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    } as const;
  }
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.6,
      delay,
      ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
    },
  } as const;
}

export function WelcomeFailed({
  printMode = false,
  onRetry,
  onContactSales,
}: WelcomeFailedProps): JSX.Element {
  // Background — cream paper with a subtle amber radial tint from the
  // top, plus the same 18px dot grid Welcome uses (consistent chassis
  // texture, different colour story).
  const backgroundStyle = useMemo<CSSProperties>(
    () => ({
      background:
        "radial-gradient(ellipse 640px 280px at 50% 0%, rgba(245,158,11,0.09), transparent 70%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.4) 100%)",
      backgroundImage:
        "radial-gradient(ellipse 640px 280px at 50% 0%, rgba(245,158,11,0.09), transparent 70%), radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)",
      backgroundSize: "auto, 18px 18px",
      backgroundPosition: "0 0, 0 0",
    }),
    [],
  );

  const handleRetry = () => {
    if (onRetry) onRetry();
  };
  const handleContact = () => {
    if (onContactSales) onContactSales();
  };

  // Stagger delays — slightly slower than Welcome to match the
  // somber-but-hopeful mood (Maalik brief).
  // Phase 0 immediate · Phase 1 ~700ms · Phase 2 ~1400ms · Phase 3 ~2100ms
  const PHASE_1 = 0.7;
  const PHASE_2 = 1.4;
  const PHASE_3 = 2.1;

  return (
    <div
      className="relative flex flex-col items-center min-h-[640px] overflow-hidden px-6 pt-7 pb-10"
      style={backgroundStyle}
    >
      <div className="relative z-10 w-full max-w-[600px] text-center">
        {/* Phase 0 : Padlock + eyebrow (immediate; crack draws over 0.6s) */}
        <div className="mb-5 relative">
          <CrackedPadlock printMode={printMode} />
          <motion.p
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-600 -mt-2"
            initial={
              printMode ? { opacity: 1 } : { opacity: 0 }
            }
            animate={{ opacity: 1 }}
            transition={
              printMode ? undefined : { duration: 0.45, delay: 0.25 }
            }
          >
            Account paused
            <span className="text-amber-500/60 mx-1.5">·</span>
            Payment not confirmed
          </motion.p>
        </div>

        {/* Phase 1 : Headline + sub */}
        <motion.div className="mb-8" {...fadeUp(PHASE_1, printMode)}>
          <h1 className="text-[32px] md:text-[38px] font-semibold tracking-tight leading-[1.08] text-foreground">
            Your account is{" "}
            <span className="relative inline-block">
              <span className="relative z-10">paused</span>
              <span
                aria-hidden
                className="absolute left-0 right-0 bottom-0.5 h-[10px] rounded-sm bg-amber-400/45"
              />
            </span>
            {" "}— let's unpause it.
          </h1>
          <p className="text-[14px] text-muted-foreground mt-3.5 max-w-[500px] mx-auto leading-relaxed">
            Your payment didn't go through, so we couldn't activate your
            workspace. If you were charged, you'll be refunded within
            5 business days — no action needed.
          </p>
        </motion.div>

        {/* Phase 2 : Reassurance stats grid — 4 tiles.
            Lime accent (not amber) on the numbers — these are the
            reassurance signals, deliberately calm. */}
        <motion.div className="mb-7" {...fadeUp(PHASE_2, printMode)}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  className="rounded-xl border border-border bg-card px-4 py-4 flex flex-col items-center text-center shadow-sm"
                  initial={
                    printMode
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    printMode
                      ? undefined
                      : {
                          duration: 0.45,
                          delay: PHASE_2 + i * 0.08,
                          ease: [0.2, 0.8, 0.2, 1],
                        }
                  }
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground mb-1.5" />
                  <div className="text-[24px] font-bold text-foreground leading-none tabular-nums font-mono">
                    {s.value}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 leading-tight">
                    {s.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Phase 3 : Reassurance line + CTAs + footnote */}
        <motion.div {...fadeUp(PHASE_3, printMode)}>
          {/* Reassurance line above the CTAs */}
          <div className="inline-flex items-center gap-1.5 mb-5">
            <ShieldCheck
              className="h-3 w-3 text-primary"
              strokeWidth={2.5}
            />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              If your card was charged, refund processes automatically
            </span>
          </div>

          {/* CTA row */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            {onRetry ? (
              <button
                onClick={handleRetry}
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-6 py-3",
                  "bg-primary text-primary-foreground font-semibold text-[14px]",
                  "hover:bg-primary/90 active:translate-y-px transition-all",
                  "shadow-[0_6px_20px_-8px_rgba(195,235,66,0.45)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Try payment again
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <a
                href="/payment-verification"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-6 py-3",
                  "bg-primary text-primary-foreground font-semibold text-[14px]",
                  "hover:bg-primary/90 active:translate-y-px transition-all",
                  "shadow-[0_6px_20px_-8px_rgba(195,235,66,0.45)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Try payment again
                <ArrowRight className="h-4 w-4" />
              </a>
            )}

            {onContactSales ? (
              <button
                onClick={handleContact}
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-3",
                  "bg-card border border-border text-foreground font-medium text-[13.5px]",
                  "hover:border-amber-500/50 hover:bg-amber-50/40 active:translate-y-px transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Talk to our team
              </button>
            ) : (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-3",
                  "bg-card border border-border text-foreground font-medium text-[13.5px]",
                  "hover:border-amber-500/50 hover:bg-amber-50/40 active:translate-y-px transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Talk to our team
              </a>
            )}
          </div>

          {/* Footnote */}
          <p className="text-[11px] text-muted-foreground mt-3">
            Need help unlocking your account?{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-foreground font-medium hover:text-primary transition-colors"
            >
              {SUPPORT_EMAIL}
            </a>
            <span className="mx-1.5 text-muted-foreground/60">·</span>
            We respond within a working day.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
