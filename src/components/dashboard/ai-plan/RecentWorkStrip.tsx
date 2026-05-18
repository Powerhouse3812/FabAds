import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface RecentWorkStripProps {
  className?: string;
}

interface RecentGen {
  id: string;
  brandId: string;
  brandName: string;
  brandColors: string[];
  mode: string;
  qualityScore: number;
  wasUsed: boolean;
  ageDays: number;
}

/**
 * RecentWorkStrip — secondary view of recent generations.
 *
 * Replaces the previous MosaicHero. Maalik's call:
 *   "Brands ko aise dikha kr, kuchh action nahi nikal rha user ka …
 *    isko hum chhote section me rakh skte hai." (Seeing brand thumbnails
 *    surfaces no action; keep it in a smaller section.)
 *
 * So: 4 uniform cards in a clean grid (no janky masonry). Each card
 * shows a thumbnail + brand + mode + quality + age. Clean, predictable,
 * fits in ~210px of vertical space. Click → opens that generation in
 * the shared library (NOT a studio — viewing only).
 *
 * Previous MosaicHero used col-span-5 row-span-2 + mixed col-spans which
 * mis-aligned on the actual viewport (cards overflowed into rows below).
 * This iter uses a flat 4-col grid with equal aspect, sidestepping the
 * masonry problem entirely.
 */
export function RecentWorkStrip({ className }: RecentWorkStripProps) {
  const navigate = useNavigate();

  const gens: RecentGen[] = (function build(): RecentGen[] {
    const pool = brands.slice(0, 4);
    const modes = ["UGC Video", "Brand Ad", "Product Ad", "Variation"];
    const scores = [92, 88, 84, 78];
    const ages = [2, 1, 3, 5];
    return pool.map((b, i) => ({
      id: `recent-${b.id}`,
      brandId: b.id,
      brandName: b.name,
      brandColors:
        b.colors.length >= 2 ? b.colors : [...b.colors, "#1A1A1A"],
      mode: modes[i] ?? "UGC Video",
      qualityScore: scores[i] ?? 75,
      wasUsed: i === 0,
      ageDays: ages[i] ?? 7,
    }));
  })();

  if (gens.length === 0) {
    return (
      <section
        className={cn(
          "rounded-2xl border border-border bg-card p-6 text-center",
          className,
        )}
      >
        <p className="text-[12.5px] text-muted-foreground">
          No generations yet — Studio Alpha will populate this strip.
        </p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5",
        className,
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Recent work
          </p>
          <p className="text-[13px] font-semibold text-foreground mt-0.5">
            Your last {gens.length} generations
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/library")}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </button>
      </header>

      {/* 4-card grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {gens.map((g, i) => (
          <motion.button
            key={g.id}
            type="button"
            onClick={() => navigate(`/iq/genie6/library/${g.id}`)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.32, 0.72, 0, 1],
              delay: i * 0.06,
            }}
            whileHover={{ y: -2 }}
            className={cn(
              "group relative overflow-hidden rounded-xl border bg-card text-left",
              "aspect-[4/5] flex flex-col",
              g.wasUsed
                ? "border-primary/40"
                : "border-border hover:border-foreground/20",
            )}
          >
            {/* Gradient thumbnail */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${g.brandColors[0]} 0%, ${g.brandColors[1] ?? "#1A1A1A"} 100%)`,
              }}
            />
            {/* Soft darken overlay for legibility */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"
            />
            {/* Big translucent initial */}
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-[88px] font-bold text-white/10 leading-none">
                {g.brandName.charAt(0)}
              </span>
            </div>

            {/* Top chip strip */}
            <div className="relative z-10 flex items-center justify-between p-2.5">
              <span className="inline-flex items-center rounded-full bg-black/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                {g.brandName}
              </span>
              {g.wasUsed && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary-foreground">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  USED
                </span>
              )}
            </div>

            {/* Bottom meta */}
            <div className="relative z-10 mt-auto p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/80">
                  {g.mode}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-black/40 px-1.5 py-0.5 font-mono text-[9.5px] text-white backdrop-blur-sm">
                  <Star
                    className="h-2.5 w-2.5 fill-primary text-primary"
                    strokeWidth={2}
                  />
                  {g.qualityScore}
                </span>
              </div>
              <p className="mt-1 font-mono text-[9px] text-white/60 tabular-nums">
                {g.ageDays === 1 ? "1 day ago" : `${g.ageDays} days ago`}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
