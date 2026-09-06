import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { batchStatus, type RunBatch } from "@/genie6/lib/genieRunTypes";
import { QueueStatusPill } from "./QueueStatusPill";
import { QueueProgressBar } from "./QueueProgressBar";
import { batchConfigChips } from "./batchDisplay";

interface QueueListV3Props {
  batches: RunBatch[];
  activeBatchId: string | null;
  onSelectBatch: (id: string) => void;
}

function formatTime(ms: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(ms))
    .toLowerCase()
    .replace(/\s/g, "");
}

/**
 * QueueListV3 — vertical Finder-style left panel for the V3 Results Queue.
 *
 * Per Maalik's spec for V3 (A-12.182):
 *   - Flat list (no sectioning), search at top
 *   - 260px fixed width (matches CatalogueFinder pane-1)
 *   - Compact rows: title + status pill + tag chips + relative time
 *   - URL-driven selection (caller writes ?batch=<id>)
 *   - Hover lift micro-interaction + active lime treatment matching Finder
 *
 * Search filters by label + config-derived chips (case-insensitive). No
 * filter chips, no grouping — Maalik's call: "Just compact rows + search at
 * top". Keeps the left panel scannable; the right pane carries all the
 * heavy chrome.
 *
 * Reference: src/catalogue/CatalogueFinder.tsx pane-1 layout (260px, search
 * input at top, vertical scrollable list, active row in primary/10 tint).
 */
export function QueueListV3({
  batches,
  activeBatchId,
  onSelectBatch,
}: QueueListV3Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return batches;
    const q = search.trim().toLowerCase();
    return batches.filter((b) => {
      if (b.label.toLowerCase().includes(q)) return true;
      if (b.batchId.toLowerCase().includes(q)) return true;
      if (batchConfigChips(b).some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [batches, search]);

  return (
    <aside
      data-fabads-queue-panel="v3-list"
      className="flex w-[260px] shrink-0 flex-col border-r border-border bg-background"
    >
      {/* Search — sticky at top so it stays put while the list scrolls. */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-3 py-2.5 backdrop-blur">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batches..."
            aria-label="Search the generation queue"
            className={cn(
              "h-8 w-full rounded-md border border-border bg-muted/40 pl-8 pr-2",
              "font-sans text-[12px] text-foreground placeholder:text-muted-foreground",
              "focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/30",
            )}
          />
        </div>
      </div>

      {/* List — scrollable, compact rows */}
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {search ? "No matches" : "No batches yet"}
            </p>
            {search && (
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Nothing matches "{search}"
              </p>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5 px-2" role="listbox">
            {filtered.map((batch) => {
              const isActive = batch.batchId === activeBatchId;
              const visibleTags = batchConfigChips(batch).slice(0, 2);
              return (
                <li key={batch.batchId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => onSelectBatch(batch.batchId)}
                    className={cn(
                      "group flex w-full flex-col gap-1 rounded-md border px-2.5 py-2 text-left transition-all",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-border/60 hover:bg-muted/40",
                    )}
                  >
                    {/* Top row — title + status pill */}
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "min-w-0 truncate font-sans text-[12.5px] font-medium leading-tight",
                          isActive ? "text-primary" : "text-foreground",
                        )}
                      >
                        {batch.label}
                      </h3>
                      <span className="shrink-0">
                        <QueueStatusPill status={batchStatus(batch)} />
                      </span>
                    </div>

                    {/* Tag chips + time. The numeric count moved into the
                        progress bar row below. */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex min-w-0 items-center gap-1">
                        {visibleTags.map((t) => (
                          <span
                            key={t}
                            className={cn(
                              "inline-flex h-[15px] items-center rounded-full px-1.5",
                              "font-sans text-[9.5px] font-medium",
                              isActive
                                ? "bg-primary/15 text-primary/80"
                                : "bg-muted/60 text-muted-foreground",
                            )}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <time
                        dateTime={new Date(batch.createdAt).toISOString()}
                        className="shrink-0 font-mono text-[9.5px] tabular-nums text-muted-foreground"
                      >
                        {formatTime(batch.createdAt)}
                      </time>
                    </div>

                    {/* Progress bar — replaces the bare count chip with a
                        live N/M fill. Hides spinner since the row already
                        has a status pill carrying the running state. */}
                    <QueueProgressBar batch={batch} size="inline" hideSpinner />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer count — gives the user a sense of total queue size. */}
      <div className="shrink-0 border-t border-border/60 px-3 py-1.5">
        <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground tabular-nums">
          {filtered.length} of {batches.length} batch{batches.length === 1 ? "" : "es"}
        </p>
      </div>
    </aside>
  );
}
