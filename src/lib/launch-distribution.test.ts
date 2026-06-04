import { describe, it, expect } from "vitest";
import {
  splitByStatus,
  slotConsuming,
  slotConsumingCount,
  aggregateCapacityByPage,
  fillFirst,
  equalDistribute,
  duplicateToEach,
  distribute,
  validateStrategy,
  computeOutputCount,
  targetPairsCount,
  uniquePagesCount,
  budgetByCurrency,
  MAX_ADS_PER_PAGE,
  type StatusSplit,
  type PageCapacity,
  type DistAd,
} from "./launch-distribution";
import {
  PAIR_ACC_A_PAGE_1,
  PAIR_ACC_B_PAGE_2,
  PAIR_ACC_C_PAGE_3,
  PAIR_ACC_A_SHARED_PAGE,
  PAIR_ACC_B_SHARED_PAGE,
  THREE_DISTINCT_PAIRS,
  TWO_PAIRS_SHARED_PAGE,
  makeActiveAds,
  makeScheduledAds,
  makePausedAds,
  makeAds,
  ADSET_USD,
  ADSET_INR,
  ADSET_EUR_ZERO,
  ADSET_GBP_NULL,
  MIXED_CURRENCY_ADSETS,
} from "./launch-distribution-fixtures";
import {
  getMockCapacities,
  mockCurrentActiveFor,
  withPageFull,
  withPageCapacity,
} from "@/components/launch/distribution/mock-page-capacity";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Empty (0 active) capacities for a set of unique fb_page_ids. */
function emptyCaps(fbPageIds: string[]): PageCapacity[] {
  return Array.from(new Set(fbPageIds)).map((fb_page_id) => ({ fb_page_id, currentActive: 0 }));
}

function split(
  active: number,
  paused: number,
  scheduled = 0,
  unknownStatuses: string[] = []
): StatusSplit {
  const ads: DistAd[] = [
    ...makeActiveAds(active),
    ...makeScheduledAds(scheduled),
    ...makePausedAds(paused),
    ...unknownStatuses.map((s, i) => ({ id: `unk_${i}`, status: s, adset_id: "adset_1" })),
  ];
  return splitByStatus(ads);
}

const sumActive = (perPair: { activeToLaunch: number }[]) => perPair.reduce((s, p) => s + p.activeToLaunch, 0);
const sumScheduled = (perPair: { scheduledToLaunch: number }[]) => perPair.reduce((s, p) => s + p.scheduledToLaunch, 0);
const sumPaused = (perPair: { pausedToAdd: number }[]) => perPair.reduce((s, p) => s + p.pausedToAdd, 0);

// ─── splitByStatus ───────────────────────────────────────────────────────────

describe("splitByStatus", () => {
  it("buckets active / scheduled / paused / unknown and never treats unknown as paused", () => {
    const ads: DistAd[] = [
      { id: "1", status: "active", adset_id: "a" },
      { id: "2", status: "paused", adset_id: "a" },
      { id: "3", status: "archived", adset_id: "a" },
      { id: "4", status: "deleted", adset_id: "a" },
      { id: "5", status: "in_review", adset_id: "a" },
      { id: "6", status: "scheduled", adset_id: "a" },
    ];
    const s = splitByStatus(ads);
    expect(s.active.map((a) => a.id)).toEqual(["1"]);
    expect(s.scheduled.map((a) => a.id)).toEqual(["6"]);
    expect(s.paused.map((a) => a.id)).toEqual(["2"]);
    expect(s.unknown.map((a) => a.id)).toEqual(["3", "4", "5"]);
  });

  it("routes 'scheduled' / 'SCHEDULED' to the scheduled bucket (case-insensitive, trimmed)", () => {
    const s = splitByStatus([
      { id: "1", status: "scheduled", adset_id: "a" },
      { id: "2", status: "SCHEDULED", adset_id: "a" },
      { id: "3", status: " Scheduled ", adset_id: "a" },
      { id: "4", status: "schedule", adset_id: "a" }, // NOT "scheduled" -> unknown
    ]);
    expect(s.scheduled.map((a) => a.id)).toEqual(["1", "2", "3"]);
    expect(s.unknown.map((a) => a.id)).toEqual(["4"]); // typo stays unknown
    expect(s.active).toHaveLength(0);
    expect(s.paused).toHaveLength(0);
  });

  it("is case-insensitive and trims", () => {
    const s = splitByStatus([
      { id: "1", status: "ACTIVE", adset_id: "a" },
      { id: "2", status: " Paused ", adset_id: "a" },
    ]);
    expect(s.active).toHaveLength(1);
    expect(s.paused).toHaveLength(1);
  });
});

// ─── slotConsuming / slotConsumingCount ─────────────────────────────────────

describe("slotConsuming / slotConsumingCount", () => {
  it("active + scheduled consume slots; paused + unknown do NOT", () => {
    const s = split(3, 7, 2, ["archived"]); // 3 active, 2 scheduled, 7 paused, 1 unknown
    expect(slotConsumingCount(s)).toBe(5); // 3 active + 2 scheduled
    expect(slotConsuming(s).map((a) => a.status)).toEqual(["active", "active", "active", "scheduled", "scheduled"]);
  });
});

// ─── aggregateCapacityByPage ───────────────────────────────────────────────────

describe("aggregateCapacityByPage", () => {
  it("collapses duplicate fb_page_ids to ONE bucket (shared page across accounts)", () => {
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_shared", currentActive: 40 }];
    const map = aggregateCapacityByPage(TWO_PAIRS_SHARED_PAGE, caps);
    expect(map.size).toBe(1);
    expect(map.get("fbpage_shared")?.currentActive).toBe(40);
  });

  it("defaults a referenced-but-missing page to 0 active", () => {
    const map = aggregateCapacityByPage([PAIR_ACC_A_PAGE_1], []);
    expect(map.get("fbpage_1")?.currentActive).toBe(0);
  });
});

// ─── helpers: counts ──────────────────────────────────────────────────────────

describe("targetPairsCount / uniquePagesCount", () => {
  it("counts pairs and distinct fb_page_ids", () => {
    expect(targetPairsCount(THREE_DISTINCT_PAIRS)).toBe(3);
    expect(uniquePagesCount(THREE_DISTINCT_PAIRS)).toBe(3);
    expect(targetPairsCount(TWO_PAIRS_SHARED_PAGE)).toBe(2);
    expect(uniquePagesCount(TWO_PAIRS_SHARED_PAGE)).toBe(1); // shared page
  });
});

// ─── Fill First ───────────────────────────────────────────────────────────────

describe("fillFirst", () => {
  it("happy path: fills first pair's page to capacity, overflows to next", () => {
    // page1 already has 200 active -> 50 free. page2 empty -> 250 free.
    const caps: PageCapacity[] = [
      { fb_page_id: "fbpage_1", currentActive: 200 },
      { fb_page_id: "fbpage_2", currentActive: 0 },
    ];
    const s = split(80, 0);
    const perPair = fillFirst(s, [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], caps);
    expect(perPair[0].activeToLaunch).toBe(50); // page1 had 50 free
    expect(perPair[1].activeToLaunch).toBe(30); // overflow
    expect(perPair[0].status).toBe("partial");
    expect(perPair[1].status).toBe("ok");
    expect(sumActive(perPair)).toBe(80);
  });

  it("paused ride along (250 active + 500 paused, 2 empty pairs)", () => {
    const caps = emptyCaps(["fbpage_1", "fbpage_2"]);
    const s = split(250, 500);
    const perPair = fillFirst(s, [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], caps);
    // Active fills page 1 fully (250) then page 2 gets 0.
    expect(perPair[0].activeToLaunch).toBe(250);
    expect(perPair[1].activeToLaunch).toBe(0);
    // Paused never consume active slots; spread evenly without blocking.
    expect(sumPaused(perPair)).toBe(500);
    expect(perPair[0].pausedToAdd).toBe(250);
    expect(perPair[1].pausedToAdd).toBe(250);
    expect(sumActive(perPair)).toBe(250);
  });

  it("SHARED page across two accounts is counted ONCE (no double-count)", () => {
    // One shared 250-slot bucket starting empty. 300 active across 2 pairs.
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_shared", currentActive: 0 }];
    const s = split(300, 0);
    const perPair = fillFirst(s, TWO_PAIRS_SHARED_PAGE, caps);
    // First pair drains the shared bucket (250); second pair sees 0 left.
    expect(perPair[0].activeToLaunch).toBe(250);
    expect(perPair[1].activeToLaunch).toBe(0);
    expect(sumActive(perPair)).toBe(250); // NOT 500 — single bucket
    expect(perPair[1].status).toBe("full");
  });

  it("marks a pair full when its page bucket is already exhausted", () => {
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_1", currentActive: 250 }];
    const s = split(10, 0);
    const perPair = fillFirst(s, [PAIR_ACC_A_PAGE_1], caps);
    expect(perPair[0].activeToLaunch).toBe(0);
    expect(perPair[0].status).toBe("full");
  });

  it("scheduled ads consume slots exactly like active (active+scheduled overflow together)", () => {
    // page1 has 200 active -> 50 free. 30 active + 40 scheduled = 70 live to place.
    const caps: PageCapacity[] = [
      { fb_page_id: "fbpage_1", currentActive: 200 },
      { fb_page_id: "fbpage_2", currentActive: 0 },
    ];
    const s = split(30, 0, 40); // 30 active, 40 scheduled, 0 paused
    const perPair = fillFirst(s, [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], caps);
    expect(perPair[0].activeToLaunch).toBe(50); // page1 had 50 free, filled with live ads
    expect(perPair[1].activeToLaunch).toBe(20); // overflow of remaining 20 live
    expect(sumActive(perPair)).toBe(70); // active + scheduled placed = 70
    // scheduledToLaunch reconciles back to the 40 scheduled across pairs.
    expect(sumScheduled(perPair)).toBe(40);
    expect(perPair[0].status).toBe("partial");
  });

  it("paused ride along alongside active + scheduled without consuming slots", () => {
    const caps = emptyCaps(["fbpage_1", "fbpage_2"]);
    const s = split(100, 80, 150); // 100 active + 150 scheduled = 250 live, 80 paused
    const perPair = fillFirst(s, [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], caps);
    // 250 live fill page1 (250 free) fully; page2 gets 0 live.
    expect(perPair[0].activeToLaunch).toBe(250);
    expect(perPair[1].activeToLaunch).toBe(0);
    expect(sumActive(perPair)).toBe(250);
    expect(sumScheduled(perPair)).toBe(150); // scheduled column sums back
    expect(sumPaused(perPair)).toBe(80); // paused placed, never blocking
  });
});

// ─── Equal Distribute ─────────────────────────────────────────────────────────

describe("equalDistribute", () => {
  it("happy path: splits total evenly across 3 pairs", () => {
    const s = split(90, 0);
    const perPair = equalDistribute(s, THREE_DISTINCT_PAIRS, []);
    expect(perPair.map((p) => p.activeToLaunch)).toEqual([30, 30, 30]);
    expect(sumActive(perPair)).toBe(90);
  });

  it("tie-break: 101 total across 2 pairs -> 51/50, extra on the FIRST pair", () => {
    const s = split(101, 0);
    const perPair = equalDistribute(s, [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], []);
    const totals = perPair.map((p) => p.activeToLaunch + p.pausedToAdd);
    expect(totals).toEqual([51, 50]);
  });

  it("balances TOTAL (active+paused): 1 active + 99 paused over 2 pairs -> ~50/50 total", () => {
    const s = split(1, 99);
    const perPair = equalDistribute(s, [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], []);
    const totals = perPair.map((p) => p.activeToLaunch + p.pausedToAdd);
    expect(totals).toEqual([50, 50]);
    // Active fills earliest pairs first.
    expect(perPair[0].activeToLaunch).toBe(1);
    expect(perPair[1].activeToLaunch).toBe(0);
    expect(sumActive(perPair)).toBe(1);
    expect(sumPaused(perPair)).toBe(99);
  });

  it("distributes paused remainder into earliest pairs after active fills", () => {
    // 3 active + 2 paused over 2 pairs: total 5 -> [3,2]. active fills first.
    const s = split(3, 2);
    const perPair = equalDistribute(s, [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], []);
    expect(perPair[0]).toMatchObject({ activeToLaunch: 3, pausedToAdd: 0 }); // quota 3, all active
    expect(perPair[1]).toMatchObject({ activeToLaunch: 0, pausedToAdd: 2 }); // quota 2, all paused
  });

  it("balances TOTAL incl scheduled: 20 active + 20 scheduled + 20 paused over 3 pairs -> 20 each", () => {
    const s = split(20, 20, 20); // active=20, paused=20, scheduled=20 -> total 60
    const perPair = equalDistribute(s, THREE_DISTINCT_PAIRS, []);
    const totals = perPair.map((p) => p.activeToLaunch + p.pausedToAdd);
    expect(totals).toEqual([20, 20, 20]); // TOTAL ads balanced
    // Slot-consuming (active+scheduled=40) fills earliest quotas first: [20,20,0].
    expect(perPair.map((p) => p.activeToLaunch)).toEqual([20, 20, 0]);
    expect(sumActive(perPair)).toBe(40); // active + scheduled placed
    expect(sumPaused(perPair)).toBe(20);
  });

  it("scheduledToLaunch sums back to total scheduled across pairs (Equal)", () => {
    const s = split(40, 0, 35); // 40 active + 35 scheduled = 75 live over 3 pairs
    const perPair = equalDistribute(s, THREE_DISTINCT_PAIRS, []);
    expect(sumScheduled(perPair)).toBe(35); // exact reconciliation
    // scheduledToLaunch never exceeds that pair's slot-consuming count.
    for (const p of perPair) expect(p.scheduledToLaunch).toBeLessThanOrEqual(p.activeToLaunch);
  });
});

// ─── Duplicate To Each ──────────────────────────────────────────────────────────

describe("duplicateToEach", () => {
  it("happy path: every pair gets ALL active + ALL paused", () => {
    const s = split(10, 5);
    const perPair = duplicateToEach(s, THREE_DISTINCT_PAIRS, []);
    for (const p of perPair) {
      expect(p.activeToLaunch).toBe(10);
      expect(p.pausedToAdd).toBe(5);
    }
    expect(sumActive(perPair)).toBe(30); // 10 x 3 pairs
  });

  it("two pairs sharing one page need active x 2 on that single bucket", () => {
    const active = 100;
    const s = split(active, 0);
    const perPair = duplicateToEach(s, TWO_PAIRS_SHARED_PAGE, []);
    // Each pair wants all 100 active; shared page demand = 100 x 2 = 200.
    const sharedDemand = perPair
      .filter((p) => p.pair.fb_page_id === "fbpage_shared")
      .reduce((sum, p) => sum + p.activeToLaunch, 0);
    expect(sharedDemand).toBe(active * 2);
  });

  it("every pair gets ALL scheduled; live count = active + scheduled per pair", () => {
    const s = split(10, 5, 4); // 10 active, 4 scheduled, 5 paused
    const perPair = duplicateToEach(s, THREE_DISTINCT_PAIRS, []);
    for (const p of perPair) {
      expect(p.activeToLaunch).toBe(14); // 10 active + 4 scheduled (slot-consuming)
      expect(p.scheduledToLaunch).toBe(4); // each pair gets ALL scheduled
      expect(p.pausedToAdd).toBe(5);
    }
    // Duplicate gives every pair all scheduled (not summing to total scheduled).
    expect(sumScheduled(perPair)).toBe(4 * 3);
  });
});

// ─── distribute dispatcher ──────────────────────────────────────────────────────

describe("distribute", () => {
  const s = split(6, 0);
  it("dispatches to the right strategy", () => {
    expect(distribute("equal", s, THREE_DISTINCT_PAIRS, []).map((p) => p.activeToLaunch)).toEqual([2, 2, 2]);
    expect(distribute("duplicate", s, THREE_DISTINCT_PAIRS, []).map((p) => p.activeToLaunch)).toEqual([6, 6, 6]);
    expect(sumActive(distribute("fill_first", s, THREE_DISTINCT_PAIRS, emptyCaps(["fbpage_1", "fbpage_2", "fbpage_3"])))).toBe(6);
  });
});

// ─── validateStrategy ───────────────────────────────────────────────────────────

describe("validateStrategy", () => {
  it("0 pairs -> unavailable with 'Select at least one Page'", () => {
    const v = validateStrategy("fill_first", split(10, 0), [], []);
    expect(v.available).toBe(false);
    expect(v.reason).toBe("Select at least one Page");
    expect(v.perPair).toEqual([]);
    expect(v.perPageDemand).toEqual([]);
  });

  it("0 active -> available (paused never block)", () => {
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_1", currentActive: 250 }]; // full page
    const v = validateStrategy("fill_first", split(0, 40), [PAIR_ACC_A_PAGE_1], caps);
    expect(v.available).toBe(true);
    expect(v.reason).toBeUndefined();
  });

  it("counts excludedUnknown without treating them as paused", () => {
    const v = validateStrategy("equal", split(2, 2, 0, ["archived", "deleted"]), THREE_DISTINCT_PAIRS, emptyCaps(["fbpage_1", "fbpage_2", "fbpage_3"]));
    expect(v.excludedUnknown).toBe(2);
  });

  it("full page -> unavailable with a reason NAMING the page", () => {
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_1", currentActive: 250 }];
    const v = validateStrategy("equal", split(5, 0), [PAIR_ACC_A_PAGE_1], caps);
    expect(v.available).toBe(false);
    expect(v.reason).toContain("Sunrise Coffee");
    const page = v.perPageDemand.find((d) => d.fb_page_id === "fbpage_1");
    expect(page?.status).toBe("over");
    expect(page?.availableSlots).toBe(0);
  });

  it("fill_first full page -> unavailable, reason names the full page", () => {
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_1", currentActive: 250 }];
    const v = validateStrategy("fill_first", split(1, 0), [PAIR_ACC_A_PAGE_1], caps);
    expect(v.available).toBe(false);
    expect(v.reason).toContain("Sunrise Coffee");
  });

  it("fill_first available when Σ available across unique pages >= active", () => {
    // page1: 50 free, page2: 50 free -> 100 free total; need 100 active.
    const caps: PageCapacity[] = [
      { fb_page_id: "fbpage_1", currentActive: 200 },
      { fb_page_id: "fbpage_2", currentActive: 200 },
    ];
    const v = validateStrategy("fill_first", split(100, 0), [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], caps);
    expect(v.available).toBe(true);
  });

  it("fill_first unavailable when Σ available < active (overflow exhausted)", () => {
    const caps: PageCapacity[] = [
      { fb_page_id: "fbpage_1", currentActive: 200 }, // 50 free
      { fb_page_id: "fbpage_2", currentActive: 200 }, // 50 free
    ];
    const v = validateStrategy("fill_first", split(101, 0), [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], caps);
    expect(v.available).toBe(false);
    expect(v.reason).toContain("101");
  });

  it("equal: every pair gets >= base and active validated per unique page", () => {
    // 60 active over 3 empty pages -> 20 each, all fit.
    const v = validateStrategy("equal", split(60, 0), THREE_DISTINCT_PAIRS, emptyCaps(["fbpage_1", "fbpage_2", "fbpage_3"]));
    expect(v.available).toBe(true);
    expect(v.perPair.map((p) => p.activeToLaunch + p.pausedToAdd)).toEqual([20, 20, 20]);
  });

  it("duplicate: shared page needs available >= activeCount x pairs sharing it", () => {
    // Shared page empty (250 free). 100 active duplicated to 2 pairs -> 200 needed. OK.
    const okCaps: PageCapacity[] = [{ fb_page_id: "fbpage_shared", currentActive: 0 }];
    const ok = validateStrategy("duplicate", split(100, 0), TWO_PAIRS_SHARED_PAGE, okCaps);
    expect(ok.available).toBe(true);
    const sharedDemand = ok.perPageDemand.find((d) => d.fb_page_id === "fbpage_shared");
    expect(sharedDemand?.activeDemand).toBe(200);

    // 130 active duplicated to 2 pairs -> 260 needed > 250. Over capacity.
    const overCaps: PageCapacity[] = [{ fb_page_id: "fbpage_shared", currentActive: 0 }];
    const over = validateStrategy("duplicate", split(130, 0), TWO_PAIRS_SHARED_PAGE, overCaps);
    expect(over.available).toBe(false);
    expect(over.reason).toContain("Shared Brand Page");
    expect(over.perPageDemand.find((d) => d.fb_page_id === "fbpage_shared")?.activeDemand).toBe(260);
  });

  it("duplicate to distinct pages: each page validated independently", () => {
    const caps = emptyCaps(["fbpage_1", "fbpage_2", "fbpage_3"]);
    const v = validateStrategy("duplicate", split(50, 0), THREE_DISTINCT_PAIRS, caps);
    expect(v.available).toBe(true);
    for (const d of v.perPageDemand) expect(d.activeDemand).toBe(50);
  });

  it("scheduled consumes a slot like active: 200 active + 60 scheduled on a 250 page -> demand 260 -> over", () => {
    // Empty page (250 free). equal across one pair -> all 260 live land here.
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_1", currentActive: 0 }];
    const v = validateStrategy("equal", split(200, 0, 60), [PAIR_ACC_A_PAGE_1], caps);
    expect(v.available).toBe(false);
    const page = v.perPageDemand.find((d) => d.fb_page_id === "fbpage_1");
    expect(page?.activeDemand).toBe(260); // active + scheduled, NOT just active
    expect(page?.status).toBe("over");
  });

  it("0 active but scheduled present still consumes slots (260 scheduled over 250 -> over)", () => {
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_1", currentActive: 0 }];
    const v = validateStrategy("equal", split(0, 0, 260), [PAIR_ACC_A_PAGE_1], caps);
    expect(v.available).toBe(false); // scheduled alone blocks — not "0 active -> available"
    expect(v.perPageDemand.find((d) => d.fb_page_id === "fbpage_1")?.activeDemand).toBe(260);
  });

  it("mixed active+scheduled+paused: demand = active+scheduled only; paused excluded but still placed", () => {
    // 100 active + 100 scheduled = 200 live (fits 250); 500 paused excluded from demand.
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_1", currentActive: 0 }];
    const v = validateStrategy("equal", split(100, 500, 100), [PAIR_ACC_A_PAGE_1], caps);
    expect(v.available).toBe(true); // 200 live <= 250; paused never counted
    const page = v.perPageDemand.find((d) => d.fb_page_id === "fbpage_1");
    expect(page?.activeDemand).toBe(200); // paused NOT in demand
    // Paused still placed on the pair (rides along).
    expect(v.perPair[0].pausedToAdd).toBe(500);
    expect(v.perPair[0].activeToLaunch).toBe(200); // active + scheduled
  });

  it("fill_first Σ-available check counts active+scheduled as demand", () => {
    // page1: 50 free, page2: 50 free -> 100 free. 60 active + 50 scheduled = 110 live > 100.
    const caps: PageCapacity[] = [
      { fb_page_id: "fbpage_1", currentActive: 200 },
      { fb_page_id: "fbpage_2", currentActive: 200 },
    ];
    const v = validateStrategy("fill_first", split(60, 0, 50), [PAIR_ACC_A_PAGE_1, PAIR_ACC_B_PAGE_2], caps);
    expect(v.available).toBe(false);
    expect(v.reason).toContain("110"); // 110 active/scheduled ads to launch
  });

  it("PerPairAllocation.scheduledToLaunch sums back to total scheduled (Fill/Equal); Duplicate gives each pair all", () => {
    const caps = emptyCaps(["fbpage_1", "fbpage_2", "fbpage_3"]);
    const s = split(30, 10, 24); // 30 active + 24 scheduled live, 10 paused

    const fill = validateStrategy("fill_first", s, THREE_DISTINCT_PAIRS, caps);
    expect(fill.perPair.reduce((a, p) => a + p.scheduledToLaunch, 0)).toBe(24);

    const eq = validateStrategy("equal", s, THREE_DISTINCT_PAIRS, caps);
    expect(eq.perPair.reduce((a, p) => a + p.scheduledToLaunch, 0)).toBe(24);

    const dup = validateStrategy("duplicate", s, THREE_DISTINCT_PAIRS, caps);
    for (const p of dup.perPair) expect(p.scheduledToLaunch).toBe(24); // each pair gets ALL
  });
});

// ─── computeOutputCount ─────────────────────────────────────────────────────────

describe("computeOutputCount", () => {
  it("fill_first / equal -> selectedAdCount; duplicate -> selectedAdCount x pairs", () => {
    expect(computeOutputCount("fill_first", 40, 3)).toBe(40);
    expect(computeOutputCount("equal", 40, 3)).toBe(40);
    expect(computeOutputCount("duplicate", 40, 3)).toBe(120);
    expect(computeOutputCount("duplicate", 0, 5)).toBe(0);
  });
});

// ─── budgetByCurrency ────────────────────────────────────────────────────────────

describe("budgetByCurrency", () => {
  it("mixed currencies produce SEPARATE entries, never summed across currencies", () => {
    const ads: DistAd[] = [
      { id: "a1", status: "active", adset_id: "adset_usd" },
      { id: "a2", status: "active", adset_id: "adset_inr" },
    ];
    const res = budgetByCurrency(ads, MIXED_CURRENCY_ADSETS, "equal", 1);
    const usd = res.find((r) => r.currency === "USD");
    const inr = res.find((r) => r.currency === "INR");
    expect(usd?.base).toBe(100);
    expect(inr?.base).toBe(5000);
    expect(res).toHaveLength(2);
  });

  it("dedupes distinct parent adsets (same adset across many ads counted once)", () => {
    const ads: DistAd[] = makeAds(5, "active", "adset_usd");
    const res = budgetByCurrency(ads, [ADSET_USD], "equal", 1);
    expect(res).toHaveLength(1);
    expect(res[0].base).toBe(100); // not 500
  });

  it("null / zero budget adsets increment unavailableAdsets and are excluded from base", () => {
    const ads: DistAd[] = [
      { id: "z", status: "active", adset_id: "adset_eur_zero" },
      { id: "n", status: "active", adset_id: "adset_gbp_null" },
      { id: "u", status: "active", adset_id: "adset_usd" },
    ];
    const res = budgetByCurrency(ads, MIXED_CURRENCY_ADSETS, "equal", 1);
    const eur = res.find((r) => r.currency === "EUR");
    const gbp = res.find((r) => r.currency === "GBP");
    const usd = res.find((r) => r.currency === "USD");
    expect(eur).toMatchObject({ base: 0, unavailableAdsets: 1 });
    expect(gbp).toMatchObject({ base: 0, unavailableAdsets: 1 });
    expect(usd).toMatchObject({ base: 100, unavailableAdsets: 0 });
  });

  it("duplicate multiplier multiplies base by targetPairsCount per currency", () => {
    const ads: DistAd[] = [
      { id: "a1", status: "active", adset_id: "adset_usd" },
      { id: "a2", status: "active", adset_id: "adset_inr" },
    ];
    const res = budgetByCurrency(ads, MIXED_CURRENCY_ADSETS, "duplicate", 3);
    const usd = res.find((r) => r.currency === "USD");
    expect(usd).toMatchObject({ base: 100, multiplier: 3, final: 300 });
    const inr = res.find((r) => r.currency === "INR");
    expect(inr).toMatchObject({ base: 5000, multiplier: 3, final: 15000 });
  });

  it("non-duplicate strategies use multiplier 1", () => {
    const ads: DistAd[] = [{ id: "a1", status: "active", adset_id: "adset_usd" }];
    expect(budgetByCurrency(ads, [ADSET_USD], "fill_first", 4)[0].multiplier).toBe(1);
    expect(budgetByCurrency(ads, [ADSET_USD], "equal", 4)[0].final).toBe(100);
  });
});

// ─── mock-page-capacity ──────────────────────────────────────────────────────────

describe("mock-page-capacity", () => {
  it("is deterministic and shared pages collapse to ONE stable bucket", () => {
    const a = getMockCapacities(TWO_PAIRS_SHARED_PAGE);
    const b = getMockCapacities(TWO_PAIRS_SHARED_PAGE);
    expect(a).toHaveLength(1); // shared fb_page_id collapses
    expect(a).toEqual(b); // deterministic
    expect(a[0].currentActive).toBe(mockCurrentActiveFor("fbpage_shared"));
  });

  it("accepts raw fb_page_ids and dedupes them", () => {
    const caps = getMockCapacities(["p1", "p1", "p2"]);
    expect(caps).toHaveLength(2);
  });

  it("produces a spread including at least one full page across enough pages", () => {
    const ids = Array.from({ length: 200 }, (_, i) => `seed_page_${i}`);
    const caps = getMockCapacities(ids);
    const values = caps.map((c) => c.currentActive);
    expect(values.some((v) => v === MAX_ADS_PER_PAGE)).toBe(true); // a full page exists
    expect(values.some((v) => v >= 200 && v < MAX_ADS_PER_PAGE)).toBe(true); // near-full band
    expect(values.some((v) => v >= 30 && v <= 120)).toBe(true); // healthy band
    expect(values.every((v) => v >= 0 && v <= MAX_ADS_PER_PAGE)).toBe(true);
  });

  it("withPageFull / withPageCapacity override the seed for tests", () => {
    const base = getMockCapacities([PAIR_ACC_A_PAGE_1]);
    const full = withPageFull(base, "fbpage_1");
    expect(full.find((c) => c.fb_page_id === "fbpage_1")?.currentActive).toBe(MAX_ADS_PER_PAGE);
    const set = withPageCapacity(base, "fbpage_1", 123);
    expect(set.find((c) => c.fb_page_id === "fbpage_1")?.currentActive).toBe(123);
  });
});

// ─── Cross-strategy: shared-page no-double-count (explicit) ──────────────────────

describe("shared fb_page_id is one 250-slot bucket across all strategies", () => {
  it("aggregate + validate agree that two pairs share a single page bucket", () => {
    const caps: PageCapacity[] = [{ fb_page_id: "fbpage_shared", currentActive: 100 }];
    expect(aggregateCapacityByPage(TWO_PAIRS_SHARED_PAGE, caps).size).toBe(1);

    // 150 active duplicated to 2 pairs -> 300 demand on one bucket with 150 free.
    const v = validateStrategy("duplicate", split(150, 0), TWO_PAIRS_SHARED_PAGE, caps);
    const shared = v.perPageDemand.find((d) => d.fb_page_id === "fbpage_shared");
    expect(v.perPageDemand).toHaveLength(1); // collapsed to one page row
    expect(shared?.availableSlots).toBe(150);
    expect(shared?.activeDemand).toBe(300);
    expect(v.available).toBe(false);
  });
});
