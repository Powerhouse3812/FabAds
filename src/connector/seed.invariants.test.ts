/**
 * Connector — invariants that must hold for the seeded demo state.
 *
 * These are not unit tests of the selectors; they pin the DEMO. The seed is
 * hand-authored and the dependency graph is hand-maintained, so the two can
 * silently drift apart — a catalogue edit could leave a seeded connection
 * booting as "Needs attention", or quietly kill the one-click dependency
 * block that the whole feature is demonstrated through. That failure is
 * invisible in a type-check and easy to miss by eye.
 */
import { describe, expect, it } from "vitest";
import { buildSeedAudit, buildSeedConnections } from "@/connector/seed";
import {
  brokenGrants,
  buildDisablePlanForAction,
  buildEnablePlan,
  buildLimitBlockMessage,
  connectionHealth,
  isOverAnyLimit,
  limitStatus,
  windowStartOf,
} from "@/connector/selectors";
import { assertCatalogueIsAcyclic } from "@/connector/catalogue";

const NOW = new Date("2026-08-10T11:00:00Z").getTime();
const conns = buildSeedConnections(NOW);
const audit = buildSeedAudit(conns, NOW);
const byId = (id: string) => conns.find((c) => c.id === id)!;

describe("connector seed", () => {
  it("catalogue graph is acyclic and within the one-hop cap", () => {
    expect(() => assertCatalogueIsAcyclic()).not.toThrow();
  });

  it("no seeded connection has broken grants", () => {
    for (const c of conns) {
      expect({ id: c.id, broken: brokenGrants(c) }).toEqual({ id: c.id, broken: [] });
    }
  });

  it("health states cover the demo matrix", () => {
    const health = Object.fromEntries(conns.map((c) => [c.id, connectionHealth(c, NOW)]));
    expect(health["conn-seed-claude"]).toBe("active");
    expect(health["conn-seed-cursor"]).toBe("active");
    expect(health["conn-seed-chatgpt"]).toBe("pending");
    expect(health["conn-seed-opsbot"]).toBe("over_limit");
    expect(health["conn-seed-windsurf"]).toBe("revoked");
    // The expired token — the state the "Issue a new token" flow exists for.
    expect(health["conn-seed-vscode"]).toBe("expired");
  });

  it("the expired connection keeps the grant the recovery strip promises to keep", () => {
    const c = byId("conn-seed-vscode");
    expect(c.tokenExpiresAt).not.toBeNull();
    expect(Date.parse(c.tokenExpiresAt!)).toBeLessThan(NOW);
    expect(c.permissions.reports.read).toBe("view");
    expect(c.permissions.reports.write).toContain("reports.pause_resume");
    // History predates the expiry, or the strip is promising to keep nothing.
    const rows = audit.filter((e) => e.connectionId === "conn-seed-vscode");
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(Date.parse(r.at)).toBeLessThan(Date.parse(c.tokenExpiresAt!));
    }
  });

  it("HERO: Claude blocks on Insights -> launch from ad and names every consequence", () => {
    const plan = buildEnablePlan(byId("conn-seed-claude"), "insights.launch_from_ad");
    expect(plan.blocked).toBe(true);
    expect(plan.enablesWrites).toContain("launch.create_draft");
    expect(plan.summary.length).toBeGreaterThanOrEqual(1);
  });

  it("REVERSE: Ops bot refuses to drop launch.create_draft while dependents are on", () => {
    const plan = buildDisablePlanForAction(byId("conn-seed-opsbot"), "launch.create_draft");
    expect(plan.blocked).toBe(true);
    expect(plan.alsoDisables.sort()).toEqual(
      ["catalogue.launch_from_product", "insights.launch_from_ad", "launch.publish", "reports.duplicate"].sort(),
    );
  });

  it("Ops bot is genuinely over its launch limit", () => {
    const c = byId("conn-seed-opsbot");
    expect(isOverAnyLimit(c, NOW)).toBe(true);
    expect(limitStatus(c, "launches", NOW).state).toBe("blocked");
  });

  it("Claude's budget meter reads NEAR, not blocked", () => {
    expect(limitStatus(byId("conn-seed-claude"), "budget_change", NOW).state).toBe("near");
  });

  it("audit covers all four outcomes and ChatGPT has none", () => {
    const outcomes = new Set(audit.map((e) => e.outcome));
    expect([...outcomes].sort()).toEqual(
      ["allowed", "blocked_limit", "blocked_permission"].sort(),
    );
    expect(audit.filter((e) => e.connectionId === "conn-seed-chatgpt")).toHaveLength(0);
    expect(audit.every((e) => e.connectionName.length > 0)).toBe(true);
  });

  /* ---------------------------------------------------------------- */
  /*  detail = the attempt, blockMessage = the agent's own words       */
  /* ---------------------------------------------------------------- */

  it("every audit detail is an attempt, never a FabAds error string", () => {
    // `detail` fills the "What it did" column. A FabAds refusal there means the
    // log can no longer say WHICH thing was refused — the defect this split fixes.
    const offenders = audit.filter((e) => e.detail.startsWith("FabAds:"));
    expect(offenders.map((e) => e.id)).toEqual([]);
  });

  it("blocked rows quote the agent verbatim in blockMessage, and each names a different attempt", () => {
    const expected = buildLimitBlockMessage({
      meter: "launches",
      used: 10,
      max: 10,
      window: "week",
      currentWindowStart: windowStartOf("week", NOW),
    });

    const blockedLimit = audit.filter((e) => e.outcome === "blocked_limit");
    expect(blockedLimit).toHaveLength(3);
    for (const e of blockedLimit) {
      // Byte-identical to what the recorder would hand the agent — the parity
      // claim, pinned. A second hand-written copy of the sentence fails here.
      expect(e.blockMessage).toBe(expected);
    }
    // …and the three rows are still individually identifiable.
    expect(new Set(blockedLimit.map((e) => e.detail)).size).toBe(3);
  });

  it("the blocked_permission row also carries the verbatim refusal", () => {
    const row = audit.find((e) => e.outcome === "blocked_permission")!;
    expect(row.blockMessage).toMatch(/^FabAds: /);
    expect(row.detail).not.toBe(row.blockMessage);
  });

  it("allowed rows carry no blockMessage", () => {
    for (const e of audit.filter((e) => e.outcome === "allowed")) {
      expect({ id: e.id, blockMessage: e.blockMessage }).toEqual({
        id: e.id,
        blockMessage: null,
      });
    }
  });

  it("seed and recorder produce the IDENTICAL limit sentence for the same inputs", () => {
    // Same meter, same window, same numbers → one sentence. Both sides call
    // `buildLimitBlockMessage`; if either ever hand-writes its own copy, the
    // strings drift and this fails.
    const opsBot = byId("conn-seed-opsbot");
    const status = limitStatus(opsBot, "launches", NOW);
    const fromRecorderInputs = buildLimitBlockMessage({
      meter: "launches",
      used: status.used,
      max: status.max,
      window: opsBot.limits.window,
      currentWindowStart: windowStartOf(opsBot.limits.window, NOW),
    });
    const seeded = audit.find((e) => e.outcome === "blocked_limit")!;
    expect(seeded.blockMessage).toBe(fromRecorderInputs);
    // And it reads as English, not as a column heading spliced mid-sentence.
    expect(seeded.blockMessage).toContain("launch limit reached");
    expect(seeded.blockMessage).not.toContain("Launches it can publish");
  });

  it("no seeded audit row mixes currencies — USD only", () => {
    expect(audit.filter((e) => /[₹€£]/.test(e.detail)).map((e) => e.id)).toEqual([]);
  });
});
