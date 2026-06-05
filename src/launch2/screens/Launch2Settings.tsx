/**
 * Launch 2.0 — Settings.
 *
 * A grouped module-settings surface (mock; local React state, no persistence).
 * Four self-contained sections, each its own card with a heading + helper text:
 *   1. Defaults            — strategy / objective / distribution / budget
 *   2. Naming convention   — token builder with a LIVE preview string
 *   3. Connected assets    — read-only ad accounts → pages / pixels + catalogues
 *   4. Saved presets       — reusable launch presets (mock rows) + save action
 *
 * Renders content-only inside the FabAds shell.
 */
import { useMemo, useState } from "react";
import { Boxes, Database, ImageIcon, Layers, Plus, Sparkles, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLaunch2 } from "../state/Launch2Context";
import type { DistributionStrategy, Objective } from "../types";
import { STRATEGIES } from "../data/strategies";
import { formatRelative } from "../utils/time";
import { AccountStatusBadge, MetaRow, SectionLabel } from "./settings/parts";

/* ------------------------------------------------------------------ */
/*  Static option sets                                                 */
/* ------------------------------------------------------------------ */

const OBJECTIVES: { id: Objective; label: string }[] = [
  { id: "sales", label: "Sales" },
  { id: "leads", label: "Leads" },
  { id: "traffic", label: "Traffic" },
  { id: "engagement", label: "Engagement" },
];

const DISTRIBUTIONS: { id: DistributionStrategy; label: string; blurb: string }[] = [
  { id: "fill-first", label: "Fill-first", blurb: "Pack each Page to the cap before moving to the next." },
  { id: "equal", label: "Equal split", blurb: "Spread ads evenly across the selected Pages." },
  { id: "duplicate", label: "Duplicate", blurb: "Clone the full set onto every selected Page." },
];

/* Naming-convention token builder. Tokens resolve against a live sample. */
const NAME_TOKENS = ["{brand}", "{strategy}", "{objective}", "{date}", "{adset}", "{n}"] as const;
type NameToken = (typeof NAME_TOKENS)[number];

const TOKEN_SAMPLE: Record<NameToken, string> = {
  "{brand}": "Mamaearth",
  "{strategy}": "Bruno",
  "{objective}": "Sales",
  "{date}": "2026-06-05",
  "{adset}": "AdSet-01",
  "{n}": "01",
};

function renderNamePreview(pattern: string): string {
  let out = pattern;
  for (const t of NAME_TOKENS) out = out.split(t).join(TOKEN_SAMPLE[t]);
  return out.trim() || "—";
}

/* Mock saved presets (ops-only — no fabricated performance metrics). */
interface Preset {
  id: string;
  name: string;
  strategyName: string;
  summary: string;
  updatedAtMsAgo: number;
}
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const SEED_PRESETS: Preset[] = [
  {
    id: "preset_bruno_spray",
    name: "Bruno spray — broad",
    strategyName: "Bruno",
    summary: "Sales · fill-first · $1/day · single-image",
    updatedAtMsAgo: 2 * DAY,
  },
  {
    id: "preset_asc_scale",
    name: "ASC scale — catalogue",
    strategyName: "ASC / High-Budget Scaling",
    summary: "Sales · equal split · $500/day · DPA",
    updatedAtMsAgo: 9 * DAY,
  },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function Launch2Settings() {
  const service = useLaunch2();
  const accounts = service.listAccounts();
  const catalogues = service.listCatalogues();

  /* ---- 1. Defaults (local state) ---- */
  const [strategyId, setStrategyId] = useState<string>("bruno");
  const [objective, setObjective] = useState<Objective>("sales");
  const [distribution, setDistribution] = useState<DistributionStrategy>("fill-first");
  const [budget, setBudget] = useState<string>("1");

  /* ---- 2. Naming convention ---- */
  const [pattern, setPattern] = useState<string>("{brand}_{strategy}_{objective}_{date}");
  const preview = useMemo(() => renderNamePreview(pattern), [pattern]);
  const appendToken = (t: NameToken) => {
    setPattern((prev) => {
      if (!prev.trim()) return t;
      const sep = /[_\-\s{]$/.test(prev) ? "" : "_";
      return `${prev}${sep}${t}`;
    });
  };

  /* ---- 4. Saved presets ---- */
  const [presets, setPresets] = useState<Preset[]>(SEED_PRESETS);
  const saveCurrentAsPreset = () => {
    const s = STRATEGIES.find((x) => x.id === strategyId);
    const objLabel = OBJECTIVES.find((o) => o.id === objective)?.label ?? objective;
    const distLabel = DISTRIBUTIONS.find((d) => d.id === distribution)?.label ?? distribution;
    setPresets((prev) => [
      {
        id: `preset_${Date.now()}`,
        name: `${s?.name ?? "Custom"} — saved defaults`,
        strategyName: s?.name ?? "Custom",
        summary: `${objLabel} · ${distLabel} · $${budget || "0"}/day`,
        updatedAtMsAgo: 0,
      },
      ...prev,
    ]);
  };

  const totalPages = accounts.reduce((n, a) => n + a.pages.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">Launch Settings</h1>
        <p className="text-sm text-muted-foreground">
          Defaults applied to every new launch, your naming convention, and the Meta assets this module can reach.
        </p>
      </div>

      {/* 1 · Defaults */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <SectionLabel>Defaults</SectionLabel>
          <p className="mb-4 text-xs text-muted-foreground">
            Pre-fill new launches with your usual starting point. You can still change anything per launch.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Default strategy */}
            <Field id="default-strategy" label="Default strategy">
              <Select value={strategyId} onValueChange={setStrategyId}>
                <SelectTrigger id="default-strategy">
                  <SelectValue placeholder="Choose a strategy" />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {!s.verified ? "  ·  [I] est." : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Default objective */}
            <Field id="default-objective" label="Default objective">
              <Select value={objective} onValueChange={(v) => setObjective(v as Objective)}>
                <SelectTrigger id="default-objective">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Default distribution */}
            <Field
              id="default-distribution"
              label="Default distribution"
              hint={DISTRIBUTIONS.find((d) => d.id === distribution)?.blurb}
            >
              <Select value={distribution} onValueChange={(v) => setDistribution(v as DistributionStrategy)}>
                <SelectTrigger id="default-distribution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTRIBUTIONS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Default budget per ad set */}
            <Field id="default-budget" label="Default budget / ad set" hint="Per day, in each account's currency.">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="default-budget"
                  inputMode="decimal"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="pl-7 font-mono tabular-nums"
                  aria-label="Default budget per ad set per day"
                />
              </div>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* 2 · Naming convention */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <SectionLabel>Naming convention</SectionLabel>
          <p className="mb-4 text-xs text-muted-foreground">
            Build the template used to name campaigns and ad sets. Click a token to append it; the preview updates live.
          </p>

          <Field id="naming-pattern" label="Pattern">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                id="naming-pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="{brand}_{strategy}_{objective}_{date}"
                className="font-mono text-sm"
                spellCheck={false}
              />
            </div>
          </Field>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {NAME_TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => appendToken(t)}
                className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                {t}
              </button>
            ))}
          </div>

          {/* Live preview */}
          <div className="mt-4 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Preview</div>
            <div className="mt-1 break-all font-mono text-sm tabular-nums text-foreground">{preview}</div>
          </div>
        </CardContent>
      </Card>

      {/* 3 · Connected assets (read-only) */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <SectionLabel
            trailing={
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {accounts.length} accounts · {totalPages} pages · {catalogues.length} catalogues
              </span>
            }
          >
            Connected assets
          </SectionLabel>
          <p className="mb-4 text-xs text-muted-foreground">
            Ad accounts, Pages, pixels and catalogues this module can launch into. Read-only here — manage access in
            Meta Business Manager.
          </p>

          {accounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <Boxes className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">No assets connected</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Connect a Meta ad account to launch from this module.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => {
                const accCatalogues = catalogues.filter((c) => c.accountId === acc.id);
                return (
                  <div key={acc.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{acc.name}</span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                          {acc.currency}
                        </span>
                      </div>
                      <AccountStatusBadge status={acc.status} />
                    </div>

                    <Separator className="my-2.5" />

                    {/* Pages */}
                    <div className="space-y-0.5">
                      {acc.pages.map((p) => (
                        <MetaRow key={p.id}>
                          <span className="flex min-w-0 items-center gap-1.5 text-xs text-foreground">
                            <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{p.name}</span>
                            {p.category ? (
                              <span className="shrink-0 text-[11px] text-muted-foreground">· {p.category}</span>
                            ) : null}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                            {p.activeAds.toLocaleString("en-IN")} active
                          </span>
                        </MetaRow>
                      ))}
                    </div>

                    {/* Pixels + catalogues */}
                    <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                      <AssetGroup icon={<Database className="h-3.5 w-3.5" />} title="Pixels">
                        {acc.pixels.length === 0 ? (
                          <EmptyLine>No pixel connected</EmptyLine>
                        ) : (
                          acc.pixels.map((px) => (
                            <MetaRow key={px.id}>
                              <span className="truncate text-xs text-foreground">{px.name}</span>
                              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                                {px.lastEventAt ? `signal ${formatRelative(px.lastEventAt)}` : "no recent signal"}
                              </span>
                            </MetaRow>
                          ))
                        )}
                      </AssetGroup>

                      <AssetGroup icon={<ImageIcon className="h-3.5 w-3.5" />} title="Catalogues">
                        {accCatalogues.length === 0 ? (
                          <EmptyLine>No catalogue connected</EmptyLine>
                        ) : (
                          accCatalogues.map((c) => (
                            <MetaRow key={c.id}>
                              <span className="truncate text-xs text-foreground">{c.name}</span>
                              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                                {c.productCount.toLocaleString("en-IN")} products
                              </span>
                            </MetaRow>
                          ))
                        )}
                      </AssetGroup>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4 · Saved presets / Library */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <SectionLabel
            trailing={
              <Button size="sm" variant="outline" className="ml-auto h-8 rounded-full" onClick={saveCurrentAsPreset}>
                <Plus className="h-4 w-4" />
                Save current defaults as preset
              </Button>
            }
          >
            Saved presets
          </SectionLabel>
          <p className="mb-4 text-xs text-muted-foreground">
            Reusable launch setups — pick one in the flow to skip configuration. Saving here captures your current
            defaults above.
          </p>

          {presets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">No saved presets yet</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Save your current defaults to reuse them across launches.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.12]">
                      <Boxes className="h-4 w-4 text-foreground/70" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
                      <div className="truncate font-mono text-[11px] tabular-nums text-muted-foreground">
                        {p.summary}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {p.updatedAtMsAgo === 0 ? "just now" : formatRelative(new Date(Date.now() - p.updatedAtMsAgo).toISOString())}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Local field helpers                                                */
/* ------------------------------------------------------------------ */

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AssetGroup({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="py-1 text-xs italic text-muted-foreground/70">{children}</p>;
}
