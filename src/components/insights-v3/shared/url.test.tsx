import { describe, expect, it, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { DetailTarget } from "@/lib/insights-v3/types";
import {
  SCOPE_STORAGE_KEY,
  parseDetailStack,
  parseSavedRef,
  parseTarget,
  readScopeFromParams,
  readSelectedTags,
  serializeDetailStack,
  serializeSavedRef,
  serializeTarget,
  useAdDrawer,
  useDetailStack,
  useInsightsScope,
  useListSort,
  usePageTab,
  useSaveModal,
  useSelectedTags,
  useViewMore,
  writeScopeToParams,
} from "./url";

const targets: DetailTarget[] = [
  { kind: "advertiser", advertiserKind: "domain", id: "napchief.com" },
  { kind: "advertiser", advertiserKind: "page", id: "pg-12" },
  { kind: "element", elementType: "framework", id: "pas" },
  { kind: "element", elementType: "hook", id: "curiosity-question" },
  { kind: "element", elementType: "angle", id: "save-money" },
  { kind: "element", elementType: "concept", id: "ugc-selfie" },
  { kind: "landing-page", id: "lp-9" },
  { kind: "offer", id: "offer.example.com" },
];

describe("detail targets", () => {
  it("round-trips every token", () => {
    for (const t of targets) expect(parseTarget(serializeTarget(t))).toEqual(t);
  });

  it("round-trips a whole stack", () => {
    expect(parseDetailStack(serializeDetailStack(targets))).toEqual(targets);
  });

  it("keeps ids that contain a colon", () => {
    const t: DetailTarget = { kind: "landing-page", id: "a:b:c" };
    expect(parseTarget(serializeTarget(t))).toEqual(t);
  });

  it("drops garbage instead of throwing", () => {
    expect(parseTarget("")).toBeNull();
    expect(parseTarget(":x")).toBeNull();
    expect(parseTarget("nope:123")).toBeNull();
    expect(parseTarget("domain:")).toBeNull();
    expect(parseTarget("domain")).toBeNull();
    expect(parseTarget("ad:123")).toBeNull();
    expect(parseTarget(undefined)).toBeNull();
    expect(parseTarget(null)).toBeNull();
    expect(parseDetailStack("~~domain:a.com~garbage~hook:~hook:h1~")).toEqual([
      { kind: "advertiser", advertiserKind: "domain", id: "a.com" },
      { kind: "element", elementType: "hook", id: "h1" },
    ]);
    expect(parseDetailStack(null)).toEqual([]);
    expect(parseDetailStack("")).toEqual([]);
  });

  it("never writes ad targets into the overlay stack", () => {
    expect(serializeDetailStack([{ kind: "ad", id: "1" }, targets[0]])).toBe("domain:napchief.com");
  });
});

describe("saved ref", () => {
  it("round-trips and rejects garbage", () => {
    expect(parseSavedRef(serializeSavedRef({ type: "landing-page", id: "lp-1" }))).toEqual({
      type: "landing-page",
      id: "lp-1",
    });
    expect(parseSavedRef("banana:1")).toBeNull();
    expect(parseSavedRef("ad:")).toBeNull();
    expect(parseSavedRef("")).toBeNull();
    expect(parseSavedRef(null)).toBeNull();
  });
});

describe("scope params", () => {
  it("defaults, omits defaults, rejects bad period", () => {
    expect(readScopeFromParams(new URLSearchParams(""))).toEqual({
      industry: "all", category: "all", period: "all", myPrefsOnly: false,
    });
    expect(readScopeFromParams(new URLSearchParams("period=banana")).period).toBe("all");
    const sp = new URLSearchParams("industry=vsl&foo=1");
    writeScopeToParams(sp, { industry: "all", category: "all", period: "all", myPrefsOnly: false });
    expect(sp.toString()).toBe("foo=1");
  });
});

describe("tag params", () => {
  it("ignores unknown groups and empty ids", () => {
    expect(readSelectedTags(new URLSearchParams("f_hookStyle=a,b,,a&f_nope=x&f_angle="))).toEqual({
      hookStyle: ["a", "b"],
    });
  });
});

/* ── hooks ─────────────────────────────────────────────────────────────── */

function wrapperFor(initial: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  );
}

function useWithLocation<T>(hook: () => T) {
  const loc = useLocation();
  return { api: hook(), search: loc.search };
}

describe("hooks", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("useInsightsScope: write keeps category when industry changes", () => {
    const { result } = renderHook(() => useWithLocation(useInsightsScope), {
      wrapper: wrapperFor("/x?category=auto-insurance"),
    });
    act(() => result.current.api[1]({ industry: "lead-gen" }));
    expect(result.current.api[0]).toMatchObject({ industry: "lead-gen", category: "auto-insurance" });
    expect(result.current.search).toContain("industry=lead-gen");
    expect(result.current.search).toContain("category=auto-insurance");
  });

  it("useInsightsScope: restores from sessionStorage when URL has no scope", () => {
    window.sessionStorage.setItem(
      SCOPE_STORAGE_KEY,
      JSON.stringify({ industry: "vsl", category: "all", period: "30d", myPrefsOnly: true }),
    );
    const { result } = renderHook(() => useWithLocation(useInsightsScope), { wrapper: wrapperFor("/x?sort=a") });
    expect(result.current.api[0]).toMatchObject({ industry: "vsl", period: "30d", myPrefsOnly: false });
    expect(result.current.search).toContain("sort=a");
  });

  it("useInsightsScope: a shared link beats sessionStorage", () => {
    window.sessionStorage.setItem(
      SCOPE_STORAGE_KEY,
      JSON.stringify({ industry: "vsl", category: "all", period: "30d", myPrefsOnly: false }),
    );
    const { result } = renderHook(() => useWithLocation(useInsightsScope), {
      wrapper: wrapperFor("/x?industry=telehealth"),
    });
    expect(result.current.api[0].industry).toBe("telehealth");
    expect(result.current.api[0].period).toBe("all");
  });

  it("useSelectedTags: toggle, clearGroup, clearAll, count", () => {
    const { result } = renderHook(() => useWithLocation(useSelectedTags), { wrapper: wrapperFor("/x") });
    act(() => result.current.api.toggle("hookStyle", "a"));
    act(() => result.current.api.toggle("hookStyle", "b"));
    act(() => result.current.api.toggle("angle", "z"));
    expect(result.current.api.selected).toEqual({ hookStyle: ["a", "b"], angle: ["z"] });
    expect(result.current.api.count).toBe(3);
    act(() => result.current.api.toggle("hookStyle", "a"));
    expect(result.current.api.selected.hookStyle).toEqual(["b"]);
    act(() => result.current.api.clearGroup("hookStyle"));
    expect(result.current.api.selected.hookStyle).toBeUndefined();
    act(() => result.current.api.clearAll());
    expect(result.current.api.count).toBe(0);
    expect(result.current.search).toBe("");
  });

  it("useListSort / usePageTab validate against the allowed list", () => {
    const { result } = renderHook(
      () => ({
        sort: useListSort(["a", "b"] as const, "a"),
        tab: usePageTab(["x", "y"] as const, "x"),
        tags: useSelectedTags(),
      }),
      { wrapper: wrapperFor("/p?sort=zzz&tab=nope") },
    );
    expect(result.current.sort[0]).toBe("a");
    expect(result.current.tab[0]).toBe("x");
    act(() => result.current.tags.toggle("angle", "q"));
    act(() => result.current.sort[1]("b"));
    expect(result.current.sort[0]).toBe("b");
    act(() => result.current.tab[1]("y"));
    expect(result.current.tab[0]).toBe("y");
    // tab switch clears filters + sort
    expect(result.current.tags.count).toBe(0);
    expect(result.current.sort[0]).toBe("a");
  });

  it("useDetailStack: push / pop / close", () => {
    const { result } = renderHook(() => useWithLocation(useDetailStack), {
      wrapper: wrapperFor("/x?detail=domain:a.com~garbage"),
    });
    expect(result.current.api.stack).toHaveLength(1);
    act(() => result.current.api.push({ kind: "element", elementType: "hook", id: "h1" }));
    expect(result.current.api.stack).toHaveLength(2);
    expect(result.current.search).toContain("detail=domain%3Aa.com%7Ehook%3Ah1");
    act(() => result.current.api.pop());
    expect(result.current.api.stack).toHaveLength(1);
    act(() => result.current.api.close());
    expect(result.current.api.stack).toHaveLength(0);
    expect(result.current.search).toBe("");
  });

  it("useAdDrawer / useSaveModal / useViewMore open and close", () => {
    const { result } = renderHook(
      () => ({ ad: useAdDrawer(), save: useSaveModal(), more: useViewMore(), loc: useLocation() }),
      { wrapper: wrapperFor("/x") },
    );
    act(() => result.current.ad.open("ad-1"));
    expect(result.current.ad.adId).toBe("ad-1");
    act(() => result.current.ad.open("ad-2"));
    expect(result.current.ad.adId).toBe("ad-2");
    act(() => result.current.ad.close());
    expect(result.current.ad.adId).toBeNull();

    act(() => result.current.save.open({ type: "hook", id: "h1" }));
    expect(result.current.save.target).toEqual({ type: "hook", id: "h1" });
    expect(result.current.loc.search).toContain("modal=save");
    act(() => result.current.save.close());
    expect(result.current.save.target).toBeNull();
    expect(result.current.loc.search).toBe("");

    act(() => result.current.more.open("keyword"));
    expect(result.current.more.group).toBe("keyword");
    act(() => result.current.more.close());
    expect(result.current.more.group).toBeNull();
  });

  it("useViewMore ignores an unknown group", () => {
    const { result } = renderHook(() => useViewMore(), { wrapper: wrapperFor("/x?more=banana") });
    expect(result.current.group).toBeNull();
  });
});
