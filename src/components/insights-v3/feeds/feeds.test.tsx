import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MyFeedsPage from "@/pages/insights-v3/MyFeedsPage";
import DiscoverPage from "@/pages/insights-v3/DiscoverPage";
import { resetInsightsV3DemoState } from "@/lib/insights-v3/stores";
import { FEED_FILTERS_KEY, FEED_OVERVIEW_KEY } from "./usePersistedFlag";

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;

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
    for (const label of ["Total ads", "Active ads", "Winning ads", "Advertisers", "New ads", "Avg live", "Landing pages & offers"]) {
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
