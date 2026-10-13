import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { LandingPageRow } from "@/lib/insights-v3/selectors";
import { groupOffers } from "../OffersList";
import { OffersTab } from "./OffersTab";
import type { DetailTabProps } from "./types";

let n = 0;
function lp(over: Partial<LandingPageRow>): LandingPageRow {
  n += 1;
  return {
    id: `lp-${n}`,
    offerDomain: null,
    funnelType: null,
    funnelLabel: null,
    adsTotal: 1,
    adsActive: 0,
    winners: 0,
    longestRunDays: null,
    isRising: false,
    adIds: [],
    ...over,
  } as LandingPageRow;
}

function renderTab(rows: LandingPageRow[]) {
  const props = { detail: { landingPages: { basedOn: 0, rows } } } as unknown as DetailTabProps;
  return render(
    <MemoryRouter>
      <OffersTab {...props} />
    </MemoryRouter>,
  );
}

describe("groupOffers", () => {
  const rows = [
    lp({ offerDomain: "small.com", adsTotal: 2, adsActive: 1, funnelLabel: "Quiz" }),
    lp({ offerDomain: "big.com", adsTotal: 6, adsActive: 3, winners: 1, longestRunDays: 40, funnelLabel: "Quiz" }),
    lp({ offerDomain: "big.com", adsTotal: 4, adsActive: 1, winners: 2, longestRunDays: 90, funnelLabel: "Advertorial", isRising: true }),
    lp({ offerDomain: null, adsTotal: 5 }),
    lp({ offerDomain: null, adsTotal: 1 }),
  ];

  it("groups landing pages by offer and sums the numbers", () => {
    const { offers } = groupOffers(rows);
    expect(offers).toHaveLength(2);
    const big = offers.find((o) => o.offer === "big.com")!;
    expect(big).toMatchObject({ landingPages: 2, adsTotal: 10, adsActive: 4, winners: 3, longestRunDays: 90, isRising: true });
    expect(big.funnels.sort()).toEqual(["Advertorial", "Quiz"]);
    expect(offers.find((o) => o.offer === "small.com")!.isRising).toBe(false);
  });

  it("sorts by total ads, most first", () => {
    expect(groupOffers(rows).offers.map((o) => o.offer)).toEqual(["big.com", "small.com"]);
  });

  it("counts untraced landing pages separately and never as an offer", () => {
    const g = groupOffers(rows);
    expect(g.untracedLandingPages).toBe(2);
    expect(g.offers.some((o) => !o.offer)).toBe(false);
    expect(g.adsBehindOffers).toBe(12);
  });
});

describe("OffersTab", () => {
  it("renders the header, an offer chip per row, 'N ads · N active' and the untraced line", () => {
    renderTab([
      lp({ offerDomain: "big.com", adsTotal: 12, adsActive: 4, winners: 2, longestRunDays: 30, funnelLabel: "Quiz", isRising: true }),
      lp({ offerDomain: "small.com", adsTotal: 3, adsActive: 0 }),
      lp({ offerDomain: null }),
      lp({ offerDomain: null }),
    ]);
    expect(screen.getByText(/The offers this competitor's landing pages send people to/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toMatch(/2\s*offers\s*·\s*4\s*landing pages/);
    const list = screen.getByRole("list", { name: "Offers" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByRole("button", { name: /Offer: big\.com/i })).toBeInTheDocument();
    expect(items[0].textContent).toMatch(/12\s*ads/);
    expect(items[0].textContent).toMatch(/4\s*active/);
    expect(items[0].textContent).toContain("Rising");
    expect(items[1].textContent).not.toContain("Rising");
    expect(screen.getByText(/send to an offer we could not trace/).textContent).toMatch(/^2\s*landing pages send to an offer we could not trace/);
    expect(screen.getByText(/Based on/)).toBeInTheDocument();
  });

  it("omits the untraced line when every landing page is traced", () => {
    renderTab([lp({ offerDomain: "a.com" })]);
    expect(screen.queryByText(/could not trace/)).toBeNull();
  });

  it("shows 8 rows then 'Show all N'", () => {
    renderTab(Array.from({ length: 11 }, (_, i) => lp({ offerDomain: `o${i}.com`, adsTotal: 20 - i })));
    const list = screen.getByRole("list", { name: "Offers" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "Show all 11" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(11);
    expect(screen.getByRole("button", { name: "Show fewer" })).toBeInTheDocument();
  });

  it("caps funnel pills at 2 with a +N", () => {
    renderTab([
      lp({ offerDomain: "a.com", funnelLabel: "Quiz" }),
      lp({ offerDomain: "a.com", funnelLabel: "Advertorial" }),
      lp({ offerDomain: "a.com", funnelLabel: "Lead form" }),
    ]);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("empty state: a disabled section with a plain reason when nothing is traced", () => {
    renderTab([lp({ offerDomain: null }), lp({ offerDomain: null })]);
    expect(screen.getByText("None of this competitor's ads in this scope lead to an offer we could trace.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Offers" })).toBeNull();
  });
});
