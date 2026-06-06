import { useMemo, useState } from "react";
import { Check, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";
import {
  brands as ALL_BRANDS,
  getWinnerAdsForEntity,
  type WinnerAd,
} from "@/mocks/shared";

/**
 * BrandWinnerAdsDrawer — Step 4 right-rail body for top-performing brand
 * creatives (Track C). Same chassis as LibraryColumnDrawer.
 *
 * A-12.8x (Maalik): ENTITY-SCOPED. Pulls from the shared Winner-Ads pool
 * via getWinnerAdsForEntity("brand", brandId) instead of an inline mock.
 * No brand selected → falls back to ALL brand winners with a soft banner so
 * the picker never blanks.
 *
 * Card baseline: glass (bg-card/60), 4:5 aspect, brand chip top-left,
 * format chip top-right, CTR shown as primary stat.
 */

interface BrandWinnerAdsDrawerProps {
  /** Resolved from wizard.state.brandId. null → show all brand winners. */
  brandId: string | null;
  onSave: (refs: AttachedRef[]) => void;
  onCancel: () => void;
}

const FORMAT_LABEL: Record<WinnerAd["format"], string> = {
  image: "Static",
  video: "Video",
  carousel: "Carousel",
};

/** 0.038 → "3.8% CTR". */
function ctrLabel(ctr?: number): string | null {
  if (ctr == null) return null;
  return `${(ctr * 100).toFixed(1)}% CTR`;
}

/** 124000 → "124K imp", 1_240_000 → "1.2M imp". */
function impLabel(imp?: number): string | null {
  if (imp == null) return null;
  if (imp >= 1_000_000) return `${(imp / 1_000_000).toFixed(1)}M imp`;
  if (imp >= 1_000) return `${Math.round(imp / 1_000)}K imp`;
  return `${imp} imp`;
}

export function BrandWinnerAdsDrawer({
  brandId,
  onSave,
  onCancel,
}: BrandWinnerAdsDrawerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Readable brand name for the eyebrow + per-card chip.
  const brandName = useMemo(
    () => ALL_BRANDS.find((b) => b.id === brandId)?.name ?? null,
    [brandId],
  );

  // Entity-scoped pull. No brand → fall back to ALL brand-level winners so the
  // picker still has substance (flagged with `isFallback` for the banner).
  const { winners, isFallback } = useMemo(() => {
    if (brandId) {
      const scoped = getWinnerAdsForEntity("brand", brandId);
      return { winners: scoped, isFallback: false };
    }
    return { winners: getAllBrandWinners(), isFallback: true };
  }, [brandId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = () => {
    const refs: AttachedRef[] = winners
      .filter((i) => selected.has(i.id))
      .map((i) => ({
        id: i.id,
        source: "brand-winner-ads",
        label: i.headline,
        thumbnail: i.thumbnail,
      }));
    onSave(refs);
  };

  const n = selected.size;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {brandName ? `${brandName} winners` : "Brand winners"} · last 30 days
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Top creatives
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              {winners.length}
            </span>
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close brand winners"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Fallback banner — no brand picked, showing all brand winners. */}
      {isFallback && winners.length > 0 && (
        <div className="shrink-0 border-b border-border/40 bg-muted/30 px-3 py-1.5">
          <p className="text-[11px] text-muted-foreground">
            Showing winners across all brands — pick a brand to scope these to
            it.
          </p>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {winners.length === 0 ? (
          <EmptyWinners brandName={brandName} />
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {winners.map((item) => {
              const isSelected = selected.has(item.id);
              const ctr = ctrLabel(item.ctr);
              const imp = impLabel(item.impressions);
              const stats = [ctr, imp].filter(Boolean).join(" · ");
              const chipBrand =
                ALL_BRANDS.find((b) => b.id === item.entityId)?.name ??
                brandName ??
                undefined;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card/60 text-left backdrop-blur-sm transition-all",
                      isSelected
                        ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                        : "border-border/40 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                    )}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                      <img
                        src={item.thumbnail}
                        alt={item.headline}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                      />
                      {chipBrand && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                          {chipBrand}
                        </span>
                      )}
                      <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-foreground backdrop-blur">
                        {FORMAT_LABEL[item.format]}
                      </span>
                      {isSelected && (
                        <span className="absolute right-1.5 bottom-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 px-2.5 py-2">
                      <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                        {item.headline}
                      </p>
                      {stats && (
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {stats}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={n === 0}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity",
            "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Save{n > 0 && <span className="font-mono opacity-90">· {n}</span>}
        </button>
      </footer>
    </div>
  );
}

/** All brand-level winners across every entity (fallback when no brand set). */
function getAllBrandWinners(): WinnerAd[] {
  // Unique brand entity ids present in the pool, resolved via the helper so we
  // never re-implement the filter. Order follows ALL_BRANDS for stability.
  const seen = new Set<string>();
  const out: WinnerAd[] = [];
  for (const b of ALL_BRANDS) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    out.push(...getWinnerAdsForEntity("brand", b.id));
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────── *
 * EmptyWinners — composed empty state (icon + line + sub-line).
 * ────────────────────────────────────────────────────────────────────── */
function EmptyWinners({ brandName }: { brandName: string | null }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Trophy className="h-4 w-4" />
      </span>
      <p className="text-[13px] font-semibold text-foreground">
        No winners yet{brandName ? ` for ${brandName}` : ""}
      </p>
      <p className="mt-1 max-w-[36ch] text-[11px] leading-snug text-muted-foreground">
        Winner ads appear here once {brandName ?? "this brand"} has
        top-performing creatives from Insights, Genie, or your Library.
      </p>
    </div>
  );
}
