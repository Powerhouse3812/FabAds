import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAds } from "@/lib/insights-v3/data";
import { boardsStore, savedAdsStore } from "@/lib/insights-v3/stores";
import { IndustryInsightsPicker } from "@/genie6/studio-v4/components/IndustryInsightsPicker";
import { UseInGenie } from "./UseInGenie";
import { V2InsightsPickerSection } from "./V2InsightsPickerSection";
import { toAttachedRef } from "./pickItems";

function Where() {
  const loc = useLocation();
  return <div data-testid="where">{loc.pathname + loc.search}</div>;
}

const withRouter = (ui: React.ReactNode, url = "/industry-insights/discover") =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              {ui}
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const ad = getAds().find((a) => a.analysis.hookText && a.analysis.hookStyle)!;

describe("<UseInGenie />", () => {
  it("renders nothing for types without a Genie flow", () => {
    const { container } = withRouter(<UseInGenie target={{ type: "domain", id: "x" }} />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("button: lime at rest, navigates to Studio with the V2 ref", () => {
    withRouter(<UseInGenie target={{ type: "ad", id: ad.id }} />);
    const btn = screen.getByRole("button", { name: /use in genie/i });
    expect(btn.className).toContain("bg-primary");
    fireEvent.click(btn);
    const where = screen.getByTestId("where").textContent!;
    expect(where).toMatch(/^\/iq\/genie6\/studio-alpha\//);
    expect(where).toContain(`ref=iiv2%3A${ad.id}`);
    expect(where).toContain("act=winner-as-reference");
  });

  it("element: hook goes as use-hook on an example ad", () => {
    withRouter(<UseInGenie target={{ type: "hook", id: ad.analysis.hookStyle! }} variant="icon" />);
    fireEvent.click(screen.getByRole("button", { name: /use in genie/i }));
    expect(screen.getByTestId("where").textContent).toContain("act=use-hook");
  });

  it("drawer's Create Variations passes generate-variation", () => {
    withRouter(<UseInGenie target={{ type: "ad", id: ad.id }} action="generate-variation" label="Create Variations" />);
    fireEvent.click(screen.getByRole("button", { name: /create variations/i }));
    expect(screen.getByTestId("where").textContent).toContain("act=generate-variation");
  });

  it("unknown items stay visible but disabled", () => {
    withRouter(<UseInGenie target={{ type: "ad", id: "ad-missing" }} />);
    expect(screen.getByRole("button", { name: /use in genie/i })).toBeDisabled();
  });

  it("menu-item variant renders inside a dropdown", () => {
    withRouter(
      <DropdownMenu open>
        <DropdownMenuTrigger>more</DropdownMenuTrigger>
        <DropdownMenuContent>
          <UseInGenie target={{ type: "angle", id: ad.analysis.angle! }} variant="menu-item" />
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole("menuitem", { name: /use in genie/i })).toBeInTheDocument();
  });
});

describe("V2 section of the Genie Industry Insights picker", () => {
  beforeEach(() => {
    boardsStore.reset();
    savedAdsStore.reset();
  });

  it("the picker defaults to the original Pinned pane and offers a V2 tab", () => {
    render(<IndustryInsightsPicker onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByRole("tab", { name: "Pinned" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Industry Insights V2" }));
    expect(screen.getByRole("tab", { name: "Industry Insights V2" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("v2-insights-picker")).toBeVisible();
  });

  it("populated: lists boards/saved items and market elements; Save hands AttachedRefs out", () => {
    const onSave = vi.fn();
    render(<V2InsightsPickerSection onSave={onSave} onClose={() => {}} />);
    expect(screen.getByRole("region", { name: "From your boards & saved ads" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Most used in the market" })).toBeInTheDocument();
    for (const f of ["All", "Ads", "Frameworks", "Hooks", "Angles", "Concepts"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${f}\\s*\\d+$`) })).toBeInTheDocument();
    }
    const rows = Array.from(document.querySelectorAll<HTMLButtonElement>("li > button[aria-pressed=\"false\"]"));
    fireEvent.click(rows[0]);
    fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const refs = onSave.mock.calls[0][0];
    expect(refs).toHaveLength(1);
    expect(refs[0].source).toBe("industry-insights");
  });

  it("zero-data: no boards or saved ads still shows the market and an explanation", () => {
    boardsStore.set(() => []);
    savedAdsStore.set(() => []);
    render(<V2InsightsPickerSection onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByText(/Nothing saved yet/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Most used in the market" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Ads\s*0$/ })).toBeDisabled();
  });

  it("elements travel as text references with a context tag; ads as whole-ad", () => {
    expect(
      toAttachedRef({ key: "hook:x", type: "hook", id: "x", title: "Warning", meta: "", thumbnail: null, quote: "Stop scrolling" }),
    ).toMatchObject({ id: "iiv2-hook:x", label: "Hook · Warning — “Stop scrolling”", context: "copy" });
    expect(toAttachedRef({ key: "ad:a", type: "ad", id: "ad-0001", title: "T", meta: "", thumbnail: "t.jpg" })).toMatchObject({
      id: "iiv2:ad-0001",
      context: "whole-ad",
      thumbnail: "t.jpg",
    });
  });
});
