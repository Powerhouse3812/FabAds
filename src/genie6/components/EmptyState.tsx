import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DotGridPattern } from "./DotGridPattern";

/**
 * Composed empty state — never bare "No data". Always: motif + title + sub + CTA.
 * Used by every screen with a zero-data variant (Library, Workspace, Settings, etc.).
 */
type Props = {
  title: string;
  description?: string;
  motif?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  motif,
  primaryAction,
  secondaryAction,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative flex min-h-[400px] w-full flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <DotGridPattern />
      <div className="relative z-10 flex max-w-md flex-col items-center gap-4">
        {motif ?? <DefaultMotif />}
        <div className="space-y-2">
          <h2 className="font-g6-sans text-g6-h3 font-bold text-g6-text">{title}</h2>
          {description && <p className="text-g6-base text-g6-text-secondary">{description}</p>}
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultMotif() {
  return (
    <svg
      viewBox="0 0 80 80"
      width="64"
      height="64"
      className="text-g6-primary"
      aria-hidden
    >
      <circle cx="40" cy="40" r="30" fill="currentColor" opacity="0.12" />
      <circle cx="40" cy="40" r="20" fill="currentColor" opacity="0.18" />
      <circle cx="40" cy="40" r="10" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
