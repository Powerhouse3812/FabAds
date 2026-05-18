/**
 * ActionPod — right-side companion to the dashboard hero.
 *
 * Why this exists
 * ---------------
 * The previous tile grid was text-heavy stat cards. Maalik flagged that the
 * user had to read everything before knowing what to *do*. This component
 * flips that — the #1 action becomes the visual anchor and status surfaces
 * as motif (gauge, pulse, sheen).
 *
 * Motif extraction (don't copy):
 *   - Vercel dashboard — big number → primary action
 *   - Mercury — gauge as a feature, not a chart
 *   - Awwwards "magnetic card" — micro-cards tilt toward cursor
 *
 * Structure (vertical, ~520-560px):
 *   1. Credit gauge tile (~220px) — SVG ring, count-up number, live dot
 *   2. Primary CTA (~88px) — lime button with sheen sweep every 8s
 *   3. Two micro action cards (~80px each) — magnetic hover
 */
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useMotionTemplate,
} from "framer-motion";
import { Sparkles, ChevronRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface ActionPodProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants — keep tunables grouped at the top so iteration is cheap.
// ─────────────────────────────────────────────────────────────────────────────
const CREDIT_VALUE = 73;
const CREDIT_MAX = 100;
const RING_SIZE = 168;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Credit gauge — SVG ring with count-up + live pulse
// ─────────────────────────────────────────────────────────────────────────────
function CreditGauge() {
  const progress = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const dashOffset = useTransform(
    progress,
    (v) => RING_CIRC - (v / CREDIT_MAX) * RING_CIRC
  );

  useEffect(() => {
    const controls = animate(progress, CREDIT_VALUE, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1], // soft ease-out
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [progress]);

  return (
    <div className="relative rounded-2xl border border-border bg-card p-5">
      {/* Live pulse — top right */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          Live
        </span>
        <motion.span
          className="block h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Ring */}
      <div className="flex flex-col items-center pt-2">
        <div
          className="relative"
          style={{ width: RING_SIZE, height: RING_SIZE }}
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="-rotate-90"
          >
            {/* Track */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={RING_STROKE}
              opacity={0.35}
            />
            {/* Progress */}
            <motion.circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              style={{ strokeDashoffset: dashOffset }}
            />
          </svg>

          {/* Number inside */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-mono text-[52px] font-bold leading-none text-foreground"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {display}
            </span>
            <span className="mt-1 font-mono text-[12px] text-muted-foreground">
              /{CREDIT_MAX}
            </span>
          </div>
        </div>

        {/* Eyebrow */}
        <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Credits · Month of May
        </div>
        {/* Micro status */}
        <div className="mt-1 text-[11px] text-muted-foreground">
          Resets Jun 1 · 27 remaining
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Primary CTA — lime button with a one-shot sheen sweep (per session)
// ui-ux-pro-max P1: previously swept every 8s, infinite. Awwwards on first
// visit, motion-noise by visit 5. Now: runs ONCE per session (sessionStorage
// flag), then settles. The button stays useful, the page calms down.
// ─────────────────────────────────────────────────────────────────────────────
const SHEEN_SESSION_KEY = "dashboard.ai.sheen.played";

function PrimaryCta() {
  const navigate = useNavigate();
  const [shouldSheen, setShouldSheen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SHEEN_SESSION_KEY) === "1") return;
      setShouldSheen(true);
      window.sessionStorage.setItem(SHEEN_SESSION_KEY, "1");
    } catch {
      // Storage blocked — play it anyway, harmless either way.
      setShouldSheen(true);
    }
  }, []);

  return (
    <motion.button
      type="button"
      onClick={() => navigate("/iq/genie6/studio-alpha")}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0, scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative flex h-14 w-full items-center justify-center gap-2",
        "overflow-hidden rounded-2xl bg-primary text-primary-foreground",
        "text-[15px] font-semibold",
        "shadow-[0_2px_0_0_rgba(0,0,0,0.04)] hover:shadow-lg",
        "transition-shadow duration-300"
      )}
    >
      {/* One-shot sheen sweep — only when shouldSheen flag is set */}
      {shouldSheen && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/2"
          style={{
            background:
              "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)",
          }}
          initial={{ x: "-120%" }}
          animate={{ x: "240%" }}
          transition={{
            duration: 1.1,
            ease: "easeInOut",
            delay: 0.6,
          }}
        />
      )}
      <Sparkles className="relative h-4 w-4" strokeWidth={2.25} />
      <span className="relative flex flex-col items-center leading-none">
        <span>Start a generation</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-70 mt-1">
          Opens Studio Alpha
        </span>
      </span>
      <ChevronRight
        className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
        strokeWidth={2.25}
      />
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Micro action card — magnetic hover (rotateX/Y from mouse position)
// ─────────────────────────────────────────────────────────────────────────────
interface MicroCardProps {
  eyebrow: string;
  title: string;
  onClick: () => void;
}

function MicroCard({ eyebrow, title, onClick }: MicroCardProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const transform = useMotionTemplate`perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 4); // ±2deg total range
    rotateX.set(-py * 4);
  };

  const handleLeave = () => {
    animate(rotateX, 0, { duration: 0.4, ease: "easeOut" });
    animate(rotateY, 0, { duration: 0.4, ease: "easeOut" });
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ transform }}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3",
        "text-left transition-colors duration-200",
        "hover:border-primary/40"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </div>
        <div className="mt-0.5 truncate text-[13px] font-medium text-foreground">
          {title}
        </div>
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
        strokeWidth={2}
      />
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Container with staggered entrance
// ─────────────────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.2, delayChildren: 0 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const microGroupVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

export function ActionPod({ className }: ActionPodProps) {
  const navigate = useNavigate();
  const activeBrand = brands[0];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("flex flex-col gap-4", className)}
    >
      {/* 1 — Gauge */}
      <motion.div variants={itemVariants}>
        <CreditGauge />
      </motion.div>

      {/* 2 — Primary CTA */}
      <motion.div variants={itemVariants}>
        <PrimaryCta />
      </motion.div>

      {/* 3 — Micro cards (own stagger nested inside parent stagger) */}
      <motion.div
        variants={microGroupVariants}
        className="flex flex-col gap-3"
      >
        <motion.div variants={itemVariants}>
          <MicroCard
            eyebrow="Pick up where you left"
            title={`${activeBrand?.name ?? "Mamaearth"} · 3 unsaved variants`}
            onClick={() =>
              navigate(
                `/iq/genie6/library?filter=brand:${activeBrand?.id ?? ""}`
              )
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <MicroCard
            eyebrow="Saved & ready"
            title="5 ads ready for Forge"
            onClick={() => navigate("/iq/genie6/studio-alpha?mode=forge")}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default ActionPod;
