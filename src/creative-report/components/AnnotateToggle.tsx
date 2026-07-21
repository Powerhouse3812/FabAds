/**
 * AnnotateToggle — dev-only footer control that flips the annotation overlay
 * on/off. Sits next to StatesSwitcher in the dev footer (Maalik-only tooling,
 * gated behind import.meta.env.DEV by the caller).
 */
import { MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnnotateMode, toggleAnnotateMode } from "@/creative-report/annotations/store";

export function AnnotateToggle() {
  const on = useAnnotateMode();
  return (
    <button
      type="button"
      onClick={toggleAnnotateMode}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
        on
          ? "border-primary/40 bg-primary/15 text-primary-text"
          : "border-border text-muted-foreground hover:bg-accent",
      )}
    >
      <MessageCircleQuestion className="h-3.5 w-3.5" />
      Annotate {on ? "on" : "off"}
    </button>
  );
}
