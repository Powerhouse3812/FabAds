import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// ─── Column definitions ────────────────────────────────────────────────────────

const COLUMNS = [
  { label: "Account", flex: "flex-[2]" },
  { label: "Spend", flex: "flex-1" },
  { label: "ROAS", flex: "w-16" },
  { label: "CTR", flex: "w-16" },
  { label: "Impressions", flex: "flex-1" },
  { label: "CPC", flex: "w-16" },
];

// Pre-defined widths per row so each row looks slightly different (not cloned).
// Values are percentage widths of the grey bar inside each cell.
const ROW_WIDTHS = [
  [85, 70, 55, 80, 75, 60],
  [60, 85, 70, 50, 90, 45],
  [90, 55, 80, 65, 70, 80],
  [70, 75, 60, 85, 55, 70],
  [55, 90, 75, 70, 80, 55],
];

// ─── TopBar ───────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
      {/* Left — module label */}
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
          Multi-account reporting
        </span>
      </div>

      {/* Right — confronting stat */}
      <div className="flex items-center gap-1.5 rounded bg-muted/50 px-2.5 py-1.5">
        <span className="font-mono text-[20px] font-bold tabular-nums leading-none text-foreground/20">
          0
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 leading-snug">
          of 15
          <br />
          accounts
          <br />
          visible
        </span>
      </div>
    </div>
  );
}

// ─── GhostTable ───────────────────────────────────────────────────────────────

function GhostTable() {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Column header row */}
      <div className="flex items-center border-b border-border/40 bg-muted/20 shrink-0">
        {COLUMNS.map((col) => (
          <div
            key={col.label}
            className={`${col.flex} px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60`}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Ghost rows */}
      {ROW_WIDTHS.map((widths, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center border-b border-border/20 py-3 last:border-0"
        >
          {COLUMNS.map((col, colIdx) => (
            <div key={col.label} className={`${col.flex} px-3`} aria-hidden>
              <span
                className="block h-2 rounded-full bg-foreground/[0.08]"
                style={{ width: `${widths[colIdx]}%` }}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Footer note */}
      <div className="px-5 py-2.5 bg-muted/10 mt-auto">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40">
          + 10 more rows hidden · 15 accounts not aggregated
        </span>
      </div>
    </div>
  );
}

// ─── BottomCTABar ─────────────────────────────────────────────────────────────

function BottomCTABar() {
  return (
    <div className="shrink-0 border-t border-border/40 bg-card/80 backdrop-blur-sm px-5 py-3 flex items-center justify-between gap-4">
      {/* Left — copy */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-foreground leading-none">
          15 accounts. 0 visible.
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          Growth unlocks the full table.
        </span>
      </div>

      {/* Right — CTA */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/plans-v2?tier=growth&view=trial"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[12.5px] font-bold text-foreground transition-colors hover:bg-primary/90"
        >
          Start 14-day Growth trial
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 hidden sm:block">
          Cancel any time
        </span>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ReportsUpsellPage() {
  return (
    <div className="flex flex-col h-full min-h-[480px]">
      <TopBar />
      <GhostTable />
      <BottomCTABar />
    </div>
  );
}
