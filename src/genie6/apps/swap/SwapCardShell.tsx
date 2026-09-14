import type { ReactNode } from "react";

/**
 * SwapCardShell — the ONE piece of chrome every stage-3 card shares: a
 * numbered badge (same role `VariationsFlowA`'s `Stage` numbers play — the
 * only thing carrying order on a screen that shows every card at once) plus
 * the bordered card frame. Standard tokens, not g6 — this screen lives in
 * Other Apps, which is standard-toned throughout (see SourceAdField.tsx's own
 * header note); only the embedded `AdgroupCard` (Stage 1) keeps its g6
 * styling, scoped via `.g6-root`.
 *
 * Accent at rest: the badge carries `primary/10` + `primary-text` unconditionally,
 * not only on hover/focus — CLAUDE.md's token-traps §1.
 */
export function SwapCardShell({
  index,
  eyebrow,
  children,
}: {
  index: number;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-[11px] font-semibold text-primary-text">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        {children}
      </div>
    </div>
  );
}
