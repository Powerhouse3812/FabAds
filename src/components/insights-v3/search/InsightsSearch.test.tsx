import { beforeAll, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { getAds, INDEX } from "@/lib/insights-v3/data";
import { DEFAULT_SCOPE } from "@/lib/insights-v3/types";
import { InsightsSearch } from "./InsightsSearch";
import { SEARCH_SCOPE_ORDER, searchInsights } from "./searchIndex";

beforeAll(() => {
  // cmdk needs these; jsdom lacks them.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= function () {};
});

const ad = getAds()[0];
const pageWord = ad.pageName.split(" ")[0];

describe("searchInsights", () => {
  it("returns every V2 scope, with zero counts for an empty query", () => {
    const out = searchInsights("", { scope: DEFAULT_SCOPE, feedAds: [], boards: [] });
    expect(out.scopes.map((s) => s.key)).toEqual(SEARCH_SCOPE_ORDER);
    expect(out.total).toBe(0);
  });

  it("counts follow the scope bar and results cap at 5", () => {
    const all = searchInsights(pageWord, { scope: DEFAULT_SCOPE, feedAds: [], boards: [] });
    const discover = all.scopes.find((s) => s.key === "discover")!;
    expect(discover.count).toBeGreaterThan(0);
    expect(discover.results.length).toBeLessThanOrEqual(5);
    const narrowed = searchInsights(pageWord, {
      scope: { ...DEFAULT_SCOPE, industry: "no-such-industry" },
      feedAds: [],
      boards: [],
    });
    expect(narrowed.scopes.find((s) => s.key === "discover")!.count).toBe(0);
  });

  it("finds elements, advertisers and landing pages with the right layer to open", () => {
    const hook = INDEX.universe.elements.hook[0];
    const out = searchInsights(hook.label, { scope: DEFAULT_SCOPE, feedAds: [], boards: [] });
    const el = out.scopes.find((s) => s.key === "elements")!;
    expect(el.results.some((r) => r.open.kind === "detail" && r.open.target.kind === "element")).toBe(true);

    const adv = searchInsights(ad.pageName, { scope: DEFAULT_SCOPE, feedAds: [], boards: [] }).scopes.find((s) => s.key === "advertisers")!;
    expect(adv.results[0].open).toMatchObject({ kind: "detail", target: { kind: "advertiser" } });

    const lp = INDEX.landingPages.find((l) => INDEX.adsByLandingPage.has(l.id))!;
    const lpOut = searchInsights(lp.domain, { scope: DEFAULT_SCOPE, feedAds: [], boards: [] }).scopes.find((s) => s.key === "lp-offers")!;
    expect(lpOut.count).toBeGreaterThan(0);
  });

  it("matches boards by name or item title", () => {
    const boards = [
      { id: "b1", name: "Q4 swipe file", pinned: false, createdAt: "", updatedAt: "", items: [] },
      { id: "b2", name: "Other", pinned: false, createdAt: "", updatedAt: "", items: [{ ref: { type: "ad" as const, id: "x" }, addedAt: "", snapshot: { title: "Swipe-worthy headline" } }] },
    ];
    const out = searchInsights("swipe", { scope: DEFAULT_SCOPE, feedAds: [], boards });
    expect(out.scopes.find((s) => s.key === "boards")!.count).toBe(2);
  });
});

function Where() {
  const loc = useLocation();
  return <div data-testid="where">{loc.pathname + loc.search}</div>;
}

function renderSearch(url = "/industry-insights/discover") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <InsightsSearch />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("<InsightsSearch />", () => {
  it("renders a closed field, then scope counts + grouped results on typing", () => {
    renderSearch();
    const input = screen.getByRole("combobox", { name: /search industry insights v2/i });
    expect(screen.queryByText(/in…/)).toBeNull();
    fireEvent.change(input, { target: { value: pageWord } });
    const summary = screen.getByRole("list", { name: /matches per section/i });
    for (const label of ["My Feeds", "Discover", "Competitors", "Creative elements", "Landing pages & offers", "Boards"]) {
      expect(within(summary).getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(/See all \d+ in Discover/)).toBeInTheDocument();
  });

  it("picking an ad opens the drawer layer via ?ad=", () => {
    renderSearch();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: ad.headline } });
    const options = screen.getAllByRole("option");
    const adOption = options.find((o) => o.textContent?.includes(ad.headline))!;
    fireEvent.click(adOption);
    // Headlines repeat across ads, so check the opened ad carries the headline.
    const opened = /[?&]ad=([^&]+)/.exec(screen.getByTestId("where").textContent!)?.[1];
    expect(getAds().find((a) => a.id === opened)?.headline).toBe(ad.headline);
  });

  it("See all in Discover carries q and the scope", () => {
    renderSearch("/industry-insights/elements?industry=lead-gen");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "insurance" } });
    fireEvent.click(screen.getByText(/See all \d+ in Discover/));
    const where = screen.getByTestId("where").textContent!;
    expect(where).toContain("/industry-insights/discover?");
    expect(where).toContain("industry=lead-gen");
    expect(where).toContain("q=insurance");
  });

  it("QA-17: narrow widths get a short placeholder; the long one shows from sm up", () => {
    renderSearch();
    const input = screen.getByRole("combobox") as HTMLInputElement;
    expect(input.className).toContain("placeholder:text-transparent");
    expect(input.className).toContain("sm:placeholder:text-muted-foreground");
    const short = screen.getByTestId("search-short-placeholder");
    expect(short).toHaveTextContent("Search…");
    expect(short.className).toContain("sm:hidden");
    fireEvent.change(input, { target: { value: "x" } });
    expect(screen.queryByTestId("search-short-placeholder")).toBeNull();
  });

  it("shows a composed no-results state with a one-click clear", () => {
    renderSearch();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "zzzqqqxxx" } });
    expect(screen.getByText(/No matches for/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear search" }).at(-1)!);
    expect((input as HTMLInputElement).value).toBe("");
  });
});
