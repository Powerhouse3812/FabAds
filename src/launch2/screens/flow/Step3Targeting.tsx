/**
 * Step 3 — Objective + Targeting.
 *
 * Audience label (free Input or a saved-audience Select), budget per ad set
 * (number Input → drives the live budget elsewhere), and a Catalogue →
 * Product-set cascade shown when the objective is sales-ish. Catalogue prereqs
 * carry an [I] tag (cross-check against Meta). Catalogues are scoped to the
 * first selected account.
 */
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStrategy } from "../../data/strategies";
import { budgetPerDay, validateStep } from "../../state/flowDerive";
import { findAccount } from "../../data/mockData";
import { formatMoney, currencySymbol } from "../../utils/time";
import { useLaunch2 } from "../../state/Launch2Context";
import type { UseLaunch2FlowReturn } from "../../state/useLaunch2Flow";
import { InlineErrors, ProvenanceTag, SectionLabel } from "./parts";

const SAVED_AUDIENCES = [
  "Broad · 18–45 · all genders",
  "Lookalike 1% — purchasers",
  "Lookalike 3% — add-to-cart",
  "Interest — beauty & wellness",
  "Retargeting — 30-day site visitors",
];

export function Step3Targeting({ flow }: { flow: UseLaunch2FlowReturn }) {
  const service = useLaunch2();
  const { plan } = flow;
  const errors = validateStep(plan, 3).errors;

  const strategy = getStrategy(plan.strategyId);
  const account = findAccount(plan.targets[0]?.accountId ?? "");
  const currency = account?.currency ?? "USD";
  const isSales = plan.objective === "sales";

  // Catalogues for the first selected account (cascade source).
  const catalogues = useMemo(
    () => (account ? service.listCatalogues(account.id) : []),
    [service, account],
  );
  const activeCatalogue = catalogues.find((c) => c.id === plan.catalogueId) ?? null;

  const adSets = strategy
    ? strategy.structure.campaigns * strategy.structure.adSetsPerCampaign
    : 0;

  function onBudgetChange(raw: string) {
    const n = Number(raw);
    flow.patch({ budgetPerAdSet: Number.isFinite(n) ? Math.max(0, n) : 0 });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      {/* LEFT — audience + budget */}
      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-4">
            <SectionLabel>Targeting</SectionLabel>

            <div>
              <Label htmlFor="audience" className="text-xs text-muted-foreground">
                Saved audience
              </Label>
              <Select
                value={plan.audienceLabel ?? undefined}
                onValueChange={(v) => flow.patch({ audienceLabel: v })}
              >
                <SelectTrigger id="audience" className="mt-1">
                  <SelectValue placeholder="Choose a saved audience" />
                </SelectTrigger>
                <SelectContent>
                  {SAVED_AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="audience-custom" className="text-xs text-muted-foreground">
                Or type a custom audience label
              </Label>
              <Input
                id="audience-custom"
                className="mt-1"
                placeholder="e.g. Diwali — high-intent retarget"
                value={plan.audienceLabel ?? ""}
                onChange={(e) => flow.patch({ audienceLabel: e.target.value || null })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-4">
            <SectionLabel>Budget per ad set</SectionLabel>
            <div className="flex items-center gap-3">
              <div className="relative w-40">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm tabular-nums text-muted-foreground">
                  {currencySymbol(currency).trim()}
                </span>
                <Input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  className="pl-7 font-mono tabular-nums"
                  value={plan.budgetPerAdSet}
                  onChange={(e) => onBudgetChange(e.target.value)}
                  aria-label="Budget per ad set per day"
                />
              </div>
              <span className="text-xs text-muted-foreground">/ ad set / day</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {strategy ? (
                <>
                  {adSets} ad set{adSets === 1 ? "" : "s"} ×{" "}
                  <span className="font-mono tabular-nums">{formatMoney(plan.budgetPerAdSet, currency)}</span> ={" "}
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatMoney(budgetPerDay(plan), currency)}
                  </span>{" "}
                  / day
                </>
              ) : (
                "Pick a strategy in Step 1 to compute the daily total."
              )}
            </p>
            <InlineErrors errors={errors} />
          </CardContent>
        </Card>
      </div>

      {/* RIGHT — catalogue cascade (Sales) */}
      <div className="space-y-4">
        <Card
          className={cn("rounded-2xl", isSales && "border-primary/40")}
          style={isSales ? { backgroundColor: "rgba(143,184,33,0.04)" } : undefined}
        >
          <CardContent className="space-y-3 p-4">
            <SectionLabel trailing={<ProvenanceTag verified={false} note="Catalogue prereqs (feed · Pixel/CAPI · events · domain verify) are placeholders — cross-check against Meta before launch." />}>
              Catalogue — Sales
            </SectionLabel>

            {!isSales ? (
              <p className="text-xs text-muted-foreground">
                Set the objective to <span className="font-medium text-foreground">Sales</span> in Step 1 to run
                catalogue (Advantage+) ads.
              </p>
            ) : !account ? (
              <p className="text-xs text-muted-foreground">
                Pick an ad account in Step 2 to load its catalogues.
              </p>
            ) : catalogues.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No catalogue connected to {account.name}.
              </p>
            ) : (
              <>
                <div>
                  <Label htmlFor="catalogue" className="text-xs text-muted-foreground">
                    Catalogue
                  </Label>
                  <Select
                    value={plan.catalogueId ?? undefined}
                    onValueChange={(v) => flow.patch({ catalogueId: v, productSetId: null })}
                  >
                    <SelectTrigger id="catalogue" className="mt-1">
                      <SelectValue placeholder="Choose a catalogue" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogues.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} · {c.productCount} products
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="product-set" className="text-xs text-muted-foreground">
                    Product set
                  </Label>
                  <Select
                    value={plan.productSetId ?? undefined}
                    onValueChange={(v) => flow.patch({ productSetId: v })}
                    disabled={!activeCatalogue}
                  >
                    <SelectTrigger id="product-set" className="mt-1">
                      <SelectValue
                        placeholder={activeCatalogue ? "Choose a product set" : "Choose a catalogue first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCatalogue?.productSets.map((ps) => (
                        <SelectItem key={ps.id} value={ps.id}>
                          {ps.name} · {ps.productCount} products
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Ad set = product set + audience → dynamic creative pulls from the feed in Step 4.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
