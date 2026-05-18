/**
 * TopPerformerHero — emotional hero of V2 AI-plan Dashboard.
 *
 * Strategic context: V1 led with analytics. V2 leads with the single best
 * piece of work this week, rendered large. Like Spotify Wrapped's "your top
 * song" or Suno's "top track" moment — the data IS the work, the work IS
 * the moment.
 *
 * Source of truth: LIBRARY_MEDIA from @/mocks/shared/library-items.
 * Pick: highest quality_score where source === "generated"; tie → most
 * recent (created_at). Fallback: empty-state CTA if none exist.
 *
 * Brand colors resolved from @/mocks/shared/brands (colors[0], colors[1]).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Sparkles,
  Zap,
  Eye,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LIBRARY_MEDIA,
  type LibraryAsset,
} from "@/mocks/shared/library-items";
import { brands } from "@/mocks/shared/brands";

interface TopPerformerHeroProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic headline mocks per brand. Falls back to generic if no match.
// ─────────────────────────────────────────────────────────────────────────────
const HEADLINE_BY_BRAND: Record<string, string> = {
  mamaearth: "I tried it for 4 weeks. Look at this growth.",
  boat: "Built for Bharat. Sound that lasts.",
  sleepyhead: "Sleep so good, you'll oversleep.",
  "wow-skin": "Skincare that doesn't lie.",
  plum: "Bestselling cleanser. Now in 3 shades.",
  mcaffeine: "Caffeine. Skin care. Wake up.",
  "the-derma-co": "Dermatologist-approved actives.",
  minimalist: "Honest skincare. Ingredients, transparent.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Pick the top performer (memoized via useMemo at consumer).
// ─────────────────────────────────────────────────────────────────────────────
function pickTopPerformer(): LibraryAsset | null {
  const generated = LIBRARY_MEDIA.filter(
    (m) => m.source === "generated" && typeof m.quality_score === "number",
  );
  if (generated.length === 0) return null;
  // Sort: highest quality_score, then most-recent created_at as tiebreak.
  const sorted = [...generated].sort((a, b) => {
    const qa = a.quality_score ?? 0;
    const qb = b.quality_score ?? 0;
    if (qb !== qa) return qb - qa;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
  return sorted[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Time-ago — short form ("2 days ago", "5 hours ago")
// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const wks = Math.floor(days / 7);
  return `${wks} week${wks === 1 ? "" : "s"} ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode label — derived from file_type ("UGC Video" / "Image Ad")
// ─────────────────────────────────────────────────────────────────────────────
function modeLabel(asset: LibraryAsset): string {
  return asset.file_type === "video" ? "UGC Video" : "Image Ad";
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export function TopPerformerHero({ className }: TopPerformerHeroProps) {
  const navigate = useNavigate();
  const top = useMemo(() => pickTopPerformer(), []);

  // Empty state — render call-out
  if (!top) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8",
          className,
        )}
        style={{ minHeight: 340 }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            TOP PERFORMER · THIS WEEK
          </div>
          <div className="mt-1 text-[15px] font-semibold text-foreground">
            No top performer yet
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            Start a generation to see your best work here.
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/studio-alpha")}
          className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          <Zap className="h-3.5 w-3.5" />
          Start a generation
        </button>
      </motion.section>
    );
  }

  return <HeroBody asset={top} className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// HeroBody — split out so hooks aren't conditional
// ─────────────────────────────────────────────────────────────────────────────
function HeroBody({
  asset,
  className,
}: {
  asset: LibraryAsset;
  className?: string;
}) {
  const navigate = useNavigate();

  // Brand resolution — colors + name
  const brand = useMemo(
    () => brands.find((b) => b.id === asset.brand_id),
    [asset.brand_id],
  );
  const brandName = brand?.name ?? "Library";
  const c0 = brand?.colors[0] ?? "#1F2937";
  const c1 = brand?.colors[1] ?? "#4B5563";
  const initial = (brandName[0] ?? "L").toUpperCase();

  const headline =
    (asset.brand_id && HEADLINE_BY_BRAND[asset.brand_id]) ||
    "Ad creative ready.";
  const score = asset.quality_score ?? 0;
  const wasUsed = (asset.used_in_adgroup_ids?.length ?? 0) > 0;

  // ── Cursor-follow shine: motion values, not React state ───────────────────
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const mxRaw = useMotionValue(50); // % within thumbnail
  const myRaw = useMotionValue(50);
  const mx = useSpring(mxRaw, { stiffness: 220, damping: 22, mass: 0.4 });
  const my = useSpring(myRaw, { stiffness: 220, damping: 22, mass: 0.4 });
  const shineBg = useMotionTemplate`radial-gradient(circle at ${mx}% ${my}%, rgba(195,235,66,0.22), transparent 55%)`;

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = thumbRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    mxRaw.set(Math.max(0, Math.min(100, px)));
    myRaw.set(Math.max(0, Math.min(100, py)));
  };
  const onPointerLeave = () => {
    mxRaw.set(50);
    myRaw.set(50);
  };

  // ── Sheen sweep on Forge button: once per session ─────────────────────────
  const SHEEN_KEY = "dashboard.ai.v2.top-performer.sheen.played";
  const [playSheen, setPlaySheen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SHEEN_KEY)) return;
      const t = window.setTimeout(() => {
        setPlaySheen(true);
        sessionStorage.setItem(SHEEN_KEY, "1");
      }, 700);
      return () => window.clearTimeout(t);
    } catch {
      // sessionStorage may be unavailable (SSR, privacy mode) — no-op
    }
  }, []);

  const onForge = () =>
    navigate(`/iq/genie6/studio-alpha?forgeFrom=${asset.id}`);
  const onView = () => navigate(`/iq/genie6/library/${asset.id}`);
  const onSave = () => toast.success("Saved to favourites");

  return (
    <motion.section
      initial="hidden"
      animate="show"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4",
        className,
      )}
    >
      {/* Header row — eyebrow + score pill */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: -6 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 120, damping: 18 },
          },
        }}
        className="flex items-center justify-between"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          TOP PERFORMER · THIS WEEK
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-mono text-[11px] font-bold text-primary-foreground"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <Star className="h-3 w-3 fill-current" />
          {score}
        </span>
      </motion.div>

      {/* Thumbnail zone */}
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.96 },
          show: {
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 120,
              damping: 18,
              delay: 0.08,
            },
          },
        }}
        ref={thumbRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        whileHover={{ scale: 1.01 }}
        className="group relative overflow-hidden rounded-xl ring-1 ring-border transition-shadow hover:ring-2 hover:ring-primary/30"
        style={{
          height: 200,
          background: `linear-gradient(135deg, ${c0} 0%, ${c1} 100%)`,
        }}
      >
        {/* Brand initial mark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="select-none font-bold leading-none text-white/30"
            style={{
              fontSize: 120,
              letterSpacing: "-0.04em",
            }}
          >
            {initial}
          </span>
        </div>

        {/* USED chip (if any adgroups reference this asset) */}
        {wasUsed ? (
          <span className="absolute right-2 top-2 inline-flex items-center rounded-md bg-primary px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
            USED
          </span>
        ) : null}

        {/* Cursor-follow shine overlay */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: shineBg }}
        />
      </motion.div>

      {/* Meta row + headline */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 6 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 120,
              damping: 18,
              delay: 0.16,
            },
          },
        }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="font-semibold text-foreground">{brandName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {modeLabel(asset)}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {timeAgo(asset.created_at)}
          </span>
        </div>
        <p className="truncate text-[14px] italic text-foreground/90">
          &ldquo;{headline}&rdquo;
        </p>
      </motion.div>

      {/* Action row */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 6 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              stiffness: 120,
              damping: 18,
              delay: 0.24,
            },
          },
        }}
        className="flex flex-wrap items-center gap-2"
      >
        {/* Forge — primary lime */}
        <motion.button
          type="button"
          onClick={onForge}
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground"
        >
          <Zap className="h-3.5 w-3.5" />
          Forge 10 variants
          {playSheen ? (
            <motion.span
              aria-hidden
              initial={{ x: "-120%" }}
              animate={{ x: "220%" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-y-0 w-1/3"
              style={{
                background:
                  "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
              }}
            />
          ) : null}
        </motion.button>

        {/* View — outline */}
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:border-foreground/30"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>

        {/* Save — ghost */}
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Bookmark className="h-3.5 w-3.5" />
          Save
        </button>
      </motion.div>
    </motion.section>
  );
}

export default TopPerformerHero;
