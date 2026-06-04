import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Copy, Trash2, Pencil, Image, Film, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { useUpdateAd, useDuplicateAd, useDeleteAd, useUpdateAdSchedules } from "@/hooks/use-launch-mutations";
import { AdEditPanel } from "./AdEditPanel";
import type { LaunchFull, LaunchAd } from "@/hooks/use-launch-data";
import type { WorkspaceTexts } from "@/hooks/use-workspace-texts";
import { toast } from "@/hooks/use-toast";
import { useFbConnection } from "@/hooks/use-fb-connection";
import { getAccountTimezone, DEFAULT_TIMEZONE } from "@/lib/timezones";
import { readAdSchedules, entryToValue } from "@/lib/ad-schedule";
import { toAdStatus, AD_STATUS_LABEL, AD_STATUS_BADGE_VARIANT } from "@/lib/ad-status";

const CTA_OPTIONS = ["Book Now", "Learn More", "Shop Now", "Sign Up", "Download", "Contact Us", "Get Offer", "Apply Now"];

interface Props {
  launchData: LaunchFull;
  search: string;
  selectedAds: Set<string>;
  onSelectionChange: (s: Set<string>) => void;
  workspaceTexts: WorkspaceTexts | undefined;
}

function TextCarousel({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const currentIdx = options.findIndex((o) => o === value);

  const cycle = (dir: 1 | -1) => {
    if (options.length === 0) return;
    let next: number;
    if (currentIdx === -1) {
      next = dir === 1 ? 0 : options.length - 1;
    } else {
      next = (currentIdx + dir + options.length) % options.length;
    }
    onChange(options[next]);
  };

  return (
    <div className="flex items-start gap-1">
      {options.length > 0 && (
        <Button variant="ghost" size="icon" className="h-6 w-6 mt-1 shrink-0" onClick={() => cycle(-1)}>
          <ChevronLeft className="h-3 w-3" />
        </Button>
      )}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="text-xs min-w-[120px] resize-none"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
      />
      {options.length > 0 && (
        <Button variant="ghost" size="icon" className="h-6 w-6 mt-1 shrink-0" onClick={() => cycle(1)}>
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function MediaTypeBadge({ type, onSwitch }: { type: string | null; onSwitch: (t: string) => void }) {
  const label = type === "video" ? "Video" : type === "carousel" ? "Carousel" : "Static";
  return (
    <div className="flex items-center gap-1">
      <Badge variant="secondary" className="text-xs">{label}</Badge>
      <div className="flex gap-0.5">
        <Button
          variant={type === "image" || !type ? "default" : "ghost"}
          size="icon"
          className="h-5 w-5"
          onClick={() => onSwitch("image")}
        >
          <Image className="h-3 w-3" />
        </Button>
        <Button
          variant={type === "video" ? "default" : "ghost"}
          size="icon"
          className="h-5 w-5"
          onClick={() => onSwitch("video")}
        >
          <Film className="h-3 w-3" />
        </Button>
        <Button
          variant={type === "carousel" ? "default" : "ghost"}
          size="icon"
          className="h-5 w-5"
          onClick={() => onSwitch("carousel")}
        >
          <Layers className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function AdsTableTab({ launchData, search, selectedAds, onSelectionChange, workspaceTexts }: Props) {
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");

  const updateAd = useUpdateAd();
  const dupAd = useDuplicateAd();
  const deleteAd = useDeleteAd();
  const updateSchedules = useUpdateAdSchedules();
  const { adAccounts } = useFbConnection();

  // Ads carry no account FK, and a launch can span accounts — default the
  // scheduling timezone from the launch's PRIMARY (first) ad account, resolved
  // via getAccountTimezone (real rows lack the not-yet-applied tz column).
  const primaryFbAccountId = launchData.ad_accounts[0]?.fb_ad_account_id;
  const primaryAccount = adAccounts.find((a) => a.id === primaryFbAccountId);
  const defaultTimezone = primaryFbAccountId ? getAccountTimezone(primaryAccount) : DEFAULT_TIMEZONE;

  // Existing per-ad schedules from launch_config (date/time/timezone for editor).
  const adSchedules = readAdSchedules(launchData.launch_config);

  const filteredAds = launchData.ads.filter((ad) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return ad.name.toLowerCase().includes(s) ||
      ad.primary_text?.toLowerCase().includes(s) ||
      ad.headline?.toLowerCase().includes(s);
  });

  const allSelected = filteredAds.length > 0 && filteredAds.every((a) => selectedAds.has(a.id));
  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(filteredAds.map((a) => a.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedAds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const handleNameBlur = (ad: LaunchAd) => {
    if (editingNameValue !== ad.name) {
      updateAd.mutate({ id: ad.id, launchId: launchData.id, name: editingNameValue });
    }
    setEditingNameId(null);
  };

  const handleDelete = (ad: LaunchAd) => {
    const siblings = launchData.ads.filter((a) => a.adset_id === ad.adset_id);
    if (siblings.length <= 1) {
      toast({ title: "At least 1 ad per ad set required", variant: "destructive" });
      return;
    }
    deleteAd.mutate({ id: ad.id, launchId: launchData.id });
  };

  const editingAd = editingAdId ? launchData.ads.find((a) => a.id === editingAdId) : null;

  return (
    <>
      <div className="border border-border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="min-w-[240px]">Ad details</TableHead>
              <TableHead className="min-w-[180px]">Primary text</TableHead>
              <TableHead className="min-w-[160px]">Headline</TableHead>
              <TableHead className="min-w-[160px]">Description</TableHead>
              <TableHead className="min-w-[120px]">CTA</TableHead>
              <TableHead className="min-w-[140px]">Display link</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAds.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell>
                  <Checkbox checked={selectedAds.has(ad.id)} onCheckedChange={() => toggleOne(ad.id)} />
                </TableCell>

                {/* Ad details */}
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="h-[60px] w-[60px] rounded bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {ad.media_urls && ad.media_urls.length > 0 ? (
                        <img src={ad.media_urls[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Image className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      {editingNameId === ad.id ? (
                         <Input
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onBlur={() => handleNameBlur(ad)}
                          onKeyDown={(e) => e.key === "Enter" && handleNameBlur(ad)}
                          autoFocus
                          className="h-7 text-sm"
                          autoComplete="off"
                          data-1p-ignore
                          data-lpignore="true"
                        />
                      ) : (
                        <span
                          className="text-sm font-medium cursor-pointer hover:underline block truncate"
                          onClick={() => { setEditingNameId(ad.id); setEditingNameValue(ad.name); }}
                        >
                          {ad.name}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <MediaTypeBadge
                          type={ad.media_type}
                          onSwitch={(t) => updateAd.mutate({ id: ad.id, launchId: launchData.id, media_type: t })}
                        />
                        <Badge variant={AD_STATUS_BADGE_VARIANT[toAdStatus(ad.status)]} className="text-xs">
                          {AD_STATUS_LABEL[toAdStatus(ad.status)]}
                        </Badge>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button className="text-primary hover:underline" onClick={() => dupAd.mutate({ adId: ad.id, launchId: launchData.id })}>Clone</button>
                        <button className="text-primary hover:underline" onClick={() => setEditingAdId(ad.id)}>Edit</button>
                        <button className="text-destructive hover:underline" onClick={() => handleDelete(ad)}>Delete</button>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Primary text */}
                <TableCell>
                  <TextCarousel
                    value={ad.primary_text || ""}
                    options={workspaceTexts?.primaryTexts || []}
                    onChange={(v) => updateAd.mutate({ id: ad.id, launchId: launchData.id, primary_text: v })}
                    placeholder="Primary text"
                  />
                </TableCell>

                {/* Headline */}
                <TableCell>
                  <TextCarousel
                    value={ad.headline || ""}
                    options={workspaceTexts?.headlines || []}
                    onChange={(v) => updateAd.mutate({ id: ad.id, launchId: launchData.id, headline: v })}
                    placeholder="Headline"
                  />
                </TableCell>

                {/* Description */}
                <TableCell>
                  <TextCarousel
                    value={ad.description || ""}
                    options={workspaceTexts?.descriptions || []}
                    onChange={(v) => updateAd.mutate({ id: ad.id, launchId: launchData.id, description: v })}
                    placeholder="Description"
                  />
                </TableCell>

                {/* CTA */}
                <TableCell>
                  <Select value={ad.cta || "__none__"} onValueChange={(v) => updateAd.mutate({ id: ad.id, launchId: launchData.id, cta: v === "__none__" ? null : v })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select CTA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Display link */}
                <TableCell>
                  <Input
                    value={ad.display_link || ""}
                    onChange={(e) => updateAd.mutate({ id: ad.id, launchId: launchData.id, display_link: e.target.value })}
                    placeholder="Display link"
                    className="h-8 text-xs"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                  />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => dupAd.mutate({ adId: ad.id, launchId: launchData.id })}>
                        <Copy className="h-3.5 w-3.5 mr-2" />Clone
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingAdId(ad.id)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(ad)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredAds.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No ads found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Ad Drawer */}
      <Sheet open={!!editingAdId} onOpenChange={(o) => !o && setEditingAdId(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Ad</SheetTitle>
          </SheetHeader>
          {editingAd && (
            <div className="mt-4">
              <AdEditPanel
                ad={editingAd}
                launchId={launchData.id}
                defaultTimezone={defaultTimezone}
                schedule={entryToValue(adSchedules[editingAd.id], defaultTimezone)}
                onSave={(fields, scheduleEntry) => {
                  updateAd.mutate({ id: editingAd.id, launchId: launchData.id, ...fields });
                  updateSchedules.mutate({
                    launchId: launchData.id,
                    updates: { [editingAd.id]: scheduleEntry },
                  });
                  setEditingAdId(null);
                }}
                onCancel={() => setEditingAdId(null)}
                saving={updateAd.isPending}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
