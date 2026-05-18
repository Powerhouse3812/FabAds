import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Package,
  Play,
  ShoppingBag,
  Star,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface RecentWorkStripProps {
  className?: string;
}

type GenMode = "UGC Video" | "Brand Ad" | "Product Ad" | "Variation";

interface RecentGen {
  id: string;
  brandId: string;
  brandName: string;
  brandColors: string[];
  mode: GenMode;
  qualityScore: number;
  wasUsed: boolean;
  ageDays: number;
  headline: string; // ad-copy mock
  price?: string; // for Product Ad
}

/**
 * RecentWorkStrip — secondary view of recent generations.
 *
 * Each thumbnail is rendered as a tiny ad-creative mock (not a paint chip).
 * Maalik: "Generations, generated outputs jaise dikhne chahiye, like in
 * results and library."
 *
 * Mode-specific visual languages on top of the brand-gradient surface:
 *   - UGC Video   → avatar silhouette + caption strip + play glyph
 *   - Brand Ad    → bold headline + CTA pill
 *   - Product Ad  → product silhouette + price tag + buy CTA
 *   - Variation   → 2×2 sub-thumbnail grid + "N variants" label
 *
 * Click → opens the generation in the shared library (view-only).
 */
export function RecentWorkStrip({ className }: RecentWorkStripProps) {
  const navigate = useNavigate();

  const gens: RecentGen[] = (function build(): RecentGen[] {
    const pool = brands.slice(0, 4);
    const modes: GenMode[] = [
      "UGC Video",
      "Brand Ad",
      "Product Ad",
      "Variation",
    ];
    const scores = [92, 88, 84, 78];
    const ages = [2, 1, 3, 5];
    // Deterministic per-brand × per-mode ad copy
    const headlinesByMode: Record<GenMode, string[]> = {
      "UGC Video": [
        "3 weeks. Look at this growth.",
        "Day 21 — I can't believe this.",
        "Honest review after 30 days.",
        "Before & after, no filters.",
      ],
      "Brand Ad": [
        "Hair fall? We solved it.",
        "Skincare that doesn't lie.",
        "Real ingredients. Real results.",
        "Built for Indian skin.",
      ],
      "Product Ad": [
        "Bestselling cleanser",
        "Top-rated in 2025",
        "Now in 3 new shades",
        "Restocked — flying off shelves",
      ],
      Variation: [
        "4 angles tested · pick the winner",
        "4 hooks, 1 product",
        "4 captions, same hero",
        "4 variants ready to ship",
      ],
    };
    const prices = ["₹599", "₹449", "₹399", "₹329"];

    return pool.map((b, i) => {
      const mode = modes[i] ?? "UGC Video";
      return {
        id: `recent-${b.id}`,
        brandId: b.id,
        brandName: b.name,
        brandColors:
          b.colors.length >= 2 ? b.colors : [...b.colors, "#1A1A1A"],
        mode,
        qualityScore: scores[i] ?? 75,
        wasUsed: i === 0,
        ageDays: ages[i] ?? 7,
        headline: headlinesByMode[mode][i] ?? headlinesByMode[mode][0],
        price: mode === "Product Ad" ? (prices[i] ?? "₹599") : undefined,
      };
    });
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
            {/* Brand-color surface (gradient) */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${g.brandColors[0]} 0%, ${g.brandColors[1] ?? "#1A1A1A"} 100%)`,
              }}
            />

            {/* Mode-specific creative mock */}
            <ModeCanvas gen={g} />

            {/* Top chip strip (brand + USED) */}
            <div className="relative z-10 flex items-start justify-between p-2.5">
              <span className="inline-flex items-center rounded-full bg-black/35 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                {g.brandName}
              </span>
              {g.wasUsed && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary-foreground">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  USED
                </span>
              )}
            </div>

            {/* Bottom strip — headline + meta + quality pill */}
            <div className="relative z-10 mt-auto">
              <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2.5 pt-6 pb-2.5">
                <p
                  className="text-[11px] font-semibold leading-tight text-white line-clamp-2"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {g.headline}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <ModeFooter gen={g} />
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 font-mono text-[9.5px] text-white backdrop-blur-sm">
                    <Star
                      className="h-2.5 w-2.5 fill-primary text-primary"
                      strokeWidth={2}
                    />
                    {g.qualityScore}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[9px] text-white/55 tabular-nums">
                  {g.mode} ·{" "}
                  {g.ageDays === 1 ? "1d ago" : `${g.ageDays}d ago`}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- */
/* Mode-specific mid-card creative mock                            */
/* -------------------------------------------------------------- */

function ModeCanvas({ gen }: { gen: RecentGen }) {
  if (gen.mode === "UGC Video") {
    return (
      <>
        {/* Avatar silhouette, large + faint */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <UserRound
            className="h-24 w-24 text-white/25"
            strokeWidth={1.25}
          />
        </div>
        {/* Play glyph hint (just under center) */}
        <div
          aria-hidden
          className="absolute left-1/2 top-[58%] -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 shadow-sm"
        >
          <Play
            className="h-3 w-3 fill-foreground text-foreground"
            strokeWidth={0}
          />
        </div>
      </>
    );
  }

  if (gen.mode === "Product Ad") {
    return (
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
      >
        <ShoppingBag
          className="h-24 w-24 text-white/25"
          strokeWidth={1.25}
        />
      </div>
    );
  }

  if (gen.mode === "Variation") {
    // 2×2 mini-thumbnail grid using shades of the brand colors
    const c0 = gen.brandColors[0];
    const c1 = gen.brandColors[1] ?? "#1A1A1A";
    return (
      <div
        aria-hidden
        className="absolute inset-x-4 top-1/2 -translate-y-[58%] grid grid-cols-2 gap-1.5"
      >
        {[c0, c1, c1, c0].map((c, idx) => (
          <div
            key={idx}
            className="aspect-square rounded-md ring-1 ring-white/20"
            style={{
              background: `linear-gradient(${135 + idx * 45}deg, ${c} 0%, rgba(0,0,0,0.35) 100%)`,
            }}
          />
        ))}
      </div>
    );
  }

  // Brand Ad — leave canvas open; headline strip handles the message
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
    >
      <Package className="h-20 w-20 text-white/15" strokeWidth={1.25} />
    </div>
  );
}

/* -------------------------------------------------------------- */
/* Mode-specific footer chip (CTA pill / price / variant count)    */
/* -------------------------------------------------------------- */

function ModeFooter({ gen }: { gen: RecentGen }) {
  if (gen.mode === "Brand Ad") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[9.5px] font-semibold text-primary-foreground">
        Shop now
        <ArrowRight className="h-2.5 w-2.5" strokeWidth={2.5} />
      </span>
    );
  }

  if (gen.mode === "Product Ad") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="font-mono text-[10px] font-semibold text-white tabular-nums">
          {gen.price}
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
          Buy
          <ArrowRight className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
      </span>
    );
  }

  if (gen.mode === "Variation") {
    return (
      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-white/80">
        4 variants
      </span>
    );
  }

  // UGC Video
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[9.5px] text-white/85">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
      0:18
    </span>
  );
}
