interface HeroHeaderProps {
  /** Main title — e.g. "What are you generating today?" */
  title: string;
  /** Right-aligned context note. Optional. Use sparingly — ProgressIndicator
   *  already shows where the user is. Most steps shouldn't need this. */
  meta?: string;
}

/**
 * HeroHeader — minimal one-line title for every wizard step.
 *
 * A-12.6 simplification: dropped the eyebrow chip + subtitle + breadcrumb
 * per the "less is more" directive. ProgressIndicator owns step naming;
 * the in-form title only carries the question/instruction the user needs
 * right now. Smaller font (text-base → text-lg max) to reduce hero weight.
 */
export function HeroHeader({ title, meta }: HeroHeaderProps) {
  return (
    <header className="flex items-baseline justify-between gap-3">
      <h1 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {meta && (
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {meta}
        </p>
      )}
    </header>
  );
}
