/**
 * TestingVelocityCard — new-creatives-per-week chart, extracted from the
 * retired Owner Report (Maalik: the only piece of that screen worth keeping
 * on Overview — everything else there was either a Dashboard $ duplicate or
 * Catalogue-dimension data OverviewBreakdown already covers). Zero $ values
 * by design: this is a testing-cadence signal, not a spend/revenue rollup.
 *
 * Same card shell as OverviewBreakdown (rounded-2xl/border/bg-card/70/
 * backdrop-blur + hover-lift) so the two sit as siblings on Overview.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { testingVelocity, type CreativeRollup, type VelocityPoint } from "@/creative-report/lib/selectors";
import { fmtDate } from "@/creative-report/lib/format";

function VelocityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: VelocityPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">Week of {fmtDate(point.weekStart)}</p>
      <p className="text-xs">
        <span className="text-muted-foreground">New creatives: </span>
        <span className="font-medium text-foreground">{point.newCreatives}</span>
      </p>
    </div>
  );
}

export function TestingVelocityCard({ rollups }: { rollups: CreativeRollup[] }) {
  const velocity = testingVelocity(rollups);

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl",
        "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-1">
        <h3 className="text-sm font-semibold text-foreground">Testing velocity</h3>
        <WhyDot id="owner.velocity" />
      </div>
      <p className="mb-3 mt-1 text-xs text-muted-foreground">
        New creatives started testing, by week.
      </p>
      {velocity.length === 0 ? (
        <p className="text-sm text-muted-foreground">No creatives in the current view yet.</p>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={velocity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="weekStart"
                tickFormatter={(d: string) => fmtDate(d)}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis hide />
              <Tooltip content={<VelocityTooltip />} />
              <Bar
                dataKey="newCreatives"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
