/**
 * ComponentTable — the ranked list for one Components tab (hooks, headlines,
 * primary text, CTAs, visual styles). Handoff §5.3: value · creatives · spend
 * · ROAS · win-rate vs median · trend · confidence · brief-to-Genie action.
 * Flat shadcn Table — the one allowed container per screen.
 */
import { Minus, TrendingDown, TrendingUp, Wand2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfidenceChip } from "@/creative-report-v2/components/ConfidenceChip";
import {
  fmtCompactCurrency,
  fmtDelta,
  fmtMultiple,
  fmtPct,
  pluralize,
  truncate,
} from "@/creative-report-v2/lib/format";
import type { ComponentRow } from "@/creative-report-v2/lib/selectors";

const VALUE_MAX = 44;

/** "+14pp" / "-6pp" / "0pp" — percentage-point delta, never a bare dash. */
function fmtPp(pct: number): string {
  const rounded = Math.round(pct);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}pp`;
}

export function ComponentTable({
  rows,
  tabLabel,
  onBrief,
}: {
  rows: ComponentRow[];
  tabLabel: string;
  onBrief: (value: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tabLabel}</TableHead>
          <TableHead>Creatives</TableHead>
          <TableHead>Spend</TableHead>
          <TableHead>ROAS</TableHead>
          <TableHead>Win-rate vs median</TableHead>
          <TableHead>Trend</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
              No components in this view.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const { text, truncated } = truncate(row.value, VALUE_MAX);
            const pp = fmtPp(row.vsMedianPct);
            const ppTone =
              row.vsMedianPct > 0 ? "text-primary-text" : row.vsMedianPct < 0 ? "text-destructive" : "text-muted-foreground";
            const trend = row.trendPct !== null ? fmtDelta(row.trendPct) : null;

            return (
              <TableRow key={row.value}>
                <TableCell
                  className="max-w-[320px] truncate text-sm font-medium text-foreground"
                  title={truncated ? row.value : undefined}
                >
                  {text}
                </TableCell>
                <TableCell className="tabular-nums text-sm text-muted-foreground">
                  {pluralize(row.creativeCount, "creative")}
                </TableCell>
                <TableCell className="tabular-nums text-sm text-foreground">
                  {fmtCompactCurrency(row.spend)}
                </TableCell>
                <TableCell className="tabular-nums text-sm text-foreground">
                  {fmtMultiple(row.roas)}
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  <span className="text-foreground">{fmtPct(row.winRate, 0)}</span>
                  <span className={`ml-1.5 font-medium ${ppTone}`}>{pp}</span>
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  {trend === null ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Minus className="h-4 w-4" />
                      <span>{fmtDelta(null).label}</span>
                    </span>
                  ) : trend.tone === "up" ? (
                    <span className="inline-flex items-center gap-1 text-primary-text">
                      <TrendingUp className="h-4 w-4" />
                      <span>{trend.label}</span>
                    </span>
                  ) : trend.tone === "down" ? (
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <TrendingDown className="h-4 w-4" />
                      <span>{trend.label}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Minus className="h-4 w-4" />
                      <span>{trend.label}</span>
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <ConfidenceChip confidence={row.confidence} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onBrief(row.value)}>
                    <Wand2 className="h-4 w-4" />
                    Brief this → Genie
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
