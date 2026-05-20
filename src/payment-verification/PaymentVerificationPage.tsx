import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  LockOpen,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Mail,
  Check,
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentState = "waiting" | "success" | "failed";

const SUPPORT_EMAIL = "hello@fabfunnel.com";

/**
 * PaymentVerificationPage — production payment verification screen.
 *
 * Design vibe locked with Maalik:
 *   Base = Vibe C "Playful sharp" — orbiting lime sparkles around a
 *          central padlock. Brand-forward, never-syncing rhythm.
 *   Sprinkle of Vibe A = thin in-transit rail BELOW the headline showing
 *          [You] → [Bank] → [Fabfunnel] with a lime dot riding the path.
 *          Subtle narrative reinforcement of "your money is in transit
 *          RIGHT NOW" without dominating the hero.
 *
 * Three states (URL-toggled via ?state=...):
 *   waiting  → orbiting sparkles + closed padlock + in-transit rail
 *              + estimated/elapsed counter + sticky "don't close" banner
 *              + support email link
 *   success  → padlock flips open + lime confetti burst (one-time)
 *              + "Locked in." headline + primary CTA "Continue to workspace"
 *   failed   → padlock with crack overlay + amber tone (NOT red — warning
 *              not destructive) + "Couldn't verify your payment." headline
 *              + retry CTA + support email
 *
 * Manual demo URLs (no real payment integration):
 *   /payment-verification              → waiting (default)
 *   /payment-verification?state=success
 *   /payment-verification?state=failed
 *
 * A small top-right state toggle stays visible during demo so design
 * review can flip live. Removed when wiring real payment.
 */
export function PaymentVerificationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const stateParam = searchParams.get("state");
  const state: PaymentState =
    stateParam === "success" || stateParam === "failed"
      ? stateParam
      : "waiting";

  const setState = (next: PaymentState) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("state", next);
        return sp;
      },
      { replace: false },
    );
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Top toggle — visible during demo, removed when wiring real payment */}
      <StateToggle state={state} onChange={setState} />

      {/* Main verification card — centered */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[640px]">
          <AnimatePresence mode="wait">
            {state === "waiting" && (
              <motion.div key="waiting" {...stateMotion}>
                <WaitingState />
              </motion.div>
            )}
            {state === "success" && (
              <motion.div key="success" {...stateMotion}>
                <SuccessState onContinue={() => navigate("/insights-v2/feed")} />
              </motion.div>
            )}
            {state === "failed" && (
              <motion.div key="failed" {...stateMotion}>
                <FailedState onRetry={() => setState("waiting")} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const stateMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] as const },
};

/* ═══════════════════════════════════════════════════════════════════════
 * State toggle (top-right pill — demo only)
 * ═══════════════════════════════════════════════════════════════════════ */
function StateToggle({
  state,
  onChange,
}: {
  state: PaymentState;
  onChange: (s: PaymentState) => void;
}) {
  return (
    <div className="absolute top-4 right-6 z-20">
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/90 backdrop-blur p-1 shadow-sm">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground px-2">
          Demo
        </span>
        {(["waiting", "success", "failed"] as const).map((s) => {
          const active = s === state;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium transition-colors capitalize",
                active
                  ? s === "failed"
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    : s === "success"
                      ? "bg-primary text-primary-foreground"
                      : "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={active}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * Orbiting sparkles + padlock hero — shared illustration.
 * Vibe C identity. State prop changes the inner mood:
 *   "waiting" → closed lock, sparkles orbit calmly
 *   "success" → lock flips open, sparkles freeze briefly then settle
 *   "failed"  → closed lock with crack overlay, sparkles fade to amber
 * ═══════════════════════════════════════════════════════════════════════ */

interface Sparkle {
  id: number;
  radius: number;
  duration: number;
  delay: number;
  startAngle: number;
  size: number;
  direction: 1 | -1;
}

const SPARKLES: Sparkle[] = [
  { id: 1, radius: 58, duration: 11, delay: 0, startAngle: 0, size: 12, direction: 1 },
  { id: 2, radius: 72, duration: 14, delay: 1.2, startAngle: 60, size: 10, direction: -1 },
  { id: 3, radius: 88, duration: 17, delay: 0.6, startAngle: 130, size: 14, direction: 1 },
  { id: 4, radius: 64, duration: 13, delay: 2.1, startAngle: 200, size: 11, direction: -1 },
  { id: 5, radius: 80, duration: 19, delay: 0.4, startAngle: 270, size: 12, direction: 1 },
  { id: 6, radius: 92, duration: 23, delay: 1.8, startAngle: 320, size: 10, direction: -1 },
  { id: 7, radius: 50, duration: 13, delay: 1.0, startAngle: 45, size: 11, direction: 1 },
];

function OrbitalHero({ state }: { state: PaymentState }) {
  const isFailed = state === "failed";
  const isSuccess = state === "success";

  // Tint of the orbiting sparkles flips amber on failed state.
  const sparkColor = isFailed
    ? "rgb(245 158 11)" // amber-500
    : "hsl(var(--primary))";

  return (
    <div className="relative h-[220px] w-[220px] mx-auto" aria-hidden>
      {/* Outer aura — soft radial gradient */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: isFailed
            ? "radial-gradient(circle, rgba(245,158,11,0.10), transparent 70%)"
            : "radial-gradient(circle, rgba(195,235,66,0.14), transparent 70%)",
        }}
      />

      {/* Dashed guide ring */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
        style={{
          width: 196,
          height: 196,
          borderColor: isFailed
            ? "rgba(245,158,11,0.30)"
            : "rgba(195,235,66,0.30)",
        }}
        animate={!isFailed ? { rotate: 360 } : { rotate: 0 }}
        transition={
          !isFailed
            ? { duration: 40, repeat: Infinity, ease: "linear" }
            : undefined
        }
      />

      {/* Sparkles orbit */}
      {SPARKLES.map((s) => {
        // Build keyframe paths via CSS @keyframes is awkward — we use
        // framer-motion with rotate on a wrapper + sparkle offset by radius
        // so the wrapper rotation moves the sparkle around the center.
        return (
          <motion.div
            key={s.id}
            className="absolute top-1/2 left-1/2 origin-center"
            style={{ width: 0, height: 0 }}
            initial={{ rotate: s.startAngle }}
            animate={
              isFailed
                ? { rotate: s.startAngle } // freeze on failed
                : { rotate: s.startAngle + 360 * s.direction }
            }
            transition={
              !isFailed
                ? {
                    duration: s.duration,
                    delay: s.delay,
                    repeat: Infinity,
                    ease: "linear",
                  }
                : undefined
            }
          >
            <Sparkles
              className="absolute"
              style={{
                width: s.size,
                height: s.size,
                color: sparkColor,
                opacity: isFailed ? 0.35 : 0.85,
                transform: `translate(${s.radius}px, -${s.size / 2}px)`,
                filter: isFailed
                  ? "drop-shadow(0 0 4px rgba(245,158,11,0.4))"
                  : "drop-shadow(0 0 6px rgba(195,235,66,0.6))",
                transition: "opacity 400ms, color 400ms",
              }}
              strokeWidth={2}
            />
          </motion.div>
        );
      })}

      {/* Central padlock card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className={cn(
            "relative h-20 w-20 rounded-2xl flex items-center justify-center border-2",
            isFailed
              ? "bg-amber-50 border-amber-400/60 dark:bg-amber-950/20"
              : isSuccess
                ? "bg-primary/15 border-primary"
                : "bg-card border-primary/40",
          )}
          animate={
            isSuccess
              ? { scale: [1, 1.1, 1.04], rotate: [0, -4, 0] }
              : !isFailed
                ? { scale: [1, 1.04, 1] }
                : { scale: 1 }
          }
          transition={
            isSuccess
              ? { duration: 0.7, ease: [0.32, 0.72, 0, 1] }
              : !isFailed
                ? { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
                : undefined
          }
          style={{
            boxShadow: isFailed
              ? "0 0 0 0 rgba(245,158,11,0)"
              : "0 0 24px rgba(195,235,66,0.18)",
          }}
        >
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.2,
                ease: [0.32, 0.72, 0, 1],
              }}
            >
              <LockOpen
                className="h-9 w-9 text-primary"
                strokeWidth={2}
              />
            </motion.div>
          ) : (
            <Lock
              className={cn(
                "h-9 w-9",
                isFailed ? "text-amber-600" : "text-foreground/80",
              )}
              strokeWidth={2}
            />
          )}

          {/* Crack overlay — only on failed */}
          {isFailed && (
            <svg
              className="absolute inset-0 pointer-events-none"
              viewBox="0 0 80 80"
              fill="none"
            >
              <motion.path
                d="M 28 32 L 36 40 L 32 46 L 42 50 L 38 58 L 48 56"
                stroke="rgb(245 158 11)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              />
              <motion.path
                d="M 50 28 L 46 36 L 52 38"
                stroke="rgb(245 158 11)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
              />
            </svg>
          )}
        </motion.div>
      </div>

      {/* Confetti burst — success only */}
      {isSuccess && <ConfettiBurst />}
    </div>
  );
}

/* ── Lime confetti burst — fires once on mount, settles ──────────────── */
function ConfettiBurst() {
  // 10 deterministic confetti pieces around the padlock
  const pieces = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 + (i % 2 ? 0.15 : -0.15);
        const distance = 80 + (i * 7) % 30;
        return {
          id: i,
          tx: Math.cos(angle) * distance,
          ty: Math.sin(angle) * distance - 16,
          rot: (i * 47) % 360,
          delay: i * 0.025,
          size: 5 + (i % 3),
          tone: i % 3 === 0 ? "muted" : "primary",
        };
      }),
    [],
  );

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={cn(
            "absolute block rounded-sm",
            p.tone === "primary" ? "bg-primary" : "bg-foreground/30",
          )}
          style={{
            width: p.size,
            height: p.size,
            top: 0,
            left: 0,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.tx, y: p.ty, rotate: p.rot, opacity: 0 }}
          transition={{
            duration: 1.1,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * In-transit rail (Vibe A flavor) — sits below the headline on the
 * waiting state. SVG path between [You] → [Bank] → [Fabfunnel] with a
 * lime dot riding the path via <animateMotion>.
 * ═══════════════════════════════════════════════════════════════════════ */
function InTransitRail() {
  // 3 stations: You (left) → Bank (center) → Fabfunnel (right)
  // Width 400, height 60.
  // Stations at x = 40, 200, 360. y = 30.
  const STATION_X = [40, 200, 360];
  const STATION_Y = 30;
  const PATH =
    "M 40 30 L 200 30 L 360 30";

  return (
    <div className="mx-auto" style={{ width: 400 }}>
      <svg viewBox="0 0 400 60" className="w-full h-[60px]" aria-hidden>
        {/* Background path */}
        <line
          x1={40}
          y1={STATION_Y}
          x2={360}
          y2={STATION_Y}
          stroke="hsl(var(--muted-foreground) / 0.25)"
          strokeWidth={1.5}
          strokeDasharray="3 4"
        >
          {/* Drift the dashes leftward — visual continuous motion */}
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-14"
            dur="2s"
            repeatCount="indefinite"
          />
        </line>

        {/* Travelling money-dot (lime) */}
        <circle r="4" fill="hsl(var(--primary))">
          <animateMotion
            dur="2.8s"
            repeatCount="indefinite"
            rotate="auto"
            path={PATH}
          />
        </circle>
        {/* Trailing glow */}
        <circle r="7" fill="hsl(var(--primary))" opacity="0.18">
          <animateMotion
            dur="2.8s"
            repeatCount="indefinite"
            rotate="auto"
            path={PATH}
          />
        </circle>

        {/* Stations */}
        {STATION_X.map((cx, i) => {
          const labels = ["You", "Bank", "Fabfunnel"];
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={STATION_Y}
                r={10}
                fill="hsl(var(--background))"
                stroke="hsl(var(--border))"
                strokeWidth={1.5}
              />
              <foreignObject
                x={cx - 12}
                y={STATION_Y - 8}
                width={24}
                height={16}
              >
                <div className="flex items-center justify-center h-full">
                  {i === 0 ? (
                    <User className="h-3 w-3 text-foreground/70" strokeWidth={2} />
                  ) : i === 1 ? (
                    <Building2 className="h-3 w-3 text-foreground/70" strokeWidth={2} />
                  ) : (
                    <Sparkles className="h-3 w-3 text-primary" strokeWidth={2} />
                  )}
                </div>
              </foreignObject>
              <text
                x={cx}
                y={STATION_Y + 24}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{
                  fontSize: "9px",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * WAITING STATE
 * ═══════════════════════════════════════════════════════════════════════ */
function WaitingState() {
  // Live elapsed counter — updates each second, formatted MM:SS.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(1, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-3">
        Payment verification
      </p>

      <OrbitalHero state="waiting" />

      <h1 className="mt-6 text-[28px] md:text-[32px] font-semibold tracking-tight leading-tight">
        Securing your{" "}
        <span className="relative inline-block">
          <span className="relative z-10">unfair edge</span>
          <span
            aria-hidden
            className="absolute left-0 right-0 bottom-0.5 h-[10px] rounded-sm bg-primary/40"
          />
        </span>
        .
      </h1>
      <p className="text-[14px] text-muted-foreground mt-2.5 max-w-[440px] mx-auto leading-relaxed">
        We're charging your card and unlocking your workspace. Hang tight.
      </p>

      {/* In-transit rail — Vibe A sprinkle */}
      <div className="mt-6">
        <InTransitRail />
      </div>

      {/* Live elapsed counter */}
      <div className="mt-5 inline-flex items-center gap-2.5 text-[12px]">
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-primary" />
          <motion.span
            aria-hidden
            className="absolute inline-flex h-2 w-2 rounded-full border-2 border-primary"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        </span>
        <span className="font-mono uppercase tracking-[0.14em] text-foreground/80 text-[10.5px]">
          Usually 30–60s
        </span>
        <span className="text-muted-foreground/60">·</span>
        <span
          className="font-mono text-foreground text-[11.5px]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {mm}:{ss} elapsed
        </span>
      </div>

      {/* Sticky banner */}
      <div className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/[0.05] px-4 py-2.5 flex-wrap">
        <div className="flex items-center gap-2 text-[12px] text-foreground/80">
          <AlertCircle
            className="h-3.5 w-3.5 text-primary shrink-0"
            strokeWidth={2}
          />
          <span>
            Don't close this tab · refresh if stuck after 60 seconds
          </span>
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary hover:underline whitespace-nowrap"
        >
          <Mail className="h-3 w-3" />
          {SUPPORT_EMAIL}
        </a>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * SUCCESS STATE
 * ═══════════════════════════════════════════════════════════════════════ */
function SuccessState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-3">
        Payment confirmed
      </p>

      <OrbitalHero state="success" />

      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-6 text-[32px] md:text-[40px] font-bold tracking-tight leading-tight"
      >
        Locked{" "}
        <span className="relative inline-block">
          <span className="relative z-10">in</span>
          <span
            aria-hidden
            className="absolute left-0 right-0 bottom-0.5 h-[12px] rounded-sm bg-primary/45"
          />
        </span>
        .
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
        className="text-[14px] text-muted-foreground mt-2.5 max-w-[440px] mx-auto leading-relaxed"
      >
        Payment confirmed. Your workspace is unlocked — let's start
        building.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="mt-8"
      >
        <button
          onClick={onContinue}
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-6 py-3",
            "bg-primary text-primary-foreground font-semibold text-[14px]",
            "hover:bg-primary/90 active:translate-y-px transition-all",
            "shadow-[0_6px_20px_-8px_rgba(195,235,66,0.45)]",
          )}
        >
          Continue to your workspace
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.9 }}
        className="mt-5 flex items-center justify-center gap-2 text-[11.5px] text-muted-foreground"
      >
        <Check className="h-3 w-3 text-primary" strokeWidth={3} />
        <span>Receipt sent to your registered email</span>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * FAILED STATE — padlock + crack + amber tone (not destructive red)
 * ═══════════════════════════════════════════════════════════════════════ */
function FailedState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-600 mb-3">
        Verification incomplete
      </p>

      <OrbitalHero state="failed" />

      <h1 className="mt-6 text-[28px] md:text-[32px] font-semibold tracking-tight leading-tight">
        Couldn't{" "}
        <span className="relative inline-block">
          <span className="relative z-10">verify</span>
          <span
            aria-hidden
            className="absolute left-0 right-0 bottom-0.5 h-[10px] rounded-sm bg-amber-400/45"
          />
        </span>{" "}
        your payment.
      </h1>
      <p className="text-[14px] text-muted-foreground mt-2.5 max-w-[480px] mx-auto leading-relaxed">
        Your bank declined the charge or we lost the response. No money
        moved. You can try again or reach us.
      </p>

      {/* Specific reason chip */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 px-3 py-1">
        <AlertTriangle
          className="h-3 w-3 text-amber-600"
          strokeWidth={2.5}
        />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
          Reason · charge_declined
        </span>
      </div>

      {/* Actions */}
      <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onRetry}
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-6 py-3",
            "bg-primary text-primary-foreground font-semibold text-[14px]",
            "hover:bg-primary/90 active:translate-y-px transition-all",
            "shadow-[0_6px_20px_-8px_rgba(195,235,66,0.45)]",
          )}
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-3",
            "bg-card border border-border text-foreground font-medium text-[13.5px]",
            "hover:border-foreground/30 active:translate-y-px transition-all",
          )}
        >
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          Email support
        </a>
      </div>

      <p className="mt-5 text-[11.5px] text-muted-foreground">
        Or write to us directly at{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-foreground font-medium hover:text-primary transition-colors"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}
