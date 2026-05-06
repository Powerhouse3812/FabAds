import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CtaLayoutToggleProps {
  value: "inline" | "footer";
  onChange: (v: "inline" | "footer") => void;
  className?: string;
}

export function CtaLayoutToggle({ value, onChange, className }: CtaLayoutToggleProps) {
  const next = value === "inline" ? "footer" : "inline";
  const label = value === "inline" ? "Layout: A · inline" : "Layout: B · footer";
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      title="Flip Step 4 CTA layout (dev toggle — A: inline Send, B: footer Generate)"
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground",
        className,
      )}
    >
      <ArrowLeftRight className="h-3 w-3" />
      {label}
    </button>
  );
}
