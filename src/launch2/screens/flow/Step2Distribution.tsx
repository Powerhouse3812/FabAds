/**
 * Step 2 — Ad account(s) + Distribution.
 *
 * Choose account(s) and their page(s) → each (account, page) becomes a target
 * via makeTarget. A distribution tri-choice (fill-first / equal / duplicate)
 * controls the spread. We show a live spread preview (per-target ad counts)
 * and a 250-cap check per unique Page; over-cap Pages surface a warning row
 * (current + new vs 250). A collapsed Advanced drawer holds mock extras.
 */
import { useMemo } from "react";
import { ChevronDown, Plus, TriangleAlert, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AdAccount, DistributionStrategy, LaunchTarget } from "../../types";
import { findAccount, makeTarget } from "../../data/mockData";
import { perPageDemand, perTargetCounts, validateStep } from "../../state/flowDerive";
import { useLaunch2 } from "../../state/Launch2Context";
import type { UseLaunch2FlowReturn } from "../../state/useLaunch2Flow";
import { ChoicePill, InlineErrors, SectionLabel, SelectTile } from "./parts";

const DISTRIBUTIONS: { id: DistributionStrategy; label: string; blurb: string }[] = [
  { id: "fill-first", label: "Fill-first", blurb: "Pack one destination, overflow to the next." },
  { id: "equal", label: "Equal split", blurb: "Spread evenly across destinations." },
  { id: "duplicate", label: "Duplicate", blurb: "Clone the full structure to every destination." },
];

function targetKey(accountId: string, pageId: string): string {
  return `${accountId}::${pageId}`;
}

export function Step2Distribution({ flow }: { flow: UseLaunch2FlowReturn }) {
  const service = useLaunch2();
  const { plan } = flow;
  const accounts = service.listAccounts();
  const errors = validateStep(plan, 2).errors;

  const selectedTargetKeys = useMemo(
    () => new Set(plan.targets.map((t) => targetKey(t.accountId, t.pageId))),
    [plan.targets],
  );

  // Accounts that already contribute at least one page target (drives the chip row).
  const selectedAccountIds = useMemo(
    () => new Set(plan.targets.map((t) => t.accountId)),
    [plan.targets],
  );

  function toggleTarget(accountId: string, pageId: string) {
    const key = targetKey(accountId, pageId);
    if (selectedTargetKeys.has(key)) {
      flow.setTargets(plan.targets.filter((t) => targetKey(t.accountId, t.pageId) !== key));
    } else {
      flow.setTargets([...plan.targets, makeTarget(accountId, pageId)]);
    }
  }

  function addAllPages(account: AdAccount) {
    const additions = account.pages
      .filter((p) => !selectedTargetKeys.has(targetKey(account.id, p.id)))
      .map((p) => makeTarget(account.id, p.id));
    if (additions.length) flow.setTargets([...plan.targets, ...additions]);
  }

  const counts = perTargetCounts(plan);
  const pageDemand = perPageDemand(plan);
  const hasStrategy = Boolean(plan.strategyId);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      {/* LEFT — accounts × pages + distribution */}
      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel>Accounts &amp; pages</SectionLabel>
            <div className="space-y-3">
              {accounts.map((acc) => {
                const restricted = acc.status === "restricted";
                const accChosen = selectedAccountIds.has(acc.id);
                return (
                  <div
                    key={acc.id}
                    className={cn(
                      "rounded-xl border p-3",
                      accChosen ? "border-primary/40 bg-primary/[0.04]" : "border-border",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{acc.name}</span>
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {acc.currency}
                        </span>
                        {restricted && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                            style={{ color: "#cf1322", backgroundColor: "rgba(255,77,79,0.12)" }}
                          >
                            Restricted
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addAllPages(acc)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        All pages
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {acc.pages.map((pg) => {
                        const chosen = selectedTargetKeys.has(targetKey(acc.id, pg.id));
                        const full = pg.activeAds >= 250;
                        const near = !full && pg.activeAds >= 200;
                        return (
                          <button
                            key={pg.id}
                            type="button"
                            onClick={() => toggleTarget(acc.id, pg.id)}
                            aria-pressed={chosen}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              chosen
                                ? "border-primary bg-primary/[0.12] text-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                            )}
                          >
                            <span className="font-medium">{pg.name}</span>
                            <span
                              className="font-mono text-[10px] tabular-nums"
                              style={{
                                color: full ? "#cf1322" : near ? "#874d00" : undefined,
                              }}
                            >
                              {pg.activeAds}/250
                            </span>
                            {chosen && <X className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel>Distribution</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-3">
              {DISTRIBUTIONS.map((d) => (
                <SelectTile
                  key={d.id}
                  selected={plan.distribution === d.id}
                  onClick={() => flow.setDistribution(d.id)}
                >
                  <span className="text-sm font-semibold text-foreground">{d.label}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{d.blurb}</p>
                </SelectTile>
              ))}
            </div>

            {/* Advanced drawer (mock extras) */}
            <Collapsible className="mt-3 border-t border-dashed border-border pt-3">
              <CollapsibleTrigger className="group flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
                Advanced — placement, Business Manager, manual matrix
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdvancedSelect label="Placement" value="advantage" options={[
                    { value: "advantage", label: "Advantage+ (auto)" },
                    { value: "manual", label: "Manual placements" },
                  ]} />
                  <AdvancedSelect label="Business Manager" value="bm1" options={[
                    { value: "bm1", label: "Idea Clan — BM 1" },
                    { value: "bm2", label: "Idea Clan — BM 2" },
                  ]} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Mock fields for the design phase — wired to Meta later.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        <InlineErrors errors={errors} />
      </div>

      {/* RIGHT — spread preview + cap */}
      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel>Spread preview</SectionLabel>
            {plan.targets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Pick destinations to preview the spread.
              </p>
            ) : !hasStrategy ? (
              <p className="text-xs text-muted-foreground">
                Choose a strategy in Step 1 to see ad counts.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 text-left font-semibold">Destination</th>
                      <th className="px-3 py-2 text-right font-semibold">Free</th>
                      <th className="px-3 py-2 text-right font-semibold">Send</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.targets.map((t, i) => {
                      const acc = findAccount(t.accountId);
                      const pg = acc?.pages.find((p) => p.id === t.pageId);
                      const free = Math.max(0, 250 - (pg?.activeAds ?? 0));
                      const send = counts[i] ?? 0;
                      return (
                        <tr key={targetKey(t.accountId, t.pageId)} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-2">
                            <div className="font-medium text-foreground">{t.pageName}</div>
                            <div className="text-[10px] text-muted-foreground">{t.accountName}</div>
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{free}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">{send}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <SectionLabel>250-cap check</SectionLabel>
            {pageDemand.length === 0 ? (
              <p className="text-xs text-muted-foreground">No destinations selected.</p>
            ) : (
              <ul className="space-y-2">
                {pageDemand.map((pd) => {
                  const after = pd.current + pd.demand;
                  return (
                    <li
                      key={pd.fbPageId}
                      className={cn(
                        "rounded-xl border px-3 py-2",
                        pd.over ? "" : "border-border",
                      )}
                      style={
                        pd.over
                          ? { borderColor: "rgba(250,173,20,0.4)", backgroundColor: "rgba(250,173,20,0.08)" }
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">{pd.pageName}</span>
                        <span
                          className="font-mono text-[11px] tabular-nums"
                          style={{ color: pd.over ? "#874d00" : undefined }}
                        >
                          {after}/250
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                        {pd.current} active + {pd.demand} new
                      </div>
                      {pd.over && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-[11px]" style={{ color: "#874d00" }}>
                          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            Over the 250 cap by {after - 250}. Reduce volume, switch distribution, or free slots.
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground">
              Pages shared across targets sum together. Breaches hard-block launch on Review.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdvancedSelect({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-muted-foreground">{label}</div>
      <Select defaultValue={value}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
