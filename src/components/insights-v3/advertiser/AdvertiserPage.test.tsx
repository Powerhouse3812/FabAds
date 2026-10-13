import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cloneElement, type ReactElement } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import AdvertiserPage from "@/pages/insights-v3/AdvertiserPage";
import { LP_COLUMNS, advertiserColumns, columnsWidth } from "./columns";

// jsdom has no layout, so recharts would warn about a 0x0 chart on every render.
vi.mock("recharts", async (orig) => {
  const m = await orig<typeof import("recharts")>();
  return {
    ...m,
    ResponsiveContainer: ({ children }: { children: ReactElement }) => (
      <div style={{ width: 400, height: 160 }}>{cloneElement(children, { width: 400, height: 160 })}</div>
    ),
  };
});

beforeAll(() => {
  // recharts' ResponsiveContainer needs these; jsdom has neither.
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= RO;
});

beforeEach(() => {
  try {
    window.sessionStorage.clear();
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});

function Where() {
  const l = useLocation();
  return <div data-testid="where">{l.pathname + l.search}</div>;
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AdvertiserPage />
      <Where />
    </MemoryRouter>,
  );
}

describe("AdvertiserPage", () => {
  it("renders the Domain tab populated: tabs with counts, overview, groups, table columns", () => {
    renderAt("/industry-insights/advertisers");
    expect(screen.getByRole("heading", { level: 1, name: /Competitors/ })).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      expect.stringMatching(/^Domain\d/),
      expect.stringMatching(/^Page\d/),
      expect.stringMatching(/^LP & Offers\d/),
    ]);
    expect(screen.getByRole("region", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getAllByText(/Based on/).length).toBeGreaterThan(0);
    // top-10 groups for Domain (Category appears because no category is scoped)
    for (const g of ["Hook style", "Angle", "Framework", "Concept", "CTA", "Country", "Category"]) {
      expect(screen.getByRole("region", { name: g })).toBeInTheDocument();
    }
    const table = screen.getByRole("table", { name: "Domains" });
    const heads = within(table).getAllByRole("columnheader").map((h) => h.textContent);
    expect(heads).toEqual([
      "Domain",
      "Total + active ads",
      "Winning ads + longest run",
      "Launch trend",
      "Top framework / hook / concept",
      "Industry + category",
      "Landing pages / offers",
      "Actions",
    ]);
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(5);
    // Domain rows have Mark as competitor but no Follow.
    expect(within(table).getAllByRole("button", { name: /Mark .* as competitor|is marked as a competitor/ }).length).toBeGreaterThan(0);
    expect(within(table).queryByRole("button", { name: /^Follow / })).toBeNull();
    // The helper copy about where marking sends data.
    expect(screen.getByText(/changes where its data shows, not what shows/i)).toBeInTheDocument();
  });

  it("Page tab shows Follow and the same Mark as competitor", () => {
    renderAt("/industry-insights/advertisers?tab=page");
    const table = screen.getByRole("table", { name: "Pages" });
    expect(within(table).getAllByRole("button", { name: /^(Follow|Unfollow) / }).length).toBeGreaterThan(0);
    expect(within(table).getAllByRole("button", { name: /competitor/i }).length).toBeGreaterThan(0);
  });

  it("LP & Offers tab shows the landing-page columns and sort", () => {
    renderAt("/industry-insights/advertisers?tab=lp");
    const table = screen.getByRole("table", { name: "Landing pages" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Page",
      "Offer",
      "Funnel type",
      "Ads (total + active)",
      "Competitors",
      "Winners",
      "Actions",
    ]);
    for (const g of ["Funnel type", "Offer domain", "Hook style", "Framework", "Concept", "Country", "CTA"]) {
      expect(screen.getByRole("region", { name: g })).toBeInTheDocument();
    }
    expect(screen.queryByRole("region", { name: "Category" })).toBeNull();
  });

  it("hides the Category group once a category is scoped", () => {
    renderAt("/industry-insights/advertisers?category=weight-loss");
    expect(screen.queryByRole("region", { name: "Category" })).toBeNull();
  });

  it("opens the competitor overlay through the URL when a row is clicked", () => {
    renderAt("/industry-insights/advertisers");
    const table = screen.getByRole("table", { name: "Domains" });
    const row = within(table).getAllByRole("row")[1];
    fireEvent.click(row);
    expect(screen.getByTestId("where").textContent).toMatch(/detail=domain%3A/);
  });

  it("opens a row with the Enter key", () => {
    renderAt("/industry-insights/advertisers?tab=lp");
    const table = screen.getByRole("table", { name: "Landing pages" });
    const row = within(table).getAllByRole("row")[1];
    fireEvent.keyDown(row, { key: "Enter" });
    expect(screen.getByTestId("where").textContent).toMatch(/detail=lp%3A/);
  });

  it("forced empty (?state=empty) shows a composed empty state, not a blank list", () => {
    renderAt("/industry-insights/advertisers?state=empty");
    expect(screen.getByText(/No domains in this scope/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset scope/ })).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("loading (?state=loading) shows skeletons", () => {
    renderAt("/industry-insights/advertisers?state=loading");
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("a tag that matches nothing offers a one-click clear", () => {
    // A REAL tag with 0 matches in scope: no Search Arb ad is in Medicare
    // (fake ids are ignored since QA-10).
    renderAt("/industry-insights/advertisers?industry=search-arb&f_category=medicare");
    expect(screen.getByText(/No domains match the selected tags/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear tags" }));
    expect(screen.getByTestId("where").textContent).not.toMatch(/f_category/);
    expect(screen.getByRole("table", { name: "Domains" })).toBeInTheDocument();
  });

  it("union filter: picking a tag narrows the list without touching other counts", () => {
    renderAt("/industry-insights/advertisers?tab=page");
    const before = within(screen.getByRole("table", { name: "Pages" })).getAllByRole("row").length;
    const group = screen.getByRole("region", { name: "Framework" });
    const chip = within(group).getAllByRole("button", { pressed: false })[0];
    fireEvent.click(chip);
    const after = within(screen.getByRole("table", { name: "Pages" })).getAllByRole("row").length;
    expect(after).toBeLessThanOrEqual(before);
    expect(screen.getByTestId("where").textContent).toMatch(/f_framework=/);
  });

  // QA-07: at 1440px with the sub-nav open the table frame is ~1121px wide.
  const FRAME_1440 = 1121 - 2;

  it("the Domain, Page and LP tables fit a 1440px screen, Actions included", () => {
    expect(columnsWidth(advertiserColumns("domain"))).toBeLessThanOrEqual(FRAME_1440);
    expect(columnsWidth(advertiserColumns("page"))).toBeLessThanOrEqual(FRAME_1440);
    expect(columnsWidth(LP_COLUMNS)).toBeLessThanOrEqual(FRAME_1440);
    renderAt("/industry-insights/advertisers?tab=page");
    const table = screen.getByRole("table", { name: "Pages" });
    expect(Number(table.getAttribute("data-table-width"))).toBe(columnsWidth(advertiserColumns("page")));
  });

  it("renders an Actions column with icon buttons that keep their accessible names", () => {
    renderAt("/industry-insights/advertisers?tab=page");
    const table = screen.getByRole("table", { name: "Pages" });
    const actionsHead = within(table).getByRole("columnheader", { name: "Actions" });
    expect(actionsHead.className).toMatch(/right-0/); // sticky right: stays visible if the frame scrolls sideways
    const group = within(table).getAllByRole("group", { name: /^Actions for / })[0];
    expect(within(group).getByRole("button", { name: /competitor/i })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: /^(Follow|Unfollow) / })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: /Save this page|Saved to/ })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: /^Download page$/ })).toBeInTheDocument();
    // icon-only: no visible text label
    expect(group.textContent?.trim()).toBe("");
  });

  it("the LP table also keeps Actions (Save + Download) per row", () => {
    renderAt("/industry-insights/advertisers?tab=lp");
    const table = screen.getByRole("table", { name: "Landing pages" });
    expect(within(table).getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    expect(within(table).getAllByRole("button", { name: /^Download landing page$/ }).length).toBeGreaterThan(0);
  });
});
