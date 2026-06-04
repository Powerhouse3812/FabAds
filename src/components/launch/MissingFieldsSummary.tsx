import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MissingFieldItem {
  /** Field key — matches a `data-field="<key>"` attribute or element id to scroll to. */
  key: string;
  /** Human label, e.g. "Launch name" or "Ad 'Skin Glow' — Headline, CTA". */
  label: string;
}

interface MissingFieldsSummaryProps {
  items: MissingFieldItem[];
  className?: string;
}

/**
 * MissingFieldsSummary — a precise "what's missing" panel shown when a launch
 * step fails validation. Replaces the old generic "please fill required fields"
 * toast that never told the user WHICH field. Each row is clickable and scrolls
 * to (and focuses) the offending field via its `data-field`/`id` anchor — the
 * same anchors `scrollToFirstError` already targets.
 *
 * Render at the top of a step (or just above its footer) whenever the step's
 * `fieldErrors` is non-empty. Self-contained scroll logic so any step can use it.
 */
export function MissingFieldsSummary({ items, className }: MissingFieldsSummaryProps) {
  if (items.length === 0) return null;

  const jumpTo = (key: string) => {
    const el =
      document.querySelector(`[data-field="${key}"]`) ||
      document.getElementById(key);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = el.querySelector("input, textarea, select, button") as HTMLElement | null;
    if (input) setTimeout(() => input.focus(), 300);
    else if ((el as HTMLElement).focus) setTimeout(() => (el as HTMLElement).focus(), 300);
  };

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-1.5",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {items.length} required field{items.length === 1 ? "" : "s"} missing — fix these to continue
      </p>
      <ul className="space-y-0.5 pl-5">
        {items.map((it) => (
          <li key={it.key}>
            <button
              type="button"
              onClick={() => jumpTo(it.key)}
              className="text-left text-xs text-destructive/90 underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
