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
    <header className="relative space-y-1 text-center">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="absolute left-0 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 text-[11px] font-medium text-muted-foreground/55 transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>
      )}
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {meta && (
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {meta}
        </p>
      )}
    </header>
  );
}
