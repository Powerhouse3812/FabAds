import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Search, X } from "lucide-react";
import type { SelectedTags, TagGroupKey, TopTenGroup } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { TruncatedText } from "./TruncatedText";
import { fmtInt } from "./format";
import { missingNote } from "./missingNote";
import { useViewMore } from "./url";

const PAGE = 100;

export interface ViewMoreModalProps {
  /** Every group the page can show. The modal opens for the one named by `?more=`. */
  groups: TopTenGroup[];
  selected: SelectedTags;
  onToggle: (groupKey: TagGroupKey, id: string) => void;
  /** Clears all selections in the open group. Optional; hides the button when omitted. */
  onClearGroup?: (groupKey: TagGroupKey) => void;
  noun?: string;
}

/**
 * Full scrollable list for one group, URL-backed (`more=<key>`).
 * Closes ONLY through the Close button, the X, or Esc — never on outside click.
 * Multi-select uses the same toggle semantics as TopTenGroup; options are never re-sorted.
 */
export function ViewMoreModal({ groups, selected, onToggle, onClearGroup, noun = "ads" }: ViewMoreModalProps) {
  const { group: key, close } = useViewMore();
  const group = key ? groups.find((g) => g.key === key) ?? null : null;
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    setQuery("");
    setVisible(PAGE);
  }, [key]);
  useEffect(() => setVisible(PAGE), [query]);

  const sel = group ? selected[group.key] ?? [] : [];
  const filtered = useMemo(() => {
    if (!group) return [];
    const q = query.trim().toLowerCase();
    return q ? group.options.filter((o) => o.label.toLowerCase().includes(q)) : group.options;
  }, [group, query]);
  const shown = filtered.slice(0, visible);
  const note = group ? missingNote(group.missing, noun, group.label, group.key) : null;

  return (
    <DialogPrimitive.Root open={!!group} onOpenChange={(o) => !o && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          // Standing rule: overlays never dismiss on outside click.
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100vw-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-base font-semibold text-foreground">
                {group?.label ?? "Tags"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">{fmtInt(group?.options.length ?? 0)}</span> options · pick any
                number; results match any selected tag
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </header>

          <div className="border-b border-border px-4 py-2.5">
            <label className="relative block">
              <span className="sr-only">Search {group?.label ?? "tags"}</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${group?.label?.toLowerCase() ?? "tags"}…`}
                className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>

          <div className="min-h-[160px] flex-1 overflow-y-auto px-2 py-2">
            {shown.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nothing matches “{query}”.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {shown.map((o) => {
                  const on = sel.includes(o.id);
                  const empty = o.count === 0 && !on;
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-disabled={empty || undefined}
                        onClick={() => {
                          if (!empty) onToggle(group!.key, o.id);
                        }}
                        title={empty ? `No ${noun} in this scope` : undefined}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          empty ? "cursor-not-allowed text-muted-foreground opacity-60" : "hover:bg-accent",
                          on && "bg-primary/10",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                          )}
                        >
                          {on && <Check className="h-3 w-3" />}
                        </span>
                        <TruncatedText text={o.label} className="flex-1" focusable={false} />
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 font-mono text-[11px] leading-5 tabular-nums",
                            empty ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary-text",
                          )}
                        >
                          {fmtInt(o.count)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {filtered.length > shown.length && (
              <div className="px-2 py-2">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE)}
                  className="w-full rounded-md border border-dashed border-border py-1.5 text-xs font-medium text-primary-text hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Show {fmtInt(Math.min(PAGE, filtered.length - shown.length))} more (
                  {fmtInt(filtered.length - shown.length)} left)
                </button>
              </div>
            )}
          </div>

          {note && <p className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">{note}</p>}
          <footer className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                <span className="font-mono font-medium tabular-nums text-foreground">{sel.length}</span> selected
              </span>
              {group && onClearGroup && sel.length > 0 && (
                <button
                  type="button"
                  onClick={() => onClearGroup(group.key)}
                  className="rounded-sm font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Clear
                </button>
              )}
            </div>
            <DialogPrimitive.Close className="inline-flex h-8 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Close
            </DialogPrimitive.Close>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
