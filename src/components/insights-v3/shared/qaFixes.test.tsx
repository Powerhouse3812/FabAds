import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import type { Kpi, TopTenGroup as TopTenGroupData } from "@/lib/insights-v3/types";
import { DEFAULT_SCOPE } from "@/lib/insights-v3/types";
import { DetailOverlay } from "./DetailOverlay";
import { TopTenGroup } from "./TopTenGroup";
import { ViewMoreModal } from "./ViewMoreModal";
import { KpiRow } from "./KpiRow";
import { OverviewShell } from "./OverviewShell";
import { ChangeChip } from "./TrendBars";
import { SelectedChips } from "./SelectedChips";
import { ScopeBar } from "./ScopeBar";
import { missingNote } from "./missingNote";

const wrap = (ui: JSX.Element, entry = "/") => render(<MemoryRouter initialEntries={[entry]}>{ui}</MemoryRouter>);

beforeAll(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(cleanup);

/* ── QA-01 / QA-05 / QA-16: DetailOverlay ────────────────────────────── */

function Harness({ onBack, onClose }: { onBack?: () => void; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>opener</button>
      <DetailOverlay
        open={open}
        title="Callout"
        typeLabel="Hook"
        onBack={onBack}
        backLabel="Hook: Callout"
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      >
        <button>inside</button>
      </DetailOverlay>
    </>
  );
}

describe("DetailOverlay", () => {
  it("QA-01: Esc goes back one level when nested, never closes the stack", () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    render(<Harness onBack={onBack} onClose={onClose} />);
    fireEvent.click(screen.getByText("opener"));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("QA-01: Esc closes when not nested; the X always closes everything", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByText("opener"));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    const onBack = vi.fn();
    const onClose2 = vi.fn();
    cleanup();
    render(<Harness onBack={onBack} onClose={onClose2} />);
    fireEvent.click(screen.getByText("opener"));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose2).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("QA-16: focus lands on the title, not a tooltip trigger", async () => {
    render(<Harness onClose={() => {}} />);
    const opener = screen.getByText("opener");
    opener.focus();
    fireEvent.click(opener);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(document.activeElement?.tagName).toBe("H2");
  });

  it("QA-05: focus returns to the opener on close", async () => {
    render(<Harness onClose={() => {}} />);
    const opener = screen.getByText("opener");
    opener.focus();
    fireEvent.click(opener);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(document.activeElement).toBe(opener);
  });
});

/* ── QA-03: missing-value disclosure ─────────────────────────────────── */

const country: TopTenGroupData = {
  key: "country",
  label: "Country",
  missing: 108,
  options: [
    { id: "US", label: "United States", count: 605 },
    { id: "FR", label: "France", count: 4 },
  ],
};

describe("missing-value note", () => {
  it("helper: wording, singular, Country suffix, null when none", () => {
    expect(missingNote(108, "ads", "Country", "country")).toBe("108 ads have no country, so counts won't add up to the total");
    expect(missingNote(1, "ads", "Hook style", "hookStyle")).toBe("1 ad has no hook style");
    expect(missingNote(0, "ads", "Country", "country")).toBeNull();
    expect(missingNote(undefined, "ads", "Country", "country")).toBeNull();
  });

  it("TopTenGroup renders it under the group; absent when missing is unset", () => {
    wrap(<TopTenGroup group={country} selected={[]} onToggle={() => {}} />);
    expect(screen.getByText(/108 ads have no country, so counts won't add up/)).toBeTruthy();
    cleanup();
    wrap(<TopTenGroup group={{ ...country, missing: undefined }} selected={[]} onToggle={() => {}} />);
    expect(screen.queryByText(/have no country/)).toBeNull();
  });

  it("ViewMoreModal shows it too", () => {
    wrap(<ViewMoreModal groups={[country]} selected={{}} onToggle={() => {}} />, "/?more=country");
    expect(screen.getByText(/108 ads have no country/)).toBeTruthy();
  });
});

/* ── QA-04: KpiRow truncation → tooltip ──────────────────────────────── */

describe("KpiRow", () => {
  it("clipped label / value / sub become focusable tooltip triggers (TruncatedText)", () => {
    const sw = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(500);
    const cw = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);
    const kpi: Kpi = {
      key: "k",
      label: "Landing pages & offers used by ads in this scope",
      value: 1,
      display: "Before / after",
      sub: "+50% launches vs the previous equal period",
      tooltip: "t",
    };
    render(<KpiRow kpis={[kpi]} />);
    expect(screen.getByText(kpi.label).getAttribute("tabindex")).toBe("0");
    expect(screen.getByText("Before / after").getAttribute("tabindex")).toBe("0");
    expect(screen.getByText(kpi.sub!).getAttribute("tabindex")).toBe("0");
    sw.mockRestore();
    cw.mockRestore();
  });
});

/* ── QA-14: AI summary does not stretch ──────────────────────────────── */

describe("OverviewShell", () => {
  it("summary is self-start and not h-full", () => {
    const { container } = render(
      <OverviewShell
        pageKey="qa14"
        basedOn={10}
        kpis={[]}
        summary={{ ads: 10, text: "Short." }}
        charts={<div style={{ height: 300 }}>chart</div>}
      />,
    );
    const block = container.querySelector('section[aria-label="AI summary"]') as HTMLElement;
    expect(block.className).toContain("h-auto");
    expect(block.parentElement?.className).toContain("self-start");
  });
});

/* ── QA-15: ChangeChip ───────────────────────────────────────────────── */

describe("ChangeChip", () => {
  it("never wraps; compact shortens the text", () => {
    const { rerender } = render(<ChangeChip changePct={15} />);
    expect(screen.getByText("vs previous period").parentElement?.className).toContain("whitespace-nowrap");
    rerender(<ChangeChip changePct={15} compact />);
    expect(screen.getByText("vs prev.")).toBeTruthy();
    rerender(<ChangeChip changePct={null} compact />);
    expect(screen.getByText("New")).toBeTruthy();
  });
});

/* ── QA-10: unknown tag ids ──────────────────────────────────────────── */

describe("SelectedChips", () => {
  it("drops chips for unknown ids but keeps Clear all while a selection exists", () => {
    const onClear = vi.fn();
    render(
      <SelectedChips
        selected={{ country: ["fr", "FR"] }}
        groups={[country]}
        onRemove={() => {}}
        onClearAll={onClear}
        total={0}
        noun="ads"
      />,
    );
    expect(screen.queryByText("fr")).toBeNull();
    expect(screen.getByText("France")).toBeTruthy();
    fireEvent.click(screen.getByText("Clear all"));
    expect(onClear).toHaveBeenCalled();
  });

  it("with only an unknown id there is no chip but Clear all is still offered", () => {
    render(
      <SelectedChips selected={{ country: ["fr"] }} groups={[country]} onRemove={() => {}} onClearAll={() => {}} total={0} noun="ads" />,
    );
    expect(screen.queryByLabelText(/Remove/)).toBeNull();
    expect(screen.getByText("Clear all")).toBeTruthy();
  });
});

/* ── QA-17: ScopeBar separators ──────────────────────────────────────── */

describe("ScopeBar", () => {
  it("separators are hidden below sm and the pickers stack", () => {
    const { container } = render(
      <ScopeBar scope={DEFAULT_SCOPE} onChange={() => {}} industries={[]} categories={[]} totalCount={10} />,
    );
    const nav = container.querySelector("nav") as HTMLElement;
    expect(nav.className).toContain("grid-cols-1");
    nav.querySelectorAll("svg.lucide-chevron-right").forEach((s) => expect(s.getAttribute("class")).toContain("hidden"));
  });
});
