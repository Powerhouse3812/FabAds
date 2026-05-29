import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoPilotConfigTab } from "@/components/autopilot/AutoPilotConfigTab";
import { AutoPilotAccountsTab } from "@/components/autopilot/AutoPilotAccountsTab";
import { AutoPilotAutoLaunchesTab } from "@/components/autopilot/AutoPilotAutoLaunchesTab";
import { AutoPilotWarmupConfigTab } from "@/components/autopilot/AutoPilotWarmupConfigTab";
import type { LaunchStrategy } from "@/components/autopilot/AutoPilotConfigTab";
import type { WarmupConfig } from "@/components/autopilot/AutoPilotWarmupConfigTab";
import type { AccountState } from "@/components/autopilot/AutoPilotAccountsTab";
import { Rocket } from "lucide-react";
import { usePlan } from "@/contexts/PlanContext";
import { AutomationUpsellPage } from "@/components/upsell/AutomationUpsellPage";

let nextStrategyId = 3;
let nextWarmupId = 3;

const INITIAL_STRATEGIES: LaunchStrategy[] = [
  {
    id: "cfg-1",
    name: "US Weight Loss AutoPilot",
    alias: "us-wl",
    isDefault: true,
    adType: "standard",
    campaignsCount: 1,
    adSetsCount: 1,
    adsCount: 5,
    nomenclature: "{ad-account-alias}_{date}_{location}",
    skipIfInReview: true,
    launchIntervalMinutes: 30,
    maxLaunchesPerDay: 10,
    pauseRejectionPercent: 20,
    cooldownMinutes: 15,
    createdAt: "2026-02-25",
    lastModifiedAt: "2026-03-03",
  },
  {
    id: "cfg-2",
    name: "EU Skincare Scale",
    alias: "eu-sc",
    isDefault: false,
    adType: "standard",
    campaignsCount: 2,
    adSetsCount: 1,
    adsCount: 3,
    nomenclature: "{ad-account-alias}_{creative}",
    skipIfInReview: false,
    launchIntervalMinutes: 60,
    maxLaunchesPerDay: 5,
    pauseRejectionPercent: 30,
    cooldownMinutes: 10,
    createdAt: "2026-02-26",
    lastModifiedAt: "2026-03-02",
  },
];

const INITIAL_WARMUP_CONFIGS: WarmupConfig[] = [
  {
    id: "wu-1",
    name: "Standard 7-Day Warm-up",
    isDefault: true,
    warmupDays: 7,
    trafficAdsCount: 3,
    trafficBudgetPerAd: 5,
    pageLikeEnabled: false,
    pageLikeBudget: 10,
    pageLikeCreativeMode: "ai",
    links: [
      { id: "wle-1", linkId: "wl-1", creativeMode: "auto" },
      { id: "wle-2", linkId: "wl-2", creativeMode: "manual", creative: { id: "fc-1", name: "WL Hero Banner", type: "image", source: "folder" } },
    ],
  },
  {
    id: "wu-2",
    name: "Aggressive 3-Day Warm-up",
    isDefault: false,
    warmupDays: 3,
    trafficAdsCount: 2,
    trafficBudgetPerAd: 10,
    pageLikeEnabled: true,
    pageLikeBudget: 15,
    pageLikeCreativeMode: "ai",
    links: [
      { id: "wle-3", linkId: "wl-3", creativeMode: "auto" },
    ],
  },
];

// Dummy initial accounts for computing assignment counts
const INITIAL_ACCOUNTS_FOR_COUNTS: Pick<AccountState, "id" | "assignedConfigId" | "assignedWarmupConfigId" | "campaignUrlId" | "folder">[] = [
  { id: "acc-1", assignedConfigId: null, assignedWarmupConfigId: null, campaignUrlId: "cu-1", folder: "Folder A" },
  { id: "acc-2", assignedConfigId: null, assignedWarmupConfigId: null, campaignUrlId: "cu-2", folder: "Folder C" },
  { id: "acc-3", assignedConfigId: null, assignedWarmupConfigId: "wu-2", campaignUrlId: "", folder: "" },
  { id: "acc-4", assignedConfigId: null, assignedWarmupConfigId: null, campaignUrlId: "", folder: "" },
];

function computeAssignedCounts(
  accounts: Pick<AccountState, "assignedConfigId">[],
  defaultId: string | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of accounts) {
    const resolvedId = a.assignedConfigId ?? defaultId;
    if (resolvedId) {
      counts[resolvedId] = (counts[resolvedId] || 0) + 1;
    }
  }
  return counts;
}

function computeWarmupAssignedCounts(
  accounts: Pick<AccountState, "assignedWarmupConfigId">[],
  defaultId: string | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of accounts) {
    const resolvedId = a.assignedWarmupConfigId ?? defaultId;
    if (resolvedId) {
      counts[resolvedId] = (counts[resolvedId] || 0) + 1;
    }
  }
  return counts;
}

export default function AutoPilotLaunch() {
  const { plan } = usePlan();
  // AI plan: Autopilot is a Growth Pro feature. Page-takeover upsell —
  // matches the LaunchAutopilotCard sub-nav nudge with the same headline
  // claim so the user can connect the two surfaces.
  if (plan === "ai") {
    return <AutomationUpsellPage />;
  }

  // Launch strategies
  const [strategies, setStrategies] = useState<LaunchStrategy[]>(INITIAL_STRATEGIES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_STRATEGIES[0].id);

  // Warmup configs
  const [warmupConfigs, setWarmupConfigs] = useState<WarmupConfig[]>(INITIAL_WARMUP_CONFIGS);
  const [selectedWarmupId, setSelectedWarmupId] = useState<string>(INITIAL_WARMUP_CONFIGS[0].id);

  const defaultStrategyId = strategies.find((s) => s.isDefault)?.id;
  const defaultWarmupId = warmupConfigs.find((w) => w.isDefault)?.id;

  const strategyAssignedCounts = computeAssignedCounts(INITIAL_ACCOUNTS_FOR_COUNTS, defaultStrategyId);
  const warmupAssignedCounts = computeWarmupAssignedCounts(INITIAL_ACCOUNTS_FOR_COUNTS, defaultWarmupId);

  // Strategy handlers
  const addStrategy = () => {
    const id = `cfg-${nextStrategyId++}`;
    const newCfg: LaunchStrategy = {
      id, name: "", alias: "", isDefault: false, adType: "standard",
      campaignsCount: 1, adSetsCount: 1, adsCount: 5, nomenclature: "",
      skipIfInReview: true, launchIntervalMinutes: 30, maxLaunchesPerDay: 10,
      pauseRejectionPercent: 20, cooldownMinutes: 15,
      createdAt: new Date().toISOString().slice(0, 10),
      lastModifiedAt: new Date().toISOString().slice(0, 10),
    };
    setStrategies((prev) => [...prev, newCfg]);
    setSelectedId(id);
  };

  const cloneStrategy = (id: string) => {
    const source = strategies.find((s) => s.id === id);
    if (!source) return;
    const newId = `cfg-${nextStrategyId++}`;
    const cloned: LaunchStrategy = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      alias: `${source.alias}-copy`,
      isDefault: false,
      createdAt: new Date().toISOString().slice(0, 10),
      lastModifiedAt: new Date().toISOString().slice(0, 10),
    };
    setStrategies((prev) => [...prev, cloned]);
    setSelectedId(newId);
  };

  const updateStrategy = (updated: LaunchStrategy) => {
    setStrategies((prev) => prev.map((c) => (c.id === updated.id ? { ...updated, lastModifiedAt: new Date().toISOString().slice(0, 10) } : c)));
  };

  const setDefault = (id: string) => {
    setStrategies((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const deleteStrategy = (id: string) => {
    setStrategies((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length > 0 && !next.some((c) => c.isDefault)) next[0].isDefault = true;
      return next;
    });
    if (selectedId === id) setSelectedId(strategies.find((c) => c.id !== id)?.id ?? "");
  };

  // Warmup config handlers
  const addWarmupConfig = () => {
    const id = `wu-${nextWarmupId++}`;
    const newCfg: WarmupConfig = {
      id, name: "", isDefault: false, warmupDays: 7,
      trafficAdsCount: 3, trafficBudgetPerAd: 5,
      pageLikeEnabled: false, pageLikeBudget: 10, pageLikeCreativeMode: "ai",
      links: [],
    };
    setWarmupConfigs((prev) => [...prev, newCfg]);
    setSelectedWarmupId(id);
  };

  const updateWarmupConfig = (updated: WarmupConfig) => {
    setWarmupConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const setWarmupDefault = (id: string) => {
    setWarmupConfigs((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const deleteWarmupConfig = (id: string) => {
    setWarmupConfigs((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length > 0 && !next.some((c) => c.isDefault)) next[0].isDefault = true;
      return next;
    });
    if (selectedWarmupId === id) setSelectedWarmupId(warmupConfigs.find((c) => c.id !== id)?.id ?? "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AutoPilot Launch</h1>
          <p className="text-sm text-muted-foreground">Configure automated launch strategies, warm-up profiles, and assign ad accounts.</p>
        </div>
      </div>

      <Tabs defaultValue="strategies" className="w-full">
        <TabsList>
          <TabsTrigger value="strategies">Launch Strategies</TabsTrigger>
          <TabsTrigger value="warmup">Warm-up Configs</TabsTrigger>
          <TabsTrigger value="accounts">Ad Accounts</TabsTrigger>
          <TabsTrigger value="auto-launches">Auto Launches</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies">
          <AutoPilotConfigTab
            configs={strategies} selectedId={selectedId} onSelect={setSelectedId}
            onChange={updateStrategy} onAdd={addStrategy} onSetDefault={setDefault} onDelete={deleteStrategy}
            onClone={cloneStrategy}
            assignedCounts={strategyAssignedCounts}
          />
        </TabsContent>

        <TabsContent value="warmup">
          <AutoPilotWarmupConfigTab
            configs={warmupConfigs} selectedId={selectedWarmupId} onSelect={setSelectedWarmupId}
            onChange={updateWarmupConfig} onAdd={addWarmupConfig} onSetDefault={setWarmupDefault} onDelete={deleteWarmupConfig}
            assignedCounts={warmupAssignedCounts}
          />
        </TabsContent>

        <TabsContent value="accounts">
          <AutoPilotAccountsTab configs={strategies} warmupConfigs={warmupConfigs} />
        </TabsContent>

        <TabsContent value="auto-launches">
          <AutoPilotAutoLaunchesTab strategies={strategies} warmupConfigs={warmupConfigs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
