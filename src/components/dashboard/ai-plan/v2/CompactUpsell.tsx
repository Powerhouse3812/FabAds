/**
 * CompactUpsell — vertical-stack upsell for V2's narrow right column.
 *
 * V1's UpsellRow is a horizontal 3-up grid. V2's bento layout puts upsell in
 * a narrow right column, so the tiles stack vertically instead. Same upsell
 * content (Launch / Reports / Automation), reformatted for vertical proportions
 * with smaller padding, tighter type, and compact inline micro-illustrations.
 *
 * Reference vibes: Stripe "Connect Atlas" sidebar promo, Notion "Try AI"
 * sidebar tiles, Linear "Upgrade to Business" panel.
 *
 * Layout — 3 tiles stacked top-to-bottom (~480-540px total):
 *   ┌─────────────────────────┐
 *   │ 🔒 UPGRADE · LAUNCH     │
 *   │ title + micro-illus     │
 *   │ [ CTA → ]               │
 *   ├─────────────────────────┤
 *   │ ... REPORTS ...         │
 *   ├─────────────────────────┤
 *   │ ... AUTOMATION ...      │
 *   └─────────────────────────┘
 *
 * Motion:
 *   1. Stagger reveal on mount — 3 tiles cascade 80ms (opacity 0→1, y 8→0)
 *   2. Hover: tile lifts -1px, border becomes border-primary/40
 *   3. Per-tile illustration animates on tile hover (variants + staggerChildren)
 *   4. Spring: stiffness 120, damping 18 (Fabfunnel DS)
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Globe,
  Lock,
  Sparkles,
  Video,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactUpsellProps {
  className?: string;
}

/* ── Springs / variants ─────────────────────────────────────────────── */

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18 };

const tileVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...SPRING, delay: i * 0.08 },
  }),
};

/* ── Illustration: Launch (platform icons → check) ──────────────────── */

function LaunchMicro() {
  const icons = [Globe, Video, Sparkles];
  return (
    <motion.div
      variants={{ rest: {}, hover: { transition: { staggerChildren: 0.05 } } }}
      className="inline-flex h-6 items-center gap-1"
    >
      {icons.map((Icon, i) => (
        <motion.span
          key={i}
          variants={{
            rest: { y: 0 },
            hover: { y: [-1, -3, -1], transition: { duration: 0.45 } },
          }}
          className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-background"
        >
          <Icon className="h-2.5 w-2.5 text-foreground/70" strokeWidth={2.25} />
        </motion.span>
      ))}
      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/60" strokeWidth={2.5} />
      <motion.span
        variants={{ rest: { scale: 1 }, hover: { scale: 1.12 } }}
        className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 ring-1 ring-primary/40"
      >
        <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
      </motion.span>
    </motion.div>
  );
}

/* ── Illustration: Reports (mini bar chart) ─────────────────────────── */

function ReportsMicro() {
  const bars = [
    { full: 14, color: "bg-foreground/60" },
    { full: 22, color: "bg-primary" },
    { full: 18, color: "bg-foreground/40" },
    { full: 24, color: "bg-foreground/75" },
  ];
  return (
    <motion.div
      variants={{ rest: {}, hover: { transition: { staggerChildren: 0.05 } } }}
      className="inline-flex h-6 items-end gap-1"
    >
      {bars.map((bar, i) => (
        <motion.span
          key={i}
          variants={{
            rest: { height: 5 },
            hover: { height: bar.full, transition: { ...SPRING } },
          }}
          initial={{ height: 5 }}
          className={cn("w-1.5 rounded-sm", bar.color)}
          style={{ height: 5 }}
        />
      ))}
    </motion.div>
  );
}

/* ── Illustration: Automation (Workflow + orbiting Zap) ─────────────── */

function AutomationMicro() {
  return (
    <motion.div
      variants={{ rest: {}, hover: {} }}
      className="relative inline-flex h-6 w-6 items-center justify-center"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background">
        <Workflow className="h-3 w-3 text-foreground/80" strokeWidth={2} />
      </span>
      <motion.span
        variants={{
          rest: { rotate: 0 },
          hover: {
            rotate: 360,
            transition: { duration: 1.4, ease: "linear", repeat: Infinity },
          },
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4.5, ease: "linear", repeat: Infinity }}
        className="pointer-events-none absolute inset-[-6px] flex items-start justify-center"
      >
        <span className="flex h-3 w-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Zap className="h-2 w-2" strokeWidth={2.5} fill="currentColor" />
        </span>
      </motion.span>
    </motion.div>
  );
}

/* ── Tile data ──────────────────────────────────────────────────────── */

interface Tile {
  eyebrow: string;
  title: string;
  cta: string;
  Micro: () => JSX.Element;
}

const TILES: Tile[] = [
  {
    eyebrow: "UPGRADE · LAUNCH",
    title: "Launch ads on Meta · TikTok · NewsBreak — one workspace.",
    cta: "Try Full · 14d trial",
    Micro: LaunchMicro,
  },
  {
    eyebrow: "UPGRADE · REPORTS",
    title: "Multi-account performance, one view.",
    cta: "See sample report",
    Micro: ReportsMicro,
  },
  {
    eyebrow: "UPGRADE · AUTOMATION",
    title: "Auto-pause losers, scale winners. Rules + budget pacing.",
    cta: "Set up rules",
    Micro: AutomationMicro,
  },
];

/* ── Component ──────────────────────────────────────────────────────── */

export default function CompactUpsell({ className }: CompactUpsellProps) {
  const navigate = useNavigate();

  const handleCta = (eyebrow: string) => {
    toast.success(`Demo: opening plans for ${eyebrow.split("·")[1]?.trim() ?? "growth"}…`);
    setTimeout(() => navigate("/plans-v2?tier=growth"), 250);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {TILES.map((tile, i) => {
        const { Micro } = tile;
        return (
          <motion.button
            key={tile.eyebrow}
            type="button"
            onClick={() => handleCta(tile.eyebrow)}
            custom={i}
            initial={["hidden", "rest"]}
            animate={["visible", "rest"]}
            whileHover="hover"
            variants={tileVariants}
            className={cn(
              "group relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-border bg-card p-4 text-left",
              "bg-gradient-to-br from-primary/[0.04] via-card to-card",
              "transition-[border-color,transform,box-shadow] duration-200",
              "hover:-translate-y-px hover:border-primary/40 hover:shadow-sm",
            )}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-muted-foreground/70" strokeWidth={2.25} />
              <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
                {tile.eyebrow}
              </span>
            </div>

            {/* Title + inline micro-illustration (hover propagates from button) */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[12.5px] font-semibold leading-snug text-foreground">
                {tile.title}
              </h3>
              <div className="shrink-0">
                <Micro />
              </div>
            </div>

            {/* CTA */}
            <span className="inline-flex items-center gap-1 self-start rounded-full bg-primary px-3 py-1.5 font-mono text-[11px] font-semibold text-primary-foreground transition-opacity group-hover:opacity-90">
              {tile.cta}
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
