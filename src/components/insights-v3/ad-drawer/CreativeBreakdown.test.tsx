import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FRAMEWORK_ELEMENT_LABEL, getAds } from "@/lib/insights-v3/data";
import { resetInsightsV3DemoState } from "@/lib/insights-v3/stores";
import { CreativeBreakdown } from "./CreativeBreakdown";

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
const WITH_BEATS = ads.find((a) => a.analysis.beats && a.analysis.beats.length >= 3 && a.analysis.transcript)!;
const NO_BEATS = ads.find((a) => !a.analysis.beats || a.analysis.beats.length === 0)!;

function renderSection(ad: (typeof ads)[number]) {
  render(
    <MemoryRouter>
      <CreativeBreakdown ad={ad} />
    </MemoryRouter>,
  );
}

describe("CreativeBreakdown · framework row", () => {
  it("shows one segment per beat, in beat order, with visible labels", () => {
    renderSection(WITH_BEATS);
    const segments = screen.getAllByTestId("framework-segment");
    const beats = WITH_BEATS.analysis.beats!;
    expect(segments).toHaveLength(beats.length);
    segments.forEach((seg, i) => {
      const label = FRAMEWORK_ELEMENT_LABEL[beats[i].element] ?? beats[i].element;
      expect(within(seg).getByText(label)).toBeVisible();
      expect(within(seg).getByText(String(i + 1))).toBeInTheDocument();
    });
  });

  it("is not interactive: no buttons, links or focusable nodes inside the row", () => {
    renderSection(WITH_BEATS);
    const row = screen.getAllByTestId("framework-segment")[0].parentElement!;
    expect(row.tagName).toBe("OL");
    expect(within(row).queryAllByRole("button")).toHaveLength(0);
    expect(within(row).queryAllByRole("link")).toHaveLength(0);
    expect(row.querySelectorAll("[tabindex], button, a, input")).toHaveLength(0);
  });

  it("keeps the beat-by-beat script and the Genie button", () => {
    renderSection(WITH_BEATS);
    expect(screen.getByText("Use this script in Genie")).toBeInTheDocument();
    for (const b of WITH_BEATS.analysis.beats!) expect(screen.getAllByText(b.text).length).toBeGreaterThan(0);
  });

  it("has no transcript in this section", () => {
    renderSection(WITH_BEATS);
    expect(screen.queryByText(/transcript/i)).toBeNull();
    expect(WITH_BEATS.analysis.transcript).toBeTruthy(); // proves it is moved, not just absent from the data
  });

  it("falls back to the disabled section when there are no beats", () => {
    renderSection(NO_BEATS);
    expect(screen.queryAllByTestId("framework-segment")).toHaveLength(0);
    expect(screen.getByText("Script, storyboard and timeline")).toBeInTheDocument();
  });
});
