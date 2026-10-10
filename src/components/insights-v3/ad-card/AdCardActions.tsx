/** Ad card action row: Save, Download and the overflow menu (Use in Genie, Copy link). */
import { Link2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { buildDownloads } from "@/lib/insights-v3/selectors";
import { useBoardCountForItem } from "@/lib/insights-v3/stores";
import type { SavedItemRef } from "@/lib/insights-v3/types";
import { DownloadButton, SaveButton } from "@/components/insights-v3/shared";
import { UseInGenie } from "@/components/insights-v3/genie/UseInGenie";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Current URL with `ad=<id>` so the link reopens the drawer. */
function adLink(adId: string): string {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("ad", adId);
    return url.toString();
  } catch {
    return `?ad=${encodeURIComponent(adId)}`;
  }
}

async function copyAdLink(adId: string) {
  try {
    await navigator.clipboard.writeText(adLink(adId));
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy the link. Open the ad and copy it from the address bar.");
  }
}

export function AdCardActions({ adId, pageName }: { adId: string; pageName: string }) {
  const ref: SavedItemRef = { type: "ad", id: adId };
  const savedCount = useBoardCountForItem(ref);
  return (
    <div className="flex items-center gap-1.5">
      <SaveButton target={ref} savedCount={savedCount} variant="icon" />
      <DownloadButton build={() => buildDownloads(ref)} ariaLabel={`Download ad from ${pageName}`} label="Download ad" variant="icon" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`More actions for the ad from ${pageName}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        {/* Portal events bubble through the React tree: stop them so a menu click never opens the drawer. */}
        <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <UseInGenie
            target={ref}
            variant="menu-item"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent focus:bg-accent disabled:opacity-60"
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void copyAdLink(adId)} className="gap-2">
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Copy link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
