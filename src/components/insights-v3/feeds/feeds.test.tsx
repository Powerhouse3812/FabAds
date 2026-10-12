import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MyFeedsPage from "@/pages/insights-v3/MyFeedsPage";
import DiscoverPage from "@/pages/insights-v3/DiscoverPage";
import { getAds } from "@/lib/insights-v3/data";
import { hasEngagement } from "@/lib/insights-v3/selectors";
import { myFeedsAds, resetInsightsV3DemoState } from "@/lib/insights-v3/stores";
import { FEED_FILTERS_KEY, FEED_OVERVIEW_KEY } from "./usePersistedFlag";

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;
// cmdk (the filter pickers) scrolls the highlighted option into view; jsdom has no layout.
Element.prototype.scrollIntoView = () => {};

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MyFeedsPage />
    </MemoryRouter>,
  );
const FEEDS = "/industry-insights/feeds";
const cards = () => Array.from(document.querySelectorAll<HTMLElement>("article[data-ad-id]"));
const total = (c: HTMLElement) => Number((c.querySelector("p[aria-live='polite'] span.font-mono")?.textContent ?? "").replace(/,/g, ""));
const quickToggle = () => screen.getByRole("button", { name: /^Quick filters/ });
const overviewToggle = () => screen.getByRole("button", { name: /^Overview/ });

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetInsightsV3DemoState();
});

describe("My Feeds redesign · collapsed by default", () => {
  it("loads with Quick filters and Overview both collapsed, but every KPI and the sources still visible as pills", () => {
    renderAt(FEEDS);
    expect(quickToggle()).toHaveAttribute("aria-expanded", "false");
    expect(overviewToggle()).toHaveAttribute("aria-expanded", "false");
    // nothing from the expanded bodies is mounted
    expect(screen.queryByText("AI summary")).toBeNull();
    expect(screen.queryByText("Suggested action")).toBeNull();
    expect(screen.queryByRole("group", { name: "Hook style" })).toBeNull();
    // all 7 KPIs + the merged sources pill sit in the bar
    const bar = screen.getByRole("region", { name: "Overview" });
    for (const label of ["Total ads", "Active ads", "Winning ads", "Competitors", "New ads", "Avg live", "Landing pages & offers"]) {
      expect(within(bar).getByText(label)).toBeInTheDocument();
    }
    expect(within(bar).getByRole("button", { name: /See what feeds My Feeds/ }).textContent).toMatch(/From\s+\d+\s+competitors/);
    expect(screen.getByText("None applied")).toBeInTheDocument();
  });

  it("the old identity row is gone: sources live in the gear and the Overview pill", () => {
    renderAt(FEEDS);
    expect(screen.queryByText("Mark competitors or follow pages")).toBeNull(); // only inside the popovers, closed
    fireEvent.click(screen.getByRole("button", { name: /Manage sources/ }));
    expect(screen.getByText("Followed pages")).toBeInTheDocument();
  });

  it("remembers an expanded Overview across a remount", () => {
    const first = renderAt(FEEDS);
    fireEvent.click(overviewToggle());
    expect(window.localStorage.getItem(FEED_OVERVIEW_KEY)).toBe("1");
    first.unmount();
    renderAt(FEEDS);
    expect(overviewToggle()).toHaveAttribute("aria-expanded", "true");
    expect(window.localStorage.getItem(FEED_FILTERS_KEY)).toBeNull();
  });
});

describe("My Feeds redesign · Overview expanded", () => {
  it("shows the AI row (summary + suggested action + both CTAs) and the three compact blocks", () => {
    renderAt(FEEDS);
    fireEvent.click(overviewToggle());
    const row = screen.getByRole("region", { name: "AI summary and suggested action" });
    expect(within(row).getByText("AI summary")).toBeInTheDocument();
    expect(within(row).getByText("Suggested action")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: /Use in Genie/ })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: /^Show \d+ ads?$/ })).toBeInTheDocument();
    // chart renamed, unit visible, Rising and Scaling present
    const chart = screen.getByRole("region", { name: "New Ad launch" });
    expect(within(chart).getByText(/Unit:/)).toBeInTheDocument();
    expect(screen.queryByText("Launch frequency")).toBeNull();
    expect(screen.getByRole("region", { name: "Rising" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Scaling" })).toBeInTheDocument();
    expect(screen.getAllByText(/Based on/).length).toBeGreaterThan(0);
  });

  it("'Show N ads' applies the rising tag as a filter, and can be cleared from the same button", () => {
    const { container } = renderAt(FEEDS);
    const before = total(container);
    fireEvent.click(overviewToggle());
    const row = screen.getByRole("region", { name: "AI summary and suggested action" });
    fireEvent.click(within(row).getByRole("button", { name: /^Show \d+ ads?$/ }));
    expect(total(container)).toBeLessThan(before);
    const clear = within(screen.getByRole("region", { name: "AI summary and suggested action" })).getByRole("button", { name: /Filter applied · Clear/ });
    fireEvent.click(clear);
    expect(total(container)).toBe(before);
  });
});

describe("My Feeds redesign · Quick filters", () => {
  it("expands to Trending + Hook style + Angle + Framework, with an expander for the other groups", () => {
    renderAt(FEEDS);
    fireEvent.click(quickToggle());
    for (const g of ["Trending", "Hook style", "Angle", "Framework"]) expect(screen.getByRole("group", { name: g })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Concept" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Show \d+ more filters$/ }));
    for (const g of ["Concept", "Keyword / topic", "Country"]) expect(screen.getByRole("group", { name: g })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Show fewer filters$/ })).toBeInTheDocument();
  });

  it("each row lists tags in descending count order", () => {
    renderAt(FEEDS);
    fireEvent.click(quickToggle());
    for (const g of ["Hook style", "Angle", "Framework", "Trending"]) {
      const counts = within(screen.getByRole("group", { name: g }))
        .getAllByRole("button", { pressed: false })
        .map((b) => Number(/,\s*([\d,]+) (?:new )?ads/.exec(b.getAttribute("aria-label") ?? "")?.[1].replace(/,/g, "")))
        .filter((n) => !Number.isNaN(n));
      expect(counts.length).toBeGreaterThan(1);
      expect(counts).toEqual([...counts].sort((a, b) => b - a));
    }
  });

  it("union rule: selecting tags changes the total and 'N applied', never another tag's count; Clear all restores", () => {
    const { container } = renderAt(FEEDS);
    const before = total(container);
    fireEvent.click(quickToggle());
    const hook = () => screen.getByRole("group", { name: "Hook style" });
    const framework = () => screen.getByRole("group", { name: "Framework" });
    const countsOf = (el: HTMLElement) => within(el).getAllByRole("button").map((b) => b.getAttribute("aria-label"));
    const frameworkBefore = countsOf(framework());

    fireEvent.click(within(hook()).getAllByRole("button", { pressed: false })[0]);
    const one = total(container);
    expect(one).toBeLessThan(before);
    expect(screen.getByText(/applied/)).toHaveTextContent("1 applied");
    expect(countsOf(framework())).toEqual(frameworkBefore);

    fireEvent.click(within(framework()).getAllByRole("button", { pressed: false })[0]);
    expect(screen.getByText(/applied/)).toHaveTextContent("2 applied");
    expect(total(container)).toBeGreaterThanOrEqual(one); // union: a second tag adds ads, never removes them

    fireEvent.click(within(screen.getByRole("region", { name: "Quick filters" })).getByRole("button", { name: "Clear all" }));
    expect(total(container)).toBe(before);
    expect(screen.getByText("None applied")).toBeInTheDocument();
  });

  it("'View more' opens the full-list modal for that group", () => {
    renderAt(FEEDS);
    fireEvent.click(quickToggle());
    fireEvent.click(screen.getByRole("button", { name: /^View more Angle tags/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Angle");
    expect(within(screen.getByRole("dialog")).getByPlaceholderText(/Search angle/i)).toBeInTheDocument();
  });

  it("a hand-edited URL with unknown tag ids does not inflate 'N applied'", () => {
    renderAt(`${FEEDS}?f_hookStyle=not-a-real-hook`);
    expect(screen.getByText("None applied")).toBeInTheDocument();
  });
});

describe("My Feeds redesign · card", () => {
  it("keeps days + status, Similar ads, badges, AI score, Industry/Category and the actions; drops hook/angle/framework/concept chips and the CTA label", () => {
    renderAt(FEEDS);
    const list = cards();
    expect(list.length).toBe(24);
    const first = list[0];
    expect(within(first).getByRole("button", { name: /^Open page / })).toBeInTheDocument();
    expect(within(first).getByRole("button", { name: "Download ad" })).toBeInTheDocument();
    expect(within(first).getByRole("button", { name: /Use in Genie/ })).toBeInTheDocument();
    expect(within(first).getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(within(first).getByRole("button", { name: /More actions/ })).toBeInTheDocument();
    expect(within(first).getByLabelText(/AI score \d+\/100/)).toBeInTheDocument();
    // the four analysis chips and the CTA label are drawer-only on this card
    expect(within(first).queryByRole("button", { name: /^(Hook|Angle|Framework|Concept): / })).toBeNull();
    expect(first.textContent).not.toMatch(/\bCTA\b/);
    // somewhere on the page: a "N Similar ads" signal and a days tag
    expect(cards().some((c) => /\d+ Similar ads?/.test(c.textContent ?? ""))).toBe(true);
    expect(cards().every((c) => !!c.querySelector("[aria-label*='live']") || /Start/.test(c.textContent ?? ""))).toBe(true);
  });

  it("a thumbnail that fails to load falls back to the no-creative layout (no overlays on the headline tile, headline once)", () => {
    renderAt(FEEDS);
    const card = cards().find((c) => c.querySelector("[data-testid='ad-media'] img"))!;
    const headline = (card.getAttribute("aria-label") ?? "").replace(/^Ad from .*?: /, "");
    expect(within(card).getAllByText(headline)).toHaveLength(1);
    fireEvent.error(card.querySelector("[data-testid='ad-media'] img")!);
    expect(within(card).getByText(/no preview/)).toBeInTheDocument();
    // the tile now IS the headline; the line under the media must not repeat it
    expect(within(card).getAllByText(headline)).toHaveLength(1);
    // AI score moved off the media (its overlay wrapper) into the signal row under it
    const mediaWrap = within(card).getByTestId("ad-media").parentElement!;
    expect(mediaWrap.querySelector("[aria-label^='AI score']")).toBeNull();
    expect(within(card).getByLabelText(/AI score \d+\/100/)).toBeInTheDocument();
  });

  it("only My Feeds uses it: Discover keeps the standard card with its analysis chips", () => {
    render(
      <MemoryRouter initialEntries={["/industry-insights/discover"]}>
        <DiscoverPage />
      </MemoryRouter>,
    );
    const hasChip = cards().some((c) => within(c).queryAllByRole("button", { name: /^(Hook|Angle|Framework|Concept): / }).length > 0);
    expect(hasChip).toBe(true);
  });
});

describe("My Feeds redesign · states", () => {
  it("empty (?state=empty): no Quick filters, no Overview bar, the empty state, and the gear still works", () => {
    renderAt(`${FEEDS}?state=empty`);
    expect(screen.getByText("Nothing feeds My Feeds yet")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Quick filters" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Overview" })).toBeNull();
    expect(screen.getByRole("button", { name: /Manage sources/ })).toBeInTheDocument();
  });

  it("loading (?state=loading): skeletons, and neither bar is interactive", () => {
    renderAt(`${FEEDS}?state=loading`);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Quick filters/ })).toBeNull();
  });

  it("no match: a search with no hits shows the no-results state and keeps the toolbar", () => {
    renderAt(`${FEEDS}?q=zzqxjv`);
    expect(screen.getByText(/No ads match “zzqxjv”/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Manage sources/ })).toBeInTheDocument();
  });
});

describe("My Feeds redesign · header + one toolbar row", () => {
  it("Industry · Category · Period sit in the header; search, filter toggle, the five filters and Sort share ONE row", () => {
    renderAt(FEEDS);
    const filterBtn = (n: string) => screen.getByRole("button", { name: new RegExp(`^${n} filter`) });
    const row = filterBtn("Domain").parentElement!;
    for (const n of ["Domain", "Page", "Status", "Running days", "Similar ads"]) expect(row).toContainElement(filterBtn(n));
    expect(within(row).getByLabelText("Search Industry Insights V2")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: /^Filters/ })).toBeInTheDocument();
    expect(within(row).getByRole("combobox", { name: "Sort" })).toBeInTheDocument();
    // scope is NOT in that row; it is in the page header, next to the title
    expect(within(row).queryByRole("button", { name: /^(Industry|Category|Period):/ })).toBeNull();
    const header = screen.getByRole("heading", { level: 1, name: /My Feeds/ }).closest("header")!;
    for (const n of ["Industry", "Category", "Period"]) expect(within(header).getByRole("button", { name: new RegExp(`^${n}:`) })).toBeInTheDocument();
  });
});

describe("My Feeds redesign · toolbar filters", () => {
  const totalNow = (c: HTMLElement) => total(c);
  const openPill = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));
  const kpi = (label: string) => screen.getByRole("region", { name: "Overview" }).querySelector(`span:has(> b)`)
    ? Array.from(screen.getByRole("region", { name: "Overview" }).querySelectorAll("span")).find((el) => el.childNodes.length > 1 && el.textContent?.includes(label))?.querySelector("b")?.textContent
    : undefined;

  it("a Status pick narrows everything: the total, the Overview KPIs and the option counts follow", () => {
    const { container } = renderAt(FEEDS);
    const before = totalNow(container);
    openPill(/^Status filter/);
    const live = screen.getByRole("option", { name: /Seen live/ });
    const liveCount = Number(/(\d[\d,]*)\s*$/.exec(live.textContent ?? "")?.[1].replace(/,/g, ""));
    fireEvent.click(live);
    expect(totalNow(container)).toBe(liveCount);
    expect(totalNow(container)).toBeLessThan(before);
    expect(kpi("Total ads")).toBe(String(liveCount));
    expect(screen.getByRole("button", { name: /^Status filter, 1 selected/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("filters come back from the URL, and Clear filters restores the page", () => {
    const { container } = renderAt(`${FEEDS}?fstatus=active&fsimilar=3-5,6-9`);
    expect(screen.getByRole("button", { name: /^Status filter, 1 selected/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Similar ads filter, 2 selected/ })).toBeInTheDocument();
    const narrowed = totalNow(container);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(totalNow(container)).toBeGreaterThan(narrowed);
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
  });

  it("unknown ids in a hand-edited URL are ignored", () => {
    const { container } = renderAt(FEEDS);
    const all = totalNow(container);
    const again = render(
      <MemoryRouter initialEntries={[`${FEEDS}?fstatus=bogus&fdays=nope`]}>
        <MyFeedsPage />
      </MemoryRouter>,
    );
    expect(totalNow(again.container)).toBe(all);
    expect(screen.queryAllByRole("button", { name: "Clear filters" })).toHaveLength(0);
  });

  it("filters that leave nothing show a specific empty state with one-click clear", () => {
    renderAt(`${FEEDS}?fpage=page-that-does-not-exist`);
    expect(screen.getByText("No ads match these filters")).toBeInTheDocument();
    // two "Clear filters": the toolbar link and the empty state's button; both do the same thing
    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(cards().length).toBeGreaterThan(0);
  });

  it("multi-pick inside one filter is 'any of them'", () => {
    const { container } = renderAt(FEEDS);
    openPill(/^Running days filter/);
    fireEvent.click(screen.getByRole("option", { name: /Under 7 days/ }));
    const one = totalNow(container);
    fireEvent.click(screen.getByRole("option", { name: /90\+ days/ }));
    expect(totalNow(container)).toBeGreaterThan(one);
  });
});

describe("My Feeds redesign · engagement", () => {
  const feedAds = () => myFeedsAds();

  it("a card only SIGNALS that engagement exists (which metrics), never the numbers", () => {
    renderAt(FEEDS);
    const byId = new Map(getAds().map((a) => [a.id, a]));
    let withData = 0;
    for (const card of cards()) {
      const ad = byId.get(card.getAttribute("data-ad-id")!)!;
      const indicator = card.querySelector("[aria-label^='Engagement data']");
      expect(!!indicator).toBe(hasEngagement(ad));
      if (indicator) {
        withData++;
        for (const v of [ad.engagement.likes, ad.engagement.comments, ad.engagement.shares]) {
          if (v != null && v >= 1000) expect(card.textContent).not.toContain(v.toLocaleString("en-US"));
        }
      }
    }
    expect(withData).toBeGreaterThan(0);
  });

  it("sorting by likes puts the ad with the most likes first and warns that not every ad has the data", () => {
    renderAt(`${FEEDS}?sort=most-liked`);
    const notice = screen.getByRole("status", { name: "" });
    expect(notice).toHaveTextContent("Not every ad has likes data.");
    expect(notice).toHaveTextContent(/Only \d+ of \d+ ads here do/);
    const top = feedAds().reduce((m, a) => ((a.engagement.likes ?? -1) > (m.engagement.likes ?? -1) ? a : m));
    expect(cards()[0].getAttribute("data-ad-id")).toBe(top.id);
    fireEvent.click(within(notice).getByRole("button", { name: "Back to Newest" }));
    expect(screen.queryByText(/Not every ad has likes data/)).toBeNull();
  });

  it("the warning names the metric being sorted", () => {
    renderAt(`${FEEDS}?sort=most-shared`);
    expect(screen.getByText("Not every ad has shares data.")).toBeInTheDocument();
  });

  it("engagement sorts do not exist on Discover: the param is ignored and no warning shows", () => {
    render(
      <MemoryRouter initialEntries={["/industry-insights/discover?sort=most-liked"]}>
        <DiscoverPage />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Not every ad has/)).toBeNull();
    expect(screen.getByText("Newest")).toBeInTheDocument();
  });
});

describe("My Feeds redesign · AI score tags", () => {
  it("every card carries a filled, tier-coloured AI tag (elite lime, strong green, average amber, weak red)", () => {
    renderAt(FEEDS);
    const cls: Record<string, string> = { Elite: "bg-primary", Strong: "bg-success-text", Average: "bg-warning-text", Weak: "bg-error-text" };
    const seen = new Set<string>();
    for (const card of cards()) {
      const tag = card.querySelector("[aria-label^='AI score']")!;
      const tier = /· (Elite|Strong|Average|Weak)\./.exec(tag.getAttribute("aria-label")!)![1];
      expect(tag.className).toContain(cls[tier]);
      seen.add(tier);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
