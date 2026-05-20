import { useEffect, useRef } from "react";
import { useInsightBoards } from "@/hooks/use-insight-boards";
import { PinnedBoardsSection } from "@/components/insights/PinnedBoardsSection";
import {
  DEFAULT_SEED_COUNT,
  hasSeeded,
  usePinnedInsightBoards,
} from "@/components/insights/use-pinned-insight-boards";

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
 * First-paint seeding: on a fresh browser (no seeded flag in
 * localStorage), we auto-pin the first DEFAULT_SEED_COUNT boards so
 * the section is visible at first paint instead of hidden behind an
 * empty state. The seed runs exactly once per browser — once the user
 * unpins, they own the list. See use-pinned-insight-boards.ts for the
 * flag contract.
 *
 * Renders nothing when there are no pins (the PinnedBoardsSection's
 * empty-state policy hides the header too).
 */
export function InsightsPinnedBoardsAddon() {
  const { boards, isLoading } = useInsightBoards();
  const { seedDefaultPins } = usePinnedInsightBoards();

  // Local guard so the effect short-circuits on subsequent renders
  // without re-reading localStorage. seedDefaultPins itself is already
  // idempotent via hasSeeded(), but this avoids the storage read on
  // every render after the first pass.
  const seedAttemptedRef = useRef(false);

  useEffect(() => {
    if (seedAttemptedRef.current) return;
    // Wait until the boards query has resolved. If we ran while
    // `isLoading` is true we'd write the seeded flag with zero pins
    // and miss the chance forever.
    if (isLoading) return;
    seedAttemptedRef.current = true;
    if (hasSeeded()) return;
    if (boards.length === 0) return;
    seedDefaultPins(boards.slice(0, DEFAULT_SEED_COUNT).map((b) => b.id));
  }, [isLoading, boards, seedDefaultPins]);

  return <PinnedBoardsSection boards={boards} />;
}
