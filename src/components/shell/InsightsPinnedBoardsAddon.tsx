import { useInsightBoards } from "@/hooks/use-insight-boards";
import { PinnedBoardsSection } from "@/components/insights/PinnedBoardsSection";

/**
 * InsightsPinnedBoardsAddon — thin shell-layer wrapper that resolves
 * pinned board IDs (localStorage) against live board data (Supabase via
 * `useInsightBoards`) and renders the pinned-boards section in the
 * Industry Insights sub-nav.
 *
 * Lives in `components/shell/` rather than `components/insights/` so the
 * insights data hook only fires when this addon is mounted — i.e. when
 * the user is on the Insights module. Other modules pay zero cost.
 *
 * Renders nothing when there are no pins (the PinnedBoardsSection's
 * empty-state policy hides the header too).
 */
export function InsightsPinnedBoardsAddon() {
  const { boards } = useInsightBoards();
  // `boards` is undefined while the query loads; pass through an empty
  // list so PinnedBoardsSection can short-circuit cleanly. Once boards
  // resolve, pinned IDs match against them and the section appears.
  return <PinnedBoardsSection boards={boards ?? []} />;
}
