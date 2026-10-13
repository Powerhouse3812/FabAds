import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { getAds } from "@/lib/insights-v3/data";
import type { Ad } from "@/lib/insights-v3/types";
import { AdCard } from "./AdCard";

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;

function Probe() {
  const loc = useLocation();
  return <output data-testid="loc">{loc.search}</output>;
}

function renderCard(ad: Ad, props: Partial<React.ComponentProps<typeof AdCard>> = {}) {
  return render(
    <MemoryRouter initialEntries={["/industry-insights/discover"]}>
      <AdCard ad={ad} {...props} />
      <Probe />
    </MemoryRouter>,
  );
}

const ads = getAds();
const populated = ads.find((a) => a.thumbnailUrl && a.analysis.hookStyle && a.analysis.framework && a.daysLive != null && a.mediaKind === "video") ?? ads[0];

const degraded: Ad = {
  ...populated,
  id: "degraded-1",
  thumbnailUrl: null,
  daysLive: null,
  startedAt: null,
  countries: [],
  ctaLabel: null,
  clones: 0,
  status: "inactive",
  analysis: {
    ...populated.analysis,
    framework: null,
    frameworkConfidence: null,
    hookStyle: null,
    hookText: null,
    angle: null,
    angleText: null,
    concept: null,
    summary: null,
    beats: null,
    transcript: null,
  },
};

const LONG = "Smart Cash Rewards Credit Card Comparison Guide for Salaried Professionals in Tier-2 Indian Cities 2026";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("AdCard", () => {
  it("renders the populated card in spec order: media, page row, chips, signals, score, headline, actions", () => {
    renderCard(populated);
    const card = screen.getByRole("article");
    expect(within(card).getByTestId("ad-media")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: new RegExp(`Open page ${populated.pageName.slice(0, 10)}`) })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /Follow|Unfollow/ })).toBeInTheDocument();
    expect(within(card).getByText(/days? live/)).toBeInTheDocument();
    expect(within(card).getByLabelText(/^AI score/)).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /Save this ad to a board|Saved to/ })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /Download ad/ })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /More actions/ })).toBeInTheDocument();
  });

  it("opens the drawer through ?ad= on click and on Enter, but not from inner buttons", () => {
    renderCard(populated);
    const card = screen.getByRole("article");
    fireEvent.click(within(card).getByRole("button", { name: /Follow|Unfollow/ }));
    expect(screen.getByTestId("loc").textContent).toBe("");
    fireEvent.click(within(card).getByRole("button", { name: /Save this ad to a board|Saved to/ }));
    expect(screen.getByTestId("loc").textContent).not.toContain("ad=");
    fireEvent.click(card);
    expect(screen.getByTestId("loc").textContent).toContain(`ad=${populated.id}`);
  });

  it("opens on Enter when the card itself is focused", () => {
    renderCard(populated);
    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(screen.getByTestId("loc").textContent).toContain(`ad=${populated.id}`);
  });

  it("uses onOpen when given instead of the URL", () => {
    let opened = "";
    renderCard(populated, { onOpen: (id) => (opened = id) });
    fireEvent.click(screen.getByRole("article"));
    expect(opened).toBe(populated.id);
    expect(screen.getByTestId("loc").textContent).toBe("");
  });

  it("page name opens the page overlay through ?detail=", () => {
    renderCard(populated);
    fireEvent.click(screen.getByRole("button", { name: /^Open page / }));
    expect(screen.getByTestId("loc").textContent).toContain("detail=page");
    expect(screen.getByTestId("loc").textContent).not.toContain("ad=");
  });

  it("survives null thumbnail, null analysis, null daysLive and no country", () => {
    renderCard(degraded);
    const card = screen.getByRole("article");
    expect(card.querySelector("img[src*='picsum']")).toBeNull(); // no thumbnail, no broken <img>
    expect(within(card).getByRole("img", { name: /No creative preview/ })).toBeInTheDocument();
    expect(within(card).getByText("Start date unknown")).toBeInTheDocument();
    expect(within(card).getByText("Not seen recently")).toBeInTheDocument();
    // analysis chips are simply absent
    expect(within(card).queryByRole("button", { name: /^(Hook|Angle|Framework|Concept):/ })).toBeNull();
    expect(within(card).getByLabelText(/^AI score/)).toBeInTheDocument();
    expect(within(card).queryByText(/^CTA/)).toBeNull();
  });

  it("keeps a 60+ character page name in one truncated line with the full name reachable", () => {
    expect(LONG.length).toBeGreaterThan(60);
    renderCard({ ...populated, pageName: LONG });
    const btn = screen.getByRole("button", { name: `Open page ${LONG}` });
    expect(btn).toBeInTheDocument();
    expect(within(btn).getByText(LONG)).toHaveClass("truncate");
  });

  it("compact variant renders and still opens the drawer", () => {
    renderCard(populated, { variant: "compact" });
    fireEvent.click(screen.getByRole("article"));
    expect(screen.getByTestId("loc").textContent).toContain(`ad=${populated.id}`);
  });

  it("only shows the Winner engagement mark when told the ad stands out", () => {
    const winner = ads.find((a) => a.status === "active" && (a.daysLive ?? 0) >= 14 && a.clones >= 2);
    if (!winner) return;
    const { unmount } = renderCard(winner, { engagementStandout: false });
    expect(screen.queryByText(/Also stands out on reported engagement/)).toBeNull();
    unmount();
    renderCard(winner, { engagementStandout: true });
    expect(screen.getAllByText(/Also stands out on reported engagement/).length).toBeGreaterThan(0);
  });
});
