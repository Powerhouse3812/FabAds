import { useState } from "react";
import { Check, Download, Eye, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AD_TYPE_LABEL,
  formatAge,
  resolveEntityLabel,
  SOURCE_LABEL,
  type ConceptItem,
} from "./conceptItems";

/**
 * ConceptCard — §12 card grammar: preview · name · tags · usage count ·
 * last used · exactly 2 actions (Download, Use concept to generate).
 *
 * §12: "hovering reveals the full concept plus its actions." The full
 * concept (untruncated hook + visual direction) and the 2 actions are
 * reachable 3 ways, so the reveal isn't a keyboard/touch trap:
 *   - mouse hover  → CSS group-hover
 *   - keyboard focus → CSS group-focus-within (tab onto the reveal button)
 *   - tap (touch has no hover) → the reveal button's own onClick toggles
 *     a real `expanded` boolean, which the same overlay also honours
 *
 * The reveal button is always visible (not hover-only) specifically so it
 * has something to tab to / tap in the first place.
 */

export interface ConceptCardProps {
  item: ConceptItem;
  /** Real (batch-derived) usage boost — see ConceptsLibrary's
   *  useConceptUsage. Falls back to item.generationCount when absent. */
  usage?: { runs: number; lastUsedAt: Date | null };
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onDownload: (item: ConceptItem) => void;
  onUseToGenerate: (item: ConceptItem) => void;
}

export function ConceptCard({
  item,
  usage,
  selectMode = false,
  selected = false,
  onToggleSelect,
  onDownload,
  onUseToGenerate,
}: ConceptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const entityLabel = resolveEntityLabel(item);
  const runs = usage?.runs ?? item.generationCount;
  const lastUsedAt = usage?.lastUsedAt ?? null;
  const ageLabel = lastUsedAt
    ? `Last used ${formatAge(lastUsedAt)}`
    : `Added ${formatAge(item.capturedAt)}`;

  // The thumbnail is a toggle either way — which toggle depends on mode.
  // It's a <div role="button">, not a real <button>, specifically so the
  // always-visible reveal-trigger <button> below can live INSIDE it
  // without illegally nesting interactive elements.
  const handleThumbActivate = () => {
    if (selectMode) onToggleSelect?.();
    else setExpanded((v) => !v);
  };

  return (
    <article
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-xl border bg-card/60 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-primary/60 ring-1 ring-primary/40"
          : "border-border/40 hover:border-foreground/20",
      )}
    >
      {/* Aspect 4:3 — synced with Step 4 trending strip cards. */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleThumbActivate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleThumbActivate();
          }
        }}
        aria-pressed={selectMode ? selected : expanded}
        aria-label={
          selectMode
            ? `${selected ? "Deselect" : "Select"} ${item.name}`
            : `${expanded ? "Hide" : "View"} full concept — ${item.name}`
        }
        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-muted text-left"
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-6 w-6 text-muted-foreground/40" aria-hidden />
          </div>
        )}

        {/* Selection checkbox — top-left, only in select mode. */}
        {selectMode && (
          <span
            aria-hidden
            className={cn(
              "absolute left-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md border-2 backdrop-blur-sm transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/90 hover:border-primary/60",
            )}
          >
            <Check
              className={cn("h-3 w-3 transition-opacity", selected ? "opacity-100" : "opacity-0")}
              strokeWidth={3}
            />
          </span>
        )}

        {entityLabel && (
          <span className="absolute left-1.5 bottom-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
            {entityLabel}
          </span>
        )}
        <span
          className={cn(
            "absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider backdrop-blur",
            item.provenance === "seeded"
              ? "bg-background/90 text-muted-foreground"
              : "bg-primary/90 text-primary-foreground",
          )}
          title={
            item.provenance === "seeded"
              ? "FabFunnel-seeded — from the shared catalogue"
              : "Client-created — saved by you this session"
          }
        >
          {item.provenance === "seeded" ? "FabFunnel" : "Yours"}
        </span>

        {/* Always-visible reveal trigger, nested inside the (non-button)
            thumbnail div — a real <button>, so it's independently reachable
            by Tab and by tap, and its own click won't double-fire the
            thumbnail's toggle (stopPropagation below). This is what keeps
            the hover-reveal from being a keyboard/touch trap.
            Hidden in select mode — bulk selection is the point there, and
            hover/focus would otherwise reveal single-item actions (Download
            / Use THIS one) that read as noise mid-multi-select. */}
        {!selectMode && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Hide full concept" : "View full concept"}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="absolute bottom-1.5 right-1.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
          >
            <Eye className="h-3 w-3" aria-hidden />
          </button>
        )}
      </div>

      {/* Compact footer — always visible, truncated. */}
      <div className="flex flex-col gap-1 px-2 py-1.5">
        <p className="line-clamp-2 text-[11px] font-bold leading-tight text-foreground">
          {item.name}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-foreground">
            {AD_TYPE_LABEL[item.adType]}
          </span>
          {item.angle && (
            <span className="truncate rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-foreground">
              {item.angle}
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          {runs} run{runs === 1 ? "" : "s"} · {ageLabel}
        </p>
      </div>

      {/* Full-concept reveal overlay — hover (CSS), keyboard focus (CSS
          focus-within), or tap (the `expanded` state above). Exactly 2
          actions per §12: Download, Use concept to generate. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex flex-col justify-end gap-1.5 bg-background/97 p-2.5 opacity-0 backdrop-blur-sm transition-opacity duration-150",
          !selectMode && "group-hover:pointer-events-auto group-hover:opacity-100",
          !selectMode && "group-focus-within:pointer-events-auto group-focus-within:opacity-100",
          expanded && "pointer-events-auto opacity-100",
        )}
      >
        <p className="text-[11px] font-bold leading-snug text-foreground">{item.name}</p>
        {item.hook && (
          <p className="line-clamp-3 text-[10px] leading-relaxed text-foreground/80">
            {item.hook}
          </p>
        )}
        {item.visualDirection && (
          <p className="line-clamp-4 text-[10px] leading-relaxed text-muted-foreground">
            {item.visualDirection}
          </p>
        )}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {item.tone && (
            <span className="rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-foreground/80">
              {item.tone}
            </span>
          )}
          {item.formatRaw && (
            <span className="rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-foreground/80">
              {item.formatRaw}
            </span>
          )}
          <span className="rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-foreground/80">
            {SOURCE_LABEL[item.source]}
          </span>
        </div>

        <div className="flex gap-1.5 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(item);
            }}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-border/60 bg-background px-2 py-1.5 text-[10px] font-semibold text-foreground transition-colors hover:border-foreground/30"
          >
            <Download className="h-3 w-3" aria-hidden />
            Download
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUseToGenerate(item);
            }}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-primary px-2 py-1.5 text-[10px] font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Wand2 className="h-3 w-3" aria-hidden />
            Use to generate
          </button>
        </div>
      </div>
    </article>
  );
}
