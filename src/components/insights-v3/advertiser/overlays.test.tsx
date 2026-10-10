import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cloneElement, type ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { INDEX } from "@/lib/insights-v3/data";
import { AdvertiserDetail } from "../overlays/AdvertiserDetail";
import { LandingPageDetail } from "../overlays/LandingPageDetail";
import { OfferDetail } from "../overlays/OfferDetail";
import type { OverlayNav } from "../overlays/overlayNav";
import { PAGE_TEXT_MISSING } from "./helpers";

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

const nav = (extra: Partial<OverlayNav> = {}): OverlayNav => ({ open: true, onClose: () => {}, ...extra });

function show(node: ReactElement, url = "/industry-insights/advertisers") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      {node}
      <Where />
    </MemoryRouter>,
  );
}

const adCount = (m: Map<string, unknown[]>, id: string) => m.get(id)?.length ?? 0;
// Advertisers with plenty of ads, so every section is populated.
const topPage = INDEX.advertisers.filter((a) => a.kind === "page").sort((a, b) => adCount(INDEX.adsByPage, b.id) - adCount(INDEX.adsByPage, a.id))[0];
const topDomain = INDEX.advertisers.filter((a) => a.kind === "domain").sort((a, b) => adCount(INDEX.adsByDomain, b.id) - adCount(INDEX.adsByDomain, a.id))[0];
const lpWithAds = INDEX.landingPages.find((l) => l.pageText && l.offerDomain && adCount(INDEX.adsByLandingPage, l.id) > 2)!;
const lpNoText = INDEX.landingPages.find((l) => !l.pageText && adCount(INDEX.adsByLandingPage, l.id) > 0);
const lpNoOffer = INDEX.landingPages.find((l) => !l.offerDomain && adCount(INDEX.adsByLandingPage, l.id) > 0);
const offer = INDEX.offers.find((o) => o.landingPageIds.length > 1) ?? INDEX.offers[0];

describe("AdvertiserDetail", () => {
  it("renders every section for a page, with Mark as competitor, Follow, Save and Download", () => {
    show(<AdvertiserDetail kind="page" id={topPage.id} nav={nav()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    for (const t of ["AI strategy summary", "Launch activity", "How they hook", "Winning ads", "Longest running ads"]) {
      expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/Landing pages: where the traffic goes/)).toBeInTheDocument();
    expect(screen.getAllByText(/Based on/).length).toBeGreaterThan(3);
    expect(screen.getByRole("button", { name: /competitor/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^(Follow|Unfollow) / })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save this page to a board|Saved to/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download this page/ })).toBeInTheDocument();
  });

  it("a domain has no Follow button", () => {
    show(<AdvertiserDetail kind="domain" id={topDomain.id} nav={nav()} />);
    expect(screen.queryByRole("button", { name: /^(Follow|Unfollow) / })).toBeNull();
    expect(screen.getByRole("button", { name: /competitor/i })).toBeInTheDocument();
  });

  it("toggles the competitor mark", () => {
    show(<AdvertiserDetail kind="domain" id={topDomain.id} nav={nav()} />);
    const before = screen.getByRole("button", { name: /competitor/i }).getAttribute("aria-pressed");
    fireEvent.click(screen.getByRole("button", { name: /competitor/i }));
    expect(screen.getByRole("button", { name: /competitor/i }).getAttribute("aria-pressed")).not.toBe(before);
  });

  it("an unknown id shows an empty state with a Close button", () => {
    const onClose = vi.fn();
    show(<AdvertiserDetail kind="domain" id="does-not-exist" nav={nav({ onClose })} />);
    expect(screen.getByText(/isn't in the current scope/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("a known advertiser with no ads in a narrow scope offers a reset instead of empty sections", () => {
    const has = new Set((INDEX.adsByPage.get(topPage.id) ?? []).map((a) => a.industryId));
    const other = INDEX.universe.industries.find((i) => !has.has(i.id));
    expect(other).toBeTruthy();
    show(<AdvertiserDetail kind="page" id={topPage.id} nav={nav()} />, `/industry-insights/advertisers?industry=${other!.id}`);
    expect(screen.getByText(/No ads from this advertiser in the current scope/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset scope/ })).toBeInTheDocument();
  });

  it("shows the back chip when nested", () => {
    const onBack = vi.fn();
    show(<AdvertiserDetail kind="page" id={topPage.id} nav={nav({ backLabel: "Some LP", onBack })} />);
    fireEvent.click(screen.getByRole("button", { name: /Back to Some LP/ }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe("LandingPageDetail", () => {
  it("renders capture, funnel, ads + advertisers and creative mix", () => {
    show(<LandingPageDetail id={lpWithAds.id} nav={nav()} />);
    for (const t of ["Page capture", "Funnel", "Ads sending traffic here", "Advertisers using this page"]) {
      expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/Creative mix/)).toBeInTheDocument();
    expect(screen.getAllByText(/Based on/).length).toBeGreaterThan(2);
    expect(screen.getByRole("button", { name: /Download this landing page/ })).toBeInTheDocument();
  });

  it("filters and highlights the page text", () => {
    show(<LandingPageDetail id={lpWithAds.id} nav={nav()} />);
    const input = screen.getByRole("searchbox", { name: /Search the page text/ });
    const word = (lpWithAds.pageText as string).split(/\s+/).find((w) => /^[a-z]{5,}$/i.test(w)) as string;
    fireEvent.change(input, { target: { value: word } });
    expect(screen.getByText(/lines? match/)).toBeInTheDocument();
    expect(document.querySelectorAll("mark").length).toBeGreaterThan(0);
    fireEvent.change(input, { target: { value: "zzzqqq" } });
    expect(screen.getByText(/No line contains/)).toBeInTheDocument();
  });

  it("partial: missing page text disables that block with the reason", () => {
    expect(lpNoText).toBeTruthy();
    show(<LandingPageDetail id={lpNoText!.id} nav={nav()} />);
    expect(screen.getAllByText(PAGE_TEXT_MISSING).length).toBeGreaterThan(0);
    expect(screen.getByText("Page capture")).toBeInTheDocument();
  });

  it("partial: an untraced offer reads 'Not traced'", () => {
    expect(lpNoOffer).toBeTruthy();
    show(<LandingPageDetail id={lpNoOffer!.id} nav={nav()} />);
    expect(screen.getAllByText("Not traced").length).toBeGreaterThan(0);
  });

  it("the offer chip pushes the offer onto the detail stack", () => {
    show(<LandingPageDetail id={lpWithAds.id} nav={nav()} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`Offer: ${lpWithAds.offerDomain}`) }));
    expect(screen.getByTestId("where").textContent).toMatch(/detail=offer%3A/);
  });

  it("unknown id shows an empty state", () => {
    show(<LandingPageDetail id="lp-nope" nav={nav()} />);
    expect(screen.getByText(/isn't in the current scope/)).toBeInTheDocument();
  });
});

describe("OfferDetail", () => {
  it("renders landing pages pointing here, ads, advertisers, creative mix", () => {
    show(<OfferDetail id={offer.id} nav={nav()} />);
    for (const t of ["Landing pages pointing here", "Ads sending traffic to this offer", "Advertisers and funnels"]) {
      expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText(/Based on/).length).toBeGreaterThan(2);
    expect(screen.getByRole("button", { name: /Save this offer to a board|Saved to/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download this offer/ })).toBeInTheDocument();
  });

  it("opens a landing page from the list", () => {
    show(<OfferDetail id={offer.id} nav={nav()} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^Open landing page/ })[0]);
    expect(screen.getByTestId("where").textContent).toMatch(/detail=lp%3A/);
  });

  it("unknown offer shows an empty state", () => {
    show(<OfferDetail id="nope.example" nav={nav()} />);
    expect(screen.getByText(/isn't in the current scope/)).toBeInTheDocument();
  });
});
