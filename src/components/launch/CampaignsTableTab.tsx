import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronRight, ChevronDown, MoreHorizontal, Copy, Trash2, Pencil } from "lucide-react";
import { useUpdateCampaign, useDuplicateCampaign, useDeleteCampaign, useUpdateAdset, useDuplicateAdset, useDeleteAdset } from "@/hooks/use-launch-mutations";
import { toast } from "@/hooks/use-toast";
import type { LaunchFull } from "@/hooks/use-launch-data";

interface Props {
  launchData: LaunchFull;
  /** Lifted into StepCreatives so the distribution bar can roll campaigns up. */
  selectedCampaigns: Set<string>;
  onSelectionChange: (s: Set<string>) => void;
}

export function CampaignsTableTab({ launchData, selectedCampaigns, onSelectionChange }: Props) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdsets, setExpandedAdsets] = useState<Set<string>>(new Set());
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");

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

  const handleNameBlur = (id: string, originalName: string) => {
    if (editingNameValue !== originalName) {
      updateCampaign.mutate({ id, launchId: launchData.id, name: editingNameValue });
    }
    setEditingNameId(null);
  };

  const handleDelete = (id: string) => {
    if (launchData.campaigns.length <= 1) {
      toast({ title: "At least 1 campaign required", variant: "destructive" });
      return;
    }
    deleteCampaign.mutate({ id, launchId: launchData.id });
  };

  const allSelected = launchData.campaigns.length > 0 && launchData.campaigns.every((c) => selectedCampaigns.has(c.id));
  const toggleAll = () => {
    if (allSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(launchData.campaigns.map((c) => c.id)));
  };

  // Extract countries from adset targeting
  const getCountriesForCampaign = (campaignId: string): string[] => {
    const adsets = launchData.adsets.filter((a) => a.campaign_id === campaignId);
    const countries = new Set<string>();
    adsets.forEach((a) => {
      const targeting = a.targeting as any;
      const geoCountries = targeting?.geo_locations?.countries;
      if (Array.isArray(geoCountries)) geoCountries.forEach((c: string) => countries.add(c));
    });
    return Array.from(countries);
  };

  const COL_COUNT = 9;

  return (
    <div className="border border-border rounded-md overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
            <TableHead className="w-12">S.No</TableHead>
            <TableHead className="min-w-[220px]">Campaign name</TableHead>
            <TableHead className="w-24">Ad groups</TableHead>
            <TableHead className="w-20">Ads</TableHead>
            <TableHead className="w-32">Budget Optimisation</TableHead>
            <TableHead className="min-w-[120px]">Categories</TableHead>
            <TableHead className="min-w-[120px]">Countries</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {launchData.campaigns.map((camp, idx) => {
            const campAdsets = launchData.adsets.filter((a) => a.campaign_id === camp.id);
            const campAds = launchData.ads.filter((a) => campAdsets.some((as) => as.id === a.adset_id));
            const isExpanded = expandedCampaigns.has(camp.id);
            const countries = getCountriesForCampaign(camp.id);

            return (
              <>
                <TableRow key={camp.id} className="cursor-pointer" onClick={() => toggleExpand(expandedCampaigns, camp.id, setExpandedCampaigns)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedCampaigns.has(camp.id)}
                      onCheckedChange={() => {
                        const next = new Set(selectedCampaigns);
                        next.has(camp.id) ? next.delete(camp.id) : next.add(camp.id);
                        onSelectionChange(next);
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer" onClick={() => toggleExpand(expandedCampaigns, camp.id, setExpandedCampaigns)}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                      {editingNameId === camp.id ? (
                        <Input value={editingNameValue} onChange={(e) => setEditingNameValue(e.target.value)} onBlur={() => handleNameBlur(camp.id, camp.name)} onKeyDown={(e) => e.key === "Enter" && handleNameBlur(camp.id, camp.name)} autoFocus className="h-7 text-sm w-48" autoComplete="off" data-1p-ignore data-lpignore="true" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{camp.name}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingNameId(camp.id); setEditingNameValue(camp.name); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{campAdsets.length}</TableCell>
                  <TableCell className="text-sm">{campAds.length}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-0.5">
                      <Button size="sm" variant={camp.budget_type === "cbo" ? "default" : "outline"} className="h-6 text-xs px-2" onClick={() => updateCampaign.mutate({ id: camp.id, launchId: launchData.id, budget_type: "cbo" })}>CBO</Button>
                      <Button size="sm" variant={camp.budget_type === "abo" ? "default" : "outline"} className="h-6 text-xs px-2" onClick={() => updateCampaign.mutate({ id: camp.id, launchId: launchData.id, budget_type: "abo" })}>ABO</Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {camp.special_ad_category && camp.special_ad_category.filter((c) => c !== "NONE").length > 0
                      ? camp.special_ad_category.filter((c) => c !== "NONE").map((c) => <Badge key={c} variant="secondary" className="text-xs mr-1">{c}</Badge>)
                      : <span className="text-xs text-muted-foreground">--</span>}
                  </TableCell>
                  <TableCell>
                    {countries.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {countries.slice(0, 2).map((c) => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                        {countries.length > 2 && <span className="text-xs text-muted-foreground">+{countries.length - 2} more</span>}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">--</span>}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => dupCampaign.mutate({ campaignId: camp.id, launchId: launchData.id })}><Copy className="h-3.5 w-3.5 mr-2" />Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(camp.id)}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                {/* Nested adsets */}
                {isExpanded && (
                  <TableRow key={`${camp.id}-expand`}>
                    <TableCell colSpan={COL_COUNT} className="p-0 bg-muted/30">
                      <div className="pl-10 pr-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Ad groups</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">S.No</TableHead>
                              <TableHead className="min-w-[180px]">Ad group name</TableHead>
                              <TableHead className="w-16">Ads</TableHead>
                              <TableHead className="w-24">Creative</TableHead>
                              <TableHead className="w-20">Gender</TableHead>
                              <TableHead className="w-24">Language</TableHead>
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
                                        {isAdsetExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                        <span className="text-sm">{adset.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{adsetAds.length}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">Flexible</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">All</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">English</TableCell>
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

                                  {isAdsetExpanded && (
                                    <TableRow key={`${adset.id}-expand`}>
                                      <TableCell colSpan={7} className="p-0 bg-muted/20">
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
  );
}
