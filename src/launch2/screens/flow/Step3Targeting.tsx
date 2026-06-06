/**
 * Step 3 — Objective + Targeting.
 *
 * Audience label (free Input or a saved-audience Select), budget per ad set
 * (number Input → drives the live budget elsewhere), an Apply / Save-as
 * Targeting Template control, and a Catalogue → Product-set cascade for
 * DPA / Sales. The cascade surfaces when the ad type is DPA (set in Step 4) OR
 * the objective is Sales; a chosen product set previews its sample products as
 * chips, since DPA ads pull dynamically from the feed. Catalogue prereqs carry
 * an [I] tag (cross-check against Meta). Catalogues are scoped to the first
 * selected account.
 */
import { useMemo } from "react";
import { Boxes, Info } from "lucide-react";
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
import { TemplateControls } from "./TemplateControls";

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
  const isDpa = plan.adType === "dpa";
  const isSales = plan.objective === "sales";
  // DPA ad type (chosen in Step 4) or a Sales objective both run catalogue ads.
  const needsCatalogue = isDpa || isSales;

  // Catalogues for the first selected account (cascade source).
  const catalogues = useMemo(
    () => (account ? service.listCatalogues(account.id) : []),
    [service, account],
  );
  const activeCatalogue = catalogues.find((c) => c.id === plan.catalogueId) ?? null;
  const activeProductSet =
    activeCatalogue?.productSets.find((ps) => ps.id === plan.productSetId) ?? null;
  const sampleProducts = activeProductSet?.sampleProducts ?? [];
  // DPA needs both a catalogue and a product set selected to resolve units.
  const dpaIncomplete = isDpa && (!plan.catalogueId || !plan.productSetId);

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

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <TemplateControls flow={flow} service={service} />
          </CardContent>
        </Card>
      </div>

      {/* RIGHT — catalogue cascade (DPA / Sales) */}
      <div className="space-y-4">
        <Card
          className={cn("rounded-2xl", needsCatalogue && "border-primary/40")}
          style={needsCatalogue ? { backgroundColor: "rgba(143,184,33,0.04)" } : undefined}
        >
          <CardContent className="space-y-3 p-4">
            <SectionLabel
              trailing={
                <div className="ml-auto flex items-center gap-1.5">
                  {isDpa ? (
                    <span
                      className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none"
                      style={{ color: "#5B7611", backgroundColor: "rgba(143,184,33,0.16)" }}
                    >
                      DPA
                    </span>
                  ) : null}
                  <ProvenanceTag
                    verified={false}
                    note="Catalogue prereqs (feed · Pixel/CAPI · events · domain verify) are placeholders — cross-check against Meta before launch."
                  />
                </div>
              }
            >
              Catalogue — DPA
            </SectionLabel>

            {!needsCatalogue ? (
              <p className="text-xs text-muted-foreground">
                Pick the <span className="font-medium text-foreground">DPA</span> ad type in Step 4, or set the
                objective to <span className="font-medium text-foreground">Sales</span> in Step 1, to run catalogue
                (Advantage+) ads.
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

                {/* Product preview — sample products from the chosen set. */}
                {activeProductSet ? (
                  sampleProducts.length > 0 ? (
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        <Boxes className="h-3.5 w-3.5" />
                        Sample products
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sampleProducts.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-foreground"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        DPA ads pull dynamically from this product set — these are a preview of the live feed.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      DPA ads pull dynamically from the{" "}
                      <span className="font-medium text-foreground">{activeProductSet.name}</span> feed
                      ({activeProductSet.productCount.toLocaleString("en-IN")} products).
                    </p>
                  )
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Ad set = product set + audience → dynamic creative pulls from the feed in Step 4.
                  </p>
                )}

                {/* DPA selected but catalogue/set not yet chosen. */}
                {dpaIncomplete ? (
                  <p
                    className="flex items-start gap-1.5 rounded-xl border px-3 py-2 text-[11px] leading-relaxed"
                    style={{ color: "#874d00", backgroundColor: "rgba(250,173,20,0.08)", borderColor: "rgba(250,173,20,0.4)" }}
                  >
                    <Info className="mt-px h-3.5 w-3.5 shrink-0" />
                    <span>
                      DPA needs a catalogue and product set — pick both so each ad maps to a product.
                    </span>
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
