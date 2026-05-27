import { Link } from "react-router-dom";
import {
  Building2,
  RefreshCw,
  Layers,
  Rocket,
  Bookmark,
  FolderPlus,
  Sparkles,
  MoreHorizontal,
  Edit3,
  Download,
  Save,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MODE_LABELS, type OutputData } from "../../types/output";

/**
 * TopActionRow — horizontal action row that sits at the top of the RIGHT
 * column inside the new Ad Detail drawer.
 *
 * Layout (67px tall, rounded-2xl bordered card):
 *  - LEFT (~36%): generation context — title + 2 tag chips (brand, product).
 *  - RIGHT (~64%): action buttons cluster — 3 labeled (Regenerate / Generate
 *    variants / Launch) + 3 icon-only (Save / Add to board / Magic wand) +
 *    kebab menu (Edit / Download / Save to library), with an optional
 *    trial-nudge eyebrow below when Launch is locked behind the Growth plan.
 *
 * Style discipline (Fabfunnel v1.2):
 *  - Geist Sans body, Geist Mono caps eyebrows, tabular-nums on numerics
 *  - bg-primary (no raw hex), rounded-2xl outer / rounded-full pills+icons
 *  - lucide-only iconography, no emojis
 */
interface TopActionRowProps {
  output: OutputData;
  /** Whether the user is on a plan where Launch is locked. Default true. */
  launchLocked?: boolean;
  /** Called on Regenerate action. */
  onRegenerate?: () => void;
  /** Called on Generate variants (alias: Forge 10 variants). */
  onGenerateVariants?: () => void;
  /** Called on Launch. When launchLocked, override to navigate to trial. */
  onLaunch?: () => void;
  /** Icon actions */
  onSave?: () => void;
  onAddToBoard?: () => void;
  onMagicWand?: () => void;
  /** Kebab actions */
  onEdit?: () => void;
  onDownload?: () => void;
  onSaveToLibrary?: () => void;
  className?: string;
}

/**
 * Convert a kebab/slug id ("college-student-ugc") into a label-cased
 * title ("College Student UGC"). Tokens that look fully upper-case
 * (e.g. "UGC", "DTC") are preserved.
 */
function labelCaseFromId(id: string): string {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((tok) => {
      if (tok.length > 1 && tok === tok.toUpperCase()) return tok;
      return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
    })
    .join(" ");
}

export function TopActionRow({
  output,
  launchLocked = true,
  onRegenerate,
  onGenerateVariants,
  onLaunch,
  onSave,
  onAddToBoard,
  onMagicWand,
  onEdit,
  onDownload,
  onSaveToLibrary,
  className,
}: TopActionRowProps) {
  const title = output.priorConfig?.conceptId
    ? labelCaseFromId(output.priorConfig.conceptId)
    : MODE_LABELS[output.mode];

  return (
    <section
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3",
        className,
      )}
    >
      {/* LEFT — gen context */}
      <div className="flex flex-col gap-1 shrink-0">
        <h3 className="font-medium text-[13px] leading-tight text-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {output.brand?.name && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/85">
              <Building2 className="h-2.5 w-2.5" />
              {output.brand.name}
            </span>
          )}
          {output.product?.name && (
            <span className="inline-flex items-center rounded-full bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/85">
              {output.product.name}
            </span>
          )}
        </div>
      </div>

      {/* RIGHT — actions cluster */}
      <div className="ml-auto flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-2">
          {/* Labeled buttons */}
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 h-7 text-[11px] hover:bg-muted/40 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Regenerate
          </button>
          <button
            type="button"
            onClick={onGenerateVariants}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 h-7 text-[11px] hover:bg-muted/40 transition-colors"
          >
            <Layers className="h-3 w-3" /> Generate variants
          </button>
          <button
            type="button"
            onClick={() => {
              if (launchLocked) return;
              onLaunch?.();
            }}
            disabled={launchLocked}
            aria-disabled={launchLocked || undefined}
            aria-label={launchLocked ? "Launch — requires Growth plan" : "Launch"}
            title={launchLocked ? "Launch needs Growth" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-[11px] font-semibold transition-colors",
              launchLocked
                ? "bg-primary/50 text-foreground cursor-not-allowed"
                : "bg-primary text-foreground hover:bg-primary/90",
            )}
          >
            <Rocket className="h-3 w-3" /> Launch
          </button>

          {/* Icon-only cluster */}
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <button
            type="button"
            onClick={onSave}
            className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-muted/40 transition-colors"
            aria-label="Save"
          >
            <Bookmark className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onAddToBoard}
            className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-muted/40 transition-colors"
            aria-label="Add to board"
          >
            <FolderPlus className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onMagicWand}
            className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-muted/40 transition-colors"
            aria-label="Magic edit"
          >
            <Sparkles className="h-3 w-3 text-muted-foreground" />
          </button>

          {/* Kebab menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-muted/40 transition-colors"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit ad
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownload}>
                <Download className="mr-2 h-3.5 w-3.5" /> Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSaveToLibrary}>
                <Save className="mr-2 h-3.5 w-3.5" /> Save to library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Locked-state trial nudge */}
        {launchLocked && (
          <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            <Lock className="h-2.5 w-2.5" />
            Launching to Meta needs Growth.
            <Link
              to="/plans-v2?tier=growth&view=trial"
              className="text-primary hover:underline"
            >
              14-day trial →
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
