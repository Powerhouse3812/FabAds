import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PageTabs } from "./PageTabs";
import { ElementChip } from "./ElementChip";

const wrap = (ui: JSX.Element) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("PageTabs zero-count tabs", () => {
  const tabs = [
    { key: "domain", label: "Domain", count: 12 },
    { key: "page", label: "Page", count: 0 },
    { key: "lp", label: "LP & Offers", count: 5 },
  ] as const;

  it("renders a 0-count tab disabled, unselectable, with an sr reason", () => {
    const onChange = vi.fn();
    wrap(<PageTabs tabs={[...tabs]} value="domain" onChange={onChange} />);
    const page = screen.getByRole("tab", { name: /Page/ });
    expect(page.getAttribute("aria-disabled")).toBe("true");
    expect(page.textContent).toContain("nothing in this scope");
    fireEvent.click(page);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("tab", { name: /LP/ }));
    expect(onChange).toHaveBeenCalledWith("lp");
  });

  it("arrow keys skip the disabled tab", () => {
    const onChange = vi.fn();
    wrap(<PageTabs tabs={[...tabs]} value="domain" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: /Domain/ }), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("lp");
    fireEvent.keyDown(screen.getByRole("tab", { name: /LP/ }), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("domain");
    fireEvent.keyDown(screen.getByRole("tab", { name: /Domain/ }), { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("lp");
  });

  it("the current tab stays selected and enabled when its count hits 0", () => {
    const zeroed = tabs.map((t) => (t.key === "domain" ? { ...t, count: 0 } : t));
    wrap(<PageTabs tabs={[...zeroed]} value="domain" onChange={() => {}} />);
    const domain = screen.getByRole("tab", { name: /Domain/ });
    expect(domain.getAttribute("aria-selected")).toBe("true");
    expect(domain.getAttribute("aria-disabled")).toBeNull();
  });
});

describe("ElementChip count", () => {
  it("renders the count as the lime pill", () => {
    wrap(<ElementChip type="hook" id="h1" label="Curiosity question" count={1284} onClick={() => {}} />);
    const pill = screen.getByText("1,284");
    expect(pill.className).toContain("bg-primary/15");
    expect(pill.className).toContain("text-primary-text");
  });
});
