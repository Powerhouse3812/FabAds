/**
 * PlacementPreviewTabs — placement-aware ad preview tabs (Decision 25).
 *
 * Tab bar: Feed | Stories | Reels | In-stream
 * Each tab shows the ad in the correct aspect ratio mock:
 *   Feed      1:1    — FB/IG feed card
 *   Stories   9:16   — full-bleed vertical card
 *   Reels     9:16   — Reels-style chrome
 *   In-stream 16:9   — horizontal YouTube-style pre-roll
 */
import { useState } from "react";
import {
  Building2,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  PlayCircle,
  Send,
  Share2,
  ThumbsUp,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanV2 } from "../../types";
import { CREATIVES } from "../../data";
import { CREATIVE_ID_KEY, resolveNodeValue } from "../../nodeOverrides";
import { buildReviewTree, flattenAllNodes, type TreeNode } from "./reviewModel";
import { ctaLabel } from "./reviewParts";

type PlacementTab = "feed" | "stories" | "reels" | "instream";

const TABS: { id: PlacementTab; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "stories", label: "Stories" },
  { id: "reels", label: "Reels" },
  { id: "instream", label: "In-stream" },
];

/** Resolve the representative ad leaf to preview. */
function resolveAdLeaf(plan: PlanV2, node: TreeNode | null): TreeNode | undefined {
  const tree = buildReviewTree(plan);
  const allAds = flattenAllNodes(tree).filter((n) => n.kind === "ad" && !n.summary);
  if (!node) return allAds[0];
  if (node.kind === "ad" && !node.summary) return allAds.find((a) => a.id === node.id) ?? allAds[0];
  const desc = flattenAllNodes([node]).filter((n) => n.kind === "ad" && !n.summary);
  return allAds.find((a) => a.id === desc[0]?.id) ?? allAds[0];
}

/* ------------------------------------------------------------------ */
/*  Feed preview (1:1)                                                  */
/* ------------------------------------------------------------------ */
function FeedPreview({
  pageName,
  headline,
  primaryText,
  description,
  cta,
  displayLink,
  isVideo,
}: {
  pageName: string;
  headline: string;
  primaryText: string;
  description?: string;
  cta: string;
  displayLink: string;
  isVideo: boolean;
}) {
  return (
    <div className="w-full max-w-[320px] self-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-tight text-foreground">{pageName || "Mamaearth Official"}</div>
          <div className="text-[10px] text-muted-foreground">Sponsored · Feed</div>
        </div>
      </div>
      {/* Primary text */}
      {primaryText ? (
        <p className="px-3 pb-2 text-[12px] leading-snug text-foreground line-clamp-3">{primaryText}</p>
      ) : (
        <p className="px-3 pb-2 text-[12px] italic leading-snug text-muted-foreground">Primary text appears here.</p>
      )}
      {/* Media — 1:1 */}
      <div className="relative aspect-square w-full bg-muted">
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
          {isVideo ? (
            <PlayCircle className="h-10 w-10 opacity-50" />
          ) : (
            <ImageIcon className="h-10 w-10 opacity-30" />
          )}
          <span className="px-4 text-center text-[11px] text-muted-foreground/60">Creative placeholder</span>
        </div>
      </div>
      {/* Link card */}
      <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{displayLink || "yourbrand.com"}</div>
          <div className="truncate text-[13px] font-semibold leading-tight text-foreground">{headline || "Headline preview"}</div>
          {description && <div className="truncate text-[11px] text-muted-foreground">{description}</div>}
        </div>
        <span className="shrink-0 rounded-md bg-foreground/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-foreground">
          {ctaLabel(cta)}
        </span>
      </div>
      {/* Engagement */}
      <div className="flex items-center gap-4 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Like</span>
        <span>Comment</span>
        <span>Share</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stories preview (9:16 vertical)                                    */
/* ------------------------------------------------------------------ */
function StoriesPreview({
  pageName,
  cta,
  headline,
}: {
  pageName: string;
  cta: string;
  headline: string;
}) {
  return (
    <div className="relative mx-auto h-[400px] w-[225px] overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
      {/* Header bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/50 to-transparent px-3 py-3">
        <div className="h-1 flex-1 rounded-full bg-white/60" />
        <div className="h-1 flex-1 rounded-full bg-white/30" />
        <div className="h-1 flex-1 rounded-full bg-white/30" />
      </div>
      {/* Page label */}
      <div className="absolute left-3 top-7 z-10 flex items-center gap-1.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm">
          <Building2 className="h-3 w-3 text-primary" />
        </div>
        <span className="text-[11px] font-medium text-white drop-shadow">{pageName || "Mamaearth"}</span>
        <span className="text-[10px] text-white/60">· Sponsored</span>
      </div>
      {/* Creative area — full bleed */}
      <div className="flex h-full w-full flex-col items-center justify-center">
        <ImageIcon className="h-12 w-12 opacity-20 text-foreground" />
        <span className="mt-2 text-[11px] text-muted-foreground/50">Stories (9:16)</span>
      </div>
      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-3 pb-4 pt-8">
        <p className="mb-2 text-[12px] font-medium text-white line-clamp-2">{headline || "Swipe up to explore"}</p>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#121212]">
            {ctaLabel(cta)}
          </span>
          <span className="text-[11px] text-white/70">Swipe up</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reels preview (9:16 vertical with Reels chrome)                    */
/* ------------------------------------------------------------------ */
function ReelsPreview({
  pageName,
  cta,
  headline,
}: {
  pageName: string;
  cta: string;
  headline: string;
}) {
  return (
    <div className="relative mx-auto h-[400px] w-[225px] overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
      {/* Creative area */}
      <div className="flex h-full w-full flex-col items-center justify-center">
        <PlayCircle className="h-12 w-12 opacity-20 text-foreground" />
        <span className="mt-2 text-[11px] text-muted-foreground/50">Reels (9:16)</span>
      </div>

      {/* Left side — page info */}
      <div className="absolute bottom-16 left-3 z-10 space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 border border-white/30">
            <Building2 className="h-3 w-3 text-primary" />
          </div>
          <span className="text-[11px] font-medium text-white drop-shadow">{pageName || "Mamaearth"}</span>
          <span className="rounded-full border border-white/60 px-1.5 py-0.5 text-[9px] font-medium text-white">Follow</span>
        </div>
        <p className="max-w-[160px] text-[11px] text-white/80 line-clamp-2">{headline || "Get yours today"}</p>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#121212]"
        >
          {ctaLabel(cta)}
        </button>
        <span className="font-mono text-[10px] text-white/50 uppercase tracking-wide">Sponsored</span>
      </div>

      {/* Right side — action icons */}
      <div className="absolute bottom-16 right-3 z-10 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-0.5">
          <Heart className="h-6 w-6 text-white drop-shadow" />
          <span className="font-mono text-[9px] text-white/70">1.2k</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <MessageCircle className="h-6 w-6 text-white drop-shadow" />
          <span className="font-mono text-[9px] text-white/70">48</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Send className="h-6 w-6 text-white drop-shadow" />
          <span className="font-mono text-[9px] text-white/70">Share</span>
        </div>
        <VolumeX className="h-5 w-5 text-white/70 drop-shadow" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  In-stream preview (16:9 horizontal)                                */
/* ------------------------------------------------------------------ */
function InstreamPreview({
  pageName,
  headline,
  cta,
}: {
  pageName: string;
  headline: string;
  cta: string;
}) {
  return (
    <div className="w-full max-w-[380px] self-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* 16:9 video area */}
      <div className="relative aspect-video w-full bg-muted">
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <PlayCircle className="h-10 w-10 opacity-30" />
          <span className="text-[11px] text-muted-foreground/50">In-stream (16:9)</span>
        </div>
        {/* Skip button mock */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white">
            Ad · 5s
          </span>
          <span className="rounded border border-white/40 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white/70">
            Skip
          </span>
        </div>
        {/* Volume icon */}
        <div className="absolute bottom-3 left-3">
          <VolumeX className="h-4 w-4 text-white/60" />
        </div>
      </div>
      {/* CTA bar below */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] font-semibold text-foreground">{pageName || "Mamaearth Official"}</div>
            <div className="truncate text-[10px] text-muted-foreground">{headline || "Headline preview"}</div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-[#121212]">
          {ctaLabel(cta)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function PlacementPreviewTabs({
  plan,
  node,
}: {
  plan: PlanV2;
  node: TreeNode | null;
}) {
  const [activeTab, setActiveTab] = useState<PlacementTab>("feed");

  const ad = resolveAdLeaf(plan, node);
  // Honor a per-ad creative swap (__creativeId override) before the baked id.
  const effectiveCreativeId = ad
    ? (resolveNodeValue(plan, ad.id, CREATIVE_ID_KEY, ad.creativeId ?? null) as string | null)
    : null;
  const creative =
    [...plan.creatives, ...CREATIVES].find((c) => c.id === effectiveCreativeId) ??
    plan.creatives.find((c) => c.id === ad?.creativeId) ??
    plan.creatives[0];
  const target = plan.targets[ad?.targetIndex ?? 0] ?? plan.targets[0];
  const copy = plan.adCopy;
  const isVideo = creative?.format === "single_video";
  const isAdNode = node?.kind === "ad" && !node?.summary;

  // Placement context caption
  const caption =
    !node
      ? "Preview — representative"
      : isAdNode
        ? "Ad preview"
        : `Preview — representative of ${node.kind}`;

  // Show placeholder when not at ad level and no ads exist
  const noAds = !ad;

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-0 border-b border-border px-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "border-b-2 px-3 py-2.5 font-mono text-[11px] font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Caption */}
      <div className="shrink-0 px-3 py-2">
        <p className="font-mono text-[10px] text-muted-foreground/60">{caption}</p>
      </div>

      {/* Preview area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-4 px-3 pb-4">
          {noAds ? (
            <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-border text-[12px] text-muted-foreground">
              Preview — select an ad
            </div>
          ) : activeTab === "feed" ? (
            <FeedPreview
              pageName={target?.pageName ?? ""}
              headline={(ad.fields?.headline as string) || copy.headline}
              primaryText={(ad.fields?.primaryText as string) || copy.primaryText}
              description={copy.description}
              cta={(ad.fields?.cta as string) || copy.cta}
              displayLink={copy.displayLink}
              isVideo={isVideo}
            />
          ) : activeTab === "stories" ? (
            <StoriesPreview
              pageName={target?.pageName ?? ""}
              cta={(ad.fields?.cta as string) || copy.cta}
              headline={(ad.fields?.headline as string) || copy.headline}
            />
          ) : activeTab === "reels" ? (
            <ReelsPreview
              pageName={target?.pageName ?? ""}
              cta={(ad.fields?.cta as string) || copy.cta}
              headline={(ad.fields?.headline as string) || copy.headline}
            />
          ) : (
            <InstreamPreview
              pageName={target?.pageName ?? ""}
              headline={(ad.fields?.headline as string) || copy.headline}
              cta={(ad.fields?.cta as string) || copy.cta}
            />
          )}

          {creative && (
            <p className="text-[11px] text-muted-foreground/70">
              {creative.name}
              {target ? <> · {target.pageName}</> : null}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
