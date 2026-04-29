import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronRight, ChevronDown, MoreHorizontal, Copy, Trash2, Pencil } from "lucide-react";
import { useUpdateAdset, useDuplicateAdset, useDeleteAdset } from "@/hooks/use-launch-mutations";
import { toast } from "@/hooks/use-toast";
import type { LaunchFull } from "@/hooks/use-launch-data";

interface Props {
  launchData: LaunchFull;
  selectedAdGroups: Set<string>;
  onSelectionChange: (s: Set<string>) => void;
}

export function AdGroupsTableTab({ launchData, selectedAdGroups, onSelectionChange }: Props) {
  const [expandedAdsets, setExpandedAdsets] = useState<Set<string>>(new Set());
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");

  const updateAdset = useUpdateAdset();
  const dupAdset = useDuplicateAdset();
  const deleteAdset = useDeleteAdset();

  const toggleExpand = (id: string) => {
    const next = new Set(expandedAdsets);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedAdsets(next);
  };

  const handleNameBlur = (id: string, originalName: string) => {
    if (editingNameValue !== originalName) {
      updateAdset.mutate({ id, launchId: launchData.id, name: editingNameValue });
    }
    setEditingNameId(null);
  };

  const handleDelete = (id: string) => {
    const adset = launchData.adsets.find((a) => a.id === id);
    if (!adset) return;
    const siblings = launchData.adsets.filter((a) => a.campaign_id === adset.campaign_id);
    if (siblings.length <= 1) {
      toast({ title: "At least 1 ad set per campaign required", variant: "destructive" });
      return;
    }
    deleteAdset.mutate({ id, launchId: launchData.id });
  };

  const getCampaignName = (campaignId: string) => {
    return launchData.campaigns.find((c) => c.id === campaignId)?.name || "--";
  };

  const allSelected = launchData.adsets.length > 0 && launchData.adsets.every((a) => selectedAdGroups.has(a.id));
  const toggleAll = () => {
    if (allSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(launchData.adsets.map((a) => a.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedAdGroups);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const COL_COUNT = 9;

  return (
    <div className="border border-border rounded-md overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></TableHead>
            <TableHead className="w-12">S.No</TableHead>
            <TableHead className="min-w-[200px]">Ad groups name</TableHead>
            <TableHead className="min-w-[160px]">Campaign name</TableHead>
            <TableHead className="w-16">Ads</TableHead>
            <TableHead className="w-24">Creative</TableHead>
            <TableHead className="w-20">Gender</TableHead>
            <TableHead className="w-24">Language</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {launchData.adsets.map((adset, idx) => {
            const adsetAds = launchData.ads.filter((a) => a.adset_id === adset.id);
            const isExpanded = expandedAdsets.has(adset.id);

            return (
              <>
                <TableRow key={adset.id} className="cursor-pointer" onClick={() => toggleExpand(adset.id)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedAdGroups.has(adset.id)} onCheckedChange={() => toggleOne(adset.id)} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer" onClick={() => toggleExpand(adset.id)}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                      {editingNameId === adset.id ? (
                        <Input value={editingNameValue} onChange={(e) => setEditingNameValue(e.target.value)} onBlur={() => handleNameBlur(adset.id, adset.name)} onKeyDown={(e) => e.key === "Enter" && handleNameBlur(adset.id, adset.name)} autoFocus className="h-7 text-sm w-44" autoComplete="off" data-1p-ignore data-lpignore="true" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{adset.name}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingNameId(adset.id); setEditingNameValue(adset.name); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{getCampaignName(adset.campaign_id)}</TableCell>
                  <TableCell className="text-sm">{adsetAds.length}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Flexible</TableCell>
                  <TableCell className="text-xs text-muted-foreground">All</TableCell>
                  <TableCell className="text-xs text-muted-foreground">English</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => dupAdset.mutate({ adsetId: adset.id, launchId: launchData.id })}><Copy className="h-3.5 w-3.5 mr-2" />Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(adset.id)}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                {/* Nested ads */}
                {isExpanded && (
                  <TableRow key={`${adset.id}-expand`}>
                    <TableCell colSpan={COL_COUNT} className="p-0 bg-muted/30">
                      <div className="pl-10 pr-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Ads</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">S.No</TableHead>
                              <TableHead className="min-w-[180px]">Ad name</TableHead>
                              <TableHead className="w-24">Type</TableHead>
                              <TableHead className="min-w-[120px]">CTA</TableHead>
                              <TableHead className="w-24">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {adsetAds.map((ad, adIdx) => (
                              <TableRow key={ad.id}>
                                <TableCell className="text-xs text-muted-foreground">{adIdx + 1}</TableCell>
                                <TableCell className="text-sm">{ad.name}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">{ad.media_type === "video" ? "Video" : ad.media_type === "carousel" ? "Carousel" : "Static"}</Badge>
                                </TableCell>
                                <TableCell className="text-xs">{ad.cta || "--"}</TableCell>
                                <TableCell>
                                  <Badge variant={ad.status === "active" ? "default" : "secondary"} className="text-xs">{ad.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
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
