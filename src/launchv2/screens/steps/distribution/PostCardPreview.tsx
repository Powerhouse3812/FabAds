/**
 * PostCardPreview — a single selectable "post as ad" preview card for
 * PostPickerModal's grid.
 *
 * Visual family: matches IndustryInsightsAdsCard.tsx (src/components/insights-v2)
 * and GenieLibraryView.tsx's local AdgroupCard — same rounded-lg shell,
 * layered rest/hover shadow, squared page avatar + identity row, edge-to-edge
 * media block, and mono meta row. This is the compact, SELECTABLE variant for
 * a picker: no action-icon footer / kebab (selection replaces those), and it
 * adds a format badge the source cards don't carry (image vs video vs
 * carousel matters when choosing which post to reuse as an ad).
 *
 * Whole-card button, ring-based selection (not a border swap) so the shell's
 * resting border still reads under the ring, plus a check chip that reveals
 * on hover or when selected.
 */
import { Check, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdFormat, RunningAdV2 } from "../../../types";

export interface PostCardPreviewProps {
  ad: RunningAdV2;
  pageName: string;
  selected: boolean;
  onToggle: () => void;
}

/* ── Format badge label — covers every AdFormat value so the badge never
   silently falls back to a raw enum string if a future post carries a
   less-common format. ────────────────────────────────────────────────── */

const FORMAT_LABEL: Record<AdFormat, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  flexible: "Flexible",
  dpa: "Catalog",
};

/* ── Formatting helpers (mirrors PostPickerModal's fmtSpend/fmtCtr style,
   extended with fmtRoas — kept self-contained per file-ownership split). ── */

function fmtSpend(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function fmtCtr(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtRoas(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(1)}x`;
}

/* ── Status chip — lime/green dot for active, muted for paused. Renders
   nothing when status is unset (metrics still stick right via ml-auto). ── */

function StatusChip({ status }: { status?: "active" | "paused" }) {
  if (!status) return null;
  const active = status === "active";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em]",
        active
          ? "bg-[#52c41a]/10 text-[#237804] dark:bg-[#49aa19]/15 dark:text-[#49aa19]"
          : "bg-foreground/[0.06] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-[#52c41a] dark:bg-[#49aa19]" : "bg-current opacity-50",
        )}
      />
      {active ? "Published" : "Paused"}
    </span>
  );
}

export default function PostCardPreview({ ad, pageName, selected, onToggle }: PostCardPreviewProps) {
  const isVideo = ad.format === "single_video";
  const formatLabel = FORMAT_LABEL[ad.format] ?? ad.format;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      title={ad.postId}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-white text-left transition-shadow dark:bg-[#1E1E23]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821] focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1E1E23]",
        selected
          ? "ring-2 ring-[#8FB821] ring-offset-1 ring-offset-white dark:ring-offset-[#1E1E23] border-[#8FB821]/60"
          : "border-[#e7e5dc] dark:border-[#2a2a2a]",
      )}
    >
      {/* Selection affordance — top-left check chip; visible on hover or when selected. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-opacity",
          selected
            ? "opacity-100 bg-[#8FB821]"
            : "opacity-0 group-hover:opacity-100 border border-[#e7e5dc] bg-white/85 backdrop-blur-sm dark:border-[#2a2a2a] dark:bg-[#1E1E23]/85",
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} color="#121212" />}
      </span>

      {/* Identity row — squared avatar + page name + format badge pushed right. */}
      <div className="flex items-center gap-2 px-3 pb-1.5 pt-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F0F0EC] dark:bg-[#1B1B1F]">
          <span className="font-mono text-[12px] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            {pageName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="truncate text-[13px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
          {pageName}
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-[#F0F0EC] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase text-[rgba(15,15,12,0.62)] dark:bg-[#1B1B1F] dark:text-[rgba(255,255,255,0.62)]">
          {formatLabel}
        </span>
      </div>

      {/* Media — edge-to-edge, no independent radius (card's overflow-hidden clips it). */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F0F0EC] dark:bg-[#1B1B1F]">
        <img src={ad.thumbnail} alt={ad.name} loading="lazy" className="h-full w-full object-cover" />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <Play className="h-4 w-4 text-white" fill="currentColor" stroke="currentColor" strokeWidth={1} />
            </span>
          </div>
        )}
      </div>

      {/* Body — post name promoted to 2-line, postId kept out of view (tooltip only). */}
      <div className="space-y-1 px-3 py-2">
        <p
          className="line-clamp-2 text-[13px] font-medium leading-snug text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
          title={ad.postId}
        >
          {ad.name}
        </p>
        <div className="flex items-center gap-1.5">
          <StatusChip status={ad.status} />
          <span className="ml-auto whitespace-nowrap font-mono text-[11px] tabular-nums text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
            {fmtSpend(ad.spend30d)} · {fmtCtr(ad.ctr30d)} · {fmtRoas(ad.roas30d)}
          </span>
        </div>
      </div>
    </button>
  );
}
