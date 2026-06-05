import { useMemo } from "react";
import { AlertTriangle, Clock, Layers, ShoppingBag, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLaunchFlow } from "@/launch2/store/launchFlowStore";
import { catalogs, pixels, productSets, savedAudiences } from "@/launch2/mocks";
import { formatCompact, formatCurrency } from "@/launch2/lib/format";
import type { LaunchObjective } from "@/launch2/types";
import { AdvancedDrawer, SectionHeader } from "@/launch2/components";

/* ───────────────────────── Constants ───────────────────────── */

const OBJECTIVES: { key: LaunchObjective; label: string }[] = [
  { key: "sales", label: "Sales" },
  { key: "leads", label: "Leads" },
  { key: "traffic", label: "Traffic" },
  { key: "engagement", label: "Engagement" },
];

const OPTIMIZATION_EVENTS = ["Purchase", "AddToCart", "InitiateCheckout", "Lead", "ViewContent"];

const PLACEMENTS = ["Feeds", "Stories", "Reels", "Search", "Audience Network"];

const AUDIENCE_TYPE_LABEL: Record<string, string> = {
  saved: "Saved",
  lal: "Lookalike",
  custom: "Custom",
  broad: "Broad",
  interest: "Interest",
};

/* ───────────────────────── Step 3 ───────────────────────── */

export function Step3Targeting() {
  const { state, dispatch } = useLaunchFlow();

  const selectedPixel = pixels.find((px) => px.id === state.pixelId) ?? null;
  const pixelInactive = selectedPixel?.status === "inactive";

  const audience = savedAudiences.find((a) => a.id === state.audienceId) ?? null;

  const catalogSets = useMemo(
    () => productSets.filter((ps) => ps.catalogId === state.catalogId),
    [state.catalogId]
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-g6-sans text-xl font-semibold text-foreground">Objective + Targeting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What this launch optimizes for, who it reaches, and the budget shape.
        </p>
      </header>

      {/* ── Objective ── */}
      <section>
        <SectionHeader title="Objective" sub="What Meta optimizes delivery toward." />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OBJECTIVES.map((o) => {
            const active = state.objective === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => dispatch({ type: "SET_OBJECTIVE", objective: o.key })}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {state.objective === "sales" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Sales unlocks the Catalogue (DPA/DABA) option below.
          </p>
        )}
      </section>

      {/* ── Saved audience ── */}
      <section>
        <SectionHeader
          title="Audience"
          sub="Pick a saved audience, or leave empty to run broad."
        />
        <div className="space-y-2">
          {savedAudiences.map((aud) => {
            const active = state.audienceId === aud.id;
            return (
              <button
                key={aud.id}
                type="button"
                onClick={() =>
                  dispatch({
                    type: "PATCH",
                    patch: { audienceId: active ? null : aud.id },
                  })
                }
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{aud.name}</span>
                  {aud.detail && (
                    <span className="block truncate text-xs text-muted-foreground">{aud.detail}</span>
                  )}
                </span>
                <span className="shrink-0 rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {AUDIENCE_TYPE_LABEL[aud.type] ?? aud.type}
                </span>
                <span className="shrink-0 font-g6-mono text-xs text-muted-foreground">
                  {formatCompact(aud.size)}
                </span>
              </button>
            );
          })}
        </div>
        {!audience && (
          <p className="mt-2 text-xs text-muted-foreground">
            No audience selected — this launch will run broad (no detailed targeting).
          </p>
        )}
      </section>

      {/* ── Budget ── */}
      <section>
        <SectionHeader title="Budget" sub="Where the budget lives, and how much per day." />
        <div className="space-y-3">
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            {(["adset", "campaign"] as const).map((lvl) => {
              const active = state.budgetLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => dispatch({ type: "SET_BUDGET_LEVEL", budgetLevel: lvl })}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {lvl === "adset" ? "ABO (per ad set)" : "CBO (campaign)"}
                </button>
              );
            })}
          </div>
          <div className="flex items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                {state.budgetLevel === "adset" ? "Daily budget / ad set" : "Daily campaign budget"}
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-g6-mono text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min={1}
                  value={state.dailyBudget}
                  onChange={(e) =>
                    dispatch({
                      type: "PATCH",
                      patch: { dailyBudget: Math.max(1, parseFloat(e.target.value) || 0) },
                    })
                  }
                  className="w-40 pl-7 font-g6-mono"
                />
              </div>
            </label>
            <p className="pb-2 text-xs text-muted-foreground">
              {state.budgetLevel === "adset"
                ? `Each ad set spends ${formatCurrency(state.dailyBudget)}/day. Total scales with ad-set count.`
                : `One shared ${formatCurrency(state.dailyBudget)}/day pool; Meta allocates across ad sets.`}
            </p>
          </div>
        </div>
      </section>

      {/* ── Schedule ── */}
      <section>
        <SectionHeader title="Schedule" sub="When delivery starts and (optionally) ends." />
        <div className="flex flex-wrap gap-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Start date</span>
            <Input
              type="date"
              value={state.scheduleStart ?? ""}
              onChange={(e) =>
                dispatch({ type: "PATCH", patch: { scheduleStart: e.target.value || null } })
              }
              className="w-48"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">End date (optional)</span>
            <Input
              type="date"
              value={state.scheduleEnd ?? ""}
              onChange={(e) =>
                dispatch({ type: "PATCH", patch: { scheduleEnd: e.target.value || null } })
              }
              className="w-48"
            />
          </label>
        </div>
      </section>

      {/* ── Placements ── */}
      <section>
        <SectionHeader title="Placements" sub="Where the ads appear across Meta surfaces." />
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Layers className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Advantage+ placements (automatic)</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Let Meta choose placements for best delivery. Turn off to pick manually in Advanced.
              </p>
            </div>
          </div>
          <Switch
            checked={state.placementsAuto}
            onCheckedChange={(v) => dispatch({ type: "PATCH", patch: { placementsAuto: v } })}
            aria-label="Advantage+ placements"
          />
        </div>
      </section>

      {/* ── Optimization event (only with a pixel) ── */}
      {state.pixelId && (
        <section>
          <SectionHeader
            title="Optimization event"
            sub={`Conversion event Meta optimizes for · ${selectedPixel?.name ?? "pixel"}`}
          />
          <Select
            value={state.optimizationEvent ?? undefined}
            onValueChange={(v) => dispatch({ type: "PATCH", patch: { optimizationEvent: v } })}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {OPTIMIZATION_EVENTS.map((ev) => (
                <SelectItem key={ev} value={ev}>
                  {ev}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pixelInactive && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(var(--warning-text))]">
              <AlertTriangle className="h-3.5 w-3.5" />
              The selected pixel is inactive — events may not fire. Recover the pixel before relying on conversion optimization.
            </p>
          )}
        </section>
      )}

      {/* ── Catalogue (Sales-only) ── */}
      {state.objective === "sales" && (
        <section>
          <SectionHeader
            title="Catalogue (DPA / DABA)"
            sub="Dynamic ads from a product feed instead of fixed creatives."
          />
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Use catalogue</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Serve products dynamically from a catalog feed.
                  </p>
                </div>
              </div>
              <Switch
                checked={state.useCatalogue}
                onCheckedChange={(v) => dispatch({ type: "PATCH", patch: { useCatalogue: v } })}
                aria-label="Use catalogue"
              />
            </div>

            {state.useCatalogue && (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Catalog</span>
                    <Select
                      value={state.catalogId ?? undefined}
                      onValueChange={(v) =>
                        dispatch({ type: "PATCH", patch: { catalogId: v, productSetId: null } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a catalog" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogs.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}{" "}
                            <span className="font-g6-mono text-xs text-muted-foreground">
                              · {c.productCount} products
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Product set</span>
                    <Select
                      value={state.productSetId ?? undefined}
                      disabled={!state.catalogId}
                      onValueChange={(v) => dispatch({ type: "PATCH", patch: { productSetId: v } })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={state.catalogId ? "Select a product set" : "Pick a catalog first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogSets.map((ps) => (
                          <SelectItem key={ps.id} value={ps.id}>
                            {ps.name}{" "}
                            <span className="font-g6-mono text-xs text-muted-foreground">
                              · {ps.productCount}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                </div>
                <p className="rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  Cascades: ad set = product set + audience → DPA/DABA auto · ad = dynamic creative from feed
                  (set in Step 4). Prereqs: catalog feed + Pixel/CAPI + events + domain verify.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Advanced ── */}
      <AdvancedDrawer label="Advanced targeting" hint="Audience builder · placements · dayparting">
        {/* Audience builder */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Audience builder
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["broad", "lal", "custom", "interest"] as const).map((t) => {
              const active = audience?.type === t;
              return (
                <span
                  key={t}
                  className={cn(
                    "rounded-md border px-2.5 py-2 text-center text-xs font-medium",
                    active
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {AUDIENCE_TYPE_LABEL[t] ?? t}
                </span>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Detailed builder (mock) — derived from the saved audience above. Pick a saved audience to seed it.
          </p>
        </div>

        {/* Explicit budget level */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Budget level (explicit)
          </p>
          <div className="flex gap-4">
            {(["adset", "campaign"] as const).map((lvl) => (
              <label key={lvl} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="adv-budget-level"
                  checked={state.budgetLevel === lvl}
                  onChange={() => dispatch({ type: "SET_BUDGET_LEVEL", budgetLevel: lvl })}
                  className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                />
                {lvl === "adset" ? "ABO — ad-set level" : "CBO — campaign level"}
              </label>
            ))}
          </div>
        </div>

        {/* Manual placements */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Manual placements
          </p>
          {state.placementsAuto && (
            <p className="mb-2 text-xs text-muted-foreground">
              Turn off Advantage+ placements above to edit manually.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PLACEMENTS.map((pl) => (
              <label
                key={pl}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm",
                  state.placementsAuto ? "opacity-50" : "cursor-pointer"
                )}
              >
                <input
                  type="checkbox"
                  defaultChecked
                  disabled={state.placementsAuto}
                  className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                />
                <span className="text-foreground">{pl}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dayparting */}
        <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Dayparting</p>
              <p className="text-xs text-muted-foreground">Restrict delivery to specific hours/days.</p>
            </div>
          </div>
          <Switch
            checked={state.dayparting}
            onCheckedChange={(v) => dispatch({ type: "PATCH", patch: { dayparting: v } })}
            aria-label="Dayparting"
          />
        </div>
      </AdvancedDrawer>
    </div>
  );
}
