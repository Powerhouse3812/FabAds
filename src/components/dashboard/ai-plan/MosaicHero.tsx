/**
 * MosaicHero — Pinterest-style asymmetric mosaic of recent generations.
 *
 * Philosophy (Maalik, locked):
 *   The user's WORK is the dashboard. Generic stat-cards are dead. This
 *   hero replaces text-led tiles with a visual mosaic — reference Suno
 *   home feed, Pinterest masonry, Midjourney gallery.
 *
 * Layout — emulated masonry via fixed 12-col grid spans (real CSS
 * grid-row-auto-flow is still inconsistent across engines):
 *   Card 1 (featured)  col-span-5 row-span-2   tall 4:5
 *   Cards 2-7          col-span-2 or 3, mixed heights for the staggered feel
 *
 * Mock-data note: no global generations store yet, so MOCK_GENS is
 * fabricated inline off `mocks/shared/brands.ts`. When the real entity
 * lands, swap MOCK_GENS for the live selector (sort by createdAt DESC,
 * take 7; mark `wasUsed && qualityScore >= 85` as featured).
 *
 * Awwwards-grade motion:
 *   1. Stagger reveal on mount (spring physics)
 *   2. Magnetic hover lift + scale (spring)
 *   3. Reveal-on-hover action overlay (View / Forge)
 *   4. Cursor-follow radial shine on the featured card
 *   5. Lime glow halo on featured hover
 */
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Eye, Layers, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { brands } from "@/mocks/shared/brands";

interface MosaicHeroProps {
  className?: string;
}

interface Gen {
  id: string;
  brandId: string;
  brandName: string;
  brandColors: string[];
  mode: string;
  qualityScore: number;
  wasUsed: boolean;
  ageDays: number;
}

/* ── Mock generations — first item is the featured "top performer" ── */
function buildMockGens(): Gen[] {
  const pool = brands.slice(0, 7);
  const modes = ["UGC Video", "Brand Ad", "Product Ad", "UGC Video", "Brand Ad", "Product Ad", "UGC Video"];
  const scores = [92, 88, 81, 76, 84, 71, 79];
  const ages = [2, 1, 3, 5, 4, 6, 7];
  return pool.map((b, i) => ({
    id: `gen-mosaic-${b.id}`,
    brandId: b.id,
    brandName: b.name,
    brandColors: b.colors.length >= 2 ? b.colors : [...b.colors, "#1A1A1A"],
    mode: modes[i] ?? "UGC Video",
    qualityScore: scores[i] ?? 75,
    wasUsed: i === 0,
    ageDays: ages[i] ?? 7,
  }));
}

function ageLabel(d: number) {
  if (d <= 0) return "TODAY";
  if (d === 1) return "1D AGO";
  return `${d}D AGO`;
}

/* ── Grid placement per slot — tuned for visual rhythm ── */
const SLOT_CLASSES: string[] = [
  // 0 — featured (handled separately, but kept here for symmetry)
  "col-span-5 row-span-2 h-full",
  // 1 — top-row tall
  "col-span-4 h-[232px]",
  // 2 — top-row small
  "col-span-3 h-[232px]",
  // 3 — bottom-row wide
  "col-span-3 h-[232px]",
  // 4 — bottom-row tall
  "col-span-2 h-[232px]",
  // 5 — bottom filler
  "col-span-2 h-[232px]",
  // 6 — corner cap
  "col-span-7 h-[120px]",
];

export function MosaicHero({ className }: MosaicHeroProps) {
  const navigate = useNavigate();
  const gens = buildMockGens();

  if (gens.length === 0) {
    return <EmptyMosaic className={className} onCta={() => navigate("/iq/genie6/studio-alpha")} />;
  }

  const [featured, ...rest] = gens;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Your canvas · 7 recent
        </p>
        <button
          onClick={() => navigate("/iq/genie6/library")}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </button>
      </div>

      <div className="grid grid-cols-12 grid-rows-2 gap-3 h-[488px]">
        <FeaturedCard gen={featured} navigate={navigate} />
        {rest.map((g, i) => (
          <MosaicCard
            key={g.id}
            gen={g}
            slotIdx={i + 1}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Featured card — 2× size, cursor-follow shine, lime ring
   ───────────────────────────────────────────────────────── */
function FeaturedCard({
  gen,
  navigate,
}: {
  gen: Gen;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const sx = useSpring(mouseX, { stiffness: 120, damping: 18 });
  const sy = useSpring(mouseY, { stiffness: 120, damping: 18 });

  const shineBackground = useTransform(
    [sx, sy] as unknown as ReturnType<typeof useMotionValue<number>>[],
    (latest: number[]) => {
      const [x, y] = latest;
      return `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 45%)`;
    },
  );

  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const gradient = `linear-gradient(135deg, ${gen.brandColors[0]} 0%, ${gen.brandColors[1] ?? gen.brandColors[0]} 100%)`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0, type: "spring", stiffness: 120, damping: 18 }}
      whileHover={{ y: -4, scale: 1.015 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMove}
      onClick={() => navigate(`/iq/genie6/library/${gen.id}`)}
      className={cn(
        "col-span-5 row-span-2 relative rounded-2xl overflow-hidden cursor-pointer",
        "ring-2 ring-primary ring-offset-2 ring-offset-background",
        "shadow-sm",
      )}
      style={{
        background: gradient,
        boxShadow: hovered
          ? "0 0 32px rgba(195,235,66,0.35), 0 8px 24px rgba(0,0,0,0.12)"
          : "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Brand initial — semi-transparent center mark */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
        <span className="font-mono font-bold text-white/15 text-[180px] leading-none">
          {gen.brandName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Cursor-follow radial shine */}
      <motion.div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: shineBackground,
        }}
      />

      {/* TOP badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-primary-foreground shadow-sm">
          <Star className="h-3 w-3 fill-primary-foreground" />
          Top
        </span>
      </div>

      {/* Brand chip — top-left */}
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center rounded-full bg-black/35 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
          {gen.brandName}
        </span>
      </div>

      {/* Bottom meta + actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 pt-16 bg-gradient-to-t from-black/55 via-black/20 to-transparent">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
              {gen.mode} · {ageLabel(gen.ageDays)}
            </p>
            <p className="mt-1 text-white font-semibold text-base leading-snug truncate">
              {gen.brandName} · {gen.mode}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-mono text-[11px] font-bold text-primary-foreground">
              <Star className="h-3 w-3 fill-primary-foreground" />
              {gen.qualityScore}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] font-bold text-primary-foreground">
              <Check className="h-3 w-3" strokeWidth={3} />
              Used
            </span>
          </div>
        </div>

        {/* Reveal-on-hover action row */}
        <motion.div
          initial={false}
          animate={{
            opacity: hovered ? 1 : 0,
            y: hovered ? 0 : 6,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mt-3 flex items-center gap-2"
        >
          <Button
            size="sm"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/iq/genie6/library/${gen.id}`);
            }}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 bg-white/90 hover:bg-white text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/iq/genie6/studio-alpha?forgeFrom=${gen.id}`);
            }}
          >
            <Layers className="mr-1 h-3.5 w-3.5" />
            Forge 10 more
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Standard mosaic card — smaller, magnetic hover
   ───────────────────────────────────────────────────────── */
function MosaicCard({
  gen,
  slotIdx,
  navigate,
}: {
  gen: Gen;
  slotIdx: number;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [hovered, setHovered] = useState(false);
  const gradient = `linear-gradient(135deg, ${gen.brandColors[0]} 0%, ${gen.brandColors[1] ?? gen.brandColors[0]} 100%)`;
  const sizeClass = SLOT_CLASSES[slotIdx] ?? "col-span-3 h-[232px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: slotIdx * 0.06,
        type: "spring",
        stiffness: 120,
        damping: 18,
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/iq/genie6/library/${gen.id}`)}
      className={cn(
        sizeClass,
        "relative rounded-2xl overflow-hidden cursor-pointer shadow-sm",
        "hover:shadow-lg transition-shadow",
      )}
      style={{ background: gradient }}
    >
      {/* Center brand initial */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
        <span className="font-mono font-bold text-white/15 text-[90px] leading-none">
          {gen.brandName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Brand chip — top-left */}
      <div className="absolute top-2.5 left-2.5">
        <span className="inline-flex items-center rounded-full bg-black/35 backdrop-blur-md px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white">
          {gen.brandName}
        </span>
      </div>

      {/* Bottom meta */}
      <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/45 via-black/10 to-transparent">
        <div className="flex items-end justify-between gap-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/75 truncate">
            {gen.mode} · {ageLabel(gen.ageDays)}
          </p>
          {gen.qualityScore >= 80 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground shrink-0">
              <Star className="h-2.5 w-2.5 fill-foreground" />
              {gen.qualityScore}
            </span>
          )}
        </div>
      </div>

      {/* Reveal-on-hover action overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/30 backdrop-blur-[2px]"
      >
        <Button
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/iq/genie6/library/${gen.id}`);
          }}
        >
          <Eye className="mr-1 h-3 w-3" />
          View
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-2.5 text-xs bg-white/95 hover:bg-white text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/iq/genie6/studio-alpha?forgeFrom=${gen.id}`);
          }}
        >
          <Layers className="mr-1 h-3 w-3" />
          Forge
        </Button>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Empty state — single centered card with lime sparkle
   ───────────────────────────────────────────────────────── */
function EmptyMosaic({ className, onCta }: { className?: string; onCta: () => void }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-12 gap-3 h-[488px]">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="col-span-12 rounded-2xl border border-dashed border-foreground/15 bg-muted/30 flex flex-col items-center justify-center text-center gap-4 p-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 140, damping: 14 }}
            className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center"
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
          <div className="space-y-1.5 max-w-[420px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Your canvas
            </p>
            <p className="text-lg font-semibold leading-snug">
              Your work will live here
            </p>
            <p className="text-sm text-muted-foreground">
              Generate to fill the canvas.
            </p>
          </div>
          <Button onClick={onCta} className="mt-1">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Start a generation
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
