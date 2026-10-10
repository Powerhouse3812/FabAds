import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getAds } from "@/lib/insights-v3/data";
import { isWinner } from "@/lib/insights-v3/selectors";
import { resetInsightsV3DemoState } from "@/lib/insights-v3/stores";
import { AdDrawer } from "./AdDrawer";

// Isolate from the sibling agents' components (their real versions land in the merge).
vi.mock("@/components/insights-v3/ad-card/AdCard", () => ({
  AdCard: ({ ad, onOpen }: { ad: { id: string; headline: string }; onOpen?: (id: string) => void }) => (
    <button type="button" data-testid="ad-card" onClick={() => onOpen?.(ad.id)}>
      {ad.headline}
    </button>
  ),
}));
vi.mock("@/components/insights-v3/genie/UseInGenie", () => ({
  UseInGenie: ({ label }: { label?: string }) => <button type="button">{label ?? "Use in Genie"}</button>,
}));

beforeAll(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
beforeEach(() => resetInsightsV3DemoState());

const ads = getAds();
const FULL = ads.find(
  (a) => isWinner(a) && a.mediaKind === "video" && a.analysis.beats && a.analysis.transcript && a.landingPageId && a.similarAdIds.length > 0 && a.analysis.angle,
)!;
const SPARSE = ads.find((a) => a.mediaKind === "image" && !a.analysis.transcript && !a.landingPageId && a.engagement.likes === null)!;

function renderDrawer(adId: string, onClose = vi.fn()) {
  render(
    <MemoryRouter initialEntries={[`/industry-insights/discover?ad=${adId}`]}>
      <AdDrawer adId={adId} onClose={onClose} />
    </MemoryRouter>,
  );
  return onClose;
}

describe("AdDrawer · populated", () => {
  it("renders every kept section and the added analysis", () => {
    renderDrawer(FULL.id);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(`Ad ID: ${FULL.externalId}`)).toBeInTheDocument();

    // kept
    for (const t of ["Ad details", "Ad keywords (AI generated)", "Platforms", "Targeted demographics", "Similar ads"]) {
      expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("Spend till now")).toBeInTheDocument();
    expect(screen.getByText("EU reach")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByText("Create Variations")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add to competitor|Competitor/ })).toBeInTheDocument();

    // added
    expect(screen.getByText("Metrics")).toBeInTheDocument();
    expect(screen.getByText("AI score breakdown")).toBeInTheDocument();
    expect(screen.getByText("Creative breakdown")).toBeInTheDocument();
    expect(screen.getByText(/Script, storyboard and timeline/)).toBeInTheDocument();
    expect(screen.getByText("Landing page, offer and funnel")).toBeInTheDocument();
    expect(screen.getByText("Use this script in Genie")).toBeInTheDocument();
    expect(screen.getAllByText(/Based on/).length).toBeGreaterThan(0);
    expect(screen.getByText("Winner")).toBeInTheDocument();

    // every score part is shown with its value and reason
    for (const p of FULL.aiScore.parts) expect(screen.getAllByText(p.label).length).toBeGreaterThan(0);
  });

  it("has no analysed / not analysed UI", () => {
    renderDrawer(FULL.id);
    expect(screen.queryByText(/not analysed/i)).toBeNull();
    expect(screen.queryByText(/^analysed$/i)).toBeNull();
    expect(screen.queryByText(/analyse again/i)).toBeNull();
    expect(screen.queryByText(/analysis queue/i)).toBeNull();
  });

  it("lists the four creative elements as clickable chips", () => {
    renderDrawer(FULL.id);
    const section = screen.getByRole("region", { name: "Creative breakdown" });
    expect(within(section).getAllByRole("button", { name: /^(Framework|Hook|Angle|Concept): .*Open details$/ })).toHaveLength(4);
  });
});

describe("AdDrawer · partial data", () => {
  it("shows disabled sections with reasons and 'Not reported', never collapsing", () => {
    renderDrawer(SPARSE.id);
    expect(screen.getByText("No transcript: image ad.")).toBeInTheDocument();
    expect(screen.getByText(/No landing page was captured for this ad/)).toBeInTheDocument();
    expect(screen.getAllByText("Not reported").length).toBeGreaterThan(0); // engagement + score parts
    // the section frames are still there
    expect(screen.getByRole("region", { name: "Engagement" })).toBeInTheDocument();
    expect(screen.getByText("AI score breakdown")).toBeInTheDocument();
  });

  it("explains the points redistribution when a score part is missing", () => {
    renderDrawer(SPARSE.id);
    expect(screen.getByText(/redistributed across the parts that are/)).toBeInTheDocument();
  });
});

describe("AdDrawer · unknown ad", () => {
  it("renders an empty state with a way out", () => {
    const onClose = renderDrawer("ad-does-not-exist");
    expect(screen.getByText("This ad isn't available")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(onClose).toHaveBeenCalled();
  });
});

describe("AdDrawer · dismissal", () => {
  it("closes on Esc", () => {
    const onClose = renderDrawer(FULL.id);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close on outside click", () => {
    const onClose = renderDrawer(FULL.id);
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    const overlay = document.querySelector("[data-state='open'][class*='bg-black']");
    if (overlay) {
      fireEvent.pointerDown(overlay);
      fireEvent.click(overlay);
    }
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes from the X button", () => {
    const onClose = renderDrawer(FULL.id);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("AdDrawer · QA fixes", () => {
  it("QA-09: a visible Download button sits right next to Save", () => {
    renderDrawer(FULL.id);
    const save = screen.getByRole("button", { name: /Save this ad to a board|Saved to \d+ board/ });
    const download = screen.getByRole("button", { name: "Download" });
    expect(download).toBeVisible();
    expect(save.nextElementSibling).toBe(download);
  });

  it("QA-05: closing returns focus to the element that opened the drawer", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <MemoryRouter initialEntries={[`/industry-insights/discover?ad=${FULL.id}`]}>
          <button type="button" onClick={() => setOpen(true)}>
            opener card
          </button>
          {open && <AdDrawer adId={FULL.id} onClose={() => setOpen(false)} />}
        </MemoryRouter>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "opener card" });
    act(() => opener.focus());
    fireEvent.click(opener);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.activeElement).not.toBe(opener);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });
});
