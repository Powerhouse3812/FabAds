import { ChevronLeft } from "lucide-react";

interface HeroHeaderProps {
  /** Main title — e.g. "What are you generating today?" */
  title: string;
  /** Right-aligned context note. Optional. Use sparingly — ProgressIndicator
   *  already shows where the user is. Most steps shouldn't need this. */
  meta?: string;
  /** Optional back hint on the LEFT side of the title row. Subtle —
   *  not a primary CTA. A-12.40: contextual back affordance close to the
   *  step content (the topbar back stays as the global one). */
  onBack?: () => void;
}

/**
 * HeroHeader — centered step title for every wizard step.
 *
 * A-12.13: Center-aligned, text-xl — matches the clean AI-app pattern
 * (HeyGen / Linear style). ProgressIndicator owns step naming; this title
 * carries the question/instruction for the current step only.
 *
 * A-12.40: optional onBack renders a subtle hint affordance on the left
 * (chevron + small label, muted). Doesn't compete with the centered title.
 */
export function HeroHeader({ title, meta, onBack }: HeroHeaderProps) {
  return (
    // Mobile (<md): flex row — back / title / spacer — so the back control
    // and the title never collide at narrow widths (A-mobile-fix).
    //
    // This per-step Back is md:-only. On a phone the wizard already shows a
    // flow-level Back in its topbar AND a thumb-reachable Back in the sticky
    // footer — a third one next to the title was noise, and it was the one
    // colliding with the title in the first place.
    // md+: reverts byte-for-byte to the original relative/absolute/
    // text-center treatment — desktop is unaffected.
    <header className="flex items-center gap-2 md:relative md:block md:space-y-1 md:text-center">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="hidden h-11 shrink-0 items-center gap-0.5 px-1 text-[11px] font-medium text-muted-foreground/55 transition-colors hover:text-foreground md:absolute md:left-0 md:top-1/2 md:inline-flex md:h-auto md:-translate-y-1/2 md:px-0"
        >
          <ChevronLeft className="h-4 w-4 md:h-3.5 md:w-3.5" />
          <span>Back</span>
        </button>
      )}
      <div className="min-w-0 flex-1 space-y-1 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
          {title}
        </h1>
        {meta && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {meta}
          </p>
        )}
      </div>
    </header>
  );
}
