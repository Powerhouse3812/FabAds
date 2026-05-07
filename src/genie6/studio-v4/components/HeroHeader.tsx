interface HeroHeaderProps {
  /** Main title — e.g. "What are you generating today?" */
  title: string;
  /** Right-aligned context note. Optional. Use sparingly — ProgressIndicator
   *  already shows where the user is. Most steps shouldn't need this. */
  meta?: string;
}

/**
 * HeroHeader — centered step title for every wizard step.
 *
 * A-12.13: Center-aligned, text-xl — matches the clean AI-app pattern
 * (HeyGen / Linear style). ProgressIndicator owns step naming; this title
 * carries the question/instruction for the current step only.
 */
export function HeroHeader({ title, meta }: HeroHeaderProps) {
  return (
    <header className="space-y-1 text-center">
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
