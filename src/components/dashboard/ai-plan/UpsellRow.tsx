/**
 * UpsellRow — the dashboard's feature-upsell zone.
 *
 * Redesign (2026-05): the old layout was 3 equal h-44 cards in a row —
 * which violated the design system's own anti-pattern #5 ("3 equal-weight
 * cards in a row") and read as three variations of one template. Maalik's
 * directive: bigger, illustrated, spacious, each card a DIFFERENT visual
 * language.
 *
 * Now this is a vertical stack of 3 large illustrated cards, each owning a
 * distinct illustration method + internal layout:
 *   • LaunchUpsellCard      — isometric account-stack, art on the right
 *   • ReportsUpsellCard     — editorial chart-as-art, art on the left
 *   • AutomationUpsellCard  — live node-circuit, art on top
 *
 * Each card is self-contained (own file). This component only stacks them
 * with consistent spacing. Unified lime palette keeps the trio coherent
 * even though every illustration is a different genre.
 */
import { cn } from "@/lib/utils";
import { LaunchUpsellCard } from "./LaunchUpsellCard";
import { ReportsUpsellCard } from "./ReportsUpsellCard";
import { AutomationUpsellCard } from "./AutomationUpsellCard";

interface UpsellRowProps {
  className?: string;
}

export function UpsellRow({ className }: UpsellRowProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <LaunchUpsellCard />
      <ReportsUpsellCard />
      <AutomationUpsellCard />
    </div>
  );
}
