import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Download,
  FolderPlus,
  MoreHorizontal,
  RefreshCw,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { OutputCard } from "./OutputCard";
import type { OutputData } from "../types/output";
import { cn } from "@/lib/utils";

interface AngleRowProps {
  angleId: string;
  angleLabel: string;
  angleDescription?: string;
  outputs: OutputData[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onCardClick: (output: OutputData) => void;
}

const VISIBLE_LIMIT = 10;

/**
 * AngleRow — horizontal scrolling row of generation cards grouped by angle.
 *
 * Composition (per Figma reference):
 *   Header: lime 2.5×14px accent bar + angle label (mono uppercase 10px)
 *           + variation count chip + sub-label ("variations · concept N")
 *           + right-side action cluster (Regenerate / Rocket / FolderAdd /
 *             Components / Download / More)
 *   Body:   Horizontal scroll of up to 10 cards (size="compact", 208×331).
 *           The first card is `featured` by default; clicking any card sets
 *           it as the active variation for this row (local state only,
 *           does not persist across refresh — that's iter 1 acceptable).
 *   Footer: Custom thin scrollbar (browser scrollbar styling). When the
 *           total exceeds VISIBLE_LIMIT, the last visible card is followed
 *           by a "View more →" CTA chip that sets `?angle=<id>` to open
 *           the AngleViewMoreDrawer.
 */
export function AngleRow({
  angleId,
  angleLabel,
  angleDescription: _angleDescription,
  outputs,
  selected,
  onSelect,
  onCardClick,
}: AngleRowProps) {
  const [, setSearchParams] = useSearchParams();
  const [featuredId, setFeaturedId] = useState<string>(outputs[0]?.id ?? "");

  const total = outputs.length;
  const visible = outputs.slice(0, VISIBLE_LIMIT);
  const overflow = Math.max(0, total - VISIBLE_LIMIT);

  const openViewMore = useCallback(() => {
    if (angleId === "__unattributed__") return;
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("angle", angleId);
        return sp;
      },
      { replace: false },
    );
  }, [angleId, setSearchParams]);

  return (
    <section className="flex flex-col gap-2" aria-label={`${angleLabel} — ${total} variations`}>
      {/* Header */}
      <header className="flex items-center gap-2 py-1.5">
        <span aria-hidden className="h-3.5 w-[2.5px] rounded-full bg-g6-primary" />
        <span className="font-g6-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-g6-text">
          {angleLabel}
        </span>
        <span className="inline-flex h-[18px] items-center justify-center rounded-g6-pill bg-g6-bg-spotlight px-1.5 font-g6-mono text-[9px] font-bold text-g6-text">
          {total}
        </span>
        <span className="font-g6-mono text-[9px] uppercase tracking-wider text-g6-text-tertiary">
          {total === 1 ? "variation" : "variations"}
        </span>

        <span className="ml-auto flex items-center gap-2">
          <RowActionBtn label="Regenerate" Icon={RefreshCw} text="Regenerate" />
          <span className="h-3.5 w-px bg-g6-border-secondary" />
          <RowActionBtn label="Launch" Icon={Rocket} />
          <RowActionBtn label="Save to folder" Icon={FolderPlus} />
          <RowActionBtn label="Download" Icon={Download} />
          <RowActionBtn label="More" Icon={MoreHorizontal} />
        </span>
      </header>

      {/* Horizontal scroll body */}
      <div
        className="
          -mx-1 flex gap-3 overflow-x-auto px-1 pb-4
          [scrollbar-width:thin]
          [&::-webkit-scrollbar]:h-1.5
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:bg-g6-bg-spotlight/40
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-g6-text-tertiary/40
          hover:[&::-webkit-scrollbar-thumb]:bg-g6-text-tertiary/60
        "
      >
        {visible.map((o) => {
          const isFeatured = featuredId === o.id;
          return (
            <div key={o.id} className="relative shrink-0">
              <OutputCard
                {...o}
                size="compact"
                featured={isFeatured}
                selected={selected.has(o.id)}
                onSelect={() => onSelect(o.id)}
                onClick={() => {
                  setFeaturedId(o.id);
                  onCardClick(o);
                }}
              />
              {/* Row-chrome accent — lime strip just below the featured card
                  anchors it to the row label (Figma: ~252×6, lime). Absolute
                  positioning so non-featured cards stay aligned at the same
                  baseline. */}
              {isFeatured && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-full mt-1.5 h-1.5 w-[80%] -translate-x-1/2 rounded-full bg-g6-primary"
                />
              )}
            </div>
          );
        })}

        {overflow > 0 && (
          <button
            type="button"
            onClick={openViewMore}
            className={cn(
              "shrink-0 inline-flex h-[331px] w-[140px] flex-col items-center justify-center gap-2",
              "rounded-g6-lg border border-dashed border-g6-border-secondary bg-g6-bg-container",
              "text-g6-text-secondary transition-colors hover:border-g6-primary hover:text-g6-text",
            )}
            aria-label={`View ${overflow} more ${angleLabel} variations`}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="font-g6-sans text-g6-sm font-medium">View more</span>
            <span className="font-g6-mono text-[10px] tabular-nums text-g6-text-tertiary">
              +{overflow}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

function RowActionBtn({
  label,
  Icon,
  text,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  text?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-g6-base px-1.5",
        "text-g6-text-tertiary transition-colors hover:bg-g6-bg-spotlight hover:text-g6-text",
        text ? "border border-g6-border-secondary px-2" : "",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {text && <span className="font-g6-sans text-g6-xs">{text}</span>}
    </button>
  );
}
