import { cn } from "@/lib/utils";
import { InfoGlyph } from "./Hint";
import { fmtInt, pluralize } from "./format";

export interface BasedOnNoteProps {
  /** Number of ads the block is built on, in the current scope. */
  ads: number;
  className?: string;
}

/** "Based on 1,234 ads" + a tooltip explaining scope. Required on every overview / summary / analysis block. */
export function BasedOnNote({ ads, className }: BasedOnNoteProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <span>
        Based on <span className="font-mono font-medium tabular-nums text-foreground">{fmtInt(ads)}</span>{" "}
        {pluralize(ads, "ads")}
      </span>
      <InfoGlyph tip="Counted within the current scope (industry, category and period). Where some ads lack data, this block covers fewer ads than the page total." />
    </span>
  );
}
