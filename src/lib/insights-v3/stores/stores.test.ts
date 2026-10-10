import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FIRST_VISIT_SEED_DAYS } from "../types";

type Stores = typeof import("./index");

const DAY = 86_400_000;

async function freshStores(): Promise<Stores> {
  vi.resetModules();
  return import("./index");
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("last visit (read once per session, first visit seeds 2 days back)", () => {
  it("first-ever visit → now − FIRST_VISIT_SEED_DAYS, then stores now for next time", async () => {
    const s = await freshStores();
    const now = Date.UTC(2026, 9, 10, 12);
    const last = s.getLastVisitAt(now);
    expect(Date.parse(last)).toBe(now - FIRST_VISIT_SEED_DAYS * DAY);
    expect(window.localStorage.getItem(s.STORAGE_KEYS.lastVisit)).toBe(new Date(now).toISOString());
    // same session → same value even if asked later
    expect(s.getLastVisitAt(now + 5 * 60_000)).toBe(last);
  });

  it("a reload in the same session keeps the session's value", async () => {
    const now = Date.UTC(2026, 9, 10, 12);
    const a = await freshStores();
    const first = a.getLastVisitAt(now);
    const b = await freshStores(); // module reload, sessionStorage kept
    expect(b.getLastVisitAt(now + 60_000)).toBe(first);
  });

  it("a new session uses the previous visit time", async () => {
    const t1 = Date.UTC(2026, 9, 10, 12);
    const a = await freshStores();
    a.getLastVisitAt(t1);
    window.sessionStorage.clear(); // new browser session
    const b = await freshStores();
    expect(b.getLastVisitAt(t1 + 60_000)).toBe(new Date(t1).toISOString());
  });

  it("works with storage blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const s = await freshStores();
    const now = Date.UTC(2026, 9, 10, 12);
    expect(Date.parse(s.getLastVisitAt(now))).toBe(now - 2 * DAY);
    expect(s.listBoards().length).toBe(3);
    expect(s.toggleFollowPage("pg-999")).toBe(true);
    expect(s.isPageFollowed("pg-999")).toBe(true);
  });
});

describe("seeded demo state", () => {
  it("seeds 4 followed pages, 1 industry, 2 competitor domains + 1 page, 3 boards (2 pinned), 6 saved ads", async () => {
    const s = await freshStores();
    expect(s.getFollows().pages).toHaveLength(4);
    expect(s.getFollows().industries).toHaveLength(1);
    expect(s.getCompetitors().domains).toHaveLength(2);
    expect(s.getCompetitors().pages).toHaveLength(1);
    const boards = s.listBoards();
    expect(boards).toHaveLength(3);
    expect(boards.filter((b) => b.pinned)).toHaveLength(2);
    const types = new Set(boards.flatMap((b) => b.items.map((i) => i.ref.type)));
    for (const t of ["ad", "hook", "framework", "landing-page", "offer"]) expect(types.has(t as never)).toBe(true);
    expect(s.getSavedAds()).toHaveLength(6);
    expect(s.myFeedsAds().length).toBeGreaterThan(0);
  });

  it("does not re-seed a key that exists (an emptied list stays empty)", async () => {
    const a = await freshStores();
    for (const b of a.listBoards()) a.deleteBoard(b.id);
    expect(a.listBoards()).toHaveLength(0);
    const b = await freshStores();
    expect(b.listBoards()).toHaveLength(0);
  });

  it("resetInsightsV3DemoState re-seeds everything except last visit", async () => {
    const s = await freshStores();
    for (const b of s.listBoards()) s.deleteBoard(b.id);
    s.unsaveAd(s.getSavedAds()[0].adId);
    s.resetInsightsV3DemoState();
    expect(s.listBoards()).toHaveLength(3);
    expect(s.getSavedAds()).toHaveLength(6);
  });
});

describe("follows + competitors", () => {
  it("toggle pages, industries and competitor marks; prefs + My Feeds follow", async () => {
    const s = await freshStores();
    const before = s.myFeedsAds().length;
    expect(s.toggleFollowIndustry("search-arb")).toBe(true);
    expect(s.getUserPrefs().followedIndustryIds).toContain("search-arb");
    expect(s.myFeedsAds().length).toBeGreaterThan(before);
    expect(s.toggleFollowIndustry("search-arb")).toBe(false);
    expect(s.toggleCompetitor("domain", "dm-001")).toBe(s.isCompetitor("domain", "dm-001"));
    s.markCompetitor("page", "pg-002");
    expect(s.isCompetitor("page", "pg-002")).toBe(true);
    s.unmarkCompetitor("page", "pg-002");
    expect(s.isCompetitor("page", "pg-002")).toBe(false);
  });

  it("prefs snapshot is referentially stable until something changes", async () => {
    const s = await freshStores();
    const a = s.getUserPrefs();
    expect(s.getUserPrefs()).toBe(a);
    s.toggleFollowPage("pg-050");
    expect(s.getUserPrefs()).not.toBe(a);
  });
});

describe("boards + saved ads", () => {
  it("create / rename / delete / add / remove with dedupe and board counts", async () => {
    const s = await freshStores();
    const board = s.createBoard("  Hooks to test  ", { description: "Q4" });
    expect(board.name).toBe("Hooks to test");
    const ref = { type: "hook" as const, id: "warning" };
    expect(s.addToBoard(board.id, ref)).toBe(true);
    expect(s.addToBoard(board.id, ref)).toBe(false); // no duplicates
    expect(s.getBoard(board.id)?.items[0].snapshot.title).toBe("Warning");
    expect(s.isSavedAnywhere(ref)).toBe(true);
    const other = s.createBoard("Second");
    s.addToBoard(other.id, ref);
    expect(s.boardCountForItem(ref)).toBe(2);
    s.renameBoard(board.id, "Renamed");
    expect(s.getBoard(board.id)?.name).toBe("Renamed");
    s.removeFromBoard(board.id, ref);
    expect(s.boardCountForItem(ref)).toBe(1);
    expect(s.toggleInBoard(other.id, ref)).toBe(false);
    expect(s.isSavedAnywhere(ref)).toBe(false);
    s.deleteBoard(board.id);
    expect(s.getBoard(board.id)).toBeUndefined();
    expect(s.addToBoard("missing", ref)).toBe(false);
  });

  it("any savable type can go to a board", async () => {
    const s = await freshStores();
    const b = s.createBoard("Mixed");
    const { INDEX } = await import("../data");
    const refs = [
      { type: "ad" as const, id: INDEX.ads[0].id },
      { type: "framework" as const, id: "pas" },
      { type: "angle" as const, id: INDEX.universe.elements.angle[0].id },
      { type: "concept" as const, id: "ugc-selfie" },
      { type: "domain" as const, id: INDEX.advertisers.find((a) => a.kind === "domain")!.id },
      { type: "page" as const, id: INDEX.advertisers.find((a) => a.kind === "page")!.id },
      { type: "landing-page" as const, id: INDEX.landingPages[0].id },
      { type: "offer" as const, id: INDEX.offers[0].id },
    ];
    for (const r of refs) expect(s.addToBoard(b.id, r)).toBe(true);
    expect(s.getBoard(b.id)?.items).toHaveLength(refs.length);
  });

  it("pinning is capped at 5", async () => {
    const s = await freshStores();
    const pinnedNow = s.listBoards().filter((b) => b.pinned).length;
    const extra = Array.from({ length: 5 }, (_, i) => s.createBoard(`B${i}`));
    let pinned = pinnedNow;
    for (const b of extra) {
      const r = s.togglePin(b.id);
      if (pinned < s.MAX_PINNED_BOARDS) {
        expect(r).toEqual({ ok: true, pinned: true });
        pinned++;
      } else {
        expect(r).toEqual({ ok: false, reason: "limit" });
      }
    }
    expect(s.listBoards().filter((b) => b.pinned)).toHaveLength(s.MAX_PINNED_BOARDS);
    const anyPinned = s.listBoards().find((b) => b.pinned)!;
    expect(s.togglePin(anyPinned.id)).toEqual({ ok: true, pinned: false });
    expect(s.togglePin("missing")).toEqual({ ok: false, reason: "not-found" });
  });

  it("saved ads: ads only, toggle + dedupe", async () => {
    const s = await freshStores();
    const id = "ad-0400";
    const had = s.isAdSaved(id);
    expect(s.toggleSavedAd(id)).toBe(!had);
    s.saveAd(id);
    s.saveAd(id);
    expect(s.getSavedAds().filter((e) => e.adId === id)).toHaveLength(1);
    s.unsaveAd(id);
    expect(s.isAdSaved(id)).toBe(false);
  });

  it("writes persist under the fabads:insights-v3: namespace", async () => {
    const s = await freshStores();
    s.createBoard("Persisted");
    const raw = window.localStorage.getItem(s.STORAGE_KEYS.boards) ?? "";
    expect(raw).toContain("Persisted");
    for (const k of Object.values(s.STORAGE_KEYS)) expect(k.startsWith("fabads:insights-v3:")).toBe(true);
  });
});
