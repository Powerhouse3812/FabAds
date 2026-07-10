import { cn } from "@/lib/utils";

/**
 * RadioDot — hand-rolled radio indicator shared by the trial row and the
 * plan-card accordions on Step 1. Not the shadcn `RadioGroup` primitive:
 * each row here is a whole clickable card (radio + price + chevron), which
 * doesn't map cleanly onto Radix's single-focusable-item radio semantics —
 * so selection is plain state lifted to Step1PlanSelection, and this is
 * just the visual dot. Figma's radio checked-state renders as a solid dark
 * fill (not the lime accent), matching node 11207:44569 in 10990:44968.
 */
export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border",
        selected ? "border-foreground" : "border-input",
      )}
    >
      {selected && <span className="size-2 rounded-full bg-foreground" />}
    </span>
  );
}
