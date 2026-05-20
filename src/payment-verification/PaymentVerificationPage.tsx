import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Sparkles,
  AlertCircle,
  Mail,
  ShieldCheck,
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUPPORT_EMAIL = "hello@fabfunnel.com";

/**
 * PaymentVerificationPage — waiting-only.
 *
 * Maalik (iter 2): success/failed states migrated to standalone
 * Welcome-equivalent screens (Welcome.tsx, WelcomeFailed.tsx,
 * WelcomeStuckWaiting.tsx). This page shows ONLY the waiting state —
 * single purpose, no toggle, no demo pill.
 *
 * Design (locked):
 *   - Vibe C: orbiting lime sparkles around a central padlock.
 *   - Sprinkle of Vibe A: in-transit rail below the headline with
 *     [You] → [Bank] → [Fabfunnel] + a lime money-dot riding the path.
 *
 * Includes:
 *   - Live elapsed counter (MM:SS, ticks each second)
 *   - Sticky "Don't close this tab" banner
 *   - "If money is deducted, will be refunded automatically" reassurance
 *     line (Maalik's iter-2 add — relieves anxiety mid-wait)
 *   - Support email link (mailto:hello@fabfunnel.com)
 */
export function PaymentVerificationPage() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[640px]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          >
            <WaitingState />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * Orbital hero — 7 lime sparkles orbiting a central padlock card.
 * Never syncs (mixed radii / directions / prime-ish durations).
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

function OrbitalHero() {
  return (
    <div className="relative h-[220px] w-[220px] mx-auto" aria-hidden>
      {/* Soft lime aura */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(195,235,66,0.14), transparent 70%)",
        }}
      />

      {/* Dashed guide ring — slow rotation */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
        style={{
          width: 196,
          height: 196,
          borderColor: "rgba(195,235,66,0.30)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      {/* Orbiting sparkles */}
      {SPARKLES.map((s) => (
        <motion.div
          key={s.id}
          className="absolute top-1/2 left-1/2 origin-center"
          style={{ width: 0, height: 0 }}
          initial={{ rotate: s.startAngle }}
          animate={{ rotate: s.startAngle + 360 * s.direction }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Sparkles
            className="absolute"
            style={{
              width: s.size,
              height: s.size,
              color: "hsl(var(--primary))",
              opacity: 0.85,
              transform: `translate(${s.radius}px, -${s.size / 2}px)`,
              filter: "drop-shadow(0 0 6px rgba(195,235,66,0.6))",
            }}
            strokeWidth={2}
          />
        </motion.div>
      ))}

      {/* Central padlock card */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-2xl flex items-center justify-center border-2 border-primary/40 bg-card"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          boxShadow: "0 0 24px rgba(195,235,66,0.18)",
        }}
      >
        <Lock className="h-9 w-9 text-foreground/80" strokeWidth={2} />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * In-transit rail (Vibe A flavor) — slim horizontal SVG showing
 * [You] → [Bank] → [Fabfunnel] with a lime money-dot riding the path.
 * ═══════════════════════════════════════════════════════════════════════ */
function InTransitRail() {
  const STATION_X = [40, 200, 360];
  const STATION_Y = 30;
  const PATH = "M 40 30 L 200 30 L 360 30";

  return (
    <div className="mx-auto" style={{ width: 400 }}>
      <svg viewBox="0 0 400 60" className="w-full h-[60px]" aria-hidden>
        {/* Background dashed path with drifting offset */}
        <line
          x1={40}
          y1={STATION_Y}
          x2={360}
          y2={STATION_Y}
          stroke="hsl(var(--muted-foreground) / 0.25)"
          strokeWidth={1.5}
          strokeDasharray="3 4"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-14"
            dur="2s"
            repeatCount="indefinite"
          />
        </line>

        {/* Travelling money-dot */}
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
 * Waiting state — the only state on this page now.
 * ═══════════════════════════════════════════════════════════════════════ */
function WaitingState() {
  // Live elapsed counter — MM:SS via setInterval at 1s.
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

      <OrbitalHero />

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

      {/* Refund reassurance line — Maalik's iter-2 add. Relieves the
          "did my money go through if this fails?" anxiety mid-wait. */}
      <div className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
        <span>
          If money is deducted, you'll be refunded automatically — no
          action needed.
        </span>
      </div>

      {/* Sticky banner */}
      <div className="mt-7 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/[0.05] px-4 py-2.5 flex-wrap">
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
