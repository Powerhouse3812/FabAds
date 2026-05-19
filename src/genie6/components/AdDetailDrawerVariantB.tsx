import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Bookmark,
  Download,
  Edit3,
  FolderPlus,
  Layers,
  Play,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { angles } from "@/mocks/shared/angles";
import type { OutputData } from "../types/output";
import { MODE_LABELS } from "../types/output";
import { cn } from "@/lib/utils";
import { VariantTogglePill } from "./AdDetailDrawerVariantA";

interface Props {
  output: OutputData;
  open: boolean;
  onClose: () => void;
  onSwitchVariant: () => void;
}

/**
 * AdDetailDrawerVariantB — Workflow-first.
 *
 * Layout:
 *   shadcn <Sheet side="right" sm:max-w-[680px]>
 *   Vertical stack (no 2-col split):
 *     1. Top — Config Snapshot card (lime-tinted bg; clickable rows that
 *        deep-link to source entities)
 *     2. Middle — Compact ad preview (280px max, 4:5 thumbnail + headline +
 *        cta) — secondary to the config
 *     3. Bottom — Vertical action stack (Launch primary lime, then Forge,
 *        Edit, Regenerate, Add to folder, Save, Download)
 *
 * Mental model: A = "show me this ad" (creative-led).
 *               B = "let me act on this ad and see what made it" (config-led).
 */
export function AdDetailDrawerVariantB({
  output,
  open,
  onClose,
  onSwitchVariant,
}: Props) {
  const angle = useMemo(
    () => angles.find((a) => a.id === output.angleId),
    [output.angleId],
  );
  const created =
    output.generatedAt instanceof Date
      ? output.generatedAt
      : new Date(output.generatedAt);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-[680px] overflow-hidden flex flex-col"
      >
        <SheetHeader className="border-b border-border px-5 py-3 flex flex-row items-center justify-between gap-3 space-y-0">
          <SheetTitle className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Ad detail · {output.id}
          </SheetTitle>
          <VariantTogglePill active="b" onSwitch={onSwitchVariant} />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1 · Config snapshot — the hero of Variant B */}
          <section className="rounded-2xl border border-primary/30 bg-[#FEFFF0] p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <span aria-hidden className="h-3 w-[2px] rounded-full bg-primary" />
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground">
                Config snapshot
              </h3>
            </div>
            <dl className="space-y-1.5">
              <ConfigRow label="Mode" value={MODE_LABELS[output.mode]} />
              <ConfigRow label="Angle" value={angle?.label ?? "—"} />
              <ConfigRow label="Brand" value={output.brand?.name ?? "—"} />
              {output.product?.name && (
                <ConfigRow label="Product" value={output.product.name} />
              )}
              {output.priorConfig?.conceptId && (
                <ConfigRow label="Concept" value={output.priorConfig.conceptId} mono />
              )}
              {output.priorConfig?.hookId && (
                <ConfigRow label="Hook" value={output.priorConfig.hookId} mono />
              )}
              {output.priorConfig?.generatedFromTemplate && (
                <ConfigRow
                  label="Template"
                  value={output.priorConfig.generatedFromTemplate}
                />
              )}
              <ConfigRow
                label="Created"
                value={created.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              {output.qualityScore !== undefined && (
                <ConfigRow
                  label="Quality"
                  value={String(output.qualityScore)}
                  accent={output.qualityScore >= 80}
                />
              )}
            </dl>
            {output.priorConfig?.promptSnippet && (
              <p className="mt-3 rounded-md bg-background/60 px-3 py-2 text-[12px] text-muted-foreground italic">
                "{output.priorConfig.promptSnippet}"
              </p>
            )}
          </section>

          {/* 2 · Compact ad preview — secondary */}
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Generation preview
            </h3>
            <div className="mx-auto max-w-[280px] overflow-hidden rounded-xl border border-border bg-card">
              <div
                className={cn(
                  "relative bg-muted",
                  output.mediaType === "video" ? "aspect-[9/16]" : "aspect-[4/5]",
                )}
              >
                {output.thumbnail ? (
                  <img
                    src={output.thumbnail}
                    alt={output.headline ?? "Generation preview"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      No preview
                    </span>
                  </div>
                )}
                {output.mediaType === "video" && output.thumbnail && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-background/80 p-1.5 backdrop-blur-sm">
                      <Play className="h-3.5 w-3.5 fill-foreground text-foreground" />
                    </span>
                  </span>
                )}
              </div>
              <div className="space-y-1 p-3">
                {output.headline && (
                  <p className="text-[12.5px] font-semibold leading-snug text-foreground line-clamp-2">
                    {output.headline}
                  </p>
                )}
                {output.body && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {output.body}
                  </p>
                )}
                {output.cta && (
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {output.cta}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* 3 · Action stack */}
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Actions
            </h3>
            <div className="space-y-2">
              <ActionRow Icon={Rocket} label="Launch this ad" primary />
              <ActionRow Icon={Layers} label="Forge 10 variations" />
              <ActionRow Icon={Edit3} label="Edit & regenerate" />
              <ActionRow Icon={RefreshCw} label="Regenerate with same config" />
              <ActionRow Icon={FolderPlus} label="Add to folder" />
              <ActionRow Icon={Bookmark} label="Save to favorites" />
              <ActionRow Icon={Download} label="Download media" />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ConfigRow({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3 text-[12px]">
      <dt className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 flex-1 leading-tight",
          mono && "font-mono text-[11px]",
          accent ? "font-semibold text-primary" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ActionRow({
  Icon,
  label,
  primary,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[13px] font-medium transition-colors",
        primary
          ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border bg-card text-foreground hover:bg-muted/40",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
