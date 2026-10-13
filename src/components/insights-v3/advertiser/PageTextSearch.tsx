/**
 * Searchable page text for the landing-page overlay. The input filters the
 * captured text to the lines that match and highlights the match. With no
 * captured text the block is disabled with the reason (layout never collapses).
 */
import { useMemo, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { DisabledSection, fmtInt } from "../shared";
import { PAGE_TEXT_MISSING, splitPageText } from "./helpers";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(line: string, query: string): ReactNode {
  if (!query) return line;
  const parts = line.split(new RegExp(`(${escapeRe(query)})`, "ig"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded-sm bg-primary/30 px-0.5 text-foreground">
        {p}
      </mark>
    ) : (
      p
    ),
  );
}

export function PageTextSearch({ text }: { text: string | null }) {
  const [query, setQuery] = useState("");
  const lines = useMemo(() => (text ? splitPageText(text) : []), [text]);
  const q = query.trim();
  const matches = useMemo(
    () => (q ? lines.filter((l) => l.toLowerCase().includes(q.toLowerCase())) : lines),
    [lines, q],
  );

  if (!text || lines.length === 0) {
    return <DisabledSection title="Page text" reason={PAGE_TEXT_MISSING} minHeight={120} />;
  }

  return (
    <div className="min-w-0 rounded-lg border border-border bg-background/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-foreground">Page text</h4>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          <span className="font-mono tabular-nums text-foreground">{fmtInt(matches.length)}</span>
          {q ? ` of ${fmtInt(lines.length)} lines match` : ` ${lines.length === 1 ? "line" : "lines"}`}
        </p>
      </div>
      <label className="relative mt-2 block">
        <span className="sr-only">Search the page text</span>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the page text…"
          className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </label>
      <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-border bg-card">
        {matches.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No line contains “{q}”. Try a shorter word.
          </p>
        ) : (
          <ol className="divide-y divide-border text-sm leading-relaxed text-foreground">
            {matches.map((l, i) => (
              <li key={`${i}-${l.slice(0, 24)}`} className="px-3 py-1.5">
                {highlight(l, q)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
