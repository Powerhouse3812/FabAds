/**
 * Meta row + actions (kept from the old drawer): page name (opens the page
 * overlay), last synced, page ID (copy), transparency regions, status / active
 * since, and the action row: Create Variations, Add to competitor, Save to
 * Board (with board count), Copy link, More.
 *
 * Removed on purpose: the "Analysed / Not analysed" badge, "Analyse again" and
 * "Add to analysis queue". Analysis shows by default on every ad.
 */
import { formatDistanceToNow } from "date-fns";
import { Copy, Link as LinkIcon, MoreHorizontal, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildDownloads } from "@/lib/insights-v3/selectors";
import { toggleCompetitor, useBoardCountForItem, useIsCompetitor } from "@/lib/insights-v3/stores";
import type { Ad } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import {
  DownloadButton,
  Hint,
  SaveButton,
  StatusPill,
  TruncatedText,
  normalizeDownloads,
  triggerDownloads,
  useDetailStack,
} from "@/components/insights-v3/shared";
import { UseInGenie } from "@/components/insights-v3/genie/UseInGenie";
import { copyText, fmtDate } from "./drawerUtils";

const ICON_BTN =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function syncedLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `${formatDistanceToNow(d)} ago`;
}

export function AdMetaPanel({ ad }: { ad: Ad }) {
  const detail = useDetailStack();
  const isCompetitor = useIsCompetitor("page", ad.pageAdvertiserId);
  const boardCount = useBoardCountForItem({ type: "ad", id: ad.id });

  const synced = syncedLabel(ad.lastSyncedAt);
  const started = fmtDate(ad.startedAt);
  const lastSeen = fmtDate(ad.lastSeenAt);

  const openPage = () => detail.push({ kind: "advertiser", advertiserKind: "page", id: ad.pageAdvertiserId });

  const onCompetitor = () => {
    const now = toggleCompetitor("page", ad.pageAdvertiserId);
    toast.success(now ? `Added ${ad.pageName} to your competitors` : `Removed ${ad.pageName} from your competitors`, {
      description: now ? "Its ads now feed My Feeds." : undefined,
    });
  };

  const onDownload = () => {
    const files = normalizeDownloads(buildDownloads({ type: "ad", id: ad.id }));
    if (files.length === 0) {
      toast.error("Nothing to download for this ad");
      return;
    }
    void triggerDownloads(files);
    toast.success(files.length === 1 ? `Downloaded ${files[0].filename}` : `Downloading ${files.length} files`);
  };

  return (
    <section aria-label="Page and actions" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] text-muted-foreground">Page</span>
            <button
              type="button"
              onClick={openPage}
              aria-label={`Open page details for ${ad.pageName}`}
              className="min-w-0 max-w-full rounded-sm text-left text-sm font-semibold text-foreground hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <TruncatedText text={ad.pageName} className="max-w-[360px]" focusable={false} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              ID: {ad.pageDisplayId}
              <Hint content="Copy page ID">
                <button
                  type="button"
                  onClick={() => void copyText(ad.pageDisplayId, "Page ID copied")}
                  aria-label="Copy page ID"
                  className="rounded p-0.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                </button>
              </Hint>
            </span>
            <Hint content={synced ? "When we last refreshed this page's ads." : "Not reported"}>
              <span tabIndex={0} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Last synced: {synced ?? "—"}
              </span>
            </Hint>
            <Hint
              content={
                ad.transparencyRegions.length > 0
                  ? "Regions where this competitor's transparency information is shown."
                  : "Not reported"
              }
            >
              <span tabIndex={0} className="min-w-0 truncate rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Transparency regions: {ad.transparencyRegions.length > 0 ? ad.transparencyRegions.join(", ") : "—"}
              </span>
            </Hint>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusPill status={ad.status} />
          <span className="text-[11px] text-muted-foreground">
            {ad.status === "active"
              ? started
                ? `Active since ${started}`
                : "Active, start date unknown"
              : lastSeen
                ? `Last seen ${lastSeen}`
                : "Last seen date unknown"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <UseInGenie target={{ type: "ad", id: ad.id }} action="generate-variation" label="Create Variations" />

        <Hint content={isCompetitor ? "Remove this page from your competitors" : "Add this page to your competitors. Its ads will feed My Feeds."}>
          <button
            type="button"
            onClick={onCompetitor}
            aria-pressed={isCompetitor}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCompetitor
                ? "border-primary/40 bg-primary/15 text-primary-text hover:bg-primary/25"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            {isCompetitor ? <UserCheck className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
            {isCompetitor ? "Competitor" : "Add to competitor"}
          </button>
        </Hint>

        <SaveButton target={{ type: "ad", id: ad.id }} savedCount={boardCount} variant="button" />

        {/* Download sits right next to Save (spec: "Download sits next to Save on every element"). */}
        <DownloadButton
          build={() => buildDownloads({ type: "ad", id: ad.id })}
          label="Download"
          ariaLabel="Download creative and analysis"
          variant="button"
        />

        <Hint content="Copy link to this ad">
          <button
            type="button"
            onClick={() => void copyText(window.location.href, "Link copied")}
            aria-label="Copy link"
            className={ICON_BTN}
          >
            <LinkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </Hint>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="More actions" className={ICON_BTN}>
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem onClick={() => void copyText(ad.externalId, "Ad ID copied")} className="text-xs">
              Copy ad ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void copyText(ad.pageDisplayId, "Page ID copied")} className="text-xs">
              Copy page ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openPage} className="text-xs">
              Open page details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDownload} className="text-xs">
              Download creative and analysis
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}
