/**
 * QuickStatsColumn — three stacked mini-tiles for the AI-plan dashboard.
 * Credits → /plans-v2  · Generations → /iq/genie6/library  · Brands → /catalogue/brands
 *
 * Numbers are placeholder mock figures matched to the redo-tidy-rain plan;
 * swap in real selectors when billing + library aggregates are wired.
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface QuickStatsColumnProps {
  className?: string;
}

const CREDITS_USED = 73;
const CREDITS_TOTAL = 100;
const GENERATIONS_THIS_MONTH = 28;
const GENERATIONS_DELTA = 12;
const ACTIVE_BRANDS = 4;

/* Tiny ASCII-feeling progress bar — 10 cells, ▓ = filled, ░ = empty. */
function microBar(value: number, total: number, cells = 10) {
  const filled = Math.max(0, Math.min(cells, Math.round((value / total) * cells)));
  return "▓".repeat(filled) + "░".repeat(cells - filled);
}

export function QuickStatsColumn({ className }: QuickStatsColumnProps) {
  const navigate = useNavigate();
  const creditsLeft = Math.max(0, CREDITS_TOTAL - CREDITS_USED);
  const topThreeBrands = brands.slice(0, 3);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Tile 1 — Credits */}
      <Card
        onClick={() => navigate("/plans-v2")}
        className="cursor-pointer transition-all hover:border-foreground/20 hover:-translate-y-0.5"
      >
        <CardContent className="p-3 h-[86px] flex flex-col justify-between">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Credits this month
            </span>
            <span className="font-mono text-lg font-bold tracking-tight tabular-nums">
              {CREDITS_USED}/{CREDITS_TOTAL}
            </span>
          </div>
          <div className="font-mono text-[11px] tracking-tighter text-primary leading-none">
            {microBar(CREDITS_USED, CREDITS_TOTAL)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {creditsLeft} credits left · resets Jun 1
          </span>
        </CardContent>
      </Card>

      {/* Tile 2 — Generations */}
      <Card
        onClick={() => navigate("/iq/genie6/library")}
        className="cursor-pointer transition-all hover:border-foreground/20 hover:-translate-y-0.5"
      >
        <CardContent className="p-3 h-[86px] flex flex-col justify-between">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Generations this month
            </span>
            <span className="font-mono text-lg font-bold tracking-tight tabular-nums">
              {GENERATIONS_THIS_MONTH}
            </span>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground">
              <span aria-hidden>▲</span>+{GENERATIONS_DELTA} vs Apr
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Across {ACTIVE_BRANDS} brands
          </span>
        </CardContent>
      </Card>

      {/* Tile 3 — Active brands */}
      <Card
        onClick={() => navigate("/catalogue/brands")}
        className="cursor-pointer transition-all hover:border-foreground/20 hover:-translate-y-0.5"
      >
        <CardContent className="p-3 h-[86px] flex flex-col justify-between">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Active brands
            </span>
            <span className="font-mono text-lg font-bold tracking-tight tabular-nums">
              {ACTIVE_BRANDS}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {topThreeBrands.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {b.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
