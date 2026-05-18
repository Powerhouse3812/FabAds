/**
 * SpotlightRow — visual replacement for the text-heavy Insights + Catalogue
 * Health row.
 *
 * Philosophy (Maalik, locked):
 *   Old dashboard tiles read like bullet lists. The fix: turn signals into
 *   things you can SEE. Trending competitor ads as thumbnail-style cards
 *   (Linear "what's hot"), catalogue health as Apple-Health-style radial
 *   dials (OpenAI Platform donut indicators). No walls of copy.
 *
 * Layout — single grid, two sub-sections:
 *   ┌─────── 60% ───────┐ ┌── 40% ──┐
 *   │  TRENDING TODAY    │ │  HEALTH │
 *   │  [4 visual cards]  │ │ 3 dials │
 *   └────────────────────┘ └─────────┘
 *
 * Animations:
 *   1. Stagger reveal of 4 trending cards on mount (spring)
 *   2. Hover on card → scale 1.03 + lime ring + action overlay slide-up
 *   3. Health dial arcs animate 0→target % on mount (1s ease-out)
 *   4. Hover on dial → forward tilt (rotateX 8deg) + drop shadow
 *   5. Cursor-follow radial shimmer across the Trending section background
 */
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bookmark, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";
import { products } from "@/mocks/shared/products";
import { categories } from "@/mocks/shared/categories";

interface SpotlightRowProps {
  className?: string;
}

/* ── Trending card data ─────────────────────────────────────────────── */

interface TrendingCard {
  brandId: string;
  brandName: string;
  insight: string;
  gradient: string;
}

const GRADIENTS = [
  "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 45%, #3a2a1a 100%)",
  "linear-gradient(135deg, #0d3b66 0%, #1a5fa8 55%, #2e7ed6 100%)",
  "linear-gradient(135deg, #2d5f3f 0%, #4a8b5f 50%, #7ab87a 100%)",
  "linear-gradient(135deg, #6b1f4a 0%, #a8326f 50%, #d04a8f 100%)",
];

const TRENDING: TrendingCard[] = [
  { brandId: "boat",        brandName: "boAt",       insight: "New hook: Built for Bharat",            gradient: GRADIENTS[0] },
  { brandId: "sleepyhead",  brandName: "Sleepyhead", insight: "Scrapped value props, lifestyle-first", gradient: GRADIENTS[1] },
  { brandId: "mamaearth",   brandName: "Mamaearth",  insight: "5 new TVC adaptations",                 gradient: GRADIENTS[2] },
  { brandId: "sleepyhead",  brandName: "Sleepyhead", insight: "Testimonial overlay drove 23% completion", gradient: GRADIENTS[3] },
];

/* ── Health computation ─────────────────────────────────────────────── */

function pct(num: number, denom: number) {
  if (denom === 0) return 0;
  return Math.round((num / denom) * 100);
}

function useHealthStats() {
  return useMemo(() => {
    const totalBrands = brands.length;
    const completeBrands = brands.filter(
      (b) => (b.voice?.length ?? 0) > 20 && (b.colors?.length ?? 0) >= 2 && (b.usps?.length ?? 0) >= 2,
    ).length;

    const totalProducts = products.length;
    const productsWithLanding = products.filter(
      (p) => Array.isArray(p.landingPages) && p.landingPages.length > 0,
    ).length;

    const totalCats = categories.length;
    const catsWithInstruction = categories.filter(
      (c) => (c.instruction?.length ?? 0) > 20,
    ).length;

    const brandPct   = pct(completeBrands, totalBrands);
    const productPct = pct(productsWithLanding, totalProducts);
    const catPct     = pct(catsWithInstruction, totalCats);

    const needsAttention =
      (totalBrands - completeBrands) +
      (totalProducts - productsWithLanding) +
      (totalCats - catsWithInstruction);

    return { brandPct, productPct, catPct, needsAttention };
  }, []);
}

/* ── Radial dial (inline SVG donut) ─────────────────────────────────── */

interface RadialDialProps {
  value: number;       // 0..100
  delay?: number;      // seconds
}

const DIAL_SIZE   = 48;
const DIAL_STROKE = 4;
const DIAL_RADIUS = (DIAL_SIZE - DIAL_STROKE) / 2;
const DIAL_CIRC   = 2 * Math.PI * DIAL_RADIUS;

function RadialDial({ value, delay = 0 }: RadialDialProps) {
  // ui-ux-pro-max P0: amber threshold lowered from 70% to 50%. At 70%,
  // most healthy users saw amber on at least one dial each visit —
  // manufactured anxiety. <50% is a fair "needs work" cut.
  const isHealthy = value >= 50;
  const stroke    = isHealthy ? "rgb(195 235 66)" : "rgb(245 158 11)"; // primary lime / amber-500
  const target    = DIAL_CIRC * (1 - value / 100);

  return (
    <svg
      width={DIAL_SIZE}
      height={DIAL_SIZE}
      viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
      className="-rotate-90"
      aria-hidden
    >
      {/* track */}
      <circle
        cx={DIAL_SIZE / 2}
        cy={DIAL_SIZE / 2}
        r={DIAL_RADIUS}
        fill="none"
        stroke="hsl(var(--muted) / 0.4)"
        strokeWidth={1.5}
      />
      {/* arc */}
      <motion.circle
        cx={DIAL_SIZE / 2}
        cy={DIAL_SIZE / 2}
        r={DIAL_RADIUS}
        fill="none"
        stroke={stroke}
        strokeWidth={DIAL_STROKE}
        strokeLinecap="round"
        strokeDasharray={DIAL_CIRC}
        initial={{ strokeDashoffset: DIAL_CIRC }}
        animate={{ strokeDashoffset: target }}
        transition={{ duration: 1, ease: "easeOut", delay }}
      />
    </svg>
  );
}

interface HealthRowProps {
  label: string;
  value: number;
  delay: number;
}

function HealthRow({ label, value, delay }: HealthRowProps) {
  return (
    <motion.div
      whileHover={{ rotateX: 8, y: -1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      style={{ perspective: 600, transformStyle: "preserve-3d" }}
      className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 hover:border-border hover:bg-muted/30 hover:shadow-[0_8px_18px_-12px_rgba(0,0,0,0.25)]"
    >
      <div className="relative shrink-0">
        <RadialDial value={value} delay={delay} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium text-foreground">{label}</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {value >= 50 ? "Healthy" : "Needs work"}
        </div>
      </div>
      <div className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
        {value}%
      </div>
    </motion.div>
  );
}

/* ── Trending card ──────────────────────────────────────────────────── */

interface TrendingThumbProps {
  card: TrendingCard;
  index: number;
}

function TrendingThumb({ card, index }: TrendingThumbProps) {
  const initial = card.brandName.charAt(0).toUpperCase();

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18, delay: index * 0.06 }}
      whileHover={{ scale: 1.03 }}
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl text-left ring-1 ring-border/60 transition-shadow hover:ring-2 hover:ring-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ background: card.gradient }}
      aria-label={`${card.brandName}: ${card.insight}`}
    >
      {/* Brand initial (semi-transparent, as thumbnail anchor) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono text-[88px] font-bold leading-none text-white/12 select-none"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.25)" }}
        >
          {initial}
        </span>
      </div>

      {/* Glass chip — brand name */}
      <div className="absolute left-2 top-2 z-10">
        <span className="inline-block rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
          {card.brandName}
        </span>
      </div>

      {/* Bottom insight overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-2.5 pt-6">
        <p className="text-[11.5px] font-medium leading-snug text-white line-clamp-2">
          {card.insight}
        </p>
      </div>

      {/* Hover action overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-full bg-gradient-to-t from-black/85 via-black/65 to-transparent p-2 transition-transform duration-200 group-hover:translate-y-0 group-hover:pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-1 font-mono text-[9px] font-medium uppercase tracking-wider text-white backdrop-blur-sm hover:bg-white/25">
            <Bookmark className="h-3 w-3" />
            Save
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90">
            <Wand2 className="h-3 w-3" />
            Forge
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ── Trending section (with cursor-follow shimmer) ──────────────────── */

function TrendingSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const shimmer = mouse
    ? `radial-gradient(circle at ${mouse.x}px ${mouse.y}px, rgba(195,235,66,0.06), transparent 40%)`
    : "transparent";

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setMouse(null)}
      className="relative col-span-1 overflow-hidden rounded-2xl border border-border bg-card p-5 lg:col-span-3"
    >
      {/* Cursor-follow shimmer */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{ background: shimmer, opacity: mouse ? 1 : 0 }}
        aria-hidden
      />

      {/* Eyebrow */}
      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Trending today · Competitor feed
        </span>
        <Link
          to="/insights/trending"
          className="inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Open feed
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 4-card grid */}
      <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TRENDING.map((card, i) => (
          <TrendingThumb key={`${card.brandId}-${i}`} card={card} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ── Health section ─────────────────────────────────────────────────── */

function HealthSection() {
  const { brandPct, productPct, catPct, needsAttention } = useHealthStats();

  return (
    <div className="col-span-1 flex flex-col rounded-2xl border border-border bg-card p-5 lg:col-span-2">
      {/* Eyebrow */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Catalogue Health
        </span>
        <Link
          to="/catalogue/brands"
          className="inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Open
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Dials */}
      <div className="mt-4 flex flex-1 flex-col gap-1.5">
        <HealthRow label="Brand KB completeness"   value={brandPct}   delay={0.05} />
        <HealthRow label="Product landing pages"   value={productPct} delay={0.15} />
        <HealthRow label="Category instructions"   value={catPct}     delay={0.25} />
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-border pt-3">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {needsAttention} {needsAttention === 1 ? "item needs" : "items need"} attention
        </span>
      </div>
    </div>
  );
}

/* ── Public component ───────────────────────────────────────────────── */

export function SpotlightRow({ className }: SpotlightRowProps) {
  return (
    <section
      className={cn("grid grid-cols-1 gap-3 lg:grid-cols-5", className)}
      aria-label="Trending competitors and catalogue health"
    >
      <TrendingSection />
      <HealthSection />
    </section>
  );
}

export default SpotlightRow;
