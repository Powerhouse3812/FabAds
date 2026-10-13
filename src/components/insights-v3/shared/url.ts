/**
 * Industry Insights V2 — URL state.
 *
 * Param names come ONLY from `QP` in `@/lib/insights-v3/types`.
 *
 * History rules:
 *  - filters / scope / sort / tab  → `replace` (no history spam)
 *  - opening a drawer / overlay / modal → PUSH (Back closes it)
 *  - closing a layer we pushed → `navigate(-1)` so history does not grow;
 *    a deep-linked layer (no push marker in history state) is closed with
 *    `replace` instead.
 *
 * The push marker is `location.state.iiPushed = "<concern>"`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ALL,
  DEFAULT_SCOPE,
  DETAIL_STACK_SEPARATOR,
  PERIOD_OPTIONS,
  QP,
  type AdvertiserKind,
  type DetailTarget,
  type ElementType,
  type PeriodKey,
  type SavableType,
  type SavedItemRef,
  type Scope,
  type SelectedTags,
  type TagGroupKey,
} from "@/lib/insights-v3/types";

/* ────────────────────────────────────────────────────────────────────────── */
/* Constants + pure helpers                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export const SCOPE_STORAGE_KEY = "fabads:insights-v3:scope";

export const TAG_GROUP_KEYS: readonly TagGroupKey[] = [
  "hookStyle", "angle", "framework", "frameworkElement", "concept",
  "keyword", "cta", "advertiser", "landingPage", "country", "category",
  "funnelType", "offerDomain",
];

const PERIOD_KEYS: readonly PeriodKey[] = PERIOD_OPTIONS.map((p) => p.key);
const ELEMENT_TYPES: readonly ElementType[] = ["framework", "hook", "angle", "concept"];
const SAVABLE_TYPES: readonly SavableType[] = [
  "ad", "framework", "hook", "angle", "concept", "domain", "page", "landing-page", "offer",
];

export function isPeriodKey(v: unknown): v is PeriodKey {
  return typeof v === "string" && (PERIOD_KEYS as readonly string[]).includes(v);
}
export function isTagGroupKey(v: unknown): v is TagGroupKey {
  return typeof v === "string" && (TAG_GROUP_KEYS as readonly string[]).includes(v);
}

/** One detail token <-> DetailTarget. Format documented on `QP` in types.ts. */
export function serializeTarget(t: DetailTarget): string {
  switch (t.kind) {
    case "ad":
      return `ad:${t.id}`;
    case "advertiser":
      return `${t.advertiserKind}:${t.id}`;
    case "element":
      return `${t.elementType}:${t.id}`;
    case "landing-page":
      return `lp:${t.id}`;
    case "offer":
      return `offer:${t.id}`;
  }
}

/** Unknown / malformed tokens return null — never throws. */
export function parseTarget(token: string | null | undefined): DetailTarget | null {
  if (typeof token !== "string") return null;
  const i = token.indexOf(":");
  if (i <= 0) return null;
  const prefix = token.slice(0, i);
  const id = token.slice(i + 1);
  if (!id.trim()) return null;
  if (prefix === "domain" || prefix === "page") {
    return { kind: "advertiser", advertiserKind: prefix as AdvertiserKind, id };
  }
  if ((ELEMENT_TYPES as readonly string[]).includes(prefix)) {
    return { kind: "element", elementType: prefix as ElementType, id };
  }
  if (prefix === "lp") return { kind: "landing-page", id };
  if (prefix === "offer") return { kind: "offer", id };
  return null;
}

export function serializeDetailStack(stack: readonly DetailTarget[]): string {
  return stack
    .filter((t) => t.kind !== "ad") // ads open in the drawer (`ad` param), never in the overlay stack
    .map(serializeTarget)
    .join(DETAIL_STACK_SEPARATOR);
}

export function parseDetailStack(raw: string | null | undefined): DetailTarget[] {
  if (!raw) return [];
  const out: DetailTarget[] = [];
  for (const token of raw.split(DETAIL_STACK_SEPARATOR)) {
    const t = parseTarget(token);
    if (t) out.push(t);
  }
  return out;
}

/** Save-modal target: `<SavableType>:<id>`. */
export function serializeSavedRef(ref: SavedItemRef): string {
  return `${ref.type}:${ref.id}`;
}

export function parseSavedRef(raw: string | null | undefined): SavedItemRef | null {
  if (typeof raw !== "string") return null;
  const i = raw.indexOf(":");
  if (i <= 0) return null;
  const type = raw.slice(0, i);
  const id = raw.slice(i + 1);
  if (!id.trim() || !(SAVABLE_TYPES as readonly string[]).includes(type)) return null;
  return { type: type as SavableType, id };
}

/** Maps a SavableType to the detail target it opens as. Used by ElementChip + boards. */
export function savedRefToDetailTarget(ref: SavedItemRef): DetailTarget {
  switch (ref.type) {
    case "ad":
      return { kind: "ad", id: ref.id };
    case "domain":
    case "page":
      return { kind: "advertiser", advertiserKind: ref.type, id: ref.id };
    case "landing-page":
      return { kind: "landing-page", id: ref.id };
    case "offer":
      return { kind: "offer", id: ref.id };
    default:
      return { kind: "element", elementType: ref.type, id: ref.id };
  }
}

/** Reads a scope from params (invalid values fall back to defaults). */
export function readScopeFromParams(sp: URLSearchParams): Scope {
  const period = sp.get(QP.period);
  return {
    industry: sp.get(QP.industry) || ALL,
    category: sp.get(QP.category) || ALL,
    period: isPeriodKey(period) ? period : DEFAULT_SCOPE.period,
    myPrefsOnly: sp.get(QP.mine) === "1",
  };
}

/** Writes a scope into params; defaults are omitted to keep URLs clean. */
export function writeScopeToParams(sp: URLSearchParams, scope: Scope): void {
  const set = (k: string, v: string | null) => (v === null ? sp.delete(k) : sp.set(k, v));
  set(QP.industry, scope.industry === ALL ? null : scope.industry);
  set(QP.category, scope.category === ALL ? null : scope.category);
  set(QP.period, scope.period === DEFAULT_SCOPE.period ? null : scope.period);
  set(QP.mine, scope.myPrefsOnly ? "1" : null);
}

export function hasScopeParams(sp: URLSearchParams): boolean {
  return [QP.industry, QP.category, QP.period, QP.mine].some((k) => sp.has(k));
}

export function readSelectedTags(sp: URLSearchParams): SelectedTags {
  const out: SelectedTags = {};
  sp.forEach((value, key) => {
    if (!key.startsWith(QP.tagPrefix)) return;
    const group = key.slice(QP.tagPrefix.length);
    if (!isTagGroupKey(group)) return;
    const ids = value.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length) out[group] = Array.from(new Set(ids));
  });
  return out;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Safe storage                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function readStoredScope(): Scope | null {
  try {
    const raw = window.sessionStorage.getItem(SCOPE_STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<Scope>;
    return {
      industry: typeof j.industry === "string" ? j.industry : ALL,
      category: typeof j.category === "string" ? j.category : ALL,
      period: isPeriodKey(j.period) ? j.period : DEFAULT_SCOPE.period,
      myPrefsOnly: false, // "My preferences only" is Discover-only; never restored
    };
  } catch {
    return null;
  }
}

function writeStoredScope(scope: Scope): void {
  try {
    window.sessionStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify({ ...scope, myPrefsOnly: false }));
  } catch {
    /* private mode / blocked storage: scope simply won't persist */
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Core writer                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

type Concern = "detail" | "ad" | "modal" | "more";
interface PushState {
  iiPushed?: Concern;
}

function useParamWriter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Latest search string, advanced synchronously on every write so two writes in
  // the same tick compose instead of the second clobbering the first.
  const searchRef = useRef(searchParams.toString());
  searchRef.current = searchParams.toString();
  const stateRef = useRef<PushState | null>(null);
  stateRef.current = (location.state as PushState | null) ?? null;

  /** Replace-write (filters, scope, sort, tab). Keeps the history state (push marker). */
  const replace = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchRef.current);
      mutate(next);
      searchRef.current = next.toString();
      setSearchParams(next, { replace: true, state: stateRef.current });
    },
    [setSearchParams],
  );

  /** Push-write: opens a layer; Back closes it. */
  const push = useCallback(
    (mutate: (sp: URLSearchParams) => void, concern: Concern) => {
      const next = new URLSearchParams(searchRef.current);
      mutate(next);
      searchRef.current = next.toString();
      const state: PushState = { iiPushed: concern };
      setSearchParams(next, { replace: false, state });
    },
    [setSearchParams],
  );

  /**
   * Close a layer. If the current history entry was created by our push for
   * this concern, go back (history shrinks); otherwise replace (deep link).
   */
  const close = useCallback(
    (concern: Concern, mutate: (sp: URLSearchParams) => void, allowBack = true) => {
      const next = new URLSearchParams(searchRef.current);
      mutate(next);
      searchRef.current = next.toString();
      if (allowBack && stateRef.current?.iiPushed === concern) {
        navigate(-1);
        return;
      }
      setSearchParams(next, { replace: true, state: null });
    },
    [navigate, setSearchParams],
  );

  return { searchParams, replace, push, close };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Scope                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * `[scope, setScope]`. `setScope` takes a full Scope or a Partial (merged).
 * Changing industry keeps the category (categories are global A–Z).
 * Restores the last scope from sessionStorage when the URL carries none.
 */
export function useInsightsScope(): [Scope, (next: Partial<Scope>) => void] {
  const { searchParams, replace } = useParamWriter();
  const key = searchParams.toString();
  const scope = useMemo(() => readScopeFromParams(searchParams), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (!hasScopeParams(searchParams)) {
        const stored = readStoredScope();
        if (stored && (stored.industry !== ALL || stored.category !== ALL || stored.period !== DEFAULT_SCOPE.period)) {
          replace((sp) => writeScopeToParams(sp, stored));
          return;
        }
      }
    }
    writeStoredScope(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.industry, scope.category, scope.period]);

  const setScope = useCallback(
    (next: Partial<Scope>) => {
      replace((sp) => writeScopeToParams(sp, { ...readScopeFromParams(sp), ...next }));
    },
    [replace],
  );

  return [scope, setScope];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Selected tags, sort, tab                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export interface SelectedTagsApi {
  selected: SelectedTags;
  toggle: (group: TagGroupKey, id: string) => void;
  clearGroup: (group: TagGroupKey) => void;
  clearAll: () => void;
  /** Total number of selected tags across groups. */
  count: number;
}

export function useSelectedTags(): SelectedTagsApi {
  const { searchParams, replace } = useParamWriter();
  const key = searchParams.toString();
  const selected = useMemo(() => readSelectedTags(searchParams), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(
    (group: TagGroupKey, id: string) => {
      replace((sp) => {
        const cur = readSelectedTags(sp)[group] ?? [];
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        if (next.length) sp.set(QP.tagPrefix + group, next.join(","));
        else sp.delete(QP.tagPrefix + group);
      });
    },
    [replace],
  );
  const clearGroup = useCallback(
    (group: TagGroupKey) => replace((sp) => sp.delete(QP.tagPrefix + group)),
    [replace],
  );
  const clearAll = useCallback(
    () =>
      replace((sp) => {
        Array.from(sp.keys())
          .filter((k) => k.startsWith(QP.tagPrefix))
          .forEach((k) => sp.delete(k));
      }),
    [replace],
  );
  const count = useMemo(() => Object.values(selected).reduce((n, ids) => n + (ids?.length ?? 0), 0), [selected]);

  return { selected, toggle, clearGroup, clearAll, count };
}

export function useListSort<T extends string>(allowed: readonly T[], fallback: T): [T, (next: T) => void] {
  const { searchParams, replace } = useParamWriter();
  const raw = searchParams.get(QP.sort);
  const value = raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  const set = useCallback(
    (next: T) => replace((sp) => (next === fallback ? sp.delete(QP.sort) : sp.set(QP.sort, next))),
    [replace, fallback],
  );
  return [value, set];
}

export interface SetTabOptions {
  /** Keep `f_*` tag filters and `sort` when switching tab (default false: groups differ per tab). */
  keepFilters?: boolean;
}

export function usePageTab<T extends string>(
  allowed: readonly T[],
  fallback: T,
): [T, (next: T, opts?: SetTabOptions) => void] {
  const { searchParams, replace } = useParamWriter();
  const raw = searchParams.get(QP.tab);
  const value = raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  const set = useCallback(
    (next: T, opts?: SetTabOptions) =>
      replace((sp) => {
        if (next === fallback) sp.delete(QP.tab);
        else sp.set(QP.tab, next);
        if (!opts?.keepFilters) {
          Array.from(sp.keys())
            .filter((k) => k.startsWith(QP.tagPrefix))
            .forEach((k) => sp.delete(k));
          sp.delete(QP.sort);
          sp.delete(QP.more);
        }
      }),
    [replace, fallback],
  );
  return [value, set];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Layers: detail stack, ad drawer, save modal, view more                    */
/* ────────────────────────────────────────────────────────────────────────── */

export interface DetailStackApi {
  stack: DetailTarget[];
  /** Pushes a deeper level (history PUSH). */
  push: (t: DetailTarget) => void;
  /** Back chip: removes the top level. */
  pop: () => void;
  /** Closes the whole overlay. */
  close: () => void;
}

export function useDetailStack(): DetailStackApi {
  const { searchParams, push: pushParams, close: closeParams } = useParamWriter();
  const raw = searchParams.get(QP.detail);
  const stack = useMemo(() => parseDetailStack(raw), [raw]);

  const push = useCallback(
    (t: DetailTarget) => {
      pushParams((sp) => {
        const cur = parseDetailStack(sp.get(QP.detail));
        sp.set(QP.detail, serializeDetailStack([...cur, t]));
      }, "detail");
    },
    [pushParams],
  );
  const pop = useCallback(() => {
    closeParams("detail", (sp) => {
      const cur = parseDetailStack(sp.get(QP.detail));
      const next = cur.slice(0, -1);
      if (next.length) sp.set(QP.detail, serializeDetailStack(next));
      else sp.delete(QP.detail);
    });
  }, [closeParams]);
  const close = useCallback(() => {
    // history-back only undoes ONE level, so it is only safe when depth is 1
    closeParams("detail", (sp) => sp.delete(QP.detail), parseDetailStack(raw).length <= 1);
  }, [closeParams, raw]);

  return { stack, push, pop, close };
}

export function useAdDrawer(): { adId: string | null; open: (id: string) => void; close: () => void } {
  const { searchParams, push, replace, close: closeParams } = useParamWriter();
  const adId = searchParams.get(QP.ad) || null;
  const open = useCallback(
    (id: string) => {
      // Already open (e.g. "similar ads") → swap in place; still ONE layer for Back.
      if (adId) replace((sp) => sp.set(QP.ad, id));
      else push((sp) => sp.set(QP.ad, id), "ad");
    },
    [push, replace, adId],
  );
  const close = useCallback(() => closeParams("ad", (sp) => sp.delete(QP.ad)), [closeParams]);
  return { adId, open, close };
}

export function useSaveModal(): {
  target: SavedItemRef | null;
  open: (ref: SavedItemRef) => void;
  close: () => void;
} {
  const { searchParams, push, close: closeParams } = useParamWriter();
  const modal = searchParams.get(QP.modal);
  const rawTarget = searchParams.get(QP.target);
  const target = useMemo(() => (modal === "save" ? parseSavedRef(rawTarget) : null), [modal, rawTarget]);
  const open = useCallback(
    (ref: SavedItemRef) =>
      push((sp) => {
        sp.set(QP.modal, "save");
        sp.set(QP.target, serializeSavedRef(ref));
      }, "modal"),
    [push],
  );
  const close = useCallback(
    () =>
      closeParams("modal", (sp) => {
        sp.delete(QP.modal);
        sp.delete(QP.target);
      }),
    [closeParams],
  );
  return { target, open, close };
}

export function useViewMore(): { group: TagGroupKey | null; open: (key: TagGroupKey) => void; close: () => void } {
  const { searchParams, push, close: closeParams } = useParamWriter();
  const raw = searchParams.get(QP.more);
  const group = isTagGroupKey(raw) ? raw : null;
  const open = useCallback((key: TagGroupKey) => push((sp) => sp.set(QP.more, key), "more"), [push]);
  const close = useCallback(() => closeParams("more", (sp) => sp.delete(QP.more)), [closeParams]);
  return { group, open, close };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Compact header on scroll                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Pattern from `src/pages/insights-v2/InsightsV2Feed.tsx` (~584-596): rAF-throttled
 * passive scroll listener on the scroll container. `ref` is a callback ref so it works
 * whenever the container mounts. Attach it to the element that actually scrolls.
 */
export function useCompactOnScroll(threshold = 80): {
  ref: (node: HTMLElement | null) => void;
  compact: boolean;
} {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      // Hysteresis: collapsing the header grows the scroller, which can pull
      // scrollTop back under the threshold and flicker. Re-expand only near the top.
      raf = requestAnimationFrame(() =>
        setCompact((prev) => (prev ? el.scrollTop > threshold / 4 : el.scrollTop > threshold)),
      );
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [el, threshold]);
  return { ref: setEl, compact };
}
