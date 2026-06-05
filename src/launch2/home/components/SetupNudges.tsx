import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SetupNudge {
  icon: ReactNode;
  title: string;
  sub: string;
  cta: string;
  primary?: boolean;
  onClick?: () => void;
}

/** A single setup-nudge card (zero-data home). */
export function NudgeCard({ nudge, className }: { nudge: SetupNudge; className?: string }) {
  return (
    <button
      type="button"
      onClick={nudge.onClick}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        nudge.primary
          ? "border-primary/40 hover:border-primary"
          : "border-border hover:border-foreground/20 hover:bg-muted/40",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-md",
          nudge.primary ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {nudge.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-g6-sans text-sm font-semibold text-foreground">{nudge.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{nudge.sub}</p>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold",
          nudge.primary
            ? "text-[hsl(var(--primary-text))]"
            : "text-foreground/80 group-hover:text-foreground",
        )}
      >
        {nudge.cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

/** Responsive grid of setup nudges. */
export function SetupNudges({ nudges, className }: { nudges: SetupNudge[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {nudges.map((n) => (
        <NudgeCard key={n.title} nudge={n} />
      ))}
    </div>
  );
}
