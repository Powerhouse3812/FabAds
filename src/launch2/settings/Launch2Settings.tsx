import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { HealthDot, SectionHeader } from "@/launch2/components";
import { formatCompact, formatNumber } from "@/launch2/lib/format";
import {
  accounts,
  namingConvention,
  pages,
  pixels,
  savedAudiences,
  templates,
} from "@/launch2/mocks";
import type { BudgetLevel } from "@/launch2/types";

/* ───────────────────────── connected accounts ───────────────────────── */

function ConnectedAccounts() {
  return (
    <div className="space-y-3">
      <SectionHeader
        title="Connected accounts"
        sub="Ad accounts, their Pages, and pixels. Reconnect or manage scopes here."
      />
      <div className="space-y-3">
        {accounts.map((account) => {
          const acctPages = pages.filter((p) => p.accountId === account.id);
          const acctPixels = pixels.filter((px) => px.accountId === account.id);
          return (
            <div key={account.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {account.name}
                    </span>
                    <HealthDot status={account.health} showLabel />
                  </div>
                  <p className="mt-0.5 font-g6-mono text-[11px] text-muted-foreground">
                    {account.id} · {account.currency} · {acctPages.length} pages ·{" "}
                    {acctPixels.length} pixels
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      toast.success(`Reconnect ${account.name}`, {
                        description: "Mock — would re-run the Meta OAuth grant.",
                      })
                    }
                  >
                    Reconnect
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => toast(`Manage ${account.name}`)}
                  >
                    Manage
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {acctPages.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    <HealthDot status={p.health} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── defaults ───────────────────────── */

function Defaults() {
  const [dailyBudget, setDailyBudget] = useState("1");
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("adset");

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Launch defaults"
        sub="Seed every new launch with sensible starting numbers."
      />
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-2 sm:max-w-xs">
          <Label htmlFor="default-budget" className="text-xs text-muted-foreground">
            Default daily budget (per ad set)
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-g6-mono text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="default-budget"
              type="number"
              min={0}
              step="0.5"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="pl-7 font-g6-mono"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs text-muted-foreground">Default budget level</Label>
          <div className="flex gap-2">
            {(["adset", "campaign"] as BudgetLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setBudgetLevel(level)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  budgetLevel === level
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {level === "adset" ? "ABO — ad-set budget" : "CBO — campaign budget"}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-1">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => toast.success("Defaults saved")}
          >
            Save defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── naming convention ───────────────────────── */

const SAMPLE_TOKENS: Record<string, string> = {
  brand: "GlowSkin",
  objective: "Sales",
  strategy: "Bruno",
  date: "0605",
  audience: "Broad",
  placement: "Auto",
  budget: "1usd",
  creative: "SerumHero",
  ratio: "4x5",
  variant: "v1",
};

function fillPattern(pattern: string): string {
  return pattern.replace(/\{(\w+)\}/g, (_, key: string) => SAMPLE_TOKENS[key] ?? `{${key}}`);
}

function Nomenclature() {
  const [campaign, setCampaign] = useState(namingConvention.campaign);
  const [adset, setAdset] = useState(namingConvention.adset);
  const [ad, setAd] = useState(namingConvention.ad);

  const rows: { label: string; value: string; set: (v: string) => void }[] = [
    { label: "Campaign", value: campaign, set: setCampaign },
    { label: "Ad set", value: adset, set: setAdset },
    { label: "Ad", value: ad, set: setAd },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Naming convention"
        sub="Tokenized patterns auto-name every entity. Available tokens: {brand} {objective} {strategy} {date} {audience} {placement} {budget} {creative} {ratio} {variant}."
      />
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-2">
            <Label className="text-xs text-muted-foreground">{row.label} pattern</Label>
            <Input
              value={row.value}
              onChange={(e) => row.set(e.target.value)}
              className="font-g6-mono text-xs"
            />
            <p className="font-g6-mono text-[11px] text-muted-foreground">
              Preview:{" "}
              <span className="text-foreground">{fillPattern(row.value)}</span>
            </p>
          </div>
        ))}
        <div className="pt-1">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => toast.success("Naming convention saved")}
          >
            Save convention
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── UTM templates ───────────────────────── */

interface UtmRow {
  id: string;
  name: string;
  value: string;
}

const INITIAL_UTM: UtmRow[] = [
  {
    id: "utm_01",
    name: "Default — Meta",
    value: "utm_source=facebook&utm_medium=paid&utm_campaign={campaign}",
  },
  {
    id: "utm_02",
    name: "Retargeting",
    value: "utm_source=facebook&utm_medium=paid&utm_content={adset}",
  },
];

function UtmTemplates() {
  const [rows, setRows] = useState<UtmRow[]>(INITIAL_UTM);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="UTM templates"
        sub="Appended to destination URLs at launch. Use the same tokens as naming."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                { id: `utm_${prev.length + 1}`, name: "New template", value: "utm_source=facebook&utm_medium=paid" },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        }
      />
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={row.id} className="grid gap-2 rounded-lg border border-border bg-card p-3">
            <Input
              value={row.name}
              onChange={(e) =>
                setRows((prev) => prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
              }
              className="h-9 text-sm"
            />
            <Input
              value={row.value}
              onChange={(e) =>
                setRows((prev) => prev.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))
              }
              className="h-9 font-g6-mono text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── templates + audiences ───────────────────────── */

const TEMPLATE_KIND_LABEL: Record<string, string> = {
  targeting: "Targeting",
  copy: "Copy",
  strategy: "Strategy",
};

function TemplatesAndAudiences() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionHeader title="Saved templates" sub="Reusable targeting, copy, and strategy presets." />
        <div className="space-y-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{tpl.name}</span>
                  <span className="shrink-0 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {TEMPLATE_KIND_LABEL[tpl.kind]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{tpl.detail}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-xs"
                onClick={() => toast(`Edit ${tpl.name}`)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader title="Saved audiences" sub="Reusable saved, lookalike, custom, and broad pools." />
        <div className="space-y-2">
          {savedAudiences.map((aud) => (
            <div
              key={aud.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0">
                <span className="truncate text-sm font-medium text-foreground">{aud.name}</span>
                {aud.detail && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{aud.detail}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {aud.type}
                </span>
                <span className="font-g6-mono text-xs text-muted-foreground" title={formatNumber(aud.size)}>
                  ~{formatCompact(aud.size)} reach
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── team / governance ───────────────────────── */

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Launcher" | "Viewer";
}

const MEMBERS: Member[] = [
  { id: "m_01", name: "Maalik", email: "maalik@ideaclan.biz", role: "Owner" },
  { id: "m_02", name: "Aman", email: "aman@ideaclan.biz", role: "Launcher" },
  { id: "m_03", name: "Review Bot", email: "system@ideaclan.biz", role: "Viewer" },
];

const ROLE_TONE: Record<Member["role"], string> = {
  Owner: "text-[hsl(var(--success-text))]",
  Admin: "text-foreground",
  Launcher: "text-foreground",
  Viewer: "text-muted-foreground",
};

function TeamGovernance() {
  return (
    <div className="space-y-3">
      <SectionHeader
        title="Team & governance"
        sub="Who can launch, retry, and edit. Every action is attributed in the Activity log."
        action={
          <Button variant="outline" size="sm" onClick={() => toast("Invite member (mock)")}>
            <Plus className="h-3.5 w-3.5" />
            Invite
          </Button>
        }
      />
      <div className="space-y-2">
        {MEMBERS.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Users className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <span className="truncate text-sm font-medium text-foreground">{m.name}</span>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
            </div>
            <span className={cn("shrink-0 text-xs font-medium", ROLE_TONE[m.role])}>{m.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── screen ───────────────────────── */

const SECTIONS = [
  { key: "accounts", label: "Accounts" },
  { key: "defaults", label: "Defaults" },
  { key: "naming", label: "Naming" },
  { key: "utm", label: "UTM" },
  { key: "library", label: "Templates" },
  { key: "team", label: "Team" },
] as const;

export function Launch2Settings() {
  const navigate = useNavigate();
  const [autosave, setAutosave] = useState(true);
  const tabs = useMemo(() => SECTIONS, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6 font-g6-sans">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => navigate("/launch2")}
            className="font-g6-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Launch 2.0
          </button>
          <h1 className="font-g6-sans text-xl font-bold tracking-tight text-foreground">
            Launch settings
          </h1>
          <p className="text-xs text-muted-foreground">
            Account config and saved assets. Fetch, edit, save — autosave keeps in-flight launches safe.
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Switch checked={autosave} onCheckedChange={setAutosave} />
          <span className="text-xs text-muted-foreground">
            Autosave flow drafts
          </span>
        </label>
      </header>

      <Tabs defaultValue="accounts">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          {tabs.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <ConnectedAccounts />
        </TabsContent>
        <TabsContent value="defaults" className="mt-4">
          <Defaults />
        </TabsContent>
        <TabsContent value="naming" className="mt-4">
          <Nomenclature />
        </TabsContent>
        <TabsContent value="utm" className="mt-4">
          <UtmTemplates />
        </TabsContent>
        <TabsContent value="library" className="mt-4">
          <TemplatesAndAudiences />
        </TabsContent>
        <TabsContent value="team" className="mt-4">
          <TeamGovernance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
