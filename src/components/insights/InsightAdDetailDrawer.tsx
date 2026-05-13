import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  LayoutGrid, Copy, Link as LinkIcon, ChevronRight, ChevronDown,
  Sparkles, UserPlus, MoreHorizontal, Mars, Venus, CircleHelp, Play,
} from "lucide-react";
import { PlatformIcons } from "./PlatformIcons";
import { SimilarAdCard } from "./SimilarAdCard";
import { useAdBoardMemberships } from "@/hooks/use-insight-boards";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import type { InsightAd } from "@/lib/insights-dummy-data";
import { cn } from "@/lib/utils";

interface Props {
  ad: InsightAd | null;
  open: boolean;
  onClose: () => void;
  onSaveToBoard?: (ad: InsightAd) => void;
  /** Click handler for Similar Ads cards — swaps drawer content without closing. */
  onSelectAd?: (ad: InsightAd) => void;
}

/* ─────────────────────────────────────────────────────────────────
   LEFT — Brand creative card
   ───────────────────────────────────────────────────────────────── */
function AdCreativeColumn({
  ad,
  activeThumb,
  setActiveThumb,
}: {
  ad: InsightAd;
  activeThumb: number;
  setActiveThumb: (i: number) => void;
}) {
  const allMedia = [ad.mediaUrl, ...ad.additionalMediaUrls].filter(Boolean);
  const currentMedia = allMedia[activeThumb] ?? ad.mediaUrl;
  const isCurrentVideo = activeThumb === 0 && ad.mediaType === "video";
  const isActive = ad.status === "active";

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      {/* Brand row */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
          {ad.brand[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{ad.brand}</p>
          <p className="text-[11px] text-muted-foreground">{ad.adType}</p>
        </div>
        <Badge
          className={cn(
            "text-[10px] px-2 py-0 h-5 shrink-0",
            isActive
              ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
              : "bg-muted text-muted-foreground border-border",
          )}
        >
          {isActive ? "Active" : ad.status}
        </Badge>
      </div>

      {/* Primary text */}
      <p className="text-[13px] text-foreground leading-relaxed">{ad.primaryText}</p>

      {/* Media block */}
      {ad.mediaUrl && (
        <div
          className="relative bg-muted rounded-xl overflow-hidden"
          style={{ aspectRatio: ad.mediaAspectRatio ?? "1/1" }}
        >
          {isCurrentVideo ? (
            <video
              src={currentMedia}
              controls
              poster={ad.thumbUrl}
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={currentMedia} alt={ad.headline} className="w-full h-full object-cover" />
          )}
          {ad.mediaType === "video" && activeThumb === 0 && !isCurrentVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-12 w-12 rounded-full bg-background/70 backdrop-blur flex items-center justify-center">
                <Play className="h-5 w-5 text-foreground" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domain + headline + description */}
      <div className="space-y-1">
        <p className="text-[11px] font-mono text-muted-foreground truncate">{ad.domain}</p>
        <p className="text-[13px] font-semibold text-foreground line-clamp-2">{ad.headline}</p>
        <p className="text-[11px] text-muted-foreground line-clamp-2">{ad.description}</p>
      </div>

      {/* "X more creatives" + thumb strip */}
      {allMedia.length > 1 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              This ad has{" "}
              <span className="text-foreground font-semibold">{allMedia.length}</span>{" "}
              {allMedia.length === 1 ? "creative" : "creatives"}
            </span>
            <span className="font-mono">
              {activeThumb + 1} of {allMedia.length}
            </span>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-1.5 pb-1.5">
              {allMedia.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveThumb(i)}
                  className={cn(
                    "shrink-0 w-14 h-12 rounded-md overflow-hidden border-2 transition-all",
                    i === activeThumb
                      ? "border-primary"
                      : "border-transparent hover:border-border",
                  )}
                  aria-label={`View creative ${i + 1}`}
                >
                  <img
                    src={i === 0 ? ad.thumbUrl || url : url}
                    alt={`Creative ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Similar ads count */}
      {ad.similarAdsCount > 0 && (
        <p className="text-[11px] text-muted-foreground pt-1">
          This ad has{" "}
          <span className="text-foreground font-semibold">
            {String(ad.similarAdsCount).padStart(2, "0")}
          </span>{" "}
          similar Ads.
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RIGHT — Meta column (stats, keywords, demographics, location)
   ───────────────────────────────────────────────────────────────── */
function AdMetaColumn({
  ad,
  membershipsCount,
  onSaveToBoard,
}: {
  ad: InsightAd;
  membershipsCount: number;
  onSaveToBoard?: (ad: InsightAd) => void;
}) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

  // Merge keywords + tags, dedupe
  const allKeywords = Array.from(new Set([...(ad.keywords ?? []), ...(ad.tags ?? [])]));

  // Stats grid — state-aware
  const baseStats = [
    { label: "Category", value: ad.category, accent: true },
    { label: "Spend till now", value: ad.spendTillNow ?? "N/F" },
    {
      label: "Ad creation",
      value: new Date(ad.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },
    {
      label: "Active duration",
      value: ad.status === "active" ? `Active, since ${ad.activeDuration}` : ad.activeDuration,
      activeText: ad.status === "active",
    },
    { label: "CTA button", value: ad.cta, cta: true },
  ];

  const audienceStats = [
    { label: "Est. audience size", value: ad.estimatedAudienceSize },
    { label: "Impression", value: ad.impressions },
    { label: "Total reach", value: ad.reach },
    {
      label: "BR reach",
      value: ad.regionReach.find((r) => r.region === "BR")?.value ?? "—",
    },
    {
      label: "EU reach",
      value: ad.regionReach.find((r) => r.region === "EU")?.value ?? "—",
    },
  ];

  // Bullet view computed from demographics array
  const ageRange = (() => {
    const ages = ad.demographics
      .map((d) => d.ageGroup.split("-").map((s) => parseInt(s, 10)))
      .filter((p) => p.every((n) => !isNaN(n)));
    if (!ages.length) return "—";
    const min = Math.min(...ages.map((p) => p[0]));
    const max = Math.max(...ages.map((p) => p[1] ?? p[0]));
    return `${min}–${max === min ? "65+" : max} years old`;
  })();

  const genderSummary = (() => {
    const set = new Set(ad.demographics.map((d) => d.gender));
    if (set.size === 1) return Array.from(set)[0];
    return "All";
  })();

  const showDomainsBlock = !ad.analysed && (ad.domains?.length ?? 0) > 0;

  const syncPaused = ad.syncStatus?.state === "paused";

  return (
    <div className="space-y-4 min-w-0">
      {/* ── Top meta row: page name, sync, CTA, action icons, badges ── */}
      <div className="space-y-2">
        {/* Page name row */}
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1 justify-between">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground">Page name:</span>
              <span className="text-sm font-semibold text-foreground truncate">
                {ad.pageName}
              </span>
              {syncPaused && (
                <button className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  Sync paused of this page (
                  {formatDistanceToNow(new Date(ad.syncStatus!.lastSyncedAt))} ago)
                  <ChevronDown className="h-3 w-3" />
                </button>
              )}
              {!syncPaused && !ad.analysed && (
                <button className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                  <UserPlus className="h-3 w-3" />
                  Add page to competitor
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
              <span>ID: {ad.pageId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ad.pageId);
                  toast.success("Page ID copied");
                }}
                className="hover:text-foreground transition-colors"
                aria-label="Copy Page ID"
              >
                <Copy className="h-3 w-3" />
              </button>
              {ad.transparencyMode && (ad.transparencyRegions?.length ?? 0) > 0 && (
                <span className="text-amber-600 dark:text-amber-400 truncate">
                  (Transparency mode: {ad.transparencyRegions!.join(", ")})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0 h-5 gap-1",
                ad.analysed
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "bg-muted text-muted-foreground border-border",
              )}
            >
              {ad.analysed ? "Analysed" : "Not Analysed"}
            </Badge>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Active, since {ad.activeDuration}
            </span>
          </div>
        </div>

        {/* CTA row + 4 action icons */}
        <div className="flex flex-wrap items-center gap-2">
          {ad.analysed ? (
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Sparkles className="h-3.5 w-3.5" />
              Analyse again
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <LayoutGrid className="h-3.5 w-3.5" />
              Add to analysis queue
            </Button>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!ad.analysed}
                    className={cn("gap-1.5 h-8", !ad.analysed && "opacity-60 cursor-not-allowed")}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Create Variations
                  </Button>
                </span>
              </TooltipTrigger>
              {!ad.analysed && (
                <TooltipContent>
                  <p className="text-xs">Ad must be analysed first</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 4 action icons */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Add to competitor"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
            onClick={() => onSaveToBoard?.(ad)}
            aria-label="Save to Board"
          >
            <LayoutGrid className="h-4 w-4" />
            {membershipsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {membershipsCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(ad.adId);
              toast.success("Link copied");
            }}
            aria-label="Copy link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
        {baseStats.map((s) => (
          <StatCell
            key={s.label}
            label={s.label}
            value={s.value}
            accent={s.accent}
            cta={s.cta}
            activeText={s.activeText}
          />
        ))}
        {ad.analysed &&
          audienceStats.map((s) => (
            <StatCell key={s.label} label={s.label} value={s.value} />
          ))}
      </div>

      {/* ── Keywords + Platforms (side-by-side) ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-6 gap-y-3 pt-1">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] text-muted-foreground">
            Ad Keywords{" "}
            <span className="text-muted-foreground/70">(AI generated)</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allKeywords.map((k) => (
              <Badge
                key={k}
                variant="outline"
                className="text-[11px] rounded-full px-2 py-0 h-6 font-normal hover:bg-accent transition-colors cursor-default"
              >
                {k.startsWith("#") ? k : `#${k}`}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Platforms</p>
          <div className="flex items-center gap-1.5">
            {ad.platforms.map((p) => (
              <span
                key={p}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
                title={p}
              >
                <PlatformIcons platforms={[p]} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Targeted demographics (Switch toggle) ── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">Targeted demographic:</p>
            <button
              onClick={() => setDemoOpen((v) => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              View details
            </button>
            <Switch
              checked={demoOpen}
              onCheckedChange={setDemoOpen}
              aria-label="Toggle demographics table"
            />
          </div>
        </div>
        {!demoOpen ? (
          <ul className="text-[12px] text-foreground/85 space-y-0.5 pl-4 list-disc">
            <li>Age Group: {ageRange}</li>
            <li>Gender: {genderSummary}</li>
          </ul>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] h-8">Age group</TableHead>
                  <TableHead className="text-[11px] h-8">Gender</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ad.demographics.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-[12px] py-1.5">{d.ageGroup}</TableCell>
                    <TableCell className="text-[12px] py-1.5">
                      <GenderCell gender={d.gender} />
                    </TableCell>
                    <TableCell className="text-[12px] py-1.5 text-right font-mono">
                      {d.percentage.toString().padStart(2, "0")}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Location (collapsible) ── */}
      {ad.locations.length > 0 && (
        <Collapsible open={locOpen} onOpenChange={setLocOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground transition-colors w-full">
              {locOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span>Location</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                ({ad.locations.length})
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] h-8">Location</TableHead>
                    <TableHead className="text-[11px] h-8">Type</TableHead>
                    <TableHead className="text-[11px] h-8">Include / Exclude</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ad.locations.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-[12px] py-1.5">{l.name}</TableCell>
                      <TableCell className="text-[12px] py-1.5">{l.type}</TableCell>
                      <TableCell className="text-[12px] py-1.5 capitalize">
                        {l.includeExclude}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ── Domains + Language (only when not analysed and multi-domain) ── */}
      {showDomainsBlock && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-1">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Domains</p>
            <ul className="text-[12px] text-foreground/85 space-y-1 pl-4 list-disc">
              {ad.domains!.map((d) => (
                <li key={d} className="font-mono">
                  {d}
                </li>
              ))}
            </ul>
          </div>
          {ad.languages.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Language</p>
              <LanguageGrid languages={ad.languages} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  accent,
  cta,
  activeText,
}: {
  label: string;
  value: string;
  accent?: boolean;
  cta?: boolean;
  activeText?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground truncate">{label}</p>
      {cta ? (
        <Button
          variant="outline"
          size="sm"
          className="h-7 mt-1 text-[12px] px-3 pointer-events-none"
        >
          {value}
        </Button>
      ) : (
        <p
          className={cn(
            "text-sm font-medium mt-0.5 truncate",
            accent && "text-rose-600 dark:text-rose-400",
            activeText && "text-emerald-600 dark:text-emerald-400",
            !accent && !activeText && "text-foreground",
          )}
          title={value}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function GenderCell({ gender }: { gender: string }) {
  const g = gender.toLowerCase();
  const Icon = g.includes("male") && !g.includes("female") ? Mars : g.includes("female") ? Venus : CircleHelp;
  return (
    <span className="inline-flex items-center gap-1.5 capitalize">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {gender}
    </span>
  );
}

function LanguageGrid({ languages }: { languages: string[] }) {
  // Split into two columns
  const mid = Math.ceil(languages.length / 2);
  const left = languages.slice(0, mid);
  const right = languages.slice(mid);
  return (
    <div className="grid grid-cols-2 gap-x-6 text-[12px] text-foreground/85">
      <ul className="space-y-1 pl-4 list-disc">
        {left.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {right.length > 0 && (
        <ul className="space-y-1 pl-4 list-disc">
          {right.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   BELOW — Similar Ads section (full-width grid)
   ───────────────────────────────────────────────────────────────── */
function SimilarAdsSection({
  ad,
  onSelectAd,
}: {
  ad: InsightAd;
  onSelectAd?: (ad: InsightAd) => void;
}) {
  const similar = DUMMY_ADS.filter((a) => a.industry === ad.industry && a.id !== ad.id).slice(0, 6);
  if (similar.length === 0) return null;

  return (
    <section className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Similar Ads{" "}
          <span className="font-mono text-muted-foreground font-normal">
            ({String(similar.length).padStart(2, "0")})
          </span>
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {similar.map((sa) => (
          <SimilarAdCard key={sa.id} ad={sa} onSelect={onSelectAd} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN — Drawer
   ───────────────────────────────────────────────────────────────── */
export function InsightAdDetailDrawer({
  ad,
  open,
  onClose,
  onSaveToBoard,
  onSelectAd,
}: Props) {
  const { memberships } = useAdBoardMemberships(ad?.id);
  const [activeThumb, setActiveThumb] = useState(0);

  if (!ad) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setActiveThumb(0);
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-[1280px] overflow-hidden p-0 flex flex-col">
        {/* Sticky header — Sheet renders its own X close in the top-right
            corner via SheetPrimitive.Close; we don't duplicate it here. */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-5 py-3 pr-12">
          <SheetHeader className="text-left">
            <SheetTitle className="text-sm font-semibold text-foreground font-mono">
              Ad ID: <span className="text-foreground">{ad.adId}</span>
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Body — scrollable container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-4">
            {/* Two-col body */}
            <div className="grid grid-cols-1 md:grid-cols-[36%_1fr] lg:grid-cols-[36%_1fr] gap-5 items-start">
              {/* Left — sticky on md+ so it stays visible while right scrolls */}
              <div className="md:sticky md:top-0 md:self-start">
                <AdCreativeColumn
                  ad={ad}
                  activeThumb={activeThumb}
                  setActiveThumb={setActiveThumb}
                />
              </div>
              {/* Right — meta column */}
              <AdMetaColumn
                ad={ad}
                membershipsCount={memberships.length}
                onSaveToBoard={onSaveToBoard}
              />
            </div>

            {/* Similar Ads — full-width below both cols */}
            <SimilarAdsSection
              ad={ad}
              onSelectAd={(nextAd) => {
                onSelectAd?.(nextAd);
                setActiveThumb(0);
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
