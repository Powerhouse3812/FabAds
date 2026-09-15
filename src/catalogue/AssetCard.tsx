import type { LucideIcon } from "lucide-react";
import { Bookmark, MoreVertical, Wand2, Lock, Copy, Download, Pencil, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { AssetCardData } from "./assetTypes";
import { ProvenanceBadge } from "./CatalogueShared";
import { primaryActionFor } from "./assetActions";

/**
 * §21.2 asset-card grammar — "one for all types": preview · name · tags ·
 * usage count (`13 runs`) · last used · actions (bookmark / use /
 * duplicate / download / delete). Built ONCE here; every asset type in
 * `CatalogueListPage.tsx` renders through this same component.
 *
 * §9 "Catalogue actions add Archive" and Edit fold into the same overflow
 * menu alongside duplicate/download/delete, so the five-verb grammar from
 * §21.2 and the four-verb list from §9 land in one consistent menu rather
 * than two competing action sets.
 */
export interface AssetCardActions {
  onOpen: () => void;
  onToggleSelect?: () => void;
  onToggleBookmark?: () => void;
  onUseInGenie?: () => void;
  onDuplicate?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

interface AssetCardProps extends AssetCardActions {
  card: AssetCardData;
  icon: LucideIcon;
  bookmarked?: boolean;
  selected?: boolean;
  selectable?: boolean;
  archived?: boolean;
  className?: string;
}

export function AssetCard({
  card,
  icon: Icon,
  bookmarked = false,
  selected = false,
  selectable = false,
  archived = false,
  onOpen,
  onToggleSelect,
  onToggleBookmark,
  onUseInGenie,
  onDuplicate,
  onDownload,
  onEdit,
  onArchive,
  onDelete,
  className,
}: AssetCardProps) {
  // Owner spec (2026-09-14, assetActions.ts): kept types each carry one named
  // headline action, shipped DISABLED — visible and labelled, not wired yet
  // (the real Genie hand-off for these types doesn't exist). `undefined` here
  // means the type keeps the existing live "Use in Genie" hand-off below
  // (Brands / Products / Categories today) — that must not regress.
  const primaryAction = primaryActionFor(card.type);

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border border-border bg-background p-3 text-left transition-all",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        selected && "border-primary ring-1 ring-primary",
        archived && "opacity-60",
        className,
      )}
    >
      {selectable && (
        /* The Radix Checkbox IS the control — no wrapper.
         *
         * This was a <span role="button" tabIndex={0}> wrapping <Checkbox>,
         * which itself renders <button role="checkbox">. Two nested
         * interactive roles, both focusable: invalid ARIA, undefined tab
         * order, and a screen reader announcing "Select, button" with a
         * checkbox inside it. The wrapper existed to dodge a
         * button-inside-button warning — but the Checkbox never needed
         * wrapping, it needed sizing.
         *
         * Also sized up: the old target was a 14px checkbox in a 20px box,
         * under the 24×24 minimum, and it is the ONLY bulk-select control on
         * these lists. And the name is the asset's, not a bare "Select" —
         * nine identical "Select" buttons tell a screen-reader user nothing
         * about which row they're on.
         */
        <Checkbox
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() => onToggleSelect?.()}
          aria-label={selected ? `Deselect ${card.name}` : `Select ${card.name}`}
          className="absolute left-2 top-2 z-10 h-6 w-6 rounded-md border-border bg-background/90 backdrop-blur-sm"
        />
      )}

      {onToggleBookmark && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark();
          }}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          className={cn(
            "absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background/90 backdrop-blur-sm transition-colors",
            bookmarked ? "border-primary/40 text-primary-text" : "border-border text-muted-foreground/60 hover:text-foreground",
          )}
        >
          <Bookmark className="h-3 w-3" fill={bookmarked ? "currentColor" : "none"} />
        </button>
      )}

      <button type="button" onClick={onOpen} className="flex flex-col gap-2.5 text-left">
        {/* Preview */}
        <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
          {card.thumbnail ? (
            <img src={card.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Name + subtitle */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{card.name}</p>
          {card.subtitle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{card.subtitle}</p>
          )}
        </div>

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted-foreground/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </button>

      {/* Usage + last used + provenance */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground tabular-nums">
          <span>{card.usageCount} runs</span>
          <span aria-hidden>·</span>
          <span>{card.lastUsedLabel}</span>
        </div>
        <ProvenanceBadge provenance={card.provenance} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-1.5">
        {primaryAction ? (
          // Coming-soon control, NOT a bare grey disabled button. Matches the
          // Lock-icon + "Soon" grammar from
          // src/genie6/studio-v4/screens/StudioHome.tsx (SOON_SURFACE /
          // SOON_BADGE / aria-disabled) so this reads as *coming*, not
          // *broken* — same border/bg/text tokens, re-typed here rather than
          // importing StudioHome's module-local constants across the
          // catalogue/genie6 boundary.
          //
          // A plain <span> with no onClick/tabIndex: inert by construction —
          // not clickable, not a tab stop — plus aria-disabled for AT that
          // still walks it. `title` surfaces the hint on hover/long-press.
          //
          // Narrow-card decision: the grid's `grid-cols-2` base is below the
          // 768px mobile gate for this route (mobileRoutePolicy fails closed
          // on unlisted /iq/genie6/assets/* paths), so grid-cols-3 @768px is
          // the narrowest column reachable in practice — measured there at
          // ~49px of label room next to the fixed 28px overflow trigger. A
          // second "Soon" chip does not fit in that budget, so the label
          // (the named action itself, e.g. "Generate Ad") wins the space over
          // the redundant word "Soon" — the Lock icon + muted surface already
          // say "not live", and `title` carries the hint text. `min-w-0` +
          // `truncate` degrade the label to a single-line ellipsis rather
          // than wrapping or silently clipping; verified in-browser at 768px
          // that "Generate Ad" truncates to "Generat…" while "Use hook"
          // fits close to whole — the icon and overflow trigger never shrink
          // or disappear. Label kept at `text-foreground` (full contrast)
          // rather than dimmed — same choice AssetDetailActions.tsx makes for
          // the same reason: "disabled" reads via the icon + muted surface,
          // never by greying the words below AA.
          <span
            role="button"
            aria-disabled="true"
            title={`${primaryAction.label} — ${primaryAction.hint}`}
            className="inline-flex min-w-0 items-center gap-1 rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 cursor-not-allowed"
          >
            <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate text-[11px] font-semibold text-foreground">{primaryAction.label}</span>
          </span>
        ) : onUseInGenie ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUseInGenie();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <Wand2 className="h-3 w-3" />
            Use in Genie
          </button>
        ) : (
          <span />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="More actions"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
            )}
            {onDownload && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="mr-2 h-3.5 w-3.5" /> Download
              </DropdownMenuItem>
            )}
            {onArchive && (
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="mr-2 h-3.5 w-3.5" /> {archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
