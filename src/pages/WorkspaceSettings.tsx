import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlansPaymentTab } from "@/components/workspace-settings/PlansPaymentTab";
import { TeamMemberTable } from "@/components/ums/TeamMemberTable";
import TeamsTab from "@/components/ums/TeamsTab";
import RolesTab from "@/components/ums/RolesTab";

/**
 * WorkspaceSettings — top-level Settings page at `/settings`.
 *
 * Tab grid matches the Figma export (Members / Workspace / Notifications /
 * Activity / Logs / Plans & Payment / Logs) but only the Plans & Payment
 * tab has real content per Maalik. Other tabs show a "Coming soon"
 * placeholder — demo-only scope.
 *
 * Active tab is URL-backed (`?tab=plans-payment` default) so refresh and
 * deep-link both work, consistent with the URL-state pattern Maalik
 * established across the app.
 */
const TABS = [
  { value: "members", label: "Members" },
  { value: "teams", label: "Teams" },
  { value: "roles", label: "Roles" },
  { value: "workspace", label: "Workspace" },
  { value: "notifications", label: "Notifications" },
  { value: "activity", label: "Activity" },
  { value: "plans-payment", label: "Plans & Payment" },
  { value: "logs", label: "Logs" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const DEFAULT_TAB: TabValue = "plans-payment";

export default function WorkspaceSettings() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: TabValue = useMemo(() => {
    const raw = searchParams.get("tab");
    const match = TABS.find((t) => t.value === raw);
    return match?.value ?? DEFAULT_TAB;
  }, [searchParams]);

  const setActiveTab = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === DEFAULT_TAB) sp.delete("tab");
          else sp.set("tab", next);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full flex-col"
      >
        {/* Tab bar — underline indicator, left-aligned, hairline divider */}
        <div className="border-b border-border/60 px-5">
          <TabsList className="h-auto justify-start gap-8 bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 py-2 text-sm font-normal text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab panels */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="plans-payment" className="mt-0">
            <PlansPaymentTab />
          </TabsContent>
          <TabsContent value="members" className="mt-0 px-5 py-6">
            <TeamMemberTable />
          </TabsContent>
          <TabsContent value="teams" className="mt-0 px-5 py-6">
            <TeamsTab />
          </TabsContent>
          <TabsContent value="roles" className="mt-0 px-5 py-6">
            <RolesTab />
          </TabsContent>
          {(["workspace", "notifications", "activity", "logs"] as const).map(
            (v) => (
              <TabsContent key={v} value={v} className="mt-0 px-5 py-12">
                <div className="rounded-lg border border-dashed border-border/60 bg-card/40 p-12 text-center">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Coming soon
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    The {TABS.find((t) => t.value === v)?.label} tab is part of the next iteration.
                  </p>
                </div>
              </TabsContent>
            ),
          )}
        </div>
      </Tabs>
    </div>
  );
}
