import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Payment Verification — Vibe C · Playful sharp
 * ---------------------------------------------
 * Brand-forward waiting state in the Linear / Lemon Squeezy / Vercel mould:
 * one bold custom-built animated illustration anchors the screen, sharp
 * typography below, single lime accent on a strategic word.
 *
 * Illustration choice: a constellation of 7 lime sparkles orbiting a
 * central padlock, each on its own ring radius and own rotation speed,
 * with depth-aware scale + opacity. The whole assembly breathes (scales
 * 1.0 ↔ 1.04) and the padlock emits a soft lime aura. Everything is
 * SVG / framer-motion — no emojis, no stock spinner. Animations loop
 * seamlessly via `repeat: Infinity` + linear easing on rotations.
 *
 * Verifier feel: ALWAYS animating, never jittery. Calm orbits, gentle
 * breathing, single elapsed counter (mono tabular-nums) ticking once
 * per second so the user feels progress without a fake progress bar.
 */

interface Props {
  className?: string;
}

/* ── Elapsed-time hook (mm:ss, live) ───────────────────────────── */
function useElapsed(startSeconds = 18) {
  const [seconds, setSeconds] = useState(startSeconds);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Orbit definitions ─────────────────────────────────────────── */
/**
 * Each sparkle lives on its own ring. `radius` is in px from the
 * centre of the 200x200 stage. `duration` (s) controls how fast that
 * sparkle completes one revolution — odd numbers + opposing
 * directions keep the constellation reading as alive, never
 * mechanical. `phase` (0..1) offsets the starting angle so all 7
 * sparkles don't start at the 3-o'clock position.
 */
interface Orbit {
  radius: number;
  duration: number;
  phase: number;
  size: number;
  /** -1 reverses direction (counter-orbit). */
  dir: 1 | -1;
  /** Visual depth — lower = further back, dimmer + smaller. */
  depth: number;
}

const ORBITS: Orbit[] = [
  { radius: 58,  duration: 11, phase: 0.00, size: 14, dir:  1, depth: 1.00 },
  { radius: 72,  duration: 17, phase: 0.18, size: 10, dir: -1, depth: 0.85 },
  { radius: 86,  duration: 13, phase: 0.42, size: 12, dir:  1, depth: 0.95 },
  { radius: 64,  duration: 19, phase: 0.61, size:  8, dir: -1, depth: 0.70 },
  { radius: 92,  duration: 23, phase: 0.77, size:  9, dir:  1, depth: 0.75 },
  { radius: 50,  duration: 15, phase: 0.33, size:  7, dir: -1, depth: 0.65 },
  { radius: 80,  duration: 21, phase: 0.88, size: 11, dir:  1, depth: 0.90 },
];

/* ── The illustration ──────────────────────────────────────────── */
function PadlockConstellation() {
  return (
    <div className="relative h-[200px] w-[200px]" aria-hidden>
      {/* Soft lime aura behind the lock — slow breathing pulse. */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0.08) 38%, transparent 65%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Faint orbit guide rings — adds geometric structure without noise. */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        {[58, 80, 92].map((r) => (
          <circle
            key={r}
            cx={100}
            cy={100}
            r={r}
            stroke="hsl(var(--primary) / 0.10)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
        ))}
      </svg>

      {/* Breathing wrapper for the entire constellation. */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Orbiting sparkles. Each is a rotating wrapper whose child
            is translated outward by `radius` — rotating the parent
            sweeps the child around the centre in a perfect circle. */}
        {ORBITS.map((o, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 h-0 w-0"
            initial={{ rotate: o.phase * 360 * o.dir }}
            animate={{ rotate: (o.phase * 360 + 360) * o.dir }}
            transition={{
              duration: o.duration,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="absolute"
              style={{
                left: o.radius,
                top: 0,
                transform: "translate(-50%, -50%)",
              }}
              animate={{ opacity: [o.depth * 0.55, o.depth, o.depth * 0.55] }}
              transition={{
                duration: 2.6 + (i % 3) * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.22,
              }}
            >
              <Sparkles
                style={{
                  width: o.size,
                  height: o.size,
                  // Counter-rotate so the sparkle glyph stays upright
                  // as its parent ring rotates around the centre.
                  transform: `rotate(${-(o.phase * 360 * o.dir)}deg) scale(${o.depth})`,
                  color: "hsl(var(--primary))",
                  filter: `drop-shadow(0 0 ${4 * o.depth}px hsl(var(--primary) / 0.6))`,
                }}
                strokeWidth={2.25}
              />
            </motion.div>
          </motion.div>
        ))}

        {/* Central padlock — the anchor. Sits on a crisp lime-tinted
            card with a 1px ring so it reads as "secured", not "loading". */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className={cn(
              "relative h-[68px] w-[68px] rounded-2xl",
              "flex items-center justify-center",
              "bg-gradient-to-br from-primary/15 to-primary/5",
              "border border-primary/40",
              "shadow-[0_8px_24px_-10px_hsl(var(--primary)/0.5)]",
            )}
            animate={{
              boxShadow: [
                "0 8px 24px -10px hsl(74 81% 59% / 0.35)",
                "0 8px 28px -8px hsl(74 81% 59% / 0.65)",
                "0 8px 24px -10px hsl(74 81% 59% / 0.35)",
              ],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lock
              className="h-7 w-7 text-foreground"
              strokeWidth={2.25}
              aria-hidden
            />
            {/* Tiny corner spark — keeps the lock feeling alive. */}
            <motion.span
              className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary"
              animate={{ scale: [0.7, 1.15, 0.7], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */
export function VibeC_PlayfulSharp({ className }: Props) {
  const elapsed = useElapsed(18);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[600px]",
        "rounded-2xl border border-border bg-card",
        "shadow-[0_10px_40px_-20px_rgba(0,0,0,0.25)]",
        "overflow-hidden",
        className,
      )}
      style={{ minHeight: 560 }}
    >
      {/* Subtle top lime wash — branded warmth without overpowering. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[180px]"
        style={{
          background:
            "radial-gradient(ellipse 480px 200px at 50% 0%, hsl(var(--primary) / 0.10), transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center px-8 pt-8 pb-[72px]">
        {/* Eyebrow stack */}
        <p className="text-[10px] tracking-[0.22em] font-mono uppercase text-primary">
          Payment Verification
        </p>
        <p className="mt-1.5 text-[9px] tracking-[0.18em] font-mono uppercase text-muted-foreground">
          Vibe C · Playful sharp
        </p>

        {/* Centerpiece illustration */}
        <div className="mt-7 mb-7">
          <PadlockConstellation />
        </div>

        {/* Headline */}
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight text-center text-foreground">
          Securing your{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-foreground">unfair edge</span>
            <span
              aria-hidden
              className="absolute left-0 right-0 bottom-0.5 h-[10px] rounded-sm bg-primary/40"
            />
          </span>
        </h1>

        {/* Sub */}
        <p className="mt-3 max-w-[440px] text-center text-[14px] leading-relaxed text-muted-foreground">
          We&rsquo;re charging your card and unlocking everything. Hang tight.
        </p>

        {/* Status row */}
        <div className="mt-6 inline-flex items-center gap-2.5 text-[11px]">
          <motion.span
            className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.15, 0.85] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <span className="font-mono uppercase tracking-[0.16em] text-muted-foreground">
            Usually 30&ndash;60s
          </span>
          <span aria-hidden className="text-muted-foreground/50">·</span>
          <span className="font-mono tabular-nums text-foreground">
            {elapsed} elapsed
          </span>
        </div>
      </div>

      {/* Sticky bottom banner */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0",
          "border-t border-primary/30 bg-primary/5",
          "px-5 py-3",
          "flex items-center justify-between gap-4",
        )}
      >
        <div className="flex items-center gap-2 text-[11px] text-foreground/80">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.25} />
          <span>
            Don&rsquo;t close this tab
            <span className="mx-1.5 text-muted-foreground/60">·</span>
            <span className="text-muted-foreground">
              Refresh if stuck after 60 seconds
            </span>
          </span>
        </div>
        <a
          href="mailto:hello@fabfunnel.com"
          className={cn(
            "text-[11px] font-mono text-muted-foreground",
            "hover:text-primary transition-colors",
            "whitespace-nowrap",
          )}
        >
          Need help? hello@fabfunnel.com
        </a>
      </div>
    </div>
  );
}

export default VibeC_PlayfulSharp;
