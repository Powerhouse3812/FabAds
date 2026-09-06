import { useState } from "react";
import {
  Bookmark,
  Copy,
  Download,
  ExternalLink,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Provenance } from "@/genie6/lib/genieRunTypes";

/**
 * AssetCard — the ONE asset-card grammar (§21.2): preview · name · tags ·
 * usage count · last used · actions (bookmark / use / duplicate / download /
 * delete). Genie Brain uses this for Frameworks / Winner Ads / References /
 * Instructions — asset types §9 puts in Catalogue too.
 *
 * There is no shared asset-card component in `src/catalogue/` yet as of this
 * writing (checked before building this — see the Brain agent's final
 * report). If Catalogue lands one before this ships, prefer importing THAT
 * one instead of this file to avoid the grammar existing twice; until then
 * this is a faithful, standalone implementation of the same spec so Genie
 * Brain isn't blocked on another agent's file.
 *
 * Genuinely destructive/editing actions (duplicate, delete) on FabFunnel
 * seed data can't safely mutate the shared module-level mock arrays every
 * other surface reads from — doing so would be a global side effect, not a
 * local one. So those two actions are honest here: they confirm, then say
 * where the real action lives (Catalogue), rather than silently no-op-ing or
 * quietly corrupting shared fixture data. Bookmark and Use are fully local
 * and functional.
 */
export interface AssetCardProps {
  preview?: { kind: "image"; src: string } | { kind: "icon"; icon: LucideIcon };
  name: string;
  tags?: string[];
  /** e.g. "13 runs" or "3 concepts sourced" — omit for asset types with no run concept. */
  usageLabel?: string;
  /** e.g. "Added 12 Apr 2026" — the grammar's "last used" slot, flexed to
   *  "last updated/added" for asset types that aren't run repeatedly. */
  lastUsedLabel?: string;
  provenance?: Provenance;
  onUse?: () => void;
  className?: string;
}

export function AssetCard({ preview, name, tags, usageLabel, lastUsedLabel, provenance, onUse, className }: AssetCardProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const isSeeded = (provenance ?? "fabfunnel-seeded") === "fabfunnel-seeded";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
        {preview?.kind === "image" ? (
          <img src={preview.src} alt="" className="h-full w-full object-cover" />
        ) : preview?.kind === "icon" ? (
          <preview.icon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="text-sm font-bold text-muted-foreground/60">{name[0]}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground" title={name}>
            {name}
          </p>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.05em]",
              isSeeded ? "border-border bg-muted text-muted-foreground" : "border-primary/30 bg-primary/10 text-primary",
            )}
          >
            {isSeeded ? "FabFunnel" : "Yours"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {(tags ?? []).slice(0, 3).map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
        {usageLabel && <span className="tabular-nums">{usageLabel}</span>}
        {lastUsedLabel && <span className="tabular-nums">{lastUsedLabel}</span>}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconAction
          label={bookmarked ? "Remove bookmark" : "Bookmark"}
          active={bookmarked}
          onClick={() => {
            setBookmarked((b) => !b);
            toast(bookmarked ? "Bookmark removed" : "Bookmarked");
          }}
        >
          <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-current")} />
        </IconAction>
        <IconAction
          label="Use in Genie"
          onClick={() => {
            onUse?.();
            toast(`${name} sent to Studio as reference`);
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </IconAction>
        <IconAction
          label="Duplicate"
          onClick={() => toast.info("Duplicate this in Catalogue — Brain is a read view.")}
        >
          <Copy className="h-3.5 w-3.5" />
        </IconAction>
        {preview?.kind === "image" && (
          <IconAction label="Open" onClick={() => window.open(preview.src, "_blank", "noopener")}>
            <Download className="h-3.5 w-3.5" />
          </IconAction>
        )}
        <IconAction
          label="Delete"
          destructive
          onClick={() => toast.info("Delete this in Catalogue — Brain is a read view.")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconAction>
      </div>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
  active,
  destructive,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-primary/10 text-primary",
        destructive && "hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}
