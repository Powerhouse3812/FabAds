import { Sparkles } from "lucide-react";

interface HeroHeaderProps {
  /** Small uppercase eyebrow chip text — e.g. "Studio", "Approach". Optional. */
  eyebrow?: string;
  /** Main title — e.g. "What are you generating today?" */
  title: string;
  /** 1-line subtitle below title. Optional. */
  subtitle?: string;
  /** Right-aligned context breadcrumb — e.g. "Asset · Image · Mamaearth Vit-C". Optional. */
  breadcrumb?: string;
}

/**
 * HeroHeader — consistent compact hero used by every wizard step.
 *
 * Replaces the per-step text-3xl/text-4xl heroes that ate 100-150px of fold
 * budget. New treatment: small eyebrow chip + text-xl title + optional
 * subtitle + optional right-aligned breadcrumb. Total height ~64-80px.
 */
export function HeroHeader({
  eyebrow,
  title,
  subtitle,
  breadcrumb,
}: HeroHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-2.5 w-2.5" />
            {eyebrow}
          </span>
        )}
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {breadcrumb && (
        <p className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {breadcrumb}
        </p>
      )}
    </header>
  );
}
