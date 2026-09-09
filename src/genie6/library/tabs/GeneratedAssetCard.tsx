import { Check, Copy, RefreshCw, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "../relativeTime";

/**
 * GeneratedAssetCard — shared card grammar for the Library's Scripts /
 * Concepts / Storyboards tabs (§21.2 "one asset-card grammar", adapted for
 * read-mostly DRAFT items rather than already-catalogued ones).
 *
 * NOT used by the Hooks tab: this card truncates its title to one line,
 * which is right when the title is a document NAME and destructive when the
 * title IS the content. See `HooksGeneratedTab.tsx` for that card and why it
 * also drops the "Free" pill below.
 *
 * Neither existing asset-card implementation fit as-is: `catalogue/
 * AssetCard.tsx` is a CRUD grid card (edit/duplicate/archive/delete —
 * actions that don't make sense for a draft that isn't in the Catalogue
 * yet) built on plain shadcn tokens; `genie6/brain/AssetCard.tsx` is
 * read-mostly but its one action slot is hardcoded to "Use in Genie" and
 * it also renders on plain shadcn tokens, not the `g6-*` tokens every
 * other file in this directory (BatchGroupHeader, GeneratedOutputsTab,
 * EmptyState) uses. Rebuilding on `g6-*` tokens keeps the Library visually
 * one surface; the grammar itself — preview · name · tags · meta ·
 * provenance · one primary action — is carried over from both.
 *
 * Provenance row deliberately mirrors `BatchGroupHeader`'s pill/mono
 * vocabulary (batch id pill with copy, module chip, Created By, relative
 * time) so a Script/Concept/Storyboard draft reads as "the same kind of
 * fact" as an ad's batch header, just sized for a card footer instead of a
 * full-width header. The same row also carries a "Free" pill — the owner's
 * call: asset generation (Script / Concept / Storyboard) doesn't cost
 * credits, and a free thing should say so rather than showing no cost at
 * all, which reads as an oversight next to `BatchGroupHeader`'s
 * `creditsLabel()` on every ad batch.
 */
export interface GeneratedAssetCardProps {
  icon: ReactNode;
  thumbnail?: string;
  title: string;
  subtitle?: string;
  bodyPreview?: string;
  tags: string[];
  batchId: string;
  batchLabel: string;
  module: string;
  createdBy: string;
  generatedAt: Date;
  status: "done" | "failed";
  /** True when this item's batch also contains at least one failed item —
   *  the batch-level "Partial" signal (same vocabulary as `BatchStatus`). */
  batchIsPartial: boolean;
  /** Present once this draft has been saved — id in the real Assets registry. */
  savedCatalogueId?: string;
  catalogueType: "scripts" | "concepts" | "storyboards";
  onSave?: () => void;
}

export function GeneratedAssetCard({
  icon,
  thumbnail,
  title,
  subtitle,
  bodyPreview,
  tags,
  batchId,
  batchLabel,
  module,
  createdBy,
  generatedAt,
  status,
  batchIsPartial,
  savedCatalogueId,
  catalogueType,
  onSave,
}: GeneratedAssetCardProps) {
  const [copied, setCopied] = useState(false);

  const copyBatchId = async () => {
    try {
      await navigator.clipboard.writeText(batchId);
      setCopied(true);
      toast.success("Batch ID copied");
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard API can fail in insecure contexts — non-fatal.
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-g6-border hover:shadow-g6-sm",
        status === "failed" && "opacity-80",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-g6-lg bg-g6-bg-spotlight text-g6-text-secondary">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            icon
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-g6-sans text-g6-base font-semibold text-g6-text" title={title}>
            {title}
          </h3>
          {subtitle && (
            <p className="truncate font-g6-mono text-g6-xs text-g6-text-tertiary">{subtitle}</p>
          )}
        </div>
      </div>

      {bodyPreview && (
        <p className="line-clamp-2 font-g6-sans text-g6-sm text-g6-text-secondary">{bodyPreview}</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-g6-pill bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-g6-text-tertiary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Provenance row — batch id · module · created by · relative time,
          same vocabulary BatchGroupHeader / HowThisWasMade use. */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-g6-border-secondary pt-3">
        <button
          type="button"
          onClick={copyBatchId}
          title="Copy Batch ID"
          className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[10px] font-bold uppercase tracking-[0.06em] text-g6-text transition-colors hover:border-g6-border"
        >
          {batchId}
          {copied ? <Check className="h-2.5 w-2.5 text-success-text" /> : <Copy className="h-2.5 w-2.5 text-g6-text-secondary" />}
        </button>
        {/* Asset generation (Script / Concept / Storyboard) is free — stated
            plainly, same slot an ad batch uses for `creditsLabel()`, rather
            than leaving the cost line blank next to a paid ad's batch. */}
        <span className="inline-flex items-center rounded-g6-pill border border-g6-success/30 bg-g6-success/10 px-2 py-0.5 font-g6-mono text-[10px] font-bold uppercase tracking-[0.06em] text-success-text">
          Free
        </span>
        {batchIsPartial && (
          <span className="inline-flex items-center rounded-g6-pill border border-g6-warning/30 bg-g6-warning/10 px-2 py-0.5 font-g6-mono text-[10px] font-bold uppercase tracking-[0.06em] text-warning-text">
            Partial batch
          </span>
        )}
        <span className="inline-flex items-center rounded-g6-pill bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[10px] uppercase tracking-[0.05em] text-g6-text-secondary">
          {module}
        </span>
        <span className="inline-flex items-center gap-1 font-g6-mono text-[10px] text-g6-text-secondary">
          <User className="h-2.5 w-2.5" /> {createdBy}
        </span>
        <span className="font-g6-mono text-[10px] text-g6-text-tertiary">{formatRelativeTime(generatedAt)}</span>
      </div>
      <p className="-mt-1 truncate font-g6-mono text-[10px] text-g6-text-tertiary" title={batchLabel}>
        {batchLabel}
      </p>

      {/* Primary action */}
      {status === "failed" ? (
        <div className="flex items-center justify-between rounded-g6-lg border border-g6-error/30 bg-g6-error/10 px-3 py-2">
          <span className="font-g6-mono text-[11px] text-error-text">Generation failed</span>
          <button
            type="button"
            onClick={() => toast("Retrying — this is a demo, no credits charged")}
            className="inline-flex items-center gap-1 font-g6-sans text-g6-xs font-semibold text-g6-text transition-colors hover:text-g6-primary"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      ) : savedCatalogueId ? (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 font-g6-sans text-g6-xs font-semibold text-success-text">
            <Check className="h-3.5 w-3.5" /> Saved to Assets
          </span>
          <Link
            to={`/iq/genie6/assets/${catalogueType}/${savedCatalogueId}`}
            className="font-g6-mono text-[11px] text-primary-text underline-offset-2 hover:underline"
          >
            View in Assets
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-8 items-center justify-center rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-xs font-semibold text-g6-text-on-accent transition-transform hover:-translate-y-0.5"
        >
          Save to Assets
        </button>
      )}
    </div>
  );
}
