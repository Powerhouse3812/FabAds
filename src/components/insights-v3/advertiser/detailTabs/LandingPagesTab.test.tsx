import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { INDEX, MODULE_NOW, getAds } from "@/lib/insights-v3/data";
import { adsInBaseScope, adsInScope, advertiserDetail, type SelectorCtx } from "@/lib/insights-v3/selectors";
import { DEFAULT_SCOPE, type AdvertiserKind } from "@/lib/insights-v3/types";
import { mergeLandingPages } from "../LandingMergedModel";
import { LandingPagesTab } from "./LandingPagesTab";
import type { DetailTabProps } from "./types";

const ctx: SelectorCtx = { now: MODULE_NOW };
const scope = DEFAULT_SCOPE;
const baseAds = adsInBaseScope(getAds(), scope, ctx);

function propsFor(kind: AdvertiserKind, id: string): DetailTabProps {
  const detail = advertiserDetail(kind, id, baseAds, scope, ctx)!;
  const ads = adsInScope(baseAds, scope, ctx).filter((a) => (kind === "page" ? a.pageAdvertiserId === id : a.domainAdvertiserId === id));
  return { kind, id, detail, ads, baseAds, scope, ctx };
}

const adCount = (m: Map<string, unknown[]>, id: string) => m.get(id)?.length ?? 0;
const top = (kind: AdvertiserKind, by: Map<string, unknown[]>) =>
  INDEX.advertisers.filter((a) => a.kind === kind).sort((a, b) => adCount(by, b.id) - adCount(by, a.id))[0];
const topDomain = top("domain", INDEX.adsByDomain);
const topPage = top("page", INDEX.adsByPage);

function renderTab(props: DetailTabProps) {
  return render(
    <MemoryRouter>
      <LandingPagesTab {...props} />
    </MemoryRouter>,
  );
}

describe("mergeLandingPages", () => {
  it("lists every page / domain the old `related` list showed, for every competitor with ads", () => {
    let checked = 0;
    for (const kind of ["domain", "page"] as const) {
      const by = kind === "domain" ? INDEX.adsByDomain : INDEX.adsByPage;
      for (const adv of INDEX.advertisers.filter((a) => a.kind === kind && adCount(by, a.id) > 0)) {
        const p = propsFor(kind, adv.id);
        if (p.detail.basedOn === 0) continue;
        const m = mergeLandingPages(kind, p.ads, p.detail.landingPages.rows);
        const merged = new Set([...m.uncaptured.map((c) => c.id), ...m.rows.flatMap((r) => r.connected.map((c) => c.id))]);
        const related = new Set(p.detail.related.items.map((i) => i.id));
        expect(merged, `${kind} ${adv.id}`).toEqual(related);
        expect(m.otherCount).toBe(related.size);
        expect(m.rows.map((r) => r.row.id)).toEqual(p.detail.landingPages.rows.map((r) => r.id));
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it("counts each connected competitor's ads per landing page", () => {
    const p = propsFor("domain", topDomain.id);
    const m = mergeLandingPages("domain", p.ads, p.detail.landingPages.rows);
    for (const { row, connected } of m.rows) {
      expect(connected.reduce((n, c) => n + c.count, 0)).toBe(row.adsTotal);
      for (let i = 1; i < connected.length; i += 1) expect(connected[i - 1].count).toBeGreaterThanOrEqual(connected[i].count);
    }
  });

  it("puts ads without a captured landing page into `uncaptured`, never into a row", () => {
    const p = propsFor("domain", topDomain.id);
    const [first, ...rest] = p.ads;
    const loose = { ...first, landingPageId: null, pageAdvertiserId: "pg-loose-test" };
    const m = mergeLandingPages("domain", [loose, ...rest], p.detail.landingPages.rows);
    const before = mergeLandingPages("domain", p.ads, p.detail.landingPages.rows);
    expect(m.uncaptured).toContainEqual({ id: "pg-loose-test", name: "pg-loose-test", count: 1 });
    expect(m.uncapturedAds).toBe(before.uncapturedAds + (first.landingPageId ? 1 : 0));
    expect(m.rows.some((r) => r.connected.some((c) => c.id === "pg-loose-test"))).toBe(false);
  });
});

describe("LandingPagesTab", () => {
  it("domain: one list with 'Run by' page chips, the count line, and ads as one row", () => {
    const p = propsFor("domain", topDomain.id);
    renderTab(p);
    const m = mergeLandingPages("domain", p.ads, p.detail.landingPages.rows);
    expect(screen.getByText(/landing pages ·/).textContent).toBe(`${m.rows.length} landing pages · ${m.otherCount} pages`);
    expect(screen.getAllByText("Run by:").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sends to:")).toBeNull();
    // Only one list of landing pages (the old second "Pages running ads to this domain" section is gone).
    expect(screen.queryByText(/Pages running ads to this domain/)).toBeNull();
    const first = within(screen.getByRole("list", { name: "Landing pages" })).getAllByRole("listitem")[0];
    expect(first.textContent).toMatch(/\d+ ads?\s*·\s*\d+ active/);
  });

  it("page: 'Sends to' domain chips", () => {
    renderTab(propsFor("page", topPage.id));
    expect(screen.getAllByText("Sends to:").length).toBeGreaterThan(0);
    expect(screen.queryByText("Run by:")).toBeNull();
  });

  it("shows only 3 chips per row, with a +N button that reveals the rest", () => {
    const p = propsFor("domain", topDomain.id);
    const m = mergeLandingPages("domain", p.ads, p.detail.landingPages.rows);
    const wide = m.rows.find((r) => r.connected.length > 3);
    if (!wide) return; // data-dependent: nothing to expand for this competitor
    renderTab(p);
    const list = screen.getByRole("list", { name: `Run by for ${wide.row.title ?? wide.row.domain}` });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    const more = within(list).getByRole("button", { name: /more/ });
    expect(more).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(more);
    expect(within(list).getAllByRole("listitem")).toHaveLength(wide.connected.length + 1);
  });

  it("collapses the 'Why were these two lists different?' note by default and toggles it", () => {
    renderTab(propsFor("domain", topDomain.id));
    const btn = screen.getByRole("button", { name: /Why were these two lists different/ });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/So the counts do/)).toBeNull();
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/So the counts do/)).toBeInTheDocument();
  });

  it("previews 8 rows, then 'Show all N landing pages'", () => {
    const p = propsFor("domain", topDomain.id);
    const n = p.detail.landingPages.rows.length;
    renderTab(p);
    if (n <= 8) return expect(screen.queryByRole("button", { name: /Show all/ })).toBeNull();
    expect(within(screen.getByRole("list", { name: "Landing pages" })).getAllByRole("listitem").length).toBe(8);
    fireEvent.click(screen.getByRole("button", { name: `Show all ${n} landing pages` }));
    expect(within(screen.getByRole("list", { name: "Landing pages" })).getAllByRole("listitem").length).toBe(n);
  });

  it("renders the 'No landing page captured' group when ads have no landing page", () => {
    const p = propsFor("domain", topDomain.id);
    const loose = p.ads.map((a, i) => (i === 0 ? { ...a, landingPageId: null } : a));
    renderTab({ ...p, ads: loose });
    expect(screen.getByRole("region", { name: "No landing page captured" })).toBeInTheDocument();
  });

  it("is disabled with a reason when there is nothing at all", () => {
    const p = propsFor("domain", topDomain.id);
    renderTab({ ...p, ads: [], detail: { ...p.detail, landingPages: { basedOn: 0, rows: [] } } });
    expect(screen.getByLabelText(/Landing pages \(unavailable\)/)).toBeInTheDocument();
  });
});
