import { describe, expect, it, beforeAll } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DEFAULT_SCOPE } from "@/lib/insights-v3/types";
import { buildScopeOptions } from "./scopeOptions";
import { ScopeBar } from "./ScopeBar";

describe("buildScopeOptions", () => {
  const rows = [
    { id: "all", label: "All industries", count: 1000 },
    { id: "vsl", label: "VSL", count: 120 },
    { id: "others", label: "Others", count: 0 },
  ];

  it("uses the incoming 'all' row count and renders it once", () => {
    const { options, allCount } = buildScopeOptions(rows, "All industries", 120);
    expect(allCount).toBe(1000);
    expect(options.filter((o) => o.id === "all")).toHaveLength(1);
    expect(options[0]).toMatchObject({ id: "all", count: 1000 });
    expect(options.find((o) => o.id === "others")?.disabled).toBe(true);
  });

  it("explicit allCount wins over the 'all' row and the fallback", () => {
    expect(buildScopeOptions(rows, "All industries", 120, 777).allCount).toBe(777);
  });

  it("falls back to totalCount when neither is present", () => {
    expect(buildScopeOptions(rows.slice(1), "All industries", 120).allCount).toBe(120);
  });
});

describe("ScopeBar All-row counts", () => {
  beforeAll(() => {
    // cmdk + Radix Popover need these in jsdom
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    Element.prototype.scrollIntoView ??= () => {};
  });

  it("with an industry picked, 'All industries' shows the cross-industry count", () => {
    render(
      <ScopeBar
        scope={{ ...DEFAULT_SCOPE, industry: "telehealth" }}
        onChange={() => {}}
        industries={[
          { id: "all", label: "All industries", count: 6598 },
          { id: "vsl", label: "VSL", count: 1284 },
          { id: "telehealth", label: "Telehealth", count: 642 },
        ]}
        categories={[
          { id: "all", label: "All categories", count: 642 },
          { id: "dental", label: "Dental", count: 90 },
        ]}
        totalCount={642}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Industry:/ }));
    const allIndustries = screen.getByText("All industries").closest("[cmdk-item]") as HTMLElement;
    expect(within(allIndustries).getByText("6,598")).toBeTruthy();
    expect(screen.getAllByText("All industries")).toHaveLength(1);
  });
});
