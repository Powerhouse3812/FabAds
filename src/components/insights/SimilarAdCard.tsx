import { Copy, Bookmark, LayoutGrid, Link as LinkIcon, MoreHorizontal, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcons } from "./PlatformIcons";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { InsightAd } from "@/lib/insights-dummy-data";

interface SimilarAdCardProps {
  ad: InsightAd;
  onSelect?: (ad: InsightAd) => void;
  className?: string;
}

/**
 * Hybrid card used inside the Ad Detail Drawer's "Similar Ads" full-width
 * grid. Top half = compact metadata stub (frame 3 reference — Ad ID, Created
 * on, Total active, Similar Ads count + platforms). Bottom half = feed-card
 * style mini ad (frame 1 reference — brand row, primary text, media thumb,
 * domain, headline, action row).
 *
 * Click anywhere outside the action buttons → opens that ad in the same
 * drawer via `onSelect`.
 */
export function SimilarAdCard({ ad, onSelect, className }: SimilarAdCardProps) {
  const createdLabel = new Date(ad.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isActive = ad.status === "active";
  const sinceLabel = formatDistanceToNow(new Date(ad.createdAt), { addSuffix: false });

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(ad)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(ad);
        }
      }}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card overflow-hidden",
        "transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "cursor-pointer",
        className,
      )}
    >
      {/* ── Top: metadata stub (frame 3 style) ── */}
      {/* pt-3.5 (mobile) / md:pt-3 (desktop, unchanged): the extra 2px gives
          "Copy Ad ID"'s ::before hit-slop (below) just enough clearance not
          to graze this article's own `overflow-hidden` top edge. Measured
          live — without it the slop clipped ~0.7px short of 44px. */}
      <div className="px-3 pt-3.5 md:pt-3 pb-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <span>Ad ID:</span>
            <span className="text-foreground truncate max-w-[140px]">{ad.adId}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(ad.adId);
              toast.success("Ad ID copied");
            }}
            // Spec B 1.3: 44px floor. Visual chip stays the same tiny icon
            // (this card repeats 6x stacked in the mobile sheet — a literal
            // padding bump here costs 6x the height). Instead we grow only
            // the HIT AREA via an invisible ::before slop (empty content,
            // absolutely positioned, negative inset) — it takes zero space
            // in layout, so nothing around it reflows. inset(-14px) on a
            // ~16px visual box (p-0.5 + h-3 icon) nets exactly 44px.
            // md:before:content-none removes the slop above the mobile
            // breakpoint so desktop hit-testing is byte-for-byte unchanged
            // (INV-4) — this control was already fine for a mouse.
            className="relative text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded before:absolute before:inset-[-14px] before:content-[''] md:before:content-none"
            aria-label="Copy Ad ID"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="text-muted-foreground">
            Created on: <span className="text-foreground">{createdLabel}</span>
          </div>
          <div className="text-muted-foreground">
            Total active: <span className="text-foreground">{ad.activeDuration}</span>
          </div>
          <div className="text-muted-foreground">
            Similar Ads: <span className="text-foreground">{String(ad.similarAdsCount).padStart(2, "0")}</span>
          </div>
          <div className="flex justify-end">
            <PlatformIcons platforms={ad.platforms} />
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-border/60" />

      {/* ── Bottom: feed-card visuals (frame 1 style) ── */}
      <div className="p-3 space-y-2">
        {/* Active since row + bookmark */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {/* Raw emerald/rose kept intentionally — checked against the DS
                token catalogue (tailwind.config.ts + index.css) and there is
                no named token at this hue. `success-text` (hsl 105°) and
                `error-text` (hsl 354°) are the only status-color tokens
                registered, and both sit on a different hue than
                emerald (~160°) / rose (~347°) — swapping in would change the
                rendered colour, which the brief rules out. Left as-is +
                reported; a `success`/`danger` token pair would need adding
                to the design system first (design-system-primacy: not this
                worker's call to make unilaterally). */}
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isActive ? "bg-emerald-500" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
            Active since: <span className="text-foreground">{sinceLabel}</span>
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            // Same invisible-slop technique as "Copy Ad ID" above. Visual
            // box here is just the bare h-3.5 icon (~14px, no padding) —
            // inset(-15px) nets 44px of hit area without adding a single
            // px to the card's rendered height. md:before:content-none
            // keeps desktop's existing hit-testing untouched (INV-4).
            className="relative text-muted-foreground hover:text-foreground transition-colors before:absolute before:inset-[-15px] before:content-[''] md:before:content-none"
            aria-label="Save to Library"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Brand row */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-semibold shrink-0">
            {ad.brand[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-foreground truncate">{ad.brand}</p>
            <p className="text-[10px] text-muted-foreground">{ad.adType}</p>
          </div>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "text-[9px] px-1.5 py-0 h-4 shrink-0",
              isActive
                ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30",
            )}
          >
            {isActive ? "Active now" : "Inactive now"}
          </Badge>
        </div>

        {/* Primary text — clamped */}
        <p className="text-[11px] text-foreground/85 leading-relaxed line-clamp-2">
          {ad.primaryText}
        </p>

        {/* Media block */}
        {ad.mediaUrl && (
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={ad.thumbUrl || ad.mediaUrl}
              alt={ad.headline}
              className="w-full h-full object-cover"
            />
            {(ad.transparencyMode || ad.analysed) && (
              <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                {ad.transparencyMode && (
                  <Badge className="text-[8px] h-3.5 px-1 bg-background/80 text-foreground border-none">
                    Transparency
                  </Badge>
                )}
                {ad.analysed && (
                  <Badge className="text-[8px] h-3.5 px-1 bg-background/80 text-foreground border-none">
                    Analysed
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Domain + headline + description */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-mono text-muted-foreground truncate">{ad.domain}</p>
          <p className="text-[11px] font-medium text-foreground truncate">{ad.headline}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{ad.description}</p>
        </div>

        {/* Action icons row */}
        {/*
          Spec B 1.3 / 1.1: 44px floor, applied via the same invisible
          ::before hit-slop as the two header buttons above — visual icon
          chip stays h-6 w-6 (24px, matches desktop) so the row's rendered
          height does not change, but the tappable area on each button
          expands to a true 44x44 via inset(-10px). md:before:content-none
          drops the slop at md+, so desktop hit-testing is unchanged (INV-4).

          gap-6 (mobile) / md:gap-1 (desktop, unchanged): caught live via
          elementFromPoint — with the original gap-1 (4px), two 10px slops
          facing each other overlapped by 16px, and the whole overlap
          resolved to whichever button sits later in DOM order. A tap aimed
          at "Add to competitor" that landed in that dead zone silently
          fired "Save to Board" instead. 20px of gap is the exact break-even
          (2x10px slop meeting edge-to-edge); gap-6 = 24px keeps a small
          buffer. Still only a horizontal change — plenty of spare width in
          this row even at 320px — so it doesn't touch the density problem
          (row height) this comment block above is solving for.
        */}
        <div className="flex items-center gap-6 md:gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="relative h-6 w-6 p-0 text-muted-foreground hover:text-foreground before:absolute before:inset-[-10px] before:content-[''] md:before:content-none"
            onClick={(e) => e.stopPropagation()}
            aria-label="Add to competitor"
          >
            <UserPlus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="relative h-6 w-6 p-0 text-muted-foreground hover:text-foreground before:absolute before:inset-[-10px] before:content-[''] md:before:content-none"
            onClick={(e) => e.stopPropagation()}
            aria-label="Save to Board"
          >
            <LayoutGrid className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            // Spec B 1.1 item 5: Maalik put Copy link back on the mobile
            // keep-list — batch A's `hidden md:inline-flex` here is undone.
            // It now renders (and hit-tests at 44px, see className) on
            // every breakpoint, same as it always has on desktop.
            className="relative h-6 w-6 p-0 text-muted-foreground hover:text-foreground before:absolute before:inset-[-10px] before:content-[''] md:before:content-none"
            // MONITOR FIX (batch B final gate): this wrote `ad.adId`
            // ("AD-218785") to the clipboard under a "Copy link" label and a
            // "Link copied" toast — verified live. Spec B's DoD requires the
            // restored action to WORK, not just to be visible, so it now
            // copies the same absolute URL shape `InsightsV2Feed`'s
            // `handleCopyLink` and the detail drawer use. The ID keeps its
            // own dedicated "Copy Ad ID" button above.
            onClick={(e) => {
              e.stopPropagation();
              const url = `${window.location.origin}/insights/discover?ad=${ad.id}`;
              if (navigator.clipboard?.writeText) {
                // Awaited: a rejected write must not still toast success.
                navigator.clipboard.writeText(url).then(
                  () => toast.success("Link copied"),
                  () => toast.error("Could not copy link"),
                );
              } else {
                toast.error("Clipboard unavailable");
              }
            }}
            aria-label="Copy link"
          >
            <LinkIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            // Re-checked for Spec B: still no DropdownMenu behind this
            // trigger — it has no menu items at all. Per spec 2.4 ("never
            // ship an empty menu") it stays pruned on mobile alongside the
            // sheet's own dead kebab; Maalik's batch B keep-list additions
            // (Copy link, bulk select) don't touch this one. No 44px work
            // needed since it never renders below md. Desktop unchanged.
            className="hidden md:inline-flex h-6 w-6 p-0 text-muted-foreground hover:text-foreground ml-auto"
            onClick={(e) => e.stopPropagation()}
            aria-label="More"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </article>
  );
}
