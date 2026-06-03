import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronRight, ChevronDown, MoreHorizontal, Copy, Trash2, Settings, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useUpdateCampaign, useDuplicateCampaign, useDeleteCampaign, useUpdateAdset, useDuplicateAdset, useDeleteAdset } from "@/hooks/use-launch-mutations";
import { toast } from "@/hooks/use-toast";
import type { LaunchFull } from "@/hooks/use-launch-data";

interface Props {
  launchData: LaunchFull;
  /**
   * Lifted into StepCreatives. Account-level selection is CONSTRAINED for bulk
   * distribution (ads carry no account FK) — the distribution bar shows a notice
   * and ignores it. We still track the selection here for UI affordances.
   */
  selectedAccounts: Set<string>;
  onSelectionChange: (s: Set<string>) => void;
}

export function AdAccountsTab({ launchData, selectedAccounts, onSelectionChange }: Props) {
  const workspaceId = useWorkspace();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdsets, setExpandedAdsets] = useState<Set<string>>(new Set());

  const { data: fbAccounts } = useQuery({
    queryKey: ["fb-ad-accounts", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("fb_ad_accounts")
        .select("id, name, fb_account_id, currency, fb_business_manager_id")
        .eq("workspace_id", workspaceId);
      return data || [];
    },
  });

  const { data: bmData } = useQuery({
    queryKey: ["fb-business-managers", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("fb_business_managers")
        .select("id, name")
        .eq("workspace_id", workspaceId);
      return data || [];
    },
  });

  const updateCampaign = useUpdateCampaign();
  const dupCampaign = useDuplicateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const updateAdset = useUpdateAdset();
  const dupAdset = useDuplicateAdset();
  const deleteAdset = useDeleteAdset();

  const toggleExpand = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const getAccountInfo = (fbAdAccountId: string) => {
    const acc = fbAccounts?.find((a: any) => a.id === fbAdAccountId);
    const bm = acc?.fb_business_manager_id
      ? bmData?.find((b: any) => b.id === acc.fb_business_manager_id)
      : null;
    return { name: acc?.name || fbAdAccountId, bmName: bm?.name || "--" };
  };

  const campaignCount = launchData.campaigns.length;
  const adsetCount = launchData.adsets.length;
  const adCount = launchData.ads.length;

  const allSelected = launchData.ad_accounts.length > 0 && launchData.ad_accounts.every((a) => selectedAccounts.has(a.id));
  const toggleAll = () => {
    if (allSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(launchData.ad_accounts.map((a) => a.id)));
  };

  const COL_COUNT = 9;

  return (
    <div className="space-y-4">
      {/* Account-level selection cannot be distributed (no ad-account FK on ads). */}
      {selectedAccounts.size > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5">
          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="text-xs text-muted-foreground">
            Account-level selection isn't supported for bulk distribution. To distribute, select at the
            Campaign, Ad Set, or Ad level.
          </p>
        </div>
      )}
      <div className="border border-border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
              <TableHead className="w-12">S.No</TableHead>
              <TableHead className="min-w-[200px]">Ad account name</TableHead>
              <TableHead className="min-w-[120px]">BM</TableHead>
              <TableHead className="w-24">Campaigns</TableHead>
              <TableHead className="w-24">Ad groups</TableHead>
              <TableHead className="w-20">Ads</TableHead>
              <TableHead className="min-w-[160px]">Tracking URL</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {launchData.ad_accounts.map((acc, idx) => {
              const info = getAccountInfo(acc.fb_ad_account_id);
              const config = (acc.setup_config || {}) as Record<string, any>;
              const isExpanded = expandedAccounts.has(acc.id);

              return (
                <>
                  <TableRow key={acc.id} className="cursor-pointer" onClick={() => toggleExpand(expandedAccounts, acc.id, setExpandedAccounts)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedAccounts.has(acc.id)}
                        onCheckedChange={() => {
                          const next = new Set(selectedAccounts);
                          next.has(acc.id) ? next.delete(acc.id) : next.add(acc.id);
                          onSelectionChange(next);
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        <span className="text-sm font-medium">{info.name}</span>
                        {config.custom_audience && <Badge variant="secondary" className="text-xs">Custom aud.</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{info.bmName}</TableCell>
                    <TableCell className="text-sm">{campaignCount}</TableCell>
                    <TableCell className="text-sm">{adsetCount}</TableCell>
                    <TableCell className="text-sm">{adCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[160px]">{config.tracking_url || "--"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast({ title: "Coming soon" })}>Edit setup</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Nested campaigns table */}
                  {isExpanded && (
                    <TableRow key={`${acc.id}-expand`}>
                      <TableCell colSpan={COL_COUNT} className="p-0 bg-muted/30">
                        <div className="pl-10 pr-4 py-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Campaigns</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">S.No</TableHead>
                                <TableHead className="min-w-[180px]">Campaign name</TableHead>
                                <TableHead className="w-24">Ad groups</TableHead>
                                <TableHead className="w-20">Ads</TableHead>
                                <TableHead className="w-28">Budget Opt.</TableHead>
                                <TableHead className="min-w-[100px]">Categories</TableHead>
                                <TableHead className="w-10"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {launchData.campaigns.map((camp, cIdx) => {
                                const campAdsets = launchData.adsets.filter((a) => a.campaign_id === camp.id);
                                const campAds = launchData.ads.filter((a) => campAdsets.some((as) => as.id === a.adset_id));
                                const isCampExpanded = expandedCampaigns.has(camp.id);

                                return (
                                  <>
                                    <TableRow key={camp.id} className="cursor-pointer" onClick={() => toggleExpand(expandedCampaigns, camp.id, setExpandedCampaigns)}>
                                      <TableCell className="text-xs text-muted-foreground">{cIdx + 1}</TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          {isCampExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                          <span className="text-sm font-medium">{camp.name}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm">{campAdsets.length}</TableCell>
                                      <TableCell className="text-sm">{campAds.length}</TableCell>
                                      <TableCell>
                                        <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                                          <Button size="sm" variant={camp.budget_type === "cbo" ? "default" : "outline"} className="h-6 text-xs px-2" onClick={() => updateCampaign.mutate({ id: camp.id, launchId: launchData.id, budget_type: "cbo" })}>CBO</Button>
                                          <Button size="sm" variant={camp.budget_type === "abo" ? "default" : "outline"} className="h-6 text-xs px-2" onClick={() => updateCampaign.mutate({ id: camp.id, launchId: launchData.id, budget_type: "abo" })}>ABO</Button>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {camp.special_ad_category && camp.special_ad_category.length > 0
                                          ? camp.special_ad_category.filter((c) => c !== "NONE").map((c) => <Badge key={c} variant="secondary" className="text-xs mr-1">{c}</Badge>)
                                          : <span className="text-xs text-muted-foreground">--</span>}
                                      </TableCell>
                                      <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => dupCampaign.mutate({ campaignId: camp.id, launchId: launchData.id })}><Copy className="h-3 w-3 mr-2" />Duplicate</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => {
                                              if (launchData.campaigns.length <= 1) { toast({ title: "At least 1 campaign required", variant: "destructive" }); return; }
                                              deleteCampaign.mutate({ id: camp.id, launchId: launchData.id });
                                            }}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>

                                    {/* Nested adsets */}
                                    {isCampExpanded && (
                                      <TableRow key={`${camp.id}-expand`}>
                                        <TableCell colSpan={7} className="p-0 bg-muted/20">
                                          <div className="pl-8 pr-4 py-2">
                                            <p className="text-xs font-semibold text-muted-foreground mb-2">Ad groups</p>
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="w-12">S.No</TableHead>
                                                  <TableHead className="min-w-[160px]">Ad group name</TableHead>
                                                  <TableHead className="w-16">Ads</TableHead>
                                                  <TableHead className="w-10"></TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {campAdsets.map((adset, asIdx) => {
                                                  const adsetAds = launchData.ads.filter((a) => a.adset_id === adset.id);
                                                  const isAdsetExpanded = expandedAdsets.has(adset.id);
                                                  return (
                                                    <>
                                                      <TableRow key={adset.id} className="cursor-pointer" onClick={() => toggleExpand(expandedAdsets, adset.id, setExpandedAdsets)}>
                                                        <TableCell className="text-xs text-muted-foreground">{asIdx + 1}</TableCell>
                                                        <TableCell>
                                                          <div className="flex items-center gap-2">
                                                            {isAdsetExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                                                            <span className="text-sm">{adset.name}</span>
                                                          </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm">{adsetAds.length}</TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                          <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                              <DropdownMenuItem onClick={() => dupAdset.mutate({ adsetId: adset.id, launchId: launchData.id })}><Copy className="h-3 w-3 mr-2" />Duplicate</DropdownMenuItem>
                                                              <DropdownMenuItem className="text-destructive" onClick={() => {
                                                                if (campAdsets.length <= 1) { toast({ title: "At least 1 ad set required", variant: "destructive" }); return; }
                                                                deleteAdset.mutate({ id: adset.id, launchId: launchData.id });
                                                              }}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                          </DropdownMenu>
                                                        </TableCell>
                                                      </TableRow>

                                                      {/* Nested ads */}
                                                      {isAdsetExpanded && (
                                                        <TableRow key={`${adset.id}-expand`}>
                                                          <TableCell colSpan={4} className="p-0 bg-muted/10">
                                                            <div className="pl-8 pr-4 py-2">
                                                              <p className="text-xs font-semibold text-muted-foreground mb-1">Ads</p>
                                                              <ul className="space-y-1">
                                                                {adsetAds.map((ad, adIdx) => (
                                                                  <li key={ad.id} className="text-sm flex items-center gap-2">
                                                                    <span className="text-muted-foreground text-xs">{adIdx + 1}.</span>
                                                                    <span>{ad.name}</span>
                                                                    <Badge variant="secondary" className="text-xs">{ad.media_type === "video" ? "Video" : ad.media_type === "carousel" ? "Carousel" : "Static"}</Badge>
                                                                  </li>
                                                                ))}
                                                              </ul>
                                                            </div>
                                                          </TableCell>
                                                        </TableRow>
                                                      )}
                                                    </>
                                                  );
                                                })}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}

            {launchData.ad_accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-sm text-muted-foreground text-center py-8">
                  No ad accounts selected. Go back to Step 1 to add accounts.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Creative enhancements toggle */}
      <div className="flex items-center gap-3 p-3 border border-border rounded-md">
        <Switch />
        <span className="text-sm font-medium">Creative Enhancements</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => toast({ title: "Coming soon" })}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
