/**
 * UpsellRow — horizontal row of upsell cards on the AI-plan dashboard.
 *
 * Philosophy (Maalik, locked):
 *   On AI plan, modules like Launch / Reports / Automation are locked. The
 *   dashboard currently has zero in-context upsell — users discover what they
 *   are missing by hitting a wall. Fix: surface the locked capabilities AS
 *   visual tiles inside the dashboard so they are tempting to click. Visual
 *   but not pushy — interactive illustration + 1-line value prop + clear CTA.
 *
 * Reference vibes: Notion "Pro features" tiles, Linear free-plan sidebar
 * callout, Stripe "Connect Atlas" inline promo. Tempting, not pushy.
 *
 * Layout — 3-column grid (1-col on mobile):
 *   ┌──────────┐  ┌──────────┐  ┌──────────┐
 *   │  LAUNCH  │  │ REPORTS  │  │  AUTO    │
 *   │  illus.  │  │  illus.  │  │  illus.  │
 *   │ [CTA →]  │  │ [CTA →]  │  │ [CTA →]  │
 *   └──────────┘  └──────────┘  └──────────┘
 *
 * Motion:
 *   1. Stagger reveal on mount — 3 cards cascade 80ms each (opacity 0→1, y 8→0)
 *   2. Hover: card lifts -2px, border becomes border-primary/40
 *   3. Per-card illustration animates on card hover:
 *      - Launch: 3 platform icons cascade (translate-y pulse)
 *      - Reports: 3 mini bars grow up to full height
 *      - Automation: Zap orbits Workflow icon faster
 *   4. Spring: stiffness 120, damping 18 (Fabfunnel DS)
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  Sparkles,
  Video,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UpsellRowProps {
  className?: string;
}

/* ── Card variants (Fabfunnel spring) ───────────────────────────────── */

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18 };

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...SPRING, delay: i * 0.08 },
  }),
};

/* ── Illustration: Launch (platform icons → target) ─────────────────── */

function LaunchIllustration() {
  const icons = [Globe, Video, Sparkles];
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-1.5">
      <div className="flex items-center gap-1.5">
        {icons.map((Icon, i) => (
          <motion.div
            key={i}
            variants={{
              rest: { y: 0 },
              hover: { y: [-1, -4, -1], transition: { delay: i * 0.08, duration: 0.5 } },
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background"
          >
            <Icon className="h-3.5 w-3.5 text-foreground/70" />
          </motion.div>
        ))}
      </div>
      <ArrowRight className="h-3 w-3 text-muted-foreground/60" strokeWidth={2.5} />
      <motion.div
        variants={{
          rest: { scale: 1 },
          hover: { scale: 1.1, transition: { delay: 0.24 } },
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}

/* ── Illustration: Reports (mini bar chart) ─────────────────────────── */

function ReportsIllustration() {
  const bars = [
    { full: 32, color: "bg-foreground/70" },
    { full: 56, color: "bg-primary" },
    { full: 44, color: "bg-foreground/40" },
    { full: 64, color: "bg-foreground/80" },
  ];
  return (
    <div className="flex h-full w-full items-end justify-center gap-2 pb-1">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          variants={{
            rest: { height: 8 },
            hover: {
              height: bar.full,
              transition: { ...SPRING, delay: i * 0.06 },
            },
          }}
          initial={{ height: 8 }}
          className={cn("w-3 rounded-sm", bar.color)}
          style={{ height: 8 }}
        />
      ))}
    </div>
  );
}

/* ── Illustration: Automation (Workflow + orbiting Zap) ─────────────── */

function AutomationIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
        <Workflow className="h-5 w-5 text-foreground/80" strokeWidth={2} />
        <motion.div
          variants={{
            rest: { rotate: 0 },
            hover: { rotate: 360, transition: { duration: 1.6, ease: "linear", repeat: Infinity } },
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          className="absolute inset-[-10px] flex items-start justify-center"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Zap className="h-3 w-3" strokeWidth={2.5} fill="currentColor" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Tile data ──────────────────────────────────────────────────────── */

interface Tile {
  eyebrow: string;
  title: string;
  sub: string;
  cta: string;
  tint?: boolean;
  Illustration: () => JSX.Element;
}

const TILES: Tile[] = [
  {
    eyebrow: "UPGRADE · LAUNCH",
    title: "Launch ads on Meta, TikTok, NewsBreak",
    sub: "Bulk-launch from this workspace · no platform-hopping",
    cta: "Try Full · 14 day trial",
    tint: true,
    Illustration: LaunchIllustration,
  },
  {
    eyebrow: "UPGRADE · REPORTS",
    title: "Multi-account performance, one view",
    sub: "FB · TikTok · NewsBreak · creative reporting in one place",
    cta: "See sample report",
    Illustration: ReportsIllustration,
  },
  {
    eyebrow: "UPGRADE · AUTOMATION",
    title: "Auto-pause losers · scale winners",
    sub: "Rule-based optimization while you sleep",
    cta: "Set up rules",
    Illustration: AutomationIllustration,
  },
];

/* ── Component ──────────────────────────────────────────────────────── */

export function UpsellRow({ className }: UpsellRowProps) {
  const navigate = useNavigate();

  const handleCta = () => {
    toast.success("Demo: opening plans modal...");
    setTimeout(() => navigate("/plans-v2?tier=growth"), 250);
  };

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      {TILES.map((tile, i) => {
        const { Illustration } = tile;
        return (
          <motion.button
            key={tile.eyebrow}
            type="button"
            onClick={handleCta}
            custom={i}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={cardVariants}
            className={cn(
              "group relative flex h-[176px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 text-left",
              "transition-[border-color,transform,box-shadow] duration-200",
              "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
              tile.tint && "bg-gradient-to-br from-primary/[0.04] via-card to-card",
            )}
          >
            {/* Eyebrow + lock */}
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-muted-foreground/70" strokeWidth={2.25} />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {tile.eyebrow}
              </span>
            </div>

            {/* Title */}
            <h3 className="mt-1.5 text-[13px] font-semibold leading-snug text-foreground">
              {tile.title}
            </h3>

            {/* Sub */}
            <p className="mt-1 font-mono text-[11px] leading-snug text-muted-foreground">
              {tile.sub}
            </p>

            {/* Illustration */}
            <motion.div
              initial="rest"
              animate="rest"
              whileHover="hover"
              variants={{ rest: {}, hover: {} }}
              className="my-2 flex flex-1 items-center justify-center"
            >
              <motion.div
                variants={{ rest: {}, hover: {} }}
                className="h-full w-full"
              >
                <Illustration />
              </motion.div>
            </motion.div>

            {/* CTA */}
            <div className="flex items-center justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11.5px] font-semibold text-primary-foreground transition-opacity group-hover:opacity-90">
                {tile.cta}
                <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
