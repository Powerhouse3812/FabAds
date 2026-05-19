import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bookmark,
  Download,
  Edit3,
  Layers,
  Play,
  RefreshCw,
  Rocket,
  Sparkles,
} from "lucide-react";
import { angles } from "@/mocks/shared/angles";
import { sampleOutputs } from "../mocks/sample-outputs";
import type { OutputData } from "../types/output";
import { MODE_LABELS } from "../types/output";
import { cn } from "@/lib/utils";

interface Props {
  output: OutputData;
  open: boolean;
  onClose: () => void;
  onSwitchVariant: () => void;
}

/**
 * AdDetailDrawerVariantA — Industry-Insights-style reference clone.
 *
 * Layout (matches `InsightAdDetailDrawer.tsx`):
 *   shadcn <Sheet side="right" sm:max-w-[1280px]>
 *   2-col grid: 36% creative left | 64% meta+actions right
 *
 * Left col  — brand header → headline → primary text → media (4:5 / 9:16 with
 *             play overlay for video) → CTA chip → secondary description
 * Right col — action row (Launch / Forge / Edit / Regenerate / Save / Download)
 *           → Generated-config StatCell grid
 *           → "Related from same angle" mini grid (up to 6)
 *
 * Why this exists: Variant A's mental model is "show me this ad in full
 * visual detail" — the creative dominates the left column with all the
 * stats and actions clustered on the right.
 */
export function AdDetailDrawerVariantA({
  output,
  open,
  onClose,
  onSwitchVariant,
}: Props) {
  const angle = useMemo(
    () => angles.find((a) => a.id === output.angleId),
    [output.angleId],
  );

  const related = useMemo(() => {
    if (!output.angleId) return [];
    return sampleOutputs
      .filter((o) => o.id !== output.id && o.angleId === output.angleId)
      .slice(0, 6);
  }, [output.id, output.angleId]);

  const created = output.generatedAt instanceof Date ? output.generatedAt : new Date(output.generatedAt);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-[1280px] overflow-hidden flex flex-col"
      >
        <SheetHeader className="border-b border-border px-5 py-3 flex flex-row items-center justify-between gap-3 space-y-0">
          <SheetTitle className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Ad detail · {output.id}
          </SheetTitle>
          <VariantTogglePill active="a" onSwitch={onSwitchVariant} />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-5 p-5 lg:grid-cols-[36%_1fr]">
            {/* LEFT — Creative */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-0 lg:self-start">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                  {output.brand?.name?.slice(0, 1) ?? "—"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">
                    {output.brand?.name ?? "Unattributed"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {output.product?.name ?? MODE_LABELS[output.mode]}
                  </p>
                </div>
              </div>

              {output.headline && (
                <h2 className="text-[15px] font-semibold leading-snug text-foreground">
                  {output.headline}
                </h2>
              )}
              {output.body && (
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {output.body}
                </p>
              )}

              {/* Media */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl bg-muted",
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
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      No preview
                    </span>
                  </div>
                )}
                {output.mediaType === "video" && output.thumbnail && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-background/80 p-2 backdrop-blur-sm">
                      <Play className="h-5 w-5 fill-foreground text-foreground" />
                    </span>
                  </span>
                )}
              </div>

              {output.cta && (
                <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
                  {output.cta}
                </span>
              )}
            </div>

            {/* RIGHT — Meta + Actions */}
            <div className="space-y-5">
              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" className="gap-1.5">
                  <Rocket className="h-3.5 w-3.5" />
                  Launch
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Forge 10
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>

              <Separator />

              {/* Generated config */}
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Generated config
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  <StatCell label="Mode" value={MODE_LABELS[output.mode]} />
                  <StatCell label="Angle" value={angle?.label ?? "—"} />
                  <StatCell label="Brand" value={output.brand?.name ?? "—"} />
                  <StatCell label="Product" value={output.product?.name ?? "—"} />
                  <StatCell
                    label="Quality"
                    value={
                      output.qualityScore !== undefined
                        ? String(output.qualityScore)
                        : "—"
                    }
                    accent={(output.qualityScore ?? 0) >= 80}
                  />
                  <StatCell
                    label="Created"
                    value={created.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                  {output.priorConfig?.conceptId && (
                    <StatCell label="Concept" value={output.priorConfig.conceptId} mono />
                  )}
                  {output.priorConfig?.hookId && (
                    <StatCell label="Hook" value={output.priorConfig.hookId} mono />
                  )}
                  {output.priorConfig?.generatedFromTemplate && (
                    <StatCell
                      label="From template"
                      value={output.priorConfig.generatedFromTemplate}
                    />
                  )}
                </dl>
                {output.priorConfig?.promptSnippet && (
                  <p className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground italic line-clamp-3">
                    "{output.priorConfig.promptSnippet}"
                  </p>
                )}
              </section>

              {/* Related from same angle */}
              {related.length > 0 && (
                <section>
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Related from same angle
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {related.map((r) => (
                      <a
                        key={r.id}
                        href={`?ad=${encodeURIComponent(r.id)}`}
                        className="group relative aspect-[4/5] overflow-hidden rounded-md bg-muted"
                      >
                        {r.thumbnail ? (
                          <img
                            src={r.thumbnail}
                            alt={r.headline ?? "Related output"}
                            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="font-mono text-[9px] uppercase text-muted-foreground">
                              No preview
                            </span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Shared between Variant A + B ─────────────────────────────────────── */

export function StatCell({
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
    <div>
      <dt className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </dt>
      <dd
        className={cn(
          "text-[12.5px] leading-tight",
          mono && "font-mono",
          accent ? "text-primary font-semibold" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function VariantTogglePill({
  active,
  onSwitch,
}: {
  active: "a" | "b";
  onSwitch: () => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Drawer variant"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
    >
      <button
        type="button"
        onClick={active === "a" ? undefined : onSwitch}
        aria-pressed={active === "a"}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
          active === "a"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        A · Reference
      </button>
      <button
        type="button"
        onClick={active === "b" ? undefined : onSwitch}
        aria-pressed={active === "b"}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
          active === "b"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        B · Workflow
      </button>
    </div>
  );
}
