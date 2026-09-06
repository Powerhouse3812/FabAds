import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
} from "lucide-react";
import { useBatches } from "@/genie6/lib/genieRunStore";
import { batchDoneCount, batchStatus } from "@/genie6/lib/genieRunTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MasonryGroupToggle, type LibraryView } from "./MasonryGroupToggle";

/**
 * LibraryTopBar — single 52px-tall top bar for the Library page.
 *
 * Collapses the previous 2-row header (title + LibraryQueueStrip) into one
 * row containing: breadcrumb, view toggle, inline queue strip, and a
 * date-range select. View toggle is URL-backed via `?view=` (same scheme
 * as GeneratedOutputsTab); the day-range select is local state for now.
 */
export function LibraryTopBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  // §10 — "batch" is now the default view, so it's the one omitted from the
  // URL (same delete-on-default convention LibraryToolbar uses for its own
  // params — `?view=` only ever appears for the two non-default groupings).
  const rawView = searchParams.get("view");
  const view: LibraryView =
    rawView === "masonry" || rawView === "grouped" ? rawView : "batch";

  const setView = useCallback(
    (next: LibraryView) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === "batch") sp.delete("view");
          else sp.set("view", next);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /**
   * Day range — URL-backed (`?days=`), like every other Library filter.
   *
   * This was `useState("today")` and nothing downstream read it: a dropdown
   * that looked like the Library's primary time filter and filtered nothing.
   * A dead control on the flagship surface is worse than an absent one — the
   * user changes it, sees the same 50 outputs, and stops trusting the other
   * five filters too. Default is "all" rather than "today", because defaulting
   * to Today while showing three weeks of seeded batches was itself the lie.
   */
  const dayRange = searchParams.get("days") ?? "all";
  const setDayRange = (v: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (v === "all") sp.delete("days");
        else sp.set("days", v);
        return sp;
      },
      { replace: true },
    );

  return (
    <header className="border-b border-g6-border-secondary bg-g6-bg-base px-5">
      <div className="flex h-[52px] items-center gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-g6-sm">
          <PanelLeftClose className="h-4 w-4 text-g6-text-tertiary" />
          <span className="font-g6-sans text-g6-text-tertiary">Genie</span>
          <span className="text-g6-text-tertiary">/</span>
          {/* The page had NO h1 at all — heading order jumped from the
              sidebar's h2 straight to 50 h3 card titles, so nothing told a
              screen-reader user which page they were on. The breadcrumb's
              current segment IS the page title, so it carries the h1 rather
              than adding a second visible one. Same pixels, real semantics. */}
          <h1 className="font-g6-sans text-g6-sm font-semibold text-g6-text">
            Library
          </h1>
        </div>

        {/* Center: view toggle + inline queue strip */}
        <div className="ml-4 flex min-w-0 flex-1 items-center gap-2">
          <MasonryGroupToggle value={view} onChange={setView} />

          {/* Batch strip — only where it adds something. In "By batch" view the
              page body renders a full header for every batch (id, status,
              count, credits, origin, created-by) starting ~40px below this
              row, so the strip was restating the newest one verbatim. In
              Masonry and By-angle the body carries no batch context at all,
              which is where a one-line "what's running" summary is the only
              place that information exists. */}
          {view !== "batch" && <QueueInlineStrip />}
        </div>

        {/* Select days — right-most */}
        <Select value={dayRange} onValueChange={setDayRange}>
          <SelectTrigger className="h-8 w-[150px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
                      </SelectContent>
        </Select>
      </div>
    </header>
  );
}

/**
 * QueueInlineStrip — compact inline batch strip in the Library top bar.
 *
 * Was hardcoded to "Product Ad · Apple · iPad pro · Performance · Story Ad ·
 * 12/12 · 1h ago" from a Figma frame. That put an Apple iPad batch directly
 * above a Library full of Mamaearth and Noise outputs — a brand that isn't on
 * the roster at all, next to real data, which reads as a bug rather than a
 * placeholder. It also claimed "queue (3/5)" and a full progress bar while the
 * real store might have nothing running.
 *
 * Now reads the same `genieRunStore` the rest of the Library does (§8: per-app
 * and per-surface history are VIEWS over one store, never separate stores), so
 * the strip is the newest batch, live, and it renders nothing at all when
 * there are no batches instead of inventing one.
 */
function QueueInlineStrip() {
  const batches = useBatches();
  const newest = batches[0];
  if (!newest) return null;

  const status = batchStatus(newest);
  const position = 1;
  const running = batches.filter((b) => batchStatus(b) === "running").length;

  return (
    <div className="flex items-center gap-2 truncate">
      <span className="flex items-center gap-1 font-g6-mono text-g6-xs text-g6-text">
        <ChevronLeft className="h-2.5 w-2.5 text-g6-text-tertiary" />
        <span>
          batch ({position}/{batches.length})
          {running > 0 && ` · ${running} running`}
        </span>
        <ChevronRight className="h-2.5 w-2.5 text-g6-text-tertiary" />
      </span>
      <span aria-hidden className="mx-1 inline-block h-3 w-px bg-g6-border-secondary" />

      <div className="flex items-center gap-2 truncate">
        {/* Batch ID = Job ID (§10), displayed with the batch it identifies. */}
        <span className="font-g6-mono text-[11px] font-semibold uppercase tracking-wide text-g6-text-secondary">
          {newest.batchId}
        </span>
        <span className="truncate font-g6-sans text-g6-sm text-g6-text">{newest.label}</span>
        <span className="inline-flex items-center rounded-g6-pill bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[11px] uppercase tracking-wide text-g6-text">
          {status}
        </span>

        <span className="flex items-center gap-2 font-g6-mono text-g6-xs tabular-nums text-g6-text">
          <span>{batchDoneCount(newest)}</span>
          <span className="relative inline-block h-1 w-[41px] overflow-hidden rounded-full bg-g6-bg-spotlight">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-g6-primary transition-[width] duration-500"
              style={{
                width: `${Math.round(
                  (newest.items.filter((i) => i.status === "done").length /
                    Math.max(newest.items.length, 1)) * 100,
                )}%`,
              }}
            />
          </span>
        </span>
      </div>

      <span aria-hidden className="mx-1 inline-block h-3 w-px bg-g6-border-secondary" />
      <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
        {relativeFromNow(newest.createdAt)}
      </span>
    </div>
  );
}

/** Short relative label — the strip has room for "9h ago", not a sentence. */
function relativeFromNow(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}
