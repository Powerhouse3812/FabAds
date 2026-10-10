/**
 * Small presentational parts shared by the Advertiser page and the three
 * overlays (advertiser, landing page, offer). Nothing here reads scope or data.
 */
import { useState, type ReactNode } from "react";
import { Copy, PanelTop } from "lucide-react";
import { toast } from "sonner";
import {
  SAVABLE_LABEL,
  type SavableType,
} from "@/lib/insights-v3/types";
import type { MixBlock, RankedItem } from "@/lib/insights-v3/selectors";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BasedOnNote,
  DisabledSection,
  EmptyState,
  Hint,
  TruncatedText,
  fmtInt,
  savedRefToDetailTarget,
  useAdDrawer,
  useDetailStack,
} from "../shared";
import { TYPE_ICON } from "../shared/typeMeta";

/* ── avatar ─────────────────────────────────────────────────────────────── */

function initials(name: string): string {
  const parts = name.replace(/\.[a-z]{2,}$/i, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Image with an initials fallback (the dummy image host may be offline). */
export function AdvertiserAvatar({
  name,
  url,
  className,
}: {
  name: string;
  url: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("h-8 w-8 border border-border bg-muted", className)}>
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary-text">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

/* ── mix chips (element chip + lime count pill) ─────────────────────────── */

/**
 * Clickable chip for one counted item: icon, label, lime count pill, share.
 * Same open behaviour as the kit's ElementChip (push onto the detail stack),
 * with the lime count pill the live competitor overlay uses for hooks/keywords.
 */
export function MixChip({
  type,
  item,
  interactive = true,
}: {
  type: SavableType | null;
  item: RankedItem;
  /** false → plain chip (keywords have no overlay). */
  interactive?: boolean;
}) {
  const detail = useDetailStack();
  const drawer = useAdDrawer();
  const Icon = type ? TYPE_ICON[type] : null;
  const tip = `${item.label} · ${fmtInt(item.count)} ${item.count === 1 ? "ad" : "ads"} (${item.sharePct}% of ads analysed)`;
  const body = (
    <>
      {Icon && <Icon className="h-3 w-3 shrink-0 text-primary-text" aria-hidden="true" />}
      <span className="min-w-0 max-w-[200px] truncate">{item.label}</span>
      <span className="inline-flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-full bg-primary/15 px-1.5 font-mono text-[11px] tabular-nums text-primary-text">
        {fmtInt(item.count)}
      </span>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{item.sharePct}%</span>
    </>
  );
  const base =
    "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-border bg-card pl-2 pr-1.5 text-xs text-foreground";
  if (!interactive || !type) {
    return (
      <Hint content={tip}>
        <span tabIndex={0} className={cn(base, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
          {body}
        </span>
      </Hint>
    );
  }
  return (
    <Hint content={tip}>
      <button
        type="button"
        aria-label={`${SAVABLE_LABEL[type]}: ${tip}. Open details`}
        onClick={(e) => {
          e.stopPropagation();
          const t = savedRefToDetailTarget({ type, id: item.id });
          if (t.kind === "ad") drawer.open(t.id);
          else detail.push(t);
        }}
        className={cn(
          base,
          "transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {body}
      </button>
    </Hint>
  );
}

/** A titled group of MixChips with its own "Based on" note; disabled when empty. */
export function MixGroup({
  title,
  type,
  mix,
  emptyReason,
  interactive = true,
  note,
}: {
  title: string;
  type: SavableType | null;
  mix: MixBlock;
  emptyReason: string;
  interactive?: boolean;
  note?: ReactNode;
}) {
  if (mix.items.length === 0) {
    return <DisabledSection title={title} reason={emptyReason} minHeight={96} />;
  }
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background/60 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
        <BasedOnNote ads={mix.basedOn} />
      </div>
      {note && <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>}
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={title}>
        {mix.items.map((it) => (
          <li key={it.id} className="max-w-full">
            <MixChip type={type} item={it} interactive={interactive} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars (CTA mix, funnel mix). Unit label always visible, tooltip per row. */
export function MixBars({
  title,
  unit,
  mix,
  emptyReason,
}: {
  title: string;
  /** What a bar measures, e.g. "share of ads with a CTA button". */
  unit: string;
  mix: MixBlock;
  emptyReason: string;
}) {
  if (mix.items.length === 0) {
    return <DisabledSection title={title} reason={emptyReason} minHeight={96} />;
  }
  const max = Math.max(1, ...mix.items.map((i) => i.sharePct));
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background/60 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
        <BasedOnNote ads={mix.basedOn} />
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Unit: <span className="font-medium text-foreground">{unit}</span>
      </p>
      <ul className="mt-2 space-y-2" aria-label={title}>
        {mix.items.map((it) => (
          <li key={it.id}>
            <Hint content={`${it.label}: ${fmtInt(it.count)} ${it.count === 1 ? "ad" : "ads"} (${it.sharePct}%)`}>
              <div tabIndex={0} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <TruncatedText text={it.label} className="text-foreground" focusable={false} />
                  <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                    {it.sharePct}% · {fmtInt(it.count)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary/15">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (it.sharePct / max) * 100)}%` }} />
                </div>
              </div>
            </Hint>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── copy value ─────────────────────────────────────────────────────────── */

/** Text + a copy button. Falls back to a toast error when the clipboard is blocked. */
export function CopyValue({ value, label }: { value: string; label: string }) {
  const [tip, setTip] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      <TooltipProvider delayDuration={200}>
        <Tooltip open={tip} onOpenChange={setTip}>
          <TooltipTrigger asChild>
            <span className="min-w-0 truncate font-mono text-xs text-foreground" tabIndex={0}>
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[360px] break-all text-xs">{value}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Hint content={`Copy ${label.toLowerCase()}`}>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Copy className="h-3 w-3" aria-hidden="true" />
        </button>
      </Hint>
    </span>
  );
}

/* ── unknown / out of scope ─────────────────────────────────────────────── */

export function OverlayEmpty({
  title,
  body,
  onClose,
  extra,
}: {
  title: string;
  body: string;
  onClose: () => void;
  extra?: ReactNode;
}) {
  return (
    <EmptyState
      title={title}
      body={body}
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          {extra}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Close
          </button>
        </div>
      }
    />
  );
}

/* ── landing-page thumbnail ─────────────────────────────────────────────── */

/** Screenshot thumbnail, or a labelled placeholder when there is none (or it fails to load). */
export function LpThumb({
  url,
  className,
  title,
}: {
  url: string | null;
  className?: string;
  title?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <Hint content="No screenshot was captured for this landing page.">
        <span
          tabIndex={0}
          role="img"
          aria-label="No screenshot captured"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <PanelTop className="h-4 w-4" aria-hidden="true" />
        </span>
      </Hint>
    );
  }
  return (
    <img
      src={url}
      alt={title ? `Screenshot of ${title}` : "Landing page screenshot"}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-md border border-border bg-muted object-cover object-top", className)}
    />
  );
}
