import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GENIE_APPS, appsInCategory } from "./data/appRegistry";
import { APP_CATEGORY_LABELS, type AppCategory } from "./appTypes";
import { CREDITS_REMAINING, formatCredits } from "../lib/credits";
import { AppCard } from "./components/AppCard";
import { OtherAppsSkeleton } from "./components/AppSkeleton";

const TAB_VALUES: ("all" | AppCategory)[] = ["all", "create", "enhance", "edit", "live-avatar"];

function tabLabel(v: "all" | AppCategory): string {
  return v === "all" ? "All Apps" : APP_CATEGORY_LABELS[v];
}

/**
 * OtherApps — the Other Apps grid (§8). 15 single-purpose tools, 7 of them
 * live. Live cards carry weight (bigger, cost stated, richer copy) — the
 * grid is deliberately asymmetric, never a repeating row of 3 equal cards.
 */
export function OtherApps() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("cat") as "all" | AppCategory) ?? "all";

  if (searchParams.get("loading") === "1") {
    return <OtherAppsSkeleton />;
  }

  const forceEmpty = searchParams.get("empty") === "1";
  const apps = forceEmpty ? [] : appsInCategory(activeTab);
  const liveApps = apps.filter((a) => a.state === "live");
  const comingSoonApps = apps.filter((a) => a.state !== "live");

  const setTab = (v: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("cat", v);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-16 pt-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-foreground">Other Apps</h1>
          <p className="text-[13px] text-muted-foreground">
            Single-purpose tools, separate from a Studio generation. {GENIE_APPS.filter((a) => a.state === "live").length} are live today.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
          <span className="font-mono text-[12px] font-semibold tabular-nums text-foreground">
            {formatCredits(CREDITS_REMAINING)}
          </span>
          <span className="text-[12px] text-muted-foreground">credits left</span>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList className="h-9 w-fit rounded-full bg-muted/60 p-1">
          {TAB_VALUES.map((v) => (
            <TabsTrigger
              key={v}
              value={v}
              className="rounded-full px-3.5 py-1.5 text-[12.5px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {tabLabel(v)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-[14px] font-semibold text-foreground">No apps in {tabLabel(activeTab)} yet</p>
          <p className="text-[12.5px] text-muted-foreground">Try a different filter, or come back to All Apps.</p>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-4">
          {liveApps.map((app) => (
            <div key={app.key} className={cn("col-span-6 sm:col-span-3")}>
              <AppCard app={app} size="lg" />
            </div>
          ))}
          {comingSoonApps.map((app) => (
            <div key={app.key} className={cn("col-span-6 sm:col-span-3 lg:col-span-2")}>
              <AppCard app={app} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
