/**
 * TopPerformerStrip — dense horizontal row replacing V2's TopPerformerHero.
 *
 * Maalik's critique on V2: cards were too big and space-wasting. This strip
 * conveys the same info — top generated asset, brand, headline, score, CTA —
 * in ~88px of vertical space. References: Vercel deployment row, Linear
 * issue row, Sublime command palette result. Operator-class density.
 *
 * Source of truth: LIBRARY_MEDIA from @/mocks/shared/library-items.
 * Pick: highest quality_score where source === "generated"; tie → most
 * recent created_at. Fallback: empty-state strip with Generate CTA.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LIBRARY_MEDIA,
  type LibraryAsset,
} from "@/mocks/shared/library-items";
import { brands } from "@/mocks/shared/brands";

interface TopPerformerStripProps {
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
// Pick the top performer (memoized at consumer).
// ─────────────────────────────────────────────────────────────────────────────
function pickTopPerformer(): LibraryAsset | null {
  const generated = LIBRARY_MEDIA.filter(
    (m) => m.source === "generated" && typeof m.quality_score === "number",
  );
  if (generated.length === 0) return null;
  const sorted = [...generated].sort((a, b) => {
    const qd = (b.quality_score ?? 0) - (a.quality_score ?? 0);
    if (qd !== 0) return qd;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
  return sorted[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Short age label — "2D", "5H", "30M", "3W"
// ─────────────────────────────────────────────────────────────────────────────
function shortAge(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}M`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}D`;
  const wks = Math.floor(days / 7);
  return `${wks}W`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode label — derived from file_type
// ─────────────────────────────────────────────────────────────────────────────
function modeLabel(asset: LibraryAsset): string {
  return asset.file_type === "video" ? "UGC VIDEO" : "IMAGE AD";
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export function TopPerformerStrip({ className }: TopPerformerStripProps) {
  const navigate = useNavigate();
  const top = useMemo(() => pickTopPerformer(), []);

  // Empty state — same strip skeleton, placeholder content
  if (!top) {
    const onGenerate = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate("/iq/genie6/studio-alpha");
    };
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        onClick={() => navigate("/iq/genie6/studio-alpha")}
        whileHover={{ scale: 1.005 }}
        className={cn(
          "group flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-shadow hover:ring-1 hover:ring-primary/30",
          className,
        )}
      >
        {/* Placeholder thumbnail */}
        <div className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Text column */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
            TOP · NO GENERATION YET
          </span>
          <span className="line-clamp-1 text-[12.5px] font-semibold text-foreground">
            Start in Studio Alpha to claim this spot
          </span>
          <span
            className="font-mono text-[10px] text-muted-foreground"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            awaiting first run
          </span>
        </div>

        {/* Action */}
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Generate
          <ArrowRight className="h-3 w-3" />
        </button>
      </motion.div>
    );
  }

  return <StripBody asset={top} className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// StripBody — split out so hooks aren't conditional
// ─────────────────────────────────────────────────────────────────────────────
function StripBody({
  asset,
  className,
}: {
  asset: LibraryAsset;
  className?: string;
}) {
  const navigate = useNavigate();

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

  const onRowClick = () => navigate(`/iq/genie6/library/${asset.id}`);
  const onForge = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/iq/genie6/studio-alpha?forgeFrom=${asset.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      onClick={onRowClick}
      whileHover={{ scale: 1.005 }}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-shadow hover:ring-1 hover:ring-primary/30",
        className,
      )}
    >
      {/* Thumbnail — brand gradient, portrait 3:4 */}
      <div
        className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-border"
        style={{
          background: `linear-gradient(135deg, ${c0} 0%, ${c1} 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="select-none font-bold leading-none text-white/40"
            style={{ fontSize: 28, letterSpacing: "-0.04em" }}
          >
            {initial}
          </span>
        </div>
        {wasUsed ? (
          <span className="absolute bottom-0.5 right-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-card/85">
            <Star className="h-3 w-3 fill-primary text-primary" />
          </span>
        ) : null}
      </div>

      {/* Text column */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
          TOP · {brandName.toUpperCase()} · {modeLabel(asset)} ·{" "}
          {shortAge(asset.created_at)}
        </span>
        <span className="line-clamp-1 text-[12.5px] font-semibold text-foreground">
          &ldquo;{headline}&rdquo;
        </span>
        <span
          className="font-mono text-[10px] text-muted-foreground"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <span className="text-primary">
            <Star className="mr-0.5 inline h-2.5 w-2.5 -translate-y-px fill-current" />
            {score}
          </span>
          {wasUsed ? <span> · used</span> : null}
        </span>
      </div>

      {/* Action — lime pill */}
      <button
        type="button"
        onClick={onForge}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        Forge
        <ArrowRight className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

export default TopPerformerStrip;
