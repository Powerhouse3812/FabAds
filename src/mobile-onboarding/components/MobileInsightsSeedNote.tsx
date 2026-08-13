import { History } from "lucide-react";
import type { MobileOnboardingStartMode } from "../types";

export interface MobileInsightsSeedNoteProps {
  startMode: MobileOnboardingStartMode;
  /** How many chips are currently selected on this screen. */
  seededCount: number;
}

/**
 * Provenance note shown at the top of each Insights picker on a "Replay"
 * run: it tells the user WHY the screen arrived pre-filled, and that the
 * pre-fill is a read of their live workspace preferences.
 *
 * Renders nothing on a "Start fresh" run, and nothing on Replay when there
 * was nothing to seed — an empty picker claiming "we loaded your picks"
 * would be a lie (NN/g #1, match between system and the real world).
 */
export function MobileInsightsSeedNote({
  startMode,
  seededCount,
}: MobileInsightsSeedNoteProps) {
  if (startMode !== "replay" || seededCount === 0) return null;

  return (
    <p className="mb-4 flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/[0.06] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
      <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <span>
        Pre-filled from your current setup. Changes here are a preview only —
        nothing is written back.
      </span>
    </p>
  );
}
