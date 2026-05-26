import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * NewAdsFetchedTile — HERO card on the AI-plan dashboard.
 *
 * Per Maalik: the MOST IMPORTANT tile. Surfaces fresh ads pulled in by the
 * Industry Insights Chrome extension / scraper feed. Lime tint + pulse dot
 * signal "attention magnet" without screaming.
 *
 * v2 (May 2026) — reframed from "random 5 mini ad cards" to a **brand-grouped
 * list**: the top performing brands Maalik is following, with their newest
 * fetched ads shown as a tiny thumbnail cluster on the right of each row.
 * Hero count shrunk to a small caption — the brand list is the content.
 *
 * Data is mocked inline; real wiring lands when the extension fetch pipe is live.
 */

const NEW_TODAY_COUNT = 24;
const LAST_FETCH = "3 min ago";

interface TopBrand {
  id: string;
  name: string;
  newAdCount: number;
  platforms: string[];
  tint: { from: string; to: string; ink: string };
}

const TOP_BRANDS: TopBrand[] = [
  {
    id: "mamaearth",
    name: "Mamaearth",
    newAdCount: 8,
    platforms: ["Facebook", "Instagram"],
    tint: { from: "#FFE4D6", to: "#F5C9B8", ink: "#5A3320" },
  },
  {
    id: "boat",
    name: "Boat",
    newAdCount: 6,
    platforms: ["Instagram", "TikTok"],
    tint: { from: "#1F2937", to: "#374151", ink: "#F9FAFB" },
  },
  {
    id: "noise",
    name: "Noise",
    newAdCount: 5,
    platforms: ["Facebook"],
    tint: { from: "#FFE9F0", to: "#F7C8DC", ink: "#5A1F36" },
  },
  {
    id: "sleepyhead",
    name: "Sleepyhead",
    newAdCount: 3,
    platforms: ["Google"],
    tint: { from: "#E5F0FF", to: "#C9DDF7", ink: "#1F3A66" },
  },
];

// Soft secondary tints used to vary the stacked mini-thumbs without real images.
const THUMB_TINTS: Array<{ from: string; to: string }> = [
  { from: "#EAF7D8", to: "#D2EAB1" }, // pistachio
  { from: "#FFE9F0", to: "#F7C8DC" }, // blush
  { from: "#E5F0FF", to: "#C9DDF7" }, // sky
  { from: "#FFE4D6", to: "#F5C9B8" }, // peach
];

interface NewAdsFetchedTileProps {
  className?: string;
}

export function NewAdsFetchedTile({ className }: NewAdsFetchedTileProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/40",
        "bg-gradient-to-br from-primary/[0.07] to-transparent",
        "shadow-[0_1px_0_0_rgba(143,184,33,0.08)_inset]",
        className,
      )}
      aria-label="New ads fetched from Industry Insights — top brands you follow"
    >
      {/* Header strip */}
      <header className="px-5 py-3.5 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Lime accent bar */}
          <span
            aria-hidden
            className="block w-[3px] h-4 rounded-full bg-primary"
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
            New ads fetched
          </p>
          {/* Live pulse dot — ping halo + solid pulse */}
          <span className="relative inline-flex h-2 w-2 items-center justify-center">
            <span
              aria-hidden
              className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping"
            />
            <span
              aria-hidden
              className="relative inline-flex h-2 w-2 rounded-full bg-primary animate-pulse"
            />
          </span>
        </div>

        {/* Tiny count caption — no longer the hero */}
        <span className="font-mono tabular-nums text-[12px] text-muted-foreground">
          {NEW_TODAY_COUNT} today
        </span>
      </header>

      {/* Body — brand list */}
      <div className="px-5 py-3 space-y-1" role="list">
        {TOP_BRANDS.map((brand, i) => (
          <BrandRow key={brand.id} brand={brand} index={i} />
        ))}
      </div>

      {/* Footer */}
      <footer className="px-5 py-3 border-t border-primary/20 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <RefreshCw aria-hidden className="h-3 w-3" strokeWidth={2} />
          <span>
            From extension feed
            <span className="mx-1 text-muted-foreground/60">·</span>
            last fetch{" "}
            <span className="font-mono tabular-nums">{LAST_FETCH}</span>
          </span>
        </p>
        <Button
          asChild
          size="sm"
          className="h-8 px-3 text-[12px] font-semibold"
        >
          <Link to="/insights-v2/feed?filter=new">
            Review all
            <ChevronRight className="ml-0.5 h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </Button>
      </footer>
    </section>
  );
}

/* -------------------------------------------------------------- */
/* Brand row — avatar + name/meta + stacked latest-ad thumbs       */
/* -------------------------------------------------------------- */

function BrandRow({ brand, index }: { brand: TopBrand; index: number }) {
  const initial = brand.name.charAt(0).toUpperCase();
  const platformLine = brand.platforms.map((p) => p.toUpperCase()).join(" · ");

  // Show up to 3 stacked mini-thumbs; if brand has more new ads than thumbs
  // displayed, show a +N chip on the right.
  const thumbsShown = Math.min(brand.newAdCount, 3);
  const overflow = brand.newAdCount - thumbsShown;

  return (
    <motion.div
      role="listitem"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease: [0.32, 0.72, 0, 1],
        delay: index * 0.04,
      }}
    >
      <Link
        to={`/insights-v2/feed?brand=${brand.id}`}
        className={cn(
          "flex items-center gap-3 py-2.5 rounded-md",
          "hover:bg-muted/30 transition-colors px-2 -mx-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        )}
      >
        {/* Brand avatar — gradient tile with brand initial */}
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-semibold tracking-tight text-[13px]"
          style={{
            background: `linear-gradient(135deg, ${brand.tint.from} 0%, ${brand.tint.to} 100%)`,
            color: brand.tint.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {initial}
        </span>

        {/* Brand name + meta */}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
            {brand.name}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground/55 truncate">
            <span className="tabular-nums">{brand.newAdCount}</span> new
            <span className="mx-1 text-foreground/30">·</span>
            {platformLine}
          </p>
        </div>

        {/* Stacked latest-ad mini-thumbs */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex -space-x-2">
            {Array.from({ length: thumbsShown }).map((_, j) => {
              const tint = THUMB_TINTS[(index + j) % THUMB_TINTS.length];
              return (
                <span
                  key={j}
                  aria-hidden
                  className="h-6 w-6 rounded-sm ring-1 ring-card"
                  style={{
                    background: `linear-gradient(135deg, ${tint.from} 0%, ${tint.to} 100%)`,
                  }}
                />
              );
            })}
          </div>
          {overflow > 0 && (
            <span className="font-mono tabular-nums text-[10px] font-semibold text-muted-foreground">
              +{overflow}
            </span>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 text-foreground/35"
          strokeWidth={2}
        />
      </Link>
    </motion.div>
  );
}
