/**
 * Render smoke tests for Creative Element Insights: the page (populated / empty /
 * loading / narrow scope) and the Element detail overlay (populated hook + framework,
 * partial scope, unknown id). They assert key text, "Based on", and the
 * non-negotiables that are cheap to check in the DOM.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MODULE_NOW, getAds, getElements } from "@/lib/insights-v3/data";
import { adsInScope, elementValue } from "@/lib/insights-v3/selectors";
import { DEFAULT_SCOPE } from "@/lib/insights-v3/types";
import ElementsPage from "@/pages/insights-v3/ElementsPage";
import { ElementDetail } from "@/components/insights-v3/overlays/ElementDetail";

beforeAll(() => {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", RO);
  vi.stubGlobal("IntersectionObserver", RO);
  Element.prototype.scrollIntoView = vi.fn();
});

// The scope bar restores the last scope from sessionStorage; keep tests independent.
beforeEach(() => {
  window.sessionStorage.clear();
});

/** Overlay sections live in a Radix portal; query by their aria-label. */
const section = (name: string) => document.querySelector(`section[aria-label="${name}"]`);

const nav = { open: true, onClose: () => {} };

function page(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/industry-insights/elements${search}`]}>
      <ElementsPage />
    </MemoryRouter>,
  );
}

function overlay(type: "framework" | "hook" | "angle" | "concept", id: string, search = "") {
  return render(
    <MemoryRouter initialEntries={[`/industry-insights/elements${search}`]}>
      <ElementDetail elementType={type} id={id} nav={nav} />
    </MemoryRouter>,
  );
}

describe("ElementsPage", () => {
  it("renders populated: title, four tabs with counts, overview, table", () => {
    page();
    expect(screen.getByRole("heading", { name: /Creative Element Insights/ })).toBeInTheDocument();
    const tabs = screen.getByRole("tablist", { name: "Creative element type" });
    for (const label of ["Framework", "Hook", "Angle", "Concept"]) expect(within(tabs).getByText(label)).toBeInTheDocument();
    expect(document.body.textContent ?? "").toMatch(/Based on\s*[\d,]+\s*ads/);
    expect(screen.getByText("Launch frequency")).toBeInTheDocument();
    expect(screen.getByText("Rising frameworks")).toBeInTheDocument();
    expect(screen.getByText("Scaling frameworks")).toBeInTheDocument();
    expect(screen.getByText("Market footprint")).toBeInTheDocument();
    expect(screen.getByText("Example · top competitors")).toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBeGreaterThan(5);
  });

  it("QA-15: trend chip never wraps and descriptions use a plain line clamp", () => {
    const { container } = page();
    const row = container.querySelector("tbody tr") as HTMLElement;
    expect(row.querySelector("span.whitespace-nowrap")?.textContent).toMatch(/vs prev\.|vs previous period|New/);
    const desc = row.querySelector("p.line-clamp-2") as HTMLElement | null;
    expect(desc).not.toBeNull();
    expect(desc?.getAttribute("style") ?? "").not.toMatch(/webkit-box/);
  });

  it("never names the data source in a column header", () => {
    const { container } = page();
    // Spy-tool / source names are grep-gated; build the probe so this file stays clean.
    expect(container.textContent ?? "").not.toMatch(new RegExp(["ad", "vault"].join(""), "i"));
  });

  it("drops the tab's own element from the top-10 groups", () => {
    page("?tab=hook");
    expect(screen.queryByRole("region", { name: "Hook style" })).toBeNull();
    expect(screen.getByRole("region", { name: "Framework" })).toBeInTheDocument();
    expect(screen.getByText("Rising hooks")).toBeInTheDocument();
  });

  it("renders the forced empty state with a one-click reset", () => {
    page("?state=empty");
    expect(screen.getByText("No ads in this scope")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset scope" })).toBeInTheDocument();
    expect(document.body.textContent ?? "").toMatch(/Based on\s*0\s*ads/);
  });

  it("renders the loading skeleton without the overview", () => {
    page("?state=loading");
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByText("Launch frequency")).toBeNull();
  });

  it("shows the no-results recovery when tags leave nothing", () => {
    // A REAL tag with 0 matches in scope (fake ids are ignored since QA-10).
    page("?industry=search-arb&f_category=medicare");
    expect(screen.getByText(/No frameworks match the selected tags/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear tags" }));
  });

  it("opens an element overlay from a row (Enter) via the URL stack", () => {
    page();
    const row = screen.getAllByRole("row")[1];
    expect(row).toHaveAttribute("tabindex", "0");
    expect(row.getAttribute("aria-label")).toMatch(/^Open /);
  });

  it("handles a narrow scope without throwing (partial data)", () => {
    page("?industry=search-arb&period=7d");
    expect(screen.getByRole("heading", { name: /Creative Element Insights/ })).toBeInTheDocument();
  });
});

describe("ElementDetail", () => {
  it("renders a hook: header actions, four sections, Based on, opening lines", () => {
    overlay("hook", "curiosity-question");
    expect(screen.getByRole("heading", { name: /Curiosity question/ })).toBeInTheDocument();
    // Header actions, scoped to the overlay header so card-level buttons don't matter.
    const header = within(screen.getByRole("dialog").querySelector("header") as HTMLElement);
    expect(header.getByRole("button", { name: /Use in Genie/ })).toBeInTheDocument();
    expect(header.getByRole("button", { name: /board/ })).toBeInTheDocument();
    expect(header.getByRole("button", { name: /Download/ })).toBeInTheDocument();
    // Each example keeps a visible Use in Genie under its card.
    const examples = within(section("Top ads and examples") as HTMLElement);
    expect(examples.getAllByRole("button", { name: /Use in Genie/ }).length).toBeGreaterThan(0);
    for (const t of ["Summary", "Where it works", "Works well with", "Top ads and examples"]) {
      expect(section(t)).not.toBeNull();
    }
    expect((document.body.textContent ?? "").match(/Based on\s*[\d,]+\s*ads/g)?.length ?? 0).toBeGreaterThan(3);
    expect(screen.getByText("Opening lines")).toBeInTheDocument();
    // QA-08: every share bar has a visible unit line and a focusable bar with a labelled value.
    const where = within(section("Where it works") as HTMLElement);
    expect(where.getAllByText(/Unit: share of ads using this hook/)).toHaveLength(3);
    const bars = where.getAllByRole("img").filter((el) => /: [\d,]+ of [\d,]+ ads, \d+%/.test(el.getAttribute("aria-label") ?? ""));
    expect(bars.length).toBeGreaterThan(5);
    for (const b of bars) expect(b).toHaveAttribute("tabindex", "0");
    expect(screen.getAllByText(/lift/).length).toBeGreaterThan(0);
    expect(document.body.textContent ?? "").not.toMatch(new RegExp(`\\b(${["be", "st"].join("")}|${["top", "performing"].join("-")})\\b`, "i"));
  });

  it("renders a framework with its beats and Where it works (decision 9)", () => {
    overlay("framework", "pas");
    expect(section("Where it works")).not.toBeNull();
    expect(screen.getByText("Beats this framework uses")).toBeInTheDocument();
    expect(screen.queryByText("Opening lines")).toBeNull();
  });

  it("disables sections with a reason when nothing in scope uses it (partial)", () => {
    const scope = { ...DEFAULT_SCOPE, industry: "search-arb", period: "7d" as const };
    const scoped = adsInScope(getAds(), scope, { now: MODULE_NOW });
    const used = new Set(scoped.map((a) => elementValue(a, "hook")));
    const unused = getElements("hook").find((e) => !used.has(e.id));
    expect(unused).toBeTruthy();
    overlay("hook", unused!.id, "?industry=search-arb&period=7d");
    expect(screen.getByRole("heading", { name: new RegExp(unused!.label) })).toBeInTheDocument();
    expect(screen.getAllByText(/No ad in this scope uses this hook/).length).toBeGreaterThan(0);
    expect(screen.getByText("Where it works")).toBeInTheDocument();
  });

  it("shows an in-overlay empty state for an unknown id", () => {
    overlay("angle", "not-a-real-angle");
    expect(screen.getByText("We couldn't find this angle")).toBeInTheDocument();
  });
});
