import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * NewAdsFetchedTile — HERO card on the AI-plan dashboard.
 *
 * Per Maalik: the MOST IMPORTANT tile. Surfaces fresh ads pulled in by the
 * Industry Insights Chrome extension / scraper feed. Lime tint + pulse dot
 * signal "attention magnet" without screaming — reference Linear's "new
 * issue" highlight and Stripe's "recent activity" card.
 *
 * Mini ad cards read as creative content (brand wordmark + caption + CTA),
 * not as data rows.
 *
 * Data is mocked inline; real wiring lands when the extension fetch pipe
 * is live.
 */

const NEW_ADS_COUNT = 24;

type Platform = "Facebook" | "Instagram" | "Google" | "TikTok";

interface FetchedAd {
  id: string;
  brand: string;
  platform: Platform;
  fetchedAgo: string;
}

const FETCHED_ADS: FetchedAd[] = [
  { id: "ad-1", brand: "Mamaearth", platform: "Facebook", fetchedAgo: "3 min ago" },
  { id: "ad-2", brand: "Boat", platform: "Instagram", fetchedAgo: "8 min ago" },
  { id: "ad-3", brand: "Noise", platform: "Facebook", fetchedAgo: "15 min ago" },
  { id: "ad-4", brand: "Sleepyhead", platform: "Google", fetchedAgo: "22 min ago" },
  { id: "ad-5", brand: "Mensa", platform: "TikTok", fetchedAgo: "28 min ago" },
];

const LAST_FETCH = "3 min ago";
const OVERFLOW_COUNT = NEW_ADS_COUNT - FETCHED_ADS.length;

// Soft tint gradients per card so the strip looks varied without real images.
const TINTS: Array<{ from: string; to: string; ink: string }> = [
  { from: "#FFE4D6", to: "#F5C9B8", ink: "#5A3320" }, // warm peach (Mamaearth)
  { from: "#1F2937", to: "#374151", ink: "#F9FAFB" }, // graphite (Boat)
  { from: "#FFE9F0", to: "#F7C8DC", ink: "#5A1F36" }, // blush (Noise)
  { from: "#E5F0FF", to: "#C9DDF7", ink: "#1F3A66" }, // sky (Sleepyhead)
  { from: "#EAF7D8", to: "#D2EAB1", ink: "#33491A" }, // pistachio (Mensa)
];

const CTA_BY_PLATFORM: Record<Platform, string> = {
  Facebook: "Shop now",
  Instagram: "Tap to view",
  Google: "Learn more",
  TikTok: "Get yours",
};

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
      aria-label="New ads fetched from Industry Insights"
    >
      {/* Header strip */}
      <header className="px-5 py-3.5 border-b border-primary/20 flex items-baseline justify-between">
        <div className="flex items-center gap-2.5">
          {/* Lime accent bar */}
          <span
            aria-hidden
            className="block w-[3px] h-4 rounded-full bg-primary"
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/85">
            New ads fetched
          </p>
          {/* Live pulse dot */}
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
          <Sparkles
            aria-hidden
            className="h-3 w-3 text-primary/70"
            strokeWidth={2}
          />
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[24px] font-semibold text-foreground tabular-nums leading-none">
            {NEW_ADS_COUNT}
          </span>
          <span className="text-[11px] text-muted-foreground">this hour</span>
        </div>
      </header>

      {/* Body — horizontal scroll strip of mini ad cards */}
      <div className="px-5 py-4 space-y-3">
        <div
          className="flex overflow-x-auto gap-2 -mx-1 px-1 pb-1 [scrollbar-width:thin]"
          role="list"
        >
          {FETCHED_ADS.map((ad, i) => (
            <MiniAdCard key={ad.id} ad={ad} index={i} />
          ))}
          <OverflowTile count={OVERFLOW_COUNT} />
        </div>
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
/* Mini ad card — reads as creative content, not a data row        */
/* -------------------------------------------------------------- */

function MiniAdCard({ ad, index }: { ad: FetchedAd; index: number }) {
  const tint = TINTS[index % TINTS.length];
  const cta = CTA_BY_PLATFORM[ad.platform];

  return (
    <motion.div
      role="listitem"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1],
        delay: index * 0.05,
      }}
    >
      <Link
        to={`/insights-v2/feed?ad=${ad.id}`}
        className={cn(
          "block w-[140px] shrink-0 overflow-hidden rounded-md",
          "border border-border/60 bg-card",
          "hover:-translate-y-[1px] hover:border-foreground/20 transition-transform",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        )}
      >
        {/* 4:5 thumbnail — gradient surface w/ brand wordmark + CTA pill */}
        <div
          className="relative aspect-[4/5] overflow-hidden bg-muted"
          style={{
            background: `linear-gradient(135deg, ${tint.from} 0%, ${tint.to} 100%)`,
          }}
        >
          {/* Brand wordmark, centered as the creative hero */}
          <div className="absolute inset-0 flex items-center justify-center px-3">
            <span
              className="text-center font-semibold tracking-tight leading-tight"
              style={{
                color: tint.ink,
                fontSize: ad.brand.length > 8 ? 13 : 15,
                letterSpacing: "-0.01em",
              }}
            >
              {ad.brand}
            </span>
          </div>

          {/* Platform chip — top-left */}
          <span
            className="absolute left-1.5 top-1.5 inline-flex items-center rounded-full bg-black/45 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-white backdrop-blur-sm"
          >
            {ad.platform}
          </span>

          {/* CTA pill — bottom, fake ad CTA so it reads as creative */}
          <span
            className="absolute bottom-1.5 left-1.5 right-1.5 inline-flex items-center justify-center rounded-sm bg-white/90 px-1.5 py-1 text-[9.5px] font-semibold text-foreground"
            style={{ backdropFilter: "blur(2px)" }}
          >
            {cta}
          </span>
        </div>

        {/* Caption — brand name + platform · fetchedAgo */}
        <div className="px-2 py-1.5">
          <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
            {ad.brand}
          </p>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground tabular-nums">
            {ad.platform}
            <span className="mx-1 text-muted-foreground/50">·</span>
            {ad.fetchedAgo}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

/* -------------------------------------------------------------- */
/* Overflow tile — "+N more" with dashed border                    */
/* -------------------------------------------------------------- */

function OverflowTile({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Link
      role="listitem"
      to="/insights-v2/feed?filter=new"
      className={cn(
        "flex w-[140px] shrink-0 flex-col items-center justify-center gap-1.5",
        "rounded-md border border-dashed border-border bg-card/40",
        "hover:border-primary/50 hover:bg-primary/[0.04] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "aspect-[4/5.5]",
      )}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <span className="font-mono text-[12px] font-semibold text-foreground tabular-nums">
        +{count}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        more
      </span>
    </Link>
  );
}
