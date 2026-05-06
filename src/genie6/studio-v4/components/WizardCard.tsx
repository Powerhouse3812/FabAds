import * as React from "react";
import { cn } from "@/lib/utils";

interface WizardCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  emoji: string;
  title: string;
  description: string;
  selected?: boolean;
  badge?: string;
}

export function WizardCard({
  emoji,
  title,
  description,
  selected = false,
  badge,
  className,
  onClick,
  ...rest
}: WizardCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex h-full flex-col items-start gap-3 rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40",
        className,
      )}
      {...rest}
    >
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {badge}
        </span>
      )}
      <span className="text-4xl leading-none">{emoji}</span>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-snug text-muted-foreground">{description}</p>
    </button>
  );
}
