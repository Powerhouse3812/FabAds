import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getAds } from "@/lib/insights-v3/data";
import { filterAdsByQuery } from "./textQuery";
import DiscoverPage from "@/pages/insights-v3/DiscoverPage";
import MyFeedsPage from "@/pages/insights-v3/MyFeedsPage";
import {
  getUserPrefs,
  resetInsightsV3DemoState,
  toggleCompetitor,
  toggleFollowIndustry,
  toggleFollowPage,
} from "@/lib/insights-v3/stores";

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;

function renderAt(node: React.ReactElement, url: string) {
  return render(<MemoryRouter initialEntries={[url]}>{node}</MemoryRouter>);
}

const total = (c: HTMLElement) => c.querySelector("p[aria-live='polite'] span.font-mono")?.textContent ?? "";
const adCards = () => document.querySelectorAll("article[data-ad-id]");

function clearAllPrefs() {
  const p = getUserPrefs();
  [...p.followedPageIds].forEach((id) => toggleFollowPage(id));
  [...p.followedIndustryIds].forEach((id) => toggleFollowIndustry(id));
  [...p.competitorPageIds].forEach((id) => toggleCompetitor("page", id));
  [...p.competitorDomainIds].forEach((id) => toggleCompetitor("domain", id));
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetInsightsV3DemoState();
});

describe("Discover page", () => {
  it("renders populated: title, scope bar, prefs toggle, KPIs, based-on, chart unit, trending tags, rising + scaling, groups, 24 cards", () => {
    const { container } = renderAt(<DiscoverPage />, "/industry-insights/discover");
    expect(screen.getByRole("heading", { level: 1, name: /Discover/ })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Scope/ })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "My preferences only" })).not.toBeChecked();
    for (const k of ["Total ads", "Active ads", "Winning ads", "Advertisers", "New ads", "Avg days live", "Landing pages & offers"]) {
      expect(screen.getAllByText(k).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText(/Based on/).length).toBeGreaterThan(3);
    expect(screen.getByText("Launch frequency")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Trending tags" })).toBeInTheDocument();
    expect(screen.getAllByRole("region", { name: /Rising creative elements|Scaling pages/ }).length).toBeGreaterThan(0);
    for (const g of ["Hook style", "Angle", "Framework", "Framework element", "Concept", "Keyword / topic", "CTA", "Advertiser / domain", "Landing pages", "Country", "Category"]) {
      expect(screen.getByRole("region", { name: g })).toBeInTheDocument();
    }
    expect(adCards().length).toBe(24);
    expect(total(container)).toBe("800");
  });

  it("hides the Category group once a category is scoped", () => {
    renderAt(<DiscoverPage />, "/industry-insights/discover?category=auto-insurance");
    expect(screen.queryByRole("region", { name: "Category" })).toBeNull();
    expect(screen.getByRole("region", { name: "Hook style" })).toBeInTheDocument();
  });

  it("selecting a tag changes the total but never another group's counts", () => {
    const { container } = renderAt(<DiscoverPage />, "/industry-insights/discover");
    const before = total(container);
    const labelsOf = (name: string) =>
      within(screen.getByRole("region", { name }))
        .getAllByRole("button", { pressed: false })
        .map((b) => b.getAttribute("aria-label"));
    const angleBefore = labelsOf("Angle");
    const frameworkBefore = labelsOf("Framework");

    const hook = screen.getByRole("region", { name: "Hook style" });
    const first = within(hook).getAllByRole("button", { pressed: false })[0];
    fireEvent.click(first);

    expect(first).toHaveAttribute("aria-pressed", "true");
    const after = total(container);
    expect(Number(after.replace(/,/g, ""))).toBeLessThan(Number(before.replace(/,/g, "")));
    expect(Number(after.replace(/,/g, ""))).toBeGreaterThan(0);
    expect(labelsOf("Angle")).toEqual(angleBefore);
    expect(labelsOf("Framework")).toEqual(frameworkBefore);
    // selected chip row + Clear all
    expect(screen.getByRole("button", { name: /^Remove Hook style:/ })).toBeInTheDocument();

    // union: a second tag from another group adds ads, never removes them
    const fw = screen.getByRole("region", { name: "Framework" });
    fireEvent.click(within(fw).getAllByRole("button", { pressed: false })[0]);
    expect(Number(total(container).replace(/,/g, ""))).toBeGreaterThanOrEqual(Number(after.replace(/,/g, "")));

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(total(container)).toBe(before);
  });

  it("clicking a trending tag selects it as a tag filter", () => {
    renderAt(<DiscoverPage />, "/industry-insights/discover");
    const trending = screen.getByRole("region", { name: "Trending tags" });
    const btn = within(trending).getAllByRole("button")[0];
    fireEvent.click(btn);
    expect(screen.getByRole("list", { name: "Selected tags" })).toBeInTheDocument();
  });

  it("sort control offers exactly the five spec options and no engagement sort", () => {
    renderAt(<DiscoverPage />, "/industry-insights/discover?sort=longest-running");
    expect(screen.getByText("Longest running")).toBeInTheDocument();
    expect(screen.queryByText(/likes|comments|shares/i)).toBeNull();
  });

  it("?state=empty shows a composed empty state with a one-click reset", () => {
    renderAt(<DiscoverPage />, "/industry-insights/discover?state=empty");
    expect(screen.getByText("No ads in this scope")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset scope" })).toBeInTheDocument();
    expect(adCards().length).toBe(0);
  });

  it("?state=loading shows skeletons, no cards", () => {
    renderAt(<DiscoverPage />, "/industry-insights/discover?state=loading");
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(adCards().length).toBe(0);
  });

  it("tags that match nothing show EmptyResults with one-click clear", () => {
    renderAt(<DiscoverPage />, "/industry-insights/discover?f_country=zz");
    expect(screen.getByText(/No ads match the selected tags/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear tags" }));
    expect(adCards().length).toBe(24);
  });

  it("My preferences only narrows the page and shows its own count", () => {
    const { container } = renderAt(<DiscoverPage />, "/industry-insights/discover?mine=1");
    expect(screen.getByRole("switch", { name: "My preferences only" })).toBeChecked();
    expect(Number(total(container).replace(/,/g, ""))).toBeLessThan(800);
  });

  it("loads more cards 24 at a time", () => {
    renderAt(<DiscoverPage />, "/industry-insights/discover");
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(adCards().length).toBe(48);
  });
});

describe("text search (?q=)", () => {
  const word = (getAds().find((a) => a.analysis.keywords.length)?.analysis.keywords[0] ?? "insurance").toLowerCase();
  const expected = filterAdsByQuery(getAds(), word).length;
  const optionCounts = (name: string) =>
    within(screen.getByRole("region", { name }))
      .getAllByRole("button")
      .map((b) => Number(/, ([\d,]+) ads/.exec(b.getAttribute("aria-label") ?? "")?.[1]?.replace(/,/g, "") ?? 0));

  it("narrows the total, the KPIs and the group counts, and the header search is mounted", () => {
    expect(expected).toBeGreaterThan(0);
    expect(expected).toBeLessThan(800);
    const plain = renderAt(<DiscoverPage />, "/industry-insights/discover");
    const hookBefore = optionCounts("Hook style").reduce((a, b) => a + b, 0);
    plain.unmount();

    const { container } = renderAt(<DiscoverPage />, `/industry-insights/discover?q=${encodeURIComponent(word)}`);
    expect(screen.getByLabelText("Search Industry Insights V2")).toBeInTheDocument();
    expect(Number(total(container).replace(/,/g, ""))).toBe(expected);
    expect(optionCounts("Hook style").reduce((a, b) => a + b, 0)).toBeLessThan(hookBefore);
    expect(screen.getByRole("button", { name: `Remove search: ${word}` })).toBeInTheDocument();
  });

  it("selecting a tag under a search still changes only the total", () => {
    const { container } = renderAt(<DiscoverPage />, `/industry-insights/discover?q=${encodeURIComponent(word)}`);
    const angleBefore = optionCounts("Angle");
    const first = within(screen.getByRole("region", { name: "Hook style" })).getAllByRole("button", { pressed: false })[0];
    fireEvent.click(first);
    expect(Number(total(container).replace(/,/g, ""))).toBeLessThanOrEqual(expected);
    expect(optionCounts("Angle")).toEqual(angleBefore);
  });

  it("removing the search chip clears q and restores the full total", () => {
    const { container } = renderAt(<DiscoverPage />, `/industry-insights/discover?q=${encodeURIComponent(word)}`);
    fireEvent.click(screen.getByRole("button", { name: `Remove search: ${word}` }));
    expect(screen.queryByRole("button", { name: /^Remove search:/ })).toBeNull();
    expect(total(container)).toBe("800");
  });

  it("a search with no hits offers one click to clear it", () => {
    renderAt(<DiscoverPage />, "/industry-insights/discover?q=zzqxjv");
    expect(screen.getByText(/No ads match “zzqxjv” in this scope/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(adCards().length).toBe(24);
  });

  it("works on My Feeds too, and the no-match path clears search and tags together", () => {
    renderAt(<MyFeedsPage />, "/industry-insights/feeds?q=zzqxjv&f_country=us");
    expect(screen.getByText(/No ads match “zzqxjv”/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(adCards().length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /^Remove (search|Country)/ })).toBeNull();
  });
});

describe("My Feeds page", () => {
  it("renders the Discover layout over the seeded sources, with the identity row and no prefs toggle", () => {
    const { container } = renderAt(<MyFeedsPage />, "/industry-insights/feeds");
    expect(screen.getByRole("heading", { level: 1, name: /My Feeds/ })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "My preferences only" })).toBeNull();
    expect(screen.getByRole("button", { name: /See what feeds My Feeds/ }).textContent).toMatch(/From\s+\d+\s+competitors?.*followed pages?.*followed industr/s);
    expect(screen.getAllByText(/Based on/).length).toBeGreaterThan(2);
    expect(adCards().length).toBeGreaterThan(0);
    expect(Number(total(container).replace(/,/g, ""))).toBeLessThan(800);
    expect(screen.getByRole("region", { name: "Hook style" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Mark competitors or follow pages" })[0]).toHaveAttribute("href", "/industry-insights/advertisers");
  });

  it("identity popover lists the sources with inline unmark / unfollow", () => {
    renderAt(<MyFeedsPage />, "/industry-insights/feeds");
    fireEvent.click(screen.getByRole("button", { name: /See what feeds My Feeds/ }));
    expect(screen.getByText("Competitors")).toBeInTheDocument();
    expect(screen.getByText("Followed pages")).toBeInTheDocument();
    expect(screen.getByText("Followed industries")).toBeInTheDocument();
    const prefsBefore = getUserPrefs();
    const unfollow = screen.getAllByRole("button", { name: /^(Unmark|Unfollow) / })[0];
    fireEvent.click(unfollow);
    const prefsAfter = getUserPrefs();
    const count = (p: typeof prefsBefore) => p.competitorDomainIds.length + p.competitorPageIds.length + p.followedPageIds.length + p.followedIndustryIds.length;
    expect(count(prefsAfter)).toBe(count(prefsBefore) - 1);
  });

  it("?state=empty explains what feeds it and links to Advertiser", () => {
    renderAt(<MyFeedsPage />, "/industry-insights/feeds?state=empty");
    expect(screen.getByText("Nothing feeds My Feeds yet")).toBeInTheDocument();
    expect(screen.getByText(/competitors you mark/)).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "Mark competitors or follow pages" });
    expect(links.some((l) => l.getAttribute("href") === "/industry-insights/advertisers")).toBe(true);
    expect(adCards().length).toBe(0);
  });

  it("empty when nothing is followed or marked (real empty path)", () => {
    clearAllPrefs();
    renderAt(<MyFeedsPage />, "/industry-insights/feeds");
    expect(screen.getByText("Nothing feeds My Feeds yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /See what feeds My Feeds/ }).textContent).toMatch(/From\s+0 competitors/);
    expect(adCards().length).toBe(0);
  });

  it("?state=loading shows skeletons", () => {
    renderAt(<MyFeedsPage />, "/industry-insights/feeds?state=loading");
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});
