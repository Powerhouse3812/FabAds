import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
} from "lucide-react";
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
  const view: LibraryView =
    searchParams.get("view") === "grouped" ? "grouped" : "masonry";

  const setView = useCallback(
    (next: LibraryView) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === "masonry") sp.delete("view");
          else sp.set("view", next);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const [dayRange, setDayRange] = useState<string>("today");

  return (
    <header className="border-b border-g6-border-secondary bg-g6-bg-base px-5">
      <div className="flex h-[52px] items-center gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-g6-sm">
          <PanelLeftClose className="h-4 w-4 text-g6-text-tertiary" />
          <span className="font-g6-sans text-g6-text-tertiary">Genie</span>
          <span className="text-g6-text-tertiary">/</span>
          <span className="font-g6-sans font-semibold text-g6-text">
            Library
          </span>
        </div>

        {/* Center: view toggle + inline queue strip */}
        <div className="ml-4 flex min-w-0 flex-1 items-center gap-2">
          <MasonryGroupToggle value={view} onChange={setView} />

          {/* Queue inline strip — compact Figma-accurate version */}
          <QueueInlineStrip />
        </div>

        {/* Select days — right-most */}
        <Select value={dayRange} onValueChange={setDayRange}>
          <SelectTrigger className="h-8 w-[150px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
            <SelectValue placeholder="Select days" />
          </SelectTrigger>
          <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}

/**
 * QueueInlineStrip — compact inline version of LibraryQueueStrip used inside
 * the top bar. Static for now; can be wired to the same mock queue source
 * later. Mirrors Figma frame 2147225521 layout.
 */
function QueueInlineStrip() {
  return (
    <div className="flex items-center gap-2 truncate">
      {/* queue (3/5) prev/next */}
      <span className="flex items-center gap-1 font-g6-mono text-g6-xs text-g6-text">
        <ChevronLeft className="h-2.5 w-2.5 text-g6-text-tertiary" />
        <span>queue (3/5)</span>
        <ChevronRight className="h-2.5 w-2.5 text-g6-text-tertiary" />
      </span>
      <span
        aria-hidden
        className="mx-1 inline-block h-3 w-px bg-g6-border-secondary"
      />

      {/* Batch tags */}
      <div className="flex items-center gap-2 truncate">
        <span className="font-g6-sans text-g6-sm text-g6-text">Product Ad</span>
        <span className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[11px] text-g6-text">
          <Apple className="h-3.5 w-3.5" /> Apple
        </span>
        <span className="inline-flex items-center rounded-g6-pill bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[11px] text-g6-text">
          iPad pro
        </span>
        <span className="inline-flex items-center rounded-g6-pill bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[11px] text-g6-text">
          Performance
        </span>
        <span className="inline-flex items-center rounded-g6-pill bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[11px] text-g6-text">
          Story Ad
        </span>

        {/* Progress mini */}
        <span className="flex items-center gap-2 font-g6-mono text-g6-xs tabular-nums text-g6-text">
          <span>12/12</span>
          <span className="relative inline-block h-1 w-[41px] overflow-hidden rounded-full bg-g6-bg-spotlight">
            <span className="absolute inset-0 rounded-full bg-g6-primary" />
          </span>
        </span>
      </div>

      <span
        aria-hidden
        className="mx-1 inline-block h-3 w-px bg-g6-border-secondary"
      />
      <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
        1h ago
      </span>
    </div>
  );
}
