import { useState } from "react";
import { Bookmark, Check, Play, RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EllipsisAction,
  KanbanColumn,
  OutputCardVariant,
  OutputData,
} from "../../types/output";
import { MODE_LABELS } from "../../types/output";
import { QualityScoreChip } from "./QualityScoreChip";
import { TextOnlyMotif } from "./TextOnlyMotif";
import { EllipsisMenu } from "./EllipsisMenu";

export interface OutputCardProps extends OutputData {
  variant?: OutputCardVariant;
  selectable?: boolean;
  selected?: boolean;
  kanbanColumn?: KanbanColumn;

  /**
   * Display size — independent of `variant`.
   *   "full"    (default) — masonry card, 272px wide × variable height per
   *                          thumbnail aspect (1:1 letterboxed, 4:5 / 9:16 /
   *                          16:9 full-bleed).
   *   "compact"            — group-by-angle row card, 208 × 331 fixed.
   */
  size?: "full" | "compact";
  /**
   * "Featured" treatment for the first / active card in a Group-by-Angle row:
   * lime border + #FEFFF0 background. Visual cue only; doesn't change
   * behaviour.
   */
  featured?: boolean;

  onSave?: () => void;
  onLaunch?: () => void;
  onDownload?: () => void;
  onRegenerate?: () => void;
  onEllipsisAction?: (action: EllipsisAction) => void;
  onSelect?: () => void;
  onClick?: () => void;
  onKanbanMove?: (col: KanbanColumn) => void;
}

/**
 * OutputCard — generation card for the Genie 6.0 Library.
 *
 * Locked to the Figma final design (`bJzB8m8Xa4WwLAweyJHWf1`). Layout
 * inverts the conventional image-first card: brand row and headline sit
 * ABOVE the thumbnail, with the CTA hook line + body description below
 * and a 4-icon footer (Launch / Save / Regenerate / More).
 *
 * Composition contract:
 *   ┌───────────────────────────┐
 *   │ ⬤ Brand name              │  Brand row — 32px avatar + name
 *   │ Headline that may         │  Headline 2-line clamp
 *   │ wrap to a second line     │
 *   │ ┌───────────────────────┐ │  Media zone — aspect-aware
 *   │ │      thumbnail        │ │     • 1:1 letterboxed
 *   │ │                       │ │     • 4:5 / 9:16 full-bleed
 *   │ │ [Q 87]      [Brand]   │ │  Quality (BL) + Mode (BR) chips
 *   │ └───────────────────────┘ │
 *   │ CTA hook line             │  Secondary row 1 (text-secondary)
 *   │ Body description text     │  Secondary row 2 (text-tertiary)
 *   ├───────────────────────────┤
 *   │ ✈ │ ☆ │ ⟳ │           ⋮ │  Footer — 4 icons + ellipsis
 *   └───────────────────────────┘
 *
 * The COMPACT variant (208×331) collapses brand+headline into a single
 * 92px block and uses a fixed 208×151 thumbnail; selection checkbox lives
 * top-left ON the image (compact only per Figma; on FULL we hover-reveal
 * it to preserve multi-select on the masonry browse surface). The
 * FEATURED variant adds a lime border + #FEFFF0 background — visual
 * anchor for the active card in a group-by-angle row.
 *
 * Hover state: subtle 1px upward translate + border darkens from
 * `g6-border-secondary` (hairline) to `g6-border`. No shadow — keeps the
 * flat aesthetic.
 *
 * Dropped from the old card per Figma lock: BrandChip overlay (brand is
 * in the header row now), LineageChip, DisclosureStamp, metadata strip
 * (mode/timestamp/short-id row), CTA pill — all removed. ModeBadge text
 * helper is preserved on disk for PreviewPane reuse but the card now
 * inlines a styled chip in the bottom-right of the thumbnail.
 */
export function OutputCard({
  thumbnail,
  mediaType,
  headline,
  body,
  cta,
  brand,
  mode,
  qualityScore,
  variant = "grid",
  selectable = true,
  selected = false,
  size = "full",
  featured = false,
  onSave,
  onLaunch,
  onRegenerate,
  onEllipsisAction,
  onSelect,
  onClick,
}: OutputCardProps) {
  const [hovered, setHovered] = useState(false);
  const isVariantCompact = variant === "compact";
  const isSizeCompact = size === "compact";
  // The "compact variant" (used in side rails) hides the thumbnail entirely.
  // The new "compact size" (Group-by-Angle row) keeps it.
  const showThumbnail = !isVariantCompact;

  const handleCardClick = () => onClick?.();
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  // Selection checkbox visibility per Figma:
  //   - COMPACT card: always show checkbox on image (top-left)
  //   - FULL card: no checkbox in Figma; we keep a hover-revealed one to
  //     preserve multi-select parity on the masonry browse surface
  const showCheckbox =
    selectable && showThumbnail && (isSizeCompact || hovered || selected);

  const headlineText = headline?.trim() ? headline : null;

  return (
    <article
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-state={selected ? "selected" : undefined}
      data-featured={featured ? "" : undefined}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-g6-lg border bg-g6-bg-container text-left transition-all duration-150",
        // Default border + subtle hover (1px lift + border darkens)
        !featured &&
          "border-g6-border-secondary hover:-translate-y-px hover:border-g6-border",
        // Featured — lime border + lime tint surface
        featured && "border-g6-primary bg-[#FEFFF0]",
        // Selected ring
        selected &&
          "ring-2 ring-g6-primary ring-offset-2 ring-offset-g6-bg-base",
        onClick && "cursor-pointer",
        // Width / height treatment
        isVariantCompact && "max-w-xs",
        isSizeCompact && "h-[331px] w-[208px]",
      )}
    >
      {/* ── Header (brand row + headline) ────────────────────────────── */}
      {isSizeCompact ? (
        /* Compact: single 92px block combining brand + headline */
        <div className="flex h-[92px] flex-col gap-1 px-3 pt-2">
          <BrandRow brand={brand} />
          <h3 className="line-clamp-2 font-g6-sans text-[12px] leading-[20px] text-g6-text">
            {headlineText ?? "Untitled"}
          </h3>
        </div>
      ) : (
        <>
          <div className="h-10 px-3 pt-2">
            <BrandRow brand={brand} />
          </div>
          <h3 className="line-clamp-2 px-3 pb-3 pt-1 font-g6-sans text-[12px] leading-[20px] text-g6-text">
            {headlineText ?? "Untitled"}
          </h3>
        </>
      )}

      {/* ── Media zone ───────────────────────────────────────────────── */}
      {showThumbnail && (
        <div
          className={cn(
            "relative w-full bg-g6-bg-spotlight",
            // Compact card: fixed 208×151 — image centered & cropped
            isSizeCompact && "h-[151px]",
            // Full card: aspect-aware. Default 4:5; video tall = 9:16.
            !isSizeCompact && mediaType === "video" && "aspect-[9/16]",
            !isSizeCompact && mediaType !== "video" && "aspect-[4/5]",
          )}
        >
          {mediaType === "text-only" ? (
            <TextOnlyMotif />
          ) : thumbnail ? (
            <img
              src={thumbnail}
              alt={headlineText ?? "Generated output"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
                no preview
              </span>
            </div>
          )}

          {/* Video play overlay — 40px circle, dark glass */}
          {mediaType === "video" && thumbnail && (
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                <Play className="h-5 w-5 fill-white text-white" />
              </span>
            </span>
          )}

          {/* On-image chips — Quality (BL) + Mode (BR) */}
          {qualityScore !== undefined && (
            <span className="absolute bottom-2 left-2">
              <QualityScoreChip score={qualityScore} />
            </span>
          )}
          <span className="absolute bottom-2 right-2">
            <ModeChip label={MODE_LABELS[mode]} />
          </span>

          {/* Selection checkbox — top-LEFT on compact (always); on full,
              hover-revealed for multi-select parity. */}
          {showCheckbox && (
            <button
              type="button"
              aria-label={selected ? "Deselect" : "Select"}
              onClick={(e) => {
                stop(e);
                onSelect?.();
              }}
              className={cn(
                "absolute left-3 top-2.5 inline-flex h-4 w-4 items-center justify-center rounded-g6-sm border-2 transition-colors",
                selected
                  ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                  : "border-g6-border bg-g6-bg-elevated/95 backdrop-blur-sm hover:border-g6-primary",
              )}
            >
              <Check
                className={cn(
                  "h-2.5 w-2.5 transition-opacity",
                  selected ? "opacity-100" : "opacity-0",
                )}
                strokeWidth={3}
              />
            </button>
          )}
        </div>
      )}

      {/* ── Secondary text (CTA hook line + body description) ────────── */}
      {(cta || body) && (
        <div
          className={cn(
            "flex flex-col px-3",
            isSizeCompact ? "h-[48px] py-1" : "py-2",
          )}
        >
          {cta && (
            <p className="truncate font-g6-sans text-[12px] leading-[20px] text-g6-text-secondary">
              {cta}
            </p>
          )}
          {body && (
            <p
              className={cn(
                "font-g6-sans text-[12px] leading-[20px] text-g6-text-tertiary",
                isSizeCompact ? "truncate" : "line-clamp-2",
              )}
            >
              {body}
            </p>
          )}
        </div>
      )}

      {/* ── Footer — 4-icon action row (top hairline divider) ────────── */}
      <div className="mt-auto flex h-10 items-center justify-between border-t border-g6-border-secondary px-3">
        <FooterIconBtn label="Launch" Icon={Send} onClick={onLaunch} stop={stop} />
        <FooterIconBtn label="Save" Icon={Bookmark} onClick={onSave} stop={stop} />
        <FooterIconBtn
          label="Regenerate"
          Icon={RefreshCw}
          onClick={onRegenerate}
          stop={stop}
        />
        <span onClick={stop}>
          <EllipsisMenu onAction={onEllipsisAction} />
        </span>
      </div>
    </article>
  );
}

/* ── Internal pieces ──────────────────────────────────────────────── */

function BrandRow({ brand }: { brand?: { name?: string; logo?: string } }) {
  const initial = brand?.name?.trim()?.[0]?.toUpperCase() ?? "—";
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-g6-bg-spotlight">
        {brand?.logo ? (
          <img
            src={brand.logo}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-g6-sans text-[11px] font-semibold text-g6-text">
            {initial}
          </div>
        )}
      </div>
      <span className="min-w-0 truncate font-g6-sans text-[12px] font-semibold leading-[22px] text-g6-text">
        {brand?.name ?? "Unattributed"}
      </span>
    </div>
  );
}

/**
 * Bottom-right on-image chip showing the generation mode (Brand Ad,
 * UGC Video, etc.). Pill style with backdrop blur so it reads on any
 * thumbnail brightness. Sits next to the QualityScoreChip on the BL.
 */
function ModeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-g6-pill border border-g6-border/40 bg-g6-bg-elevated/95 px-2 py-0.5 font-g6-mono text-g6-xs font-semibold uppercase tracking-wide text-g6-text-secondary backdrop-blur-sm">
      {label}
    </span>
  );
}

function FooterIconBtn({
  label,
  Icon,
  onClick,
  stop,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  stop: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        stop(e);
        onClick?.();
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-g6-base text-g6-text-secondary transition-colors hover:bg-g6-bg-spotlight hover:text-g6-text"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
