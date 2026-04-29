import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useFbConnection } from "@/hooks/use-fb-connection";
import { useAccountHealthConfigs, useLatestHealthSnapshots, getHealthBadge } from "@/hooks/use-account-health";
import FacebookCard from "@/components/integrations/FacebookCard";
import AdAccountRow from "@/components/integrations/AdAccountRow";
import AccountHealthDetail from "@/components/integrations/AccountHealthDetail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import type { FbAdAccount } from "@/hooks/use-fb-connection";

export default function Integrations() {
  const workspaceId = useWorkspace();
  const { connection, connectionLoading, businessManagers, adAccounts, dataLoading, refetchAll } = useFbConnection();
  const { data: healthConfigs } = useAccountHealthConfigs(workspaceId);
  const { data: healthSnapshots } = useLatestHealthSnapshots(workspaceId);

  const [selectedAccount, setSelectedAccount] = useState<FbAdAccount | null>(null);

  const configMap = Object.fromEntries((healthConfigs || []).map((c) => [c.fb_ad_account_id, c]));
  const snapshotMap = Object.fromEntries((healthSnapshots || []).map((s) => [s.fb_ad_account_id, s]));

  const accountsWithHealth = adAccounts.filter((a) => snapshotMap[a.id] && snapshotMap[a.id].rejection_ratio !== null && snapshotMap[a.id].rejection_ratio !== undefined).length;

  return (
    <div className="space-y-6">

      <Tabs defaultValue="connection" className="w-full">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="accounts">Ad Accounts</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        {/* Tab 1: Connection */}
        <TabsContent value="connection" className="space-y-4 mt-4">
          <FacebookCard connection={connection} loading={connectionLoading} onRefresh={refetchAll} />

          {businessManagers.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-4 w-4" />
                Business Managers ({businessManagers.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-1">
                  {businessManagers.map((bm) => (
                    <div key={bm.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded bg-muted/40">
                      <span className="font-medium text-foreground">{bm.name}</span>
                      <span className="text-muted-foreground font-mono text-xs">{bm.fb_business_id}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </TabsContent>

        {/* Tab 2: Ad Accounts */}
        <TabsContent value="accounts" className="space-y-4 mt-4">
          {dataLoading ? (
            <p className="text-sm text-muted-foreground">Loading accounts...</p>
          ) : adAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ad accounts synced yet. Connect Facebook and sync to import accounts.</p>
          ) : (
            <>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{adAccounts.length} account{adAccounts.length !== 1 ? "s" : ""} synced</span>
                <span>{accountsWithHealth} with health data</span>
              </div>
              <ScrollArea className="max-h-[500px] border border-border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Guardrail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adAccounts.map((acc) => (
                      <AdAccountRow
                        key={acc.id}
                        account={acc}
                        snapshot={snapshotMap[acc.id] || null}
                        config={configMap[acc.id] || null}
                        onClick={() => setSelectedAccount(acc)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}

          {/* Detail Drawer */}
          <Sheet open={!!selectedAccount} onOpenChange={(o) => { if (!o) setSelectedAccount(null); }}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{selectedAccount?.name || "Account Detail"}</SheetTitle>
              </SheetHeader>
              {selectedAccount && (
                <AccountHealthDetail
                  accountId={selectedAccount.id}
                  workspaceId={workspaceId || ""}
                  snapshot={snapshotMap[selectedAccount.id] || null}
                  config={configMap[selectedAccount.id] || null}
                />
              )}
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* Tab 3: Health */}
        <TabsContent value="health" className="space-y-4 mt-4">
          {dataLoading ? (
            <p className="text-sm text-muted-foreground">Loading health data...</p>
          ) : adAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ad accounts to show health for.</p>
          ) : (
            <div className="space-y-4">
              {adAccounts.map((acc) => {
                const snap = snapshotMap[acc.id] || null;
                const cfg = configMap[acc.id] || null;
                const badge = getHealthBadge(snap);
                const hasRealData = snap && snap.rejection_ratio !== null;

                return (
                  <Card key={acc.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{acc.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {!hasRealData && (
                            <Badge variant="outline" className="text-xs">Not synced</Badge>
                          )}
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Ratio: {hasRealData ? `${snap!.rejection_ratio}%` : "Unknown"}</span>
                        {hasRealData && (
                          <>
                            <span>Approved: {snap!.approved_ads ?? "—"}</span>
                            <span>Rejected: {snap!.rejected_ads ?? "—"}</span>
                            <span>Total: {snap!.total_ads ?? "—"}</span>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <AccountHealthDetail
                        accountId={acc.id}
                        workspaceId={workspaceId || ""}
                        snapshot={snap}
                        config={cfg}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
