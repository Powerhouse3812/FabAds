/**
 * Advertiser actions: Mark as competitor (domain + page), Follow (page only),
 * and the Save + Download pair every element gets (Q9 / non-negotiable #11).
 */
import type { MouseEvent } from "react";
import { Check, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import { SAVABLE_LABEL, type AdvertiserKind, type SavedItemRef, type Scope } from "@/lib/insights-v3/types";
import { MODULE_NOW } from "@/lib/insights-v3/data";
import { buildDownloads } from "@/lib/insights-v3/selectors";
import {
  toggleCompetitor,
  toggleFollowPage,
  useBoardCountForItem,
  useIsCompetitor,
  useIsPageFollowed,
} from "@/lib/insights-v3/stores";
import { cn } from "@/lib/utils";
import { DownloadButton, Hint, SaveButton } from "../shared";

const BTN =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MarkCompetitorButton({
  kind,
  id,
  name,
  className,
  compact,
}: {
  kind: AdvertiserKind;
  id: string;
  name: string;
  className?: string;
  /** Icon-only (table rows). The tooltip and aria-label carry the text. */
  compact?: boolean;
}) {
  const marked = useIsCompetitor(kind, id);
  const noun = kind === "page" ? "page" : "domain";
  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    const now = toggleCompetitor(kind, id);
    if (now) toast.success(`Marked as competitor. ${name} now feeds My Feeds.`);
    else toast(`Removed ${name} from your competitors.`);
  };
  return (
    <Hint
      content={
        marked
          ? `Competitor. Its ads show in My Feeds. Click to remove.`
          : `Send this ${noun} to My Feeds. It changes where its data shows, not what shows.`
      }
    >
      <button
        type="button"
        aria-pressed={marked}
        aria-label={marked ? `${name} is marked as a competitor. Remove` : `Mark ${name} as competitor`}
        onClick={onClick}
        className={cn(
          BTN,
          marked
            ? "border-primary/40 bg-primary/15 text-primary-text hover:bg-primary/25"
            : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5",
          compact && "w-8 justify-center px-0",
          className,
        )}
      >
        {marked ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Star className="h-3.5 w-3.5" aria-hidden="true" />}
        {!compact && (marked ? "Competitor" : "Mark as competitor")}
      </button>
    </Hint>
  );
}

/** Pages only. Brand = Page, so following here is the same as following a brand. */
export function FollowButton({
  id,
  name,
  className,
  compact,
}: {
  id: string;
  name: string;
  className?: string;
  /** Icon-only (table rows). The tooltip and aria-label carry the text. */
  compact?: boolean;
}) {
  const following = useIsPageFollowed(id);
  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    const now = toggleFollowPage(id);
    if (now) toast.success(`Following ${name}. It's now part of your preferences and My Feeds.`);
    else toast(`Unfollowed ${name}.`);
  };
  return (
    <Hint content={following ? "Following. Click to unfollow." : "Follow this brand. Followed pages go into your preferences and My Feeds."}>
      <button
        type="button"
        aria-pressed={following}
        aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
        onClick={onClick}
        className={cn(
          BTN,
          following
            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
            : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5",
          compact && "w-8 justify-center px-0",
          className,
        )}
      >
        {following ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
        {!compact && (following ? "Following" : "Follow")}
      </button>
    </Hint>
  );
}

/** Save (with its board count) + Download for one savable item. */
export function SaveDownload({ target, scope }: { target: SavedItemRef; scope: Scope }) {
  const savedCount = useBoardCountForItem(target);
  return (
    <>
      <SaveButton target={target} savedCount={savedCount} variant="icon" />
      <DownloadButton
        variant="icon"
        ariaLabel={`Download this ${SAVABLE_LABEL[target.type].toLowerCase()}`}
        label={`Download ${SAVABLE_LABEL[target.type].toLowerCase()}`}
        build={() => buildDownloads(target, { scope, now: MODULE_NOW })}
      />
    </>
  );
}
