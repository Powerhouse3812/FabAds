import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { INDEX, MODULE_NOW } from "@/lib/insights-v3/data";
import { countActive, countWinners, sortAds } from "@/lib/insights-v3/selectors";
import { ALL, type Ad } from "@/lib/insights-v3/types";
import { AdsTab } from "./AdsTab";
import type { DetailTabProps } from "./types";

beforeAll(() => {
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

const topDomain = INDEX.advertisers
  .filter((a) => a.kind === "domain")
  .sort((a, b) => (INDEX.adsByDomain.get(b.id)?.length ?? 0) - (INDEX.adsByDomain.get(a.id)?.length ?? 0))[0];
const ADS: Ad[] = INDEX.adsByDomain.get(topDomain.id) ?? [];

function props(ads: Ad[]): DetailTabProps {
  return {
    kind: "domain",
    id: topDomain.id,
    detail: {} as DetailTabProps["detail"],
    ads,
    baseAds: ads,
    scope: { industry: ALL, category: ALL, period: ALL } as unknown as DetailTabProps["scope"],
    ctx: { now: MODULE_NOW },
  };
}

function show(ads: Ad[] = ADS) {
  return render(
    <MemoryRouter initialEntries={["/industry-insights/advertisers"]}>
      <AdsTab {...props(ads)} />
    </MemoryRouter>,
  );
}

const cardIds = () => [...document.querySelectorAll("[data-ad-id]")].map((el) => el.getAttribute("data-ad-id"));

describe("AdsTab", () => {
  it("has enough ads to page through (fixture sanity)", () => {
    expect(ADS.length).toBeGreaterThan(13);
  });

  it("starts on Longest running with the longest-running ad first, 12 at a time", () => {
    show();
    const region = screen.getByRole("region", { name: "Ads" });
    expect(within(region).getByRole("combobox", { name: "Sort" })).toHaveTextContent("Longest running");
    const expected = sortAds(ADS, "longest-running").slice(0, 12).map((a) => a.id);
    expect(cardIds()).toEqual(expected);
    expect(within(region).getByRole("heading", { level: 3 })).toHaveTextContent(new RegExp(`${ADS.length.toLocaleString("en-US")} ads`));
    expect(region).toHaveTextContent(new RegExp(`${countActive(ADS)} active`));
    expect(region).toHaveTextContent(new RegExp(`${countWinners(ADS)} winners?`));
    expect(screen.getByText(/Based on/)).toBeInTheDocument();
  });

  it("changing the sort reorders the cards", () => {
    show();
    fireEvent.click(screen.getByRole("combobox", { name: "Sort" }));
    fireEvent.click(screen.getByRole("option", { name: "Oldest" }));
    const expected = sortAds(ADS, "oldest").slice(0, 12).map((a) => a.id);
    expect(cardIds()).toEqual(expected);
    expect(cardIds()).not.toEqual(sortAds(ADS, "longest-running").slice(0, 12).map((a) => a.id));
  });

  it("shows 12, then more on request, with a Showing X of N line", () => {
    show();
    expect(cardIds()).toHaveLength(12);
    expect(screen.getByText(/Showing/)).toHaveTextContent(`Showing 12 of ${ADS.length.toLocaleString("en-US")}`);
    fireEvent.click(screen.getByRole("button", { name: /Show more ads/ }));
    expect(cardIds()).toHaveLength(Math.min(24, ADS.length));
    expect(screen.getByText(/Showing/)).toHaveTextContent(`Showing ${Math.min(24, ADS.length)} of`);
  });

  it("shows an empty state when the competitor has no ads in scope", () => {
    show([]);
    expect(screen.getByText("No ads in this scope")).toBeInTheDocument();
    expect(cardIds()).toHaveLength(0);
  });
});
