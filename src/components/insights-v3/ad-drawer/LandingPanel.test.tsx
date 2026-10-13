import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getAds } from "@/lib/insights-v3/data";
import { resetInsightsV3DemoState } from "@/lib/insights-v3/stores";
import type { Ad } from "@/lib/insights-v3/types";
import { LandingPanel } from "./LandingPanel";

beforeAll(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
beforeEach(() => resetInsightsV3DemoState());

const ads = getAds();
const BASE = ads.find((a) => a.landingPageId && a.analysis.transcript)!;
const LONG = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");

const withTranscript = (t: string | null): Ad => ({ ...BASE, analysis: { ...BASE.analysis, transcript: t } });
const withoutPage = (t: string | null): Ad => ({ ...withTranscript(t), landingPageId: null });

function renderPanel(ad: Ad) {
  return render(
    <MemoryRouter initialEntries={["/industry-insights/discover"]}>
      <LandingPanel ad={ad} />
    </MemoryRouter>,
  );
}

describe("LandingPanel · transcript block", () => {
  it("shows the full transcript in a keyboard-reachable scroll region with its word count", () => {
    renderPanel(withTranscript(LONG));
    const box = screen.getByRole("region", { name: "Transcript" });
    expect(box).toHaveAttribute("tabindex", "0");
    expect(box.className).toContain("overflow-y-auto");
    expect(box.className).toContain("h-40");
    expect(box.className).not.toContain("overflow-hidden");
    expect(box.textContent).toBe(LONG);
    expect(screen.getByText("What the landing page says")).toBeInTheDocument();
    expect(screen.getByText("400 words")).toBeInTheDocument();
    // sits inside the landing page section, not a section of its own
    const section = screen.getByRole("region", { name: "Landing page, offer and funnel" });
    expect(within(section).getByRole("region", { name: "Transcript" })).toBe(box);
  });

  it("keeps the landing page details and the page capture button", () => {
    renderPanel(withTranscript(LONG));
    expect(screen.getByRole("button", { name: /^Open landing page details:/ })).toBeInTheDocument();
    expect(screen.getByText("Funnel type")).toBeInTheDocument();
    expect(screen.getByText("Offer domain")).toBeInTheDocument();
    expect(screen.getByText("Redirect path")).toBeInTheDocument();
    expect(screen.queryByText(/No transcript was captured/)).toBeNull();
  });
});

describe("LandingPanel · states", () => {
  it("no landing page and no transcript → the disabled section", () => {
    renderPanel(withoutPage(null));
    expect(screen.getByText(/No landing page was captured for this ad, so the offer and funnel path/)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Transcript" })).toBeNull();
  });

  it("no landing page but a transcript → section with a muted note, then the transcript", () => {
    renderPanel(withoutPage(LONG));
    const section = screen.getByRole("region", { name: "Landing page, offer and funnel" });
    expect(within(section).getByText("No landing page was captured for this ad.")).toBeInTheDocument();
    expect(within(section).getByRole("region", { name: "Transcript" }).textContent).toBe(LONG);
    expect(screen.queryByText("Funnel type")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Open landing page details:/ })).toBeNull();
  });

  it("landing page but no transcript → details plus a one-line note, no disabled box", () => {
    renderPanel(withTranscript(null));
    expect(screen.getByText("Funnel type")).toBeInTheDocument();
    expect(screen.getByText("No transcript was captured for this ad.")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Transcript" })).toBeNull();
    expect(document.querySelector("[aria-disabled='true']")).toBeNull();
  });

  it("treats a whitespace-only transcript as missing", () => {
    renderPanel(withTranscript("   \n  "));
    expect(screen.getByText("No transcript was captured for this ad.")).toBeInTheDocument();
  });
});
