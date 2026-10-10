import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { getAd } from "@/lib/insights-v3/data";
import {
  addToBoard,
  createBoard,
  getBoard,
  getSavedAds,
  isAdSaved,
  listBoards,
  resetInsightsV3DemoState,
  togglePin,
} from "@/lib/insights-v3/stores";
import { SaveToBoardModal } from "./SaveToBoardModal";
import PinnedBoardsNav from "./PinnedBoardsNav";
import BoardsPage from "@/pages/insights-v3/BoardsPage";
import BoardDetailPage from "@/pages/insights-v3/BoardDetailPage";
import SavedAdsPage from "@/pages/insights-v3/SavedAdsPage";

// Isolate from sibling agents' components (their real versions land in the merge).
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
vi.mock("@/components/insights-v3/overlays/AdvertiserDetail", () => ({ AdvertiserDetail: () => null }));
vi.mock("@/components/insights-v3/overlays/ElementDetail", () => ({
  ElementDetail: ({ elementType, id }: { elementType: string; id: string }) => <div data-testid="element-overlay">{`${elementType}:${id}`}</div>,
}));
vi.mock("@/components/insights-v3/overlays/LandingPageDetail", () => ({ LandingPageDetail: () => null }));
vi.mock("@/components/insights-v3/overlays/OfferDetail", () => ({ OfferDetail: () => null }));

beforeAll(() => {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
beforeEach(() => {
  resetInsightsV3DemoState();
  try {
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
});

function Where() {
  const l = useLocation();
  return <div data-testid="where">{`${l.pathname}${l.search}`}</div>;
}

const SEED_HOOKS = "board-seed-hooks";
const SEED_VSL = "board-seed-vsl";

/* ── SaveToBoardModal ───────────────────────────────────────────────────── */

describe("SaveToBoardModal", () => {
  const renderModal = (target: string) =>
    render(
      <MemoryRouter initialEntries={[`/industry-insights/discover?modal=save&target=${target}`]}>
        <SaveToBoardModal />
        <Where />
      </MemoryRouter>,
    );

  it("renders nothing without a target", () => {
    render(
      <MemoryRouter initialEntries={["/industry-insights/discover"]}>
        <SaveToBoardModal />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the snapshot, boards with counts and the Saved Ads toggle for an ad", () => {
    const ad = getAd(listBoards()[0].items.find((i) => i.ref.type === "ad")!.ref.id)!;
    renderModal(`ad:${ad.id}`);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Save to board")).toBeInTheDocument();
    expect(screen.getByText(ad.headline)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Saved Ads/ })).toBeInTheDocument();
    for (const b of listBoards()) expect(screen.getByRole("checkbox", { name: new RegExp(b.name.slice(0, 12)) })).toBeInTheDocument();
    // already on the seeded hooks board
    expect(screen.getByRole("checkbox", { name: /Winning hooks/ })).toHaveAttribute("aria-checked", "true");
  });

  it("toggles board membership and Saved Ads", () => {
    const ad = getAd(listBoards()[2].items.find((i) => i.ref.type === "ad")!.ref.id)!;
    renderModal(`ad:${ad.id}`);
    const row = screen.getByRole("checkbox", { name: /VSL teardown/ });
    const before = getBoard(SEED_VSL)!.items.some((i) => i.ref.id === ad.id);
    fireEvent.click(row);
    expect(getBoard(SEED_VSL)!.items.some((i) => i.ref.id === ad.id)).toBe(!before);
    expect(row).toHaveAttribute("aria-checked", String(!before));

    const saved = isAdSaved(ad.id);
    fireEvent.click(screen.getByRole("checkbox", { name: /Saved Ads/ }));
    expect(isAdSaved(ad.id)).toBe(!saved);
    expect(getSavedAds().length).toBeGreaterThan(0);
  });

  it("works for non-ad types (no Saved Ads row) and creates a board inline", () => {
    renderModal("hook:curiosity-question");
    expect(screen.queryByRole("checkbox", { name: /Saved Ads/ })).toBeNull();
    expect(screen.getAllByText("Hook").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "New board" }));
    fireEvent.change(screen.getByLabelText("New board name"), { target: { value: "Hooks for Monday" } });
    fireEvent.click(screen.getByRole("button", { name: "Create and save" }));
    const made = listBoards().find((b) => b.name === "Hooks for Monday")!;
    expect(made.items.map((i) => `${i.ref.type}:${i.ref.id}`)).toEqual(["hook:curiosity-question"]);
  });

  it("handles an unknown item without throwing", () => {
    renderModal("hook:no-such-hook");
    expect(screen.getByText("No preview available for this hook.")).toBeInTheDocument();
  });

  it("does not close on outside click, closes on Done", () => {
    renderModal("hook:curiosity-question");
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByTestId("where").textContent).not.toContain("modal=save");
  });
});

/* ── PinnedBoardsNav ────────────────────────────────────────────────────── */

describe("PinnedBoardsNav", () => {
  const renderNav = (path = "/industry-insights/discover") =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <PinnedBoardsNav />
      </MemoryRouter>,
    );

  it("lists pinned boards with counts, linking to the board page", () => {
    renderNav();
    const links = within(screen.getByRole("navigation", { name: "Pinned boards" })).getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", `/industry-insights/boards/${SEED_HOOKS}`);
    expect(links[0]).toHaveAccessibleName(/Winning hooks.*, \d+ items/);
  });

  it("marks the open board as current", () => {
    renderNav(`/industry-insights/boards/${SEED_VSL}`);
    expect(screen.getByRole("link", { name: /VSL teardown/ })).toHaveAttribute("aria-current", "page");
  });

  it("is hidden when nothing is pinned and capped at 5", () => {
    togglePin(SEED_HOOKS);
    togglePin(SEED_VSL);
    const { container } = renderNav();
    expect(container).toBeEmptyDOMElement();

    for (let i = 0; i < 7; i++) createBoard(`Extra ${i}`, { pinned: true });
    expect(listBoards().filter((b) => b.pinned).length).toBe(5);
  });
});

/* ── BoardsPage ─────────────────────────────────────────────────────────── */

describe("BoardsPage", () => {
  const renderPage = (search = "") =>
    render(
      <MemoryRouter initialEntries={[`/industry-insights/boards${search}`]}>
        <Routes>
          <Route path="/industry-insights/boards" element={<BoardsPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it("populated: pinned section first, cards with counts by type, no scope bar", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: /Boards/ })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Pinned boards" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Other boards" })).toBeInTheDocument();
    expect(screen.getByText("Winning hooks — insurance")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Items by type").length).toBe(3);
    expect(screen.queryByRole("navigation", { name: /Scope/ })).toBeNull();
  });

  it("?state=empty shows the zero-boards state with a next step", () => {
    renderPage("?state=empty");
    expect(screen.getByText("No boards yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create your first board/ })).toBeInTheDocument();
  });

  it("?state=loading shows a skeleton", () => {
    renderPage("?state=loading");
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("search with no hits offers a one-click clear", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Search boards"), { target: { value: "zzzz-nothing" } });
    expect(screen.getByText(/No boards match/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear search" }).pop()!);
    expect(screen.getByText("Winning hooks — insurance")).toBeInTheDocument();
  });

  it("pin cap: the sixth pin is refused", () => {
    for (let i = 0; i < 3; i++) createBoard(`Pin me ${i}`, { pinned: true }); // 2 seeded + 3 = 5
    renderPage();
    expect(listBoards().filter((b) => b.pinned).length).toBe(5);
    fireEvent.click(screen.getByRole("button", { name: "Pin Offers to watch" }));
    expect(listBoards().filter((b) => b.pinned).length).toBe(5);
  });

  it("creates and deletes with confirmation", () => {
    renderPage();
    fireEvent.click(screen.getAllByRole("button", { name: /New board/ })[0]);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Long name board ".repeat(5).trim() } });
    fireEvent.click(screen.getByRole("button", { name: "Create board" }));
    expect(listBoards().some((b) => b.name.startsWith("Long name board"))).toBe(true);

    fireEvent.keyDown(screen.getByRole("button", { name: "More actions for Offers to watch" }), { key: "Enter" });
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(getBoard("board-seed-offers")).toBeDefined(); // not yet: confirm first
    fireEvent.click(screen.getByRole("button", { name: "Delete board" }));
    expect(getBoard("board-seed-offers")).toBeUndefined();
  });
});

/* ── BoardDetailPage ────────────────────────────────────────────────────── */

describe("BoardDetailPage", () => {
  const renderPage = (id: string, search = "") =>
    render(
      <MemoryRouter initialEntries={[`/industry-insights/boards/${id}${search}`]}>
        <Routes>
          <Route path="/industry-insights/boards/:id" element={<BoardDetailPage />} />
          <Route path="/industry-insights/boards" element={<div>boards list</div>} />
        </Routes>
        <Where />
      </MemoryRouter>,
    );

  it("populated: type chips with counts (0 disabled), mixed grid", () => {
    renderPage(SEED_HOOKS);
    expect(screen.getByRole("heading", { level: 1, name: /Winning hooks/ })).toBeInTheDocument();
    const group = screen.getByRole("group", { name: "Filter by type" });
    expect(within(group).getByRole("button", { name: /^All/ })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: /Offers/ })).toBeDisabled(); // none of this type: disabled, not hidden
    expect(within(group).getByRole("button", { name: /Hooks/ })).toBeEnabled();
    expect(screen.getAllByTestId("ad-card").length).toBeGreaterThan(0);
  });

  it("filters by type (URL-backed)", () => {
    renderPage(SEED_HOOKS);
    fireEvent.click(within(screen.getByRole("group", { name: "Filter by type" })).getByRole("button", { name: /Hooks/ }));
    expect(screen.getByTestId("where").textContent).toContain("tab=hook");
    expect(screen.queryAllByTestId("ad-card")).toHaveLength(0);
  });

  it("opening an ad item opens the ad drawer", () => {
    renderPage(SEED_HOOKS);
    fireEvent.click(screen.getAllByTestId("ad-card")[0]);
    expect(screen.getByTestId("where").textContent).toMatch(/[?&]ad=ad-/);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opening an element item opens the overlay it was saved from", () => {
    renderPage(SEED_HOOKS);
    fireEvent.click(screen.getByRole("button", { name: /^Open .*[Cc]allout/ }));
    expect(screen.getByTestId("where").textContent).toMatch(/detail=hook(%3A|:)callout/);
    expect(screen.getByTestId("element-overlay")).toHaveTextContent("hook:callout");
  });

  it("QA-21: clicking the card body (or Enter on it) opens the item; inner controls don't", () => {
    renderPage(SEED_HOOKS);
    const card = screen.getByRole("article", { name: "Callout (Hook)" });
    // inner controls keep their own behaviour
    fireEvent.click(within(card).getByRole("button", { name: "Edit note" }));
    expect(screen.getByTestId("where").textContent).not.toContain("detail=");
    fireEvent.click(within(card).getByRole("button", { name: /^Remove / }));
    expect(screen.getByTestId("where").textContent).not.toContain("detail=");
  });

  it("QA-21: card body click opens the overlay it was saved from", () => {
    renderPage(SEED_HOOKS);
    fireEvent.click(screen.getByRole("article", { name: "Callout (Hook)" }));
    expect(screen.getByTestId("where").textContent).toMatch(/detail=hook(%3A|:)callout/);
  });

  it("QA-21: Enter on a focused card opens it", () => {
    renderPage(SEED_HOOKS);
    const card = screen.getByRole("article", { name: "Callout (Hook)" });
    expect(card).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(screen.getByTestId("where").textContent).toMatch(/detail=hook(%3A|:)callout/);
  });

  it("partial: an item missing from the data set stays removable, not openable", () => {
    addToBoard(SEED_HOOKS, { type: "hook", id: "ghost-hook" }, { title: "Ghost hook" });
    renderPage(SEED_HOOKS);
    expect(screen.getByText(/No longer in the data set/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ghost hook is no longer available/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove Ghost hook from this board" })).toBeEnabled();
  });

  it("edits a note", () => {
    renderPage(SEED_HOOKS);
    fireEvent.click(screen.getAllByRole("button", { name: "Add a note" })[0]);
    fireEvent.change(screen.getByPlaceholderText("Why did you save this?"), { target: { value: "Test on Monday" } });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect(getBoard(SEED_HOOKS)!.items.some((i) => i.note === "Test on Monday")).toBe(true);
  });

  it("?state=empty and an empty board show the explainer", () => {
    renderPage(SEED_HOOKS, "?state=empty");
    expect(screen.getByText("This board is empty")).toBeInTheDocument();
  });

  it("unknown id: empty state linking back to Boards", () => {
    renderPage("no-such-board");
    expect(screen.getByText("This board doesn't exist")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Boards/ })).toHaveAttribute("href", "/industry-insights/boards");
  });

  it("deleting navigates back to Boards", () => {
    renderPage(SEED_VSL);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete board" }));
    expect(screen.getByText("boards list")).toBeInTheDocument();
    expect(getBoard(SEED_VSL)).toBeUndefined();
  });
});

/* ── SavedAdsPage ───────────────────────────────────────────────────────── */

describe("SavedAdsPage", () => {
  const renderPage = (search = "") =>
    render(
      <MemoryRouter initialEntries={[`/industry-insights/saved${search}`]}>
        <Routes>
          <Route path="/industry-insights/saved" element={<SavedAdsPage />} />
        </Routes>
        <Where />
      </MemoryRouter>,
    );

  it("populated: scope bar, sort, ads grid, counts from the saved set", () => {
    renderPage();
    expect(screen.getByRole("navigation", { name: /Scope/ })).toBeInTheDocument();
    expect(screen.getAllByTestId("ad-card")).toHaveLength(getSavedAds().length);
    expect(screen.getByText(/saved ads for the scope above/)).toBeInTheDocument();
    expect(screen.getByText("Sort")).toBeInTheDocument();
  });

  it("QA-19: explains that the card bookmark is 'add to a board', not the Saved state", () => {
    renderPage();
    expect(screen.getByText(/bookmark on a card adds that ad to a board/)).toBeInTheDocument();
  });

  it("unsave removes the ad from Saved Ads only", () => {
    renderPage();
    const before = getSavedAds().length;
    fireEvent.click(screen.getAllByRole("button", { name: /Remove .* from Saved Ads/ })[0]);
    expect(getSavedAds().length).toBe(before - 1);
    expect(listBoards().length).toBe(3);
  });

  it("opening a saved ad opens the same drawer", () => {
    renderPage();
    fireEvent.click(screen.getAllByTestId("ad-card")[0]);
    expect(screen.getByTestId("where").textContent).toMatch(/[?&]ad=ad-/);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("?state=empty explains how to save, with a link to Discover", () => {
    renderPage("?state=empty");
    expect(screen.getByText("No saved ads yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse Discover" })).toHaveAttribute("href", "/industry-insights/discover");
  });

  it("?state=loading shows a skeleton", () => {
    renderPage("?state=loading");
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("a scope with no saved ads offers a one-click reset", () => {
    renderPage("?industry=search-arb&category=zzz-none");
    expect(screen.getByText("No saved ads in this scope")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all saved ads" }));
    expect(screen.getAllByTestId("ad-card").length).toBeGreaterThan(0);
  });
});
