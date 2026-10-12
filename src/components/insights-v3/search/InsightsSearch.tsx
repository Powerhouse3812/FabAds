/**
 * OWNER: agent E. Contract: InsightsSearch() — V2's own search popover.
 * Pages render it in InsightsPageLayout's `headerActions`; it's self-contained.
 *
 * Ported from the old module's InsightsSearchPopover (read-only), with its
 * known bug fixed: the old one navigated with `?search=` to pages that never
 * read it and to a `/insights-v2/search` route that doesn't exist. Here a
 * result opens its layer DIRECTLY (ad → drawer, element / advertiser / LP /
 * offer → detail overlay, board → board page), so nothing depends on a target
 * page reading a param. The single exception is "See all in Discover", which
 * sends `q` — Discover must read it (flagged to the orchestrator).
 *
 * Scopes follow the V2 menu; every scope shows its match count for the
 * current scope bar, 0 = shown but disabled. Keyboard: "/" focuses, arrows
 * move (cmdk), Enter opens, Esc closes.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Command } from "cmdk";
import { ArrowRight, Bookmark, Compass, Layers, PanelTop, Rss, Search, Store, X, type LucideIcon } from "lucide-react";
import { INSIGHTS_ROUTES } from "@/lib/insights-v3/types";
import { useBoards, useMyFeedsAds, useUserPrefs } from "@/lib/insights-v3/stores";
import { readScopeFromParams, useAdDrawer, useDetailStack } from "@/components/insights-v3/shared/url";
import { cn } from "@/lib/utils";
import {
  SEARCH_SCOPE_LABEL,
  SEARCH_SCOPE_ORDER,
  searchInsights,
  type SearchResult,
  type SearchScopeKey,
} from "./searchIndex";

const SCOPE_ICON: Record<SearchScopeKey, LucideIcon> = {
  feeds: Rss,
  discover: Compass,
  advertisers: Store,
  elements: Layers,
  "lp-offers": PanelTop,
  boards: Bookmark,
};

/** Query param Discover should read for "See all" (not wired on Discover yet at the time of writing). */
export const SEARCH_QUERY_PARAM = "q";

export function InsightsSearch({ variant = "default" }: { variant?: "default" | "pill" } = {}) {
  const pill = variant === "pill";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const drawer = useAdDrawer();
  const detail = useDetailStack();
  const prefs = useUserPrefs();
  const feedAds = useMyFeedsAds();
  const boards = useBoards();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Read-only scope read (useInsightsScope also restores/writes; the page owns that).
  const scopeKey = ["industry", "category", "period", "mine"].map((k) => searchParams.get(k)).join("|");
  const scope = useMemo(() => readScopeFromParams(searchParams), [scopeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const trimmed = query.trim();
  const out = useMemo(
    () => searchInsights(trimmed, { scope, prefs, feedAds, boards }),
    [trimmed, scope, prefs, feedAds, boards],
  );
  const discoverCount = out.scopes.find((s) => s.key === "discover")?.count ?? 0;

  // "/" focuses the field from anywhere on the page (not while typing elsewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = () => setOpen(false);

  const pick = (r: SearchResult) => {
    close();
    if (r.open.kind === "ad") drawer.open(r.open.id);
    else if (r.open.kind === "detail") detail.push(r.open.target);
    else navigate(INSIGHTS_ROUTES.boardDetail.replace(":id", encodeURIComponent(r.open.id)));
  };

  const seeAllInDiscover = () => {
    close();
    const sp = new URLSearchParams();
    for (const k of ["industry", "category", "period", "mine"]) {
      const v = searchParams.get(k);
      if (v) sp.set(k, v);
    }
    sp.set(SEARCH_QUERY_PARAM, trimmed);
    navigate(`${INSIGHTS_ROUTES.discover}?${sp.toString()}`);
  };

  const showPanel = open && trimmed.length > 0;

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full min-w-0", pill ? "sm:w-[310px]" : "sm:w-72")}
      onBlur={(e) => {
        // Popover-class surface: closing when focus leaves the whole widget is allowed.
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <Command shouldFilter={false} loop label="Search Industry Insights V2" className="relative">
        <div
          className={cn(
            "flex h-8 items-center gap-2 border px-2.5 transition-colors",
            pill ? "rounded-full bg-muted/70 pl-3" : "rounded-md bg-card",
            showPanel
              ? "border-primary/50 ring-2 ring-primary/20"
              : pill
                ? "border-transparent hover:border-primary/30 hover:bg-muted"
                : "border-border hover:border-primary/30",
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-primary-text" aria-hidden="true" />
          {/* Narrow widths (QA-17): the long placeholder clips at 375px, so it is
              transparent below `sm` and a short "Search…" stands in. Pure CSS. */}
          <span className="relative flex h-full min-w-0 flex-1">
          <Command.Input
            ref={inputRef}
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                if (showPanel) close();
                else inputRef.current?.blur();
              }
            }}
            placeholder="Search ads, advertisers, hooks…"
            aria-label="Search Industry Insights V2"
            className="h-full w-full min-w-0 bg-transparent text-[13px] text-foreground outline-none placeholder:text-transparent sm:placeholder:text-muted-foreground"
          />
          {!query && (
            <span
              aria-hidden="true"
              data-testid="search-short-placeholder"
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[13px] text-muted-foreground sm:hidden"
            >
              Search…
            </span>
          )}
          </span>
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded border border-border px-1 font-mono text-[10px] text-muted-foreground sm:inline">/</kbd>
          )}
        </div>

        {showPanel && (
          <div
            // Keep focus in the input while clicking a result, so blur doesn't unmount the panel first.
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              "absolute top-full z-40 mt-1 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md",
              pill ? "left-0" : "right-0",
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
              <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Search <span className="font-sans font-medium normal-case text-foreground">&ldquo;{trimmed}&rdquo;</span> in…
              </p>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">Follows the scope bar</span>
            </div>

            {/* Scope summary — one row per V2 menu item, with its count. */}
            <ul aria-label="Matches per section" className="grid grid-cols-2 gap-1 border-b border-border/60 p-2 sm:grid-cols-3">
              {out.scopes.map((s) => {
                const Icon = SCOPE_ICON[s.key];
                return (
                  <li
                    key={s.key}
                    aria-disabled={s.count === 0}
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px]",
                      s.count === 0 ? "text-muted-foreground opacity-60" : "bg-primary/10 text-foreground",
                    )}
                  >
                    <Icon className={cn("h-3 w-3 shrink-0", s.count > 0 && "text-primary-text")} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{SEARCH_SCOPE_LABEL[s.key]}</span>
                    <span className="shrink-0 font-mono tabular-nums">{s.count}</span>
                  </li>
                );
              })}
            </ul>

            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto overflow-x-hidden p-1">
              {out.total === 0 && (
                <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                  <p className="text-[13px] font-semibold text-foreground">No matches for &ldquo;{trimmed}&rdquo;</p>
                  <p className="max-w-[32ch] text-[11px] leading-snug text-muted-foreground">
                    Try a page name, a domain, a hook style or a word from the ad copy. Results follow the scope bar.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="mt-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary-text hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Clear search
                  </button>
                </div>
              )}
              {out.total > 0 &&
                SEARCH_SCOPE_ORDER.map((key) => {
                  const s = out.scopes.find((x) => x.key === key)!;
                  if (s.count === 0) return null;
                  return (
                    <Command.Group
                      key={key}
                      heading={
                        <span className="flex items-center justify-between">
                          <span>{SEARCH_SCOPE_LABEL[key]}</span>
                          <span className="font-mono tabular-nums">
                            {Math.min(s.results.length, s.count)} of {s.count}
                          </span>
                        </span>
                      }
                      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
                    >
                      {s.results.map((r) => (
                        <ResultItem key={r.key} result={r} onPick={pick} />
                      ))}
                      {key === "discover" && (
                        <Command.Item
                          value="see-all-discover"
                          onSelect={seeAllInDiscover}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-semibold text-primary-text aria-selected:bg-primary/10"
                        >
                          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          See all {discoverCount} in Discover
                        </Command.Item>
                      )}
                    </Command.Group>
                  );
                })}
            </Command.List>
            {out.total > 0 && (
              <p className="border-t border-border/60 px-3 py-1.5 text-[10px] text-muted-foreground">
                Boards aren&rsquo;t limited by the scope bar.
              </p>
            )}
          </div>
        )}
      </Command>
    </div>
  );
}

function ResultItem({ result, onPick }: { result: SearchResult; onPick: (r: SearchResult) => void }) {
  return (
    <Command.Item
      value={result.key}
      onSelect={() => onPick(result)}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-foreground aria-selected:bg-primary/10"
    >
      <span className="h-7 w-7 shrink-0 overflow-hidden rounded bg-muted">
        {result.thumbnail && <img src={result.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium" title={result.title}>
          {result.title}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground" title={result.meta}>
          {result.meta}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary-text">
        {result.typeLabel}
      </span>
    </Command.Item>
  );
}
