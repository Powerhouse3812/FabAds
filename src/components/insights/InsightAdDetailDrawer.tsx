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
  Sparkles, UserPlus, MoreHorizontal, Play, ShieldCheck,
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
  // D2 (mobile spec): the "Read more" toggle only exists so the truncated
  // primary text (F7 anatomy) can expand in place — there's no further
  // detail view to hand off to since we're already inside the detail sheet.
  const [textExpanded, setTextExpanded] = useState(false);
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
        {/* F6: status becomes a dot + duration pill on mobile (feed-card
            anatomy); md+ keeps today's solid Active/Paused badge, unchanged
            (INV-4) — every md: class below is a literal restatement of the
            original unconditional classes. */}
        <Badge
          className={cn(
            "gap-1.5 h-auto shrink-0 border-border bg-muted/60 px-2 py-0.5 text-[10px] text-foreground/80",
            "md:h-5 md:gap-0 md:px-2 md:py-0",
            isActive
              ? "md:border-emerald-200 md:bg-emerald-100 md:text-emerald-700 md:hover:bg-emerald-100 dark:md:border-emerald-500/30 dark:md:bg-emerald-500/20 dark:md:text-emerald-300"
              : "md:border-border md:bg-muted md:text-muted-foreground",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full md:hidden",
              isActive ? "bg-emerald-500" : "bg-muted-foreground",
            )}
          />
          <span className="md:hidden">{ad.activeDuration}</span>
          <span className="hidden md:inline">{isActive ? "Active" : ad.status}</span>
        </Badge>
      </div>

      {/* Primary text — F7: 2-line clamp + inline "Read more" text link on
          mobile; md+ restores today's full, untruncated copy (INV-4). */}
      <div className="relative">
        <p
          className={cn(
            "text-[13px] text-foreground leading-relaxed",
            !textExpanded && "line-clamp-2 md:line-clamp-none",
          )}
        >
          {ad.primaryText}
        </p>
        {ad.primaryText && (
          <button
            type="button"
            onClick={() => setTextExpanded((v) => !v)}
            className="mt-0.5 text-[11px] font-medium text-primary transition-colors hover:text-primary/80 md:hidden"
          >
            {textExpanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>

      {/* Media block — F8: capped 4:5 on mobile (the single biggest
          usability fix in the batch); md+ restores this ad's own aspect
          ratio via the --media-ar custom property so desktop is
          pixel-unchanged (INV-4) — a per-ad dynamic ratio can't be expressed
          as a static md: utility class. */}
      {ad.mediaUrl && (
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted md:[aspect-ratio:var(--media-ar)]"
          style={{ "--media-ar": ad.mediaAspectRatio ?? "1/1" } as React.CSSProperties}
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
          {/* F9: transparency chip — new addition, shown at every size (the
              feed card carries the same unconditional treatment, so this
              isn't a desktop regression — nothing existing is altered). */}
          {ad.transparencyMode && (
            <div className="absolute bottom-2 left-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/85 px-2 py-0.5 text-[10px] text-foreground backdrop-blur-sm">
                <ShieldCheck className="h-3 w-3" />
                Transparency mode
              </span>
            </div>
          )}
        </div>
      )}

      {/* Domain + headline + description — F10 link-preview block. Mobile
          adds a right-aligned "View collection" button next to the domain;
          md+ hides it and restores today's 2-line headline/description
          clamps (INV-4). */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-mono text-muted-foreground truncate">{ad.domain}</p>
          <button
            type="button"
            onClick={() => window.open(`https://${ad.domain}`, "_blank", "noopener,noreferrer")}
            className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted md:hidden"
          >
            View collection
          </button>
        </div>
        <p className="text-[13px] font-bold text-foreground line-clamp-1 md:font-semibold md:line-clamp-2">
          {ad.headline}
        </p>
        <p className="text-[11px] text-muted-foreground line-clamp-1 md:line-clamp-2">
          {ad.description}
        </p>
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
                // D3: warning-toned colour — the DS v1.2 accessible-text
                // token (WCAG-checked in both themes), not a raw palette
                // shade (INV-9).
                <span className="text-warning-text truncate">
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
            {ad.status === "active" ? (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                Active, since {ad.activeDuration}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap capitalize">
                {ad.status}
              </span>
            )}
          </div>
        </div>

        {/* CTA row + action icons.
            D4 / spec 2.4 — action prune on mobile: Analyse again / Add to
            analysis queue (same control, state-dependent label) and Create
            Variations (hand-off into the new-generation flow, blocked on
            mobile) STAY removed below `md` — MOBILE_SPEC_B.md §1.1
            reconfirmed these as the only two survivors of batch A's prune.
            "More" has no menu items today (no DropdownMenu wraps it — it is
            already dead/decorative), so per spec it's pruned too rather
            than shipping an empty trigger. Every removed control reappears
            unchanged at md+ via `md:` (INV-4).
            Copy link was pruned by batch A and is RESTORED here per
            MOBILE_SPEC_B.md §1.1 item 5 — back on the keep-list,
            unconditional again. Add to competitor, Save to Board and Copy
            link are therefore the three actions visible at every size; each
            gets a `relative … after:absolute after:-inset-1.5` hit-area
            expansion (32px visible box → 44px clickable region — same
            technique as `DesktopOnlyPrompt`'s `ICON_BUTTON_BASE`, reused
            rather than reinvented) so the row hits the WCAG 2.5.5 floor on
            mobile without the row getting visually denser or sparser at any
            size — the `after:` pseudo paints nothing, so it's left
            unconditional (not `md:`-gated) and desktop's 32px look is
            untouched either way (INV-4). */}
        {/* gap-3 below md, gap-2 at md+ (INV-4). The 32px icon buttons carry a
            6px-per-side `after:-inset-1.5` hit slop to clear the 44px floor, so
            they claim 6+6=12px of gutter — an 8px gap left neighbours
            overlapping by 4px and a tap in the gutter fired the wrong action.
            Desktop drops the slop entirely (`md:after:content-none`) and keeps
            its 8px rhythm. */}
        <div className="flex flex-wrap items-center gap-3 md:gap-2">
          <div className="hidden md:contents">
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
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hidden md:inline">
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

          <Separator orientation="vertical" className="hidden md:block h-6 mx-1" />

          {/* Add to competitor — keep-list action (spec 2.4), wired in this
              file; visible at every size. */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 text-muted-foreground hover:text-foreground after:absolute after:-inset-1.5 after:content-[''] md:after:content-none"
            aria-label="Add to competitor"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 text-muted-foreground hover:text-foreground after:absolute after:-inset-1.5 after:content-[''] md:after:content-none"
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
          {/* Copy link — RESTORED on mobile (MOBILE_SPEC_B.md §1.1 item 5).
              No longer `hidden md:inline-flex`; unconditionally visible like
              its two siblings above.
              MONITOR FIX (batch B final gate): the handler used to write
              `ad.adId` ("AD-100000") to the clipboard under a "Copy link"
              label and a "Link copied" toast — verified live. That is a
              functional lie, and spec B's definition of done requires the
              RESTORED action to actually work, not merely to be un-hidden.
              It now copies the same absolute URL `InsightsV2Feed`'s own
              `handleCopyLink` builds, so both surfaces hand out one link
              shape. The ID still has its own dedicated affordance ("Copy
              Page ID" above / "Copy Ad ID" on SimilarAdCard). */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 text-muted-foreground hover:text-foreground after:absolute after:-inset-1.5 after:content-[''] md:after:content-none"
            onClick={() => {
              const url = `${window.location.origin}/insights/discover?ad=${ad.id}`;
              if (navigator.clipboard?.writeText) {
                // Awaited: a rejected write must not still toast success.
                navigator.clipboard.writeText(url).then(
                  () => toast.success("Link copied"),
                  () => toast.error("Could not copy link"),
                );
              } else {
                toast.error("Clipboard unavailable");
              }
            }}
            aria-label="Copy link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground"
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
            {/* 44px sweep (MOBILE_SPEC_B.md §1.3): this link's own box is
                ~17px tall — growing it to a literal 44px box would puff up
                the whole row (flex `items-center` stretches to the tallest
                sibling). Instead the `after:` pseudo grows only the
                CLICKABLE region 14px above/below (17 + 14 + 14 = 45px),
                leaving the visible text and the row's height exactly as
                they were. Width is untouched on purpose — the text alone is
                already well past 44px wide, so only height was under
                floor. */}
            <button
              onClick={() => setDemoOpen((v) => !v)}
              className="relative text-[11px] text-muted-foreground transition-colors hover:text-foreground after:absolute after:inset-x-0 after:-inset-y-3.5 after:content-[''] md:after:content-none"
            >
              View details
            </button>
            {/* Same hit-area trick, tuned to this control's own box: Switch
                is a fixed h-6 w-11 (24×44) shadcn primitive we don't own
                (don't edit switch.tsx) — width already clears 44px, so only
                10px of vertical `after:` growth is needed (24 + 10 + 10 =
                44px) to bring height to the floor without touching the
                visible track/thumb size. */}
            <Switch
              checked={demoOpen}
              onCheckedChange={setDemoOpen}
              aria-label="Toggle demographics table"
              className="relative after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-[''] md:after:content-none"
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
            {/* 44px sweep (MOBILE_SPEC_B.md §1.3): this is a standalone
                full-width row (not a dense multi-icon toolbar), so — unlike
                the CTA row above — a real `min-h-11` box is the simpler fix
                here; `md:min-h-0` resets it back to today's content-driven
                ~20px at md+ so desktop is pixel-unchanged (INV-4). */}
            <button className="flex w-full min-h-11 items-center gap-1 text-sm font-medium text-foreground hover:text-foreground transition-colors md:min-h-0">
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
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {cta ? (
        <span
          className="inline-flex items-center h-7 mt-1 px-2.5 rounded-md border border-border bg-background text-foreground text-[12px] max-w-full truncate"
          title={value}
        >
          {value}
        </span>
      ) : (
        <p
          className={cn(
            // D5: 15px value on mobile; md+ restores today's text-sm (14px), unchanged (INV-4).
            "text-[15px] md:text-sm font-medium mt-0.5 truncate",
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
  // Unicode gender symbols — render cross-platform without depending on
  // lucide-react Mars/Venus icons (not in our pinned version).
  const symbol = g === "male"
    ? "♂"
    : g === "female"
      ? "♀"
      : g.includes("male") && !g.includes("female")
        ? "♂"
        : g.includes("female")
          ? "♀"
          : "⚧"; // unknown / non-binary
  return (
    <span className="inline-flex items-center gap-1.5 capitalize">
      <span
        className="text-muted-foreground text-sm leading-none"
        aria-hidden
      >
        {symbol}
      </span>
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
      <SheetContent
        className={cn(
          "w-full sm:max-w-[1280px] overflow-hidden p-0 flex flex-col",
          // D1 (mobile spec): presents as a bottom sheet at ~90dvh with a
          // rounded top edge, feed dimmed behind (SheetOverlay, untouched)
          // and no outside-click dismiss — sheet.tsx already preventDefaults
          // pointer-down/interact-outside app-wide (INV-8). `side` is left at
          // its default "right" so every `md:` class below is a literal
          // restatement of today's exact right-panel geometry (INV-4).
          // `top` needs `!important`: sheetVariants bakes an unconditional
          // `inset-y-0` (top:0;bottom:0) for side="right" that a plain
          // override can't beat deterministically — tailwind-merge does not
          // treat `inset-y` and `top` as the same class group (verified),
          // so without `!important` the winner at a given breakpoint would
          // depend on Tailwind's internal stylesheet order, not ours.
          // Verified against the actual compiled CSS: `md:!top-0` sits in
          // the `@media (min-width:768px)` block, which Tailwind always
          // emits after the base layer, so it wins at md+ over the
          // always-present `!top-auto` (both `!important`, tie broken by
          // source order).
          "!top-auto h-[90dvh] rounded-t-2xl border-t border-l-0",
          "md:!top-0 md:h-full md:rounded-none md:border-l md:border-t-0",
        )}
      >
        {/*
          Single wrapper around everything below so the built-in
          SheetPrimitive.Close (rendered by sheet.tsx right after
          {children} — a bare ~16px icon button, no padding) has exactly one
          unambiguous DOM sibling to reach. D1 requires exactly ONE close
          control at >=44px, not that 16px X alongside a second footer
          button — we don't own sheet.tsx (shadcn primitive, do not modify
          directly) and it exposes no prop to resize its own Close, so the
          `[&+button]` arbitrary sibling selector below reaches across to
          size and center that same X to the WCAG 2.5.5 floor on mobile.
          `md:[&+button]:h-4 md:[&+button]:w-4 md:[&+button]:inline-block`
          restores its exact original ~16px footprint at md+ (INV-4).
          `[&+button]:z-20` fixes a pre-existing bug found while building
          this: the sticky header below is `z-10`, which — per the CSS
          stacking rules for a positive z-index vs. the Close button's
          default `z-index:auto` — painted ON TOP of the button and ate its
          clicks at every size (confirmed via elementFromPoint against the
          unmodified file). Not a desktop regression: it was already
          non-functional there, so this is a fix, not an INV-4 change.
        */}
        <div className="flex flex-1 min-h-0 flex-col [&+button]:z-20 [&+button]:flex [&+button]:h-11 [&+button]:w-11 [&+button]:items-center [&+button]:justify-center md:[&+button]:inline-block md:[&+button]:h-4 md:[&+button]:w-4">
          {/* Drag handle — mobile only; same treatment as the sidebar's
              mobile-nav sheet grabber (MobileNavContent.tsx) for a
              consistent bottom-sheet idiom app-wide. */}
          <div className="flex justify-center pt-2 pb-1 shrink-0 md:hidden" aria-hidden="true">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-5 py-3 pr-16 md:pr-12 shrink-0">
            <SheetHeader className="text-left">
              <SheetTitle className="text-sm font-semibold text-foreground font-mono">
                Ad ID: <span className="text-foreground">{ad.adId}</span>
              </SheetTitle>
            </SheetHeader>
          </div>

          {/* Body — scrollable container */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
