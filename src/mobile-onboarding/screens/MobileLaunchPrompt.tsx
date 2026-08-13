import { useState } from "react";
import { History, Info, Sparkles } from "lucide-react";
import { MobileFlowShell } from "../components/MobileFlowShell";
import { MobileOptionCard } from "../components/MobileOptionCard";
import type { MobileOnboardingStartMode } from "../types";

export interface MobileLaunchPromptProps {
  onClose: () => void;
  onPick: (mode: MobileOnboardingStartMode) => void;
  /** True while the current-preferences read for "Replay" is in flight. */
  seedLoading?: boolean;
  /** How many preference values the workspace currently has, for the blurb. */
  seedCount?: number;
}

/**
 * Screen 0 — "Replay" vs "Start fresh".
 *
 * The flow is fully replayable (there is no "already seen" flag anywhere in
 * this module), so asking this up front is what makes a repeat run
 * meaningful. Because NOTHING PERSISTS, the two answers differ in exactly
 * one way, and the copy says so plainly rather than implying a saved state:
 *
 *   Replay      → the Insights pickers open pre-filled with the workspace's
 *                 CURRENT preferences (read-only), so the run feels like
 *                 revisiting an existing setup.
 *   Start fresh → every picker opens empty.
 *
 * Skipped entirely when the caller passes an explicit `mode` prop.
 */
export function MobileLaunchPrompt({
  onClose,
  onPick,
  seedLoading = false,
  seedCount = 0,
}: MobileLaunchPromptProps) {
  const [picked, setPicked] = useState<MobileOnboardingStartMode | null>(null);

  const replayBlurb = seedLoading
    ? "Loading your current preferences…"
    : seedCount > 0
      ? `Pre-fills the pickers with your ${seedCount} current preference${seedCount === 1 ? "" : "s"}.`
      : "Pre-fills the pickers with your current preferences — you have none set yet.";

  return (
    <MobileFlowShell
      eyebrow="Set up my feed & Genie"
      title="How do you want to run this?"
      subtitle="You can walk through setup as many times as you like — nothing here overwrites your workspace."
      onClose={onClose}
      primaryLabel="Start"
      primaryDisabled={picked === null}
      onPrimary={() => picked && onPick(picked)}
      footerNote="Takes under 2 minutes"
    >
      <div className="flex flex-col gap-2.5">
        <MobileOptionCard
          icon={History}
          title="Replay"
          blurb={replayBlurb}
          selected={picked === "replay"}
          onSelect={() => setPicked("replay")}
        />
        <MobileOptionCard
          icon={Sparkles}
          title="Start fresh"
          blurb="Opens every picker empty, like a brand-new account."
          selected={picked === "fresh"}
          onSelect={() => setPicked("fresh")}
        />
      </div>

      {/* Honesty note — this is a preview surface, not a settings screen.
          Stating it here prevents the "I edited my feed and it didn't stick"
          support ticket (NN/g #1, visibility of system status). */}
      <div className="mt-4 flex gap-3 rounded-lg border border-border bg-muted/40 px-3.5 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium leading-tight text-foreground">
            This is a preview walkthrough
          </p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Choices made in here are not saved. Change your real preferences
            from <span className="font-mono text-foreground/80">My Feeds</span> →
            Settings.
          </p>
        </div>
      </div>
    </MobileFlowShell>
  );
}
