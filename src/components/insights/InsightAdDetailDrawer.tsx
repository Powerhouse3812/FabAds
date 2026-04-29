import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { LayoutGrid, Copy, X, Bookmark, Sparkles, Link, ChevronDown, ChevronRight } from "lucide-react";
import { PlatformIcons } from "./PlatformIcons";
import { useAdBoardMemberships } from "@/hooks/use-insight-boards";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import type { InsightAd } from "@/lib/insights-dummy-data";

interface Props {
  ad: InsightAd | null;
  open: boolean;
  onClose: () => void;
  onSaveToBoard?: (ad: InsightAd) => void;
}

/* ── Left Column ── */
function AdPreviewColumn({ ad, activeThumb, setActiveThumb }: { ad: InsightAd; activeThumb: number; setActiveThumb: (i: number) => void }) {
  const allMedia = [ad.mediaUrl, ...ad.additionalMediaUrls];
  const currentMedia = allMedia[activeThumb] ?? ad.mediaUrl;
  const isCurrentVideo = activeThumb === 0 && ad.mediaType === "video";

  return (
    <div className="lg:w-[40%] shrink-0 space-y-4">
      {/* Brand header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
          {ad.brand[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{ad.brand}</p>
          <p className="text-xs text-muted-foreground">{ad.adType}</p>
        </div>
        <Badge variant={ad.status === "active" ? "default" : "secondary"} className="ml-auto shrink-0 text-xs">
          {ad.status}
        </Badge>
        {ad.analysed && <Badge variant="outline" className="shrink-0 text-xs">Analysed</Badge>}
      </div>

      {/* Page ID + Transparency */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button onClick={() => { navigator.clipboard.writeText(ad.pageId); toast.success("Page ID copied"); }} className="hover:text-foreground transition-colors">
          <Copy className="h-3 w-3" />
        </button>
        <span className="truncate">Page ID: {ad.pageId}</span>
        {ad.transparencyMode && <Badge variant="outline" className="text-[10px] shrink-0">Transparency</Badge>}
      </div>

      {/* Primary text */}
      <p className="text-sm text-foreground leading-relaxed">{ad.primaryText}</p>

      {/* Media block */}
      <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden">
        {isCurrentVideo ? (
          <video src={currentMedia} controls poster={ad.thumbUrl} className="w-full h-full object-cover" />
        ) : (
          <img src={currentMedia} alt={ad.headline} className="w-full h-full object-cover" />
        )}
        {/* Overlay badges */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {ad.transparencyMode && <Badge className="text-[10px] bg-background/80 text-foreground border-none">Transparency</Badge>}
          {ad.analysed && <Badge className="text-[10px] bg-background/80 text-foreground border-none">Analysed</Badge>}
        </div>
      </div>

      {/* Domain + headline */}
      <div className="space-y-1">
        <p className="text-[11px] text-muted-foreground">{ad.domain}</p>
        <p className="text-sm font-medium">{ad.headline}</p>
        <p className="text-xs text-muted-foreground">{ad.description}</p>
      </div>

      {/* Creative count */}
      <p className="text-xs text-muted-foreground">
        This ad has <span className="font-medium text-foreground">{allMedia.length}</span> more creatives
        <span className="ml-2 text-muted-foreground">{activeThumb + 1} of {allMedia.length}</span>
      </p>

      {/* Thumbnail strip */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {allMedia.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveThumb(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeThumb ? "border-primary bg-primary/10" : "border-transparent hover:border-border"
              }`}
            >
              <img src={i === 0 ? ad.thumbUrl : url} alt={`Creative ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Similar ads count */}
      <p className="text-xs text-muted-foreground">
        This ad has <span className="font-medium text-foreground">{ad.similarAdsCount}</span> similar ads
      </p>
    </div>
  );
}

/* ── Right Column ── */
function DataPanel({ ad, memberships, onRemoveFromBoard, onSaveToBoard }: {
  ad: InsightAd;
  memberships: any[];
  onRemoveFromBoard: (itemId: string) => void;
  onSaveToBoard?: (ad: InsightAd) => void;
}) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

  const statsGrid = [
    { label: "Category", value: ad.category },
    { label: "Spend till now", value: ad.spendTillNow },
    { label: "Ad creation", value: new Date(ad.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
    { label: "Active duration", value: ad.activeDuration },
    { label: "Est. audience size", value: ad.estimatedAudienceSize },
    { label: "Impressions", value: ad.impressions },
    { label: "Total reach", value: ad.reach },
    { label: "CTA button", value: ad.cta },
  ];

  const similarAds = DUMMY_ADS.filter(a => a.industry === ad.industry && a.id !== ad.id).slice(0, 8);

  return (
    <div className="flex-1 min-w-0 space-y-5 overflow-y-auto">
      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(ad.adId); toast.success("Link copied"); }}>
          <Link className="h-3.5 w-3.5 mr-1.5" /> Copy Link
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSaveToBoard?.(ad)} className="relative">
          <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Save to Board
          {memberships.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
              {memberships.length}
            </span>
          )}
        </Button>
        <Button variant="outline" size="sm">
          <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Save to Library
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" size="sm" disabled={!ad.analysed} className={!ad.analysed ? "opacity-50 cursor-not-allowed" : ""}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Create Variations
                </Button>
              </span>
            </TooltipTrigger>
            {!ad.analysed && (
              <TooltipContent>
                <p>Ad must be analysed first</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Saved in Boards */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Saved in Boards</p>
        {memberships.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {memberships.map((m: any) => (
              <Badge key={m.id} variant="secondary" className="gap-1 pr-1">
                {m.insight_boards?.name ?? "Board"}
                <button onClick={() => onRemoveFromBoard(m.id)} className="ml-0.5 hover:text-destructive transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Not saved to any board</p>
        )}
      </div>

      <Separator />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {statsGrid.map((s) => (
          <div key={s.label}>
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <p className="text-base font-medium text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Region reach badges */}
      {ad.regionReach.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ad.regionReach.map((r) => (
            <Badge key={r.region} variant="outline" className="text-xs">
              {r.region} reach: {r.value}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Tags & Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Ad Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {ad.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs rounded-full hover:bg-accent transition-colors cursor-default">
                {t}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {ad.keywords.map((k) => (
              <Badge key={k} variant="outline" className="text-xs rounded-full hover:bg-accent transition-colors cursor-default">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Platforms */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Platforms</p>
        <PlatformIcons platforms={ad.platforms} />
      </div>

      <Separator />

      {/* Targeted Demographics (collapsible) */}
      <Collapsible open={demoOpen} onOpenChange={setDemoOpen}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Targeted Demographics</p>
            {!demoOpen && (
              <p className="text-sm text-foreground mt-0.5">
                Age Group: 18–65+ years old · Gender: All
              </p>
            )}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              {demoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="ml-1">{demoOpen ? "Hide" : "View details"}</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Age</TableHead>
                <TableHead className="text-xs">Gender</TableHead>
                <TableHead className="text-xs text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ad.demographics.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{d.ageGroup}</TableCell>
                  <TableCell className="text-sm">{d.gender}</TableCell>
                  <TableCell className="text-sm text-right">{d.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleContent>
      </Collapsible>

      {/* Location (collapsible) */}
      <Collapsible open={locOpen} onOpenChange={setLocOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
            {locOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>Location ({ad.locations.length})</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Include / Exclude</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ad.locations.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{l.name}</TableCell>
                  <TableCell className="text-sm">{l.type}</TableCell>
                  <TableCell className="text-sm capitalize">{l.includeExclude}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleContent>
      </Collapsible>

      {/* Languages & Domain */}
      <div className="flex gap-6 text-sm">
        <div><span className="text-muted-foreground text-xs">Languages</span><p className="font-medium">{ad.languages.join(", ")}</p></div>
        <div><span className="text-muted-foreground text-xs">Domain</span><p className="font-medium">{ad.domain}</p></div>
      </div>

      <Separator />

      {/* Similar Ads Strip */}
      {similarAds.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Similar Ads</p>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {similarAds.map((sa) => (
                <div key={sa.id} className="shrink-0 w-48 rounded-lg border border-border bg-card p-2 space-y-1.5">
                  <div className="aspect-video rounded-md overflow-hidden bg-muted">
                    <img src={sa.thumbUrl} alt={sa.brand} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0">
                      {sa.brand[0]}
                    </div>
                    <p className="text-xs font-medium truncate">{sa.brand}</p>
                    <Badge variant={sa.status === "active" ? "default" : "secondary"} className="ml-auto text-[9px] px-1 py-0">
                      {sa.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{sa.adId} · {sa.adType}</p>
                  <PlatformIcons platforms={sa.platforms} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

/* ── Main Drawer ── */
export function InsightAdDetailDrawer({ ad, open, onClose, onSaveToBoard }: Props) {
  const { memberships, removeFromBoard } = useAdBoardMemberships(ad?.id);
  const [activeThumb, setActiveThumb] = useState(0);

  const handleRemoveFromBoard = (itemId: string) => {
    removeFromBoard.mutate(itemId, {
      onSuccess: () => toast.success("Removed from board"),
      onError: () => toast.error("Failed to remove"),
    });
  };

  if (!ad) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { onClose(); setActiveThumb(0); } }}>
      <SheetContent className="w-full sm:max-w-6xl overflow-hidden p-0 flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-8 py-3">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold text-foreground">
              Ad ID: {ad.adId}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Two-column body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col lg:flex-row gap-8 p-8">
            <AdPreviewColumn ad={ad} activeThumb={activeThumb} setActiveThumb={setActiveThumb} />
            <DataPanel
              ad={ad}
              memberships={memberships}
              onRemoveFromBoard={handleRemoveFromBoard}
              onSaveToBoard={onSaveToBoard}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
