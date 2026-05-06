import { ChevronRight, Box, Upload, Sparkles, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptBarReference } from "@/components/PromptBar";

/**
 * ReferencesSummaryRow — A-11.24.
 *
 * Compact summary for the References field. Shows attached count + a small
 * thumbnail-stack avatars row + Edit trigger that opens the references
 * drawer. The thumbnail stack mixes upload / pinterest / product chips so
 * the user sees what kinds of references are attached at a glance.
 */

export interface ReferencesSummaryRowProps {
  /** All currently-attached references (uploads + pinterest + product). */
  references: PromptBarReference[];
  onClick: () => void;
  active: boolean;
}

export function ReferencesSummaryRow({
  references,
  onClick,
  active,
}: ReferencesSummaryRowProps) {
  const count = references.length;
  const empty = count === 0;
  const stack = references.slice(0, 3);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "w-full flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {empty ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground italic">
            <Paperclip className="h-3 w-3" />
            No references attached →
          </span>
        ) : (
          <>
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
              {count} attached
            </span>
            <div className="flex -space-x-1">
              {stack.map((r, i) => (
                <ThumbDot key={`${r.value}-${i}`} reference={r} />
              ))}
            </div>
          </>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground",
        )}
      >
        {active ? "Editing" : "Edit"}
        <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */

function ThumbDot({ reference }: { reference: PromptBarReference }) {
  const kind = reference.kind ?? "url";
  const Icon =
    kind === "product" ? Box : kind === "upload" ? Upload : Sparkles;
  const tint =
    kind === "product"
      ? "bg-primary/20 text-primary border-primary/30"
      : kind === "upload"
      ? "bg-amber-200/40 text-amber-700 dark:text-amber-400 border-amber-400/30"
      : "bg-sky-200/40 text-sky-700 dark:text-sky-400 border-sky-400/30";
  return (
    <span
      title={reference.label}
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-card",
        tint,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
    </span>
  );
}
