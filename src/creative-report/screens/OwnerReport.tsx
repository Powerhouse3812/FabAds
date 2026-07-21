/**
 * OwnerReport — agency-owner-level rollup screen (P5 "Rollups & loop").
 * Portfolio KPIs, spend-vs-revenue trend, brand/account breakdowns, and
 * testing velocity — every number folded by the selectors in lib/selectors.ts
 * (sum-then-recompute, cardinal rule §8.3), never invented or averaged twice.
 * No composite score anywhere on this screen.
 *
 * Self-contained: pulls its own data via useCreativeData/useReportParams, so
 * it can be dropped into a route with zero required props. Not wired into
 * any route/sidebar yet — that's a separate integration step.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useReportParams } from "@/creative-report/hooks/useReportParams";
import { StateMessage } from "@/creative-report/components/states/StateMessage";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { KpiCards } from "@/creative-report/components/KpiCards";
import { PortfolioTrendChart } from "@/creative-report/components/PortfolioTrendChart";
import { ReportWizard } from "@/creative-report/components/ReportWizard";
import {
  accountRollups,
  brandRollups,
  testingVelocity,
  type VelocityPoint,
} from "@/creative-report/lib/selectors";
import {
  fmtCompactCurrency,
  fmtCurrency,
  fmtDate,
  fmtMultiple,
  notEnoughData,
  pluralize,
} from "@/creative-report/lib/format";
import { PLATFORM_LABELS } from "@/creative-report/lib/paramSchema";

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

export function OwnerReport() {
  const data = useCreativeData();
  const { filters } = useReportParams();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (data.status === "loading") {
    return <div className="p-6 text-sm text-muted-foreground">Loading owner report…</div>;
  }
  if (data.status === "error") {
    return (
      <StateMessage
        variant="error"
        title="Couldn't load your creatives"
        body="Something went wrong loading this report. Your filters are still applied — try again."
        actionLabel="Retry"
        onAction={() => navigate(0)}
      />
    );
  }
  if (data.status === "empty" || data.status === "filtered-empty") {
    return (
      <StateMessage
        variant={data.status === "empty" ? "empty" : "filtered"}
        title={data.status === "empty" ? "No creatives yet" : "No creatives match your filters"}
        body={
          data.status === "empty"
            ? "Once ads start running you'll be able to roll up spend and revenue here."
            : "Adjust or clear filters to bring creatives back into range for this rollup."
        }
      />
    );
  }

  const brandRows = brandRollups(data.rollups);
  const accountRows = accountRollups(data.rollups);
  const velocity = testingVelocity(data.rollups);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Owner report</h1>
          <p className="text-sm text-muted-foreground">
            Spend, revenue, and testing velocity rolled up by brand and ad account — the
            agency-owner view of the same filtered creatives.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => setWizardOpen(true)}
        >
          <Settings2 className="h-4 w-4" />
          Configure report
        </Button>
      </header>

      <KpiCards kpis={data.kpis} compareEnabled={filters.compareEnabled} />

      <PortfolioTrendChart rollups={data.rollups} />

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-1 text-sm font-medium text-foreground">
          <WhyDot id="owner.byBrand" />
          By brand
        </h2>
        {brandRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No brand-linked creatives in the current view — link creatives to a Catalogue brand to
            see them here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Creatives</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">CPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brandRows.map((b) => (
                <TableRow key={b.brandId}>
                  <TableCell className="font-medium text-foreground">{b.brandName}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {pluralize(b.creativeCount, "creative")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {fmtCompactCurrency(b.metrics.spend)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {fmtCompactCurrency(b.metrics.revenue)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {fmtMultiple(b.metrics.roas)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {b.metrics.cpa !== null
                      ? fmtCurrency(b.metrics.cpa, { decimals: 2 })
                      : notEnoughData(b.metrics.purchases)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-1 text-sm font-medium text-foreground">
          <WhyDot id="owner.byAccount" />
          By account
        </h2>
        <p className="mb-3 mt-1 text-xs text-muted-foreground">
          Each account&apos;s own numbers — never summed across accounts (different attribution
          windows).
        </p>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Account</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">Creatives</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountRows.map((a) => (
              <TableRow key={a.accountId}>
                <TableCell className="font-medium text-foreground">{a.accountName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {PLATFORM_LABELS[a.platform]}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {pluralize(a.creativeCount, "creative")}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {fmtCompactCurrency(a.metrics.spend)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {fmtCompactCurrency(a.metrics.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {fmtMultiple(a.metrics.roas)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-1 text-sm font-medium text-foreground">
          <WhyDot id="owner.velocity" />
          Testing velocity
        </h2>
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

      <ReportWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
