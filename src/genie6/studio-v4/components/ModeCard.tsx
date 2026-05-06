import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeCardProps {
  variant: "hero" | "grid";
  emoji: string;
  title: string;
  description: string;
  selected?: boolean;
  recommended?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function ModeCard({
  variant,
  emoji,
  title,
  description,
  selected = false,
  recommended = false,
  disabled = false,
  onClick,
}: ModeCardProps) {
  const base =
    "relative flex flex-col gap-3 rounded-2xl border bg-card text-left shadow-sm transition-all";

  const borderState = selected
    ? "border-primary ring-2 ring-primary/30"
    : disabled
      ? "border-border opacity-60 cursor-not-allowed"
      : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md";

  const sizing = variant === "hero" ? "p-6 w-full" : "p-4";

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(base, borderState, sizing)}
    >
      {/* Hero variant: Recommended chip + Check icon */}
      {variant === "hero" && recommended && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          Recommended
        </span>
      )}
      {variant === "hero" && selected && (
        <span
          className={cn(
            "absolute top-4 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground",
            recommended ? "right-32" : "right-4",
          )}
          aria-label="Selected"
        >
          <Check className="h-3 w-3" />
        </span>
      )}

      {/* Grid variant: Coming soon pill when disabled */}
      {variant === "grid" && disabled && (
        <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          Coming soon
        </span>
      )}

      <span
        className={cn(
          "leading-none",
          variant === "hero" ? "text-4xl" : "text-3xl",
        )}
      >
        {emoji}
      </span>
      <h3
        className={cn(
          "font-bold text-foreground",
          variant === "hero" ? "text-xl" : "text-sm",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-muted-foreground leading-relaxed",
          variant === "hero" ? "text-sm" : "text-xs",
        )}
      >
        {description}
      </p>
    </button>
  );
}
