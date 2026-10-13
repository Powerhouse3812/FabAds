import { beforeAll, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { INDEX, MODULE_NOW, getAds } from "@/lib/insights-v3/data";
import { adsInBaseScope, adsInScope, advertiserDetail, rising } from "@/lib/insights-v3/selectors";
import { DEFAULT_SCOPE, type AdvertiserKind, type Scope } from "@/lib/insights-v3/types";
import { CreativeTab } from "./CreativeTab";
import type { DetailTabProps } from "./types";

beforeAll(() => {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= RO;
});

const ctx = { now: MODULE_NOW };

function propsFor(kind: AdvertiserKind, id: string, scope: Scope = DEFAULT_SCOPE): DetailTabProps {
  const baseAds = adsInBaseScope(getAds(), scope, ctx);
  const detail = advertiserDetail(kind, id, baseAds, scope, ctx)!;
  const own = (a: { pageAdvertiserId: string; domainAdvertiserId: string | null }) => (kind === "page" ? a.pageAdvertiserId === id : a.domainAdvertiserId === id);
  return { kind, id, detail, ads: adsInScope(baseAds, scope, ctx).filter(own), baseAds, scope, ctx };
}

function show(p: DetailTabProps) {
  return render(
    <MemoryRouter initialEntries={["/industry-insights/advertisers"]}>
      <CreativeTab {...p} />
    </MemoryRouter>,
  );
}

// A domain with plenty of ads so every group is populated and the hooks list is longer than six.
const topDomain = INDEX.advertisers
  .filter((a) => a.kind === "domain")
  .sort((a, b) => (INDEX.adsByDomain.get(b.id)?.length ?? 0) - (INDEX.adsByDomain.get(a.id)?.length ?? 0))[0];

describe("CreativeTab", () => {
  it("titles every group in 'they run most' language with the usage-not-results subtitle", () => {
    show(propsFor("domain", topDomain.id));
    for (const t of ["Hooks they run most", "Angles they run most", "Frameworks they run most", "Concepts they run most"]) {
      expect(screen.getByRole("region", { name: t })).toBeInTheDocument();
    }
    expect(screen.getByText(/Most-used first\. A count is how many of their ads use it; it shows usage, not results\./)).toBeInTheDocument();
    // Every group states how many ads it is built on.
    expect(screen.getAllByText(/Based on/).length).toBeGreaterThanOrEqual(6);
  });

  it("ranks by count (top first), highlights #1 with a 'Most run' pill and caps the list at 6 with Show all", () => {
    const p = propsFor("domain", topDomain.id);
    show(p);
    const group = within(screen.getByRole("region", { name: "Hooks they run most" }));
    const rows = group.getAllByTestId("ranked-row");
    const items = p.detail.hooks.items;
    expect(rows).toHaveLength(Math.min(6, items.length));
    // sorted by count, desc
    for (let i = 1; i < items.length; i++) expect(items[i - 1].count).toBeGreaterThanOrEqual(items[i].count);
    expect(within(rows[0]).getByRole("button", { name: new RegExp(`Hook: ${items[0].label}`) })).toBeInTheDocument();
    // #1 only is highlighted
    expect(rows[0]).toHaveAttribute("data-top", "true");
    expect(within(rows[0]).getByText("Most run")).toBeInTheDocument();
    expect(group.getAllByText("Most run")).toHaveLength(1);
    rows.slice(1).forEach((r) => expect(r).not.toHaveAttribute("data-top"));
    if (items.length > 6) {
      fireEvent.click(group.getByRole("button", { name: new RegExp(`^Show all ${items.length}`) }));
      expect(group.getAllByTestId("ranked-row")).toHaveLength(items.length);
      fireEvent.click(group.getByRole("button", { name: /^Show top 6/ }));
      expect(group.getAllByTestId("ranked-row")).toHaveLength(6);
    }
  });

  it("marks only the elements that are rising for this competitor", () => {
    const p = propsFor("domain", topDomain.id);
    const own = p.baseAds.filter((a) => a.domainAdvertiserId === topDomain.id);
    const risingIds = new Set(rising("hook", own, p.scope.period, p.ctx.now, { limit: 20 }).map((t) => t.id));
    show(p);
    const group = within(screen.getByRole("region", { name: "Hooks they run most" }));
    const rows = group.getAllByTestId("ranked-row");
    const shown = p.detail.hooks.items.slice(0, rows.length);
    rows.forEach((r, i) => {
      const pill = within(r).queryByLabelText(/^Rising for this competitor/);
      expect(Boolean(pill)).toBe(risingIds.has(shown[i].id));
    });
  });

  it("disables a group with the reason when there is nothing to rank", () => {
    const p = propsFor("domain", topDomain.id);
    show({ ...p, detail: { ...p.detail, angles: { basedOn: 0, items: [] }, keywords: { basedOn: 0, items: [] } } });
    expect(screen.getByRole("region", { name: /Angles they run most \(unavailable\)/ })).toBeInTheDocument();
    expect(screen.getByText("No angle could be identified in this competitor's ads.")).toBeInTheDocument();
    expect(screen.getByText("No keywords could be extracted from this competitor's ads.")).toBeInTheDocument();
    // the other groups still render
    expect(screen.getByRole("region", { name: "Hooks they run most" })).toBeInTheDocument();
  });

  it("shows CTA buttons and opening lines with their own 'Based on' notes", () => {
    const p = propsFor("domain", topDomain.id);
    show(p);
    expect(screen.getByRole("region", { name: "CTA buttons they use most" })).toBeInTheDocument();
    if (p.detail.hookLines.items.length > 0) {
      const lines = within(screen.getByRole("region", { name: "Opening lines" }));
      expect(lines.getByText(/Based on/)).toBeInTheDocument();
      expect(lines.getAllByRole("button").length).toBeLessThanOrEqual(4);
    }
  });
});
