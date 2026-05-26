import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Bookmark,
  Download,
  Edit3,
  Layers,
  MoreHorizontal,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { angles } from "@/mocks/shared/angles";
import { sampleOutputs } from "../mocks/sample-outputs";
import type { OutputData } from "../types/output";
import { MODE_LABELS } from "../types/output";
import { cn } from "@/lib/utils";

// Agent 1 components — landing in parallel. Type contract documented inline.
// QualityRing is consumed inside AiVerdictCells' "strip" layout, so it is
// not imported here directly.
import { AiVerdictCells } from "./ad-detail/AiVerdictCells";
import { CompareBars } from "./ad-detail/CompareBars";
import { CoachRow } from "./ad-detail/CoachRow";
import { ProvenanceLineageTree } from "./ad-detail/ProvenanceLineageTree";

import { StatCell, VariantTogglePill } from "./AdDetailDrawerVariantA";

interface Props {
  output: OutputData;
  open: boolean;
  onClose: () => void;
  /**
   * Variant switcher — flips `?drawer=a|c` in the URL. When omitted, the
   * toggle pill in the header is hidden. The parent `AdDetailDrawer`
   * wrapper passes this in based on the current URL state.
   */
  onSwitchVariant?: () => void;
}

/**
 * AdDetailDrawerVariantC — Asymmetric Bento ad-detail.
 *
 * Layout (matches `docs/mockups/ad-detail-variant-c-bento.html`):
 *   Wide shadcn <Sheet side="right" sm:max-w-[1600px]>
 *   4-row × 12-col bento grid stacked vertically inside the Sheet body.
 *
 *   Row 1  — Hero creative (col-8) + Vertical action lane (col-4)
 *   Row 2  — AI Verdict strip (col-12, 5 cells: Quality ring / Est CTR / Est CVR / Audience fit / Brand-voice match)
 *   Row 3  — Provenance lineage (col-8) + Peer compare bars + Coach (col-4)
 *   Row 4  — Siblings + Related horizontal strips (col-12)
 *
 * Why this exists: Variant A's mental model is "show me the creative."
 * Variant C's mental model is "show me everything in one glance" — the
 * asymmetric bento gives equal weight to the artifact, the AI judgment of
 * it, the lineage behind it, and what to do next.
 */
export function AdDetailDrawerVariantC({
  output,
  open,
  onClose,
  onSwitchVariant,
}: Props) {
  const angle = useMemo(
    () => angles.find((a) => a.id === output.angleId),
    [output.angleId],
  );

  const siblings = useMemo(() => {
    if (!output.priorConfig?.conceptId) return [];
    return sampleOutputs
      .filter(
        (o) =>
          o.id !== output.id &&
          o.priorConfig?.conceptId === output.priorConfig?.conceptId,
      )
      .slice(0, 4);
  }, [output.id, output.priorConfig?.conceptId]);

  const related = useMemo(() => {
    if (!output.angleId) return [];
    return sampleOutputs
      .filter((o) => o.id !== output.id && o.angleId === output.angleId)
      .slice(0, 12);
  }, [output.id, output.angleId]);

  const created =
    output.generatedAt instanceof Date
      ? output.generatedAt
      : new Date(output.generatedAt);

  const breadcrumbCur = (output.headline ?? output.product?.name ?? "—").slice(
    0,
    40,
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-[1600px] overflow-hidden flex flex-col"
      >
        <SheetHeader className="border-b border-border px-5 py-3 flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <SheetTitle className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground truncate">
              Library / {angle?.label ?? "—"} / {output.brand?.name ?? "—"} —{" "}
              {breadcrumbCur}
            </SheetTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {output.aiVerdict && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                Quality · {output.aiVerdict.quality}
              </span>
            )}
            {onSwitchVariant && (
              <VariantTogglePill active="c" onSwitch={onSwitchVariant} />
            )}
            <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </SheetHeader>

        {/* BODY — 12-col bento grid, 4 rows */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ROW 1 — Hero (col-8) + Action lane (col-4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT col-span-8 — Hero creative */}
            <section className="lg:col-span-8 rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-5 lg:flex-row">
              {/* LEFT inner — text */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/40 to-primary flex items-center justify-center text-sm font-semibold shrink-0 border border-border/40">
                    {output.brand?.name?.slice(0, 1) ?? "—"}
                  </div>
                  <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {output.brand?.name ?? "Unattributed"}
                    </span>
                    {output.product?.name && (
                      <>
                        <span className="text-muted-foreground/60">·</span>
                        <span className="text-[13px] text-muted-foreground truncate">
                          {output.product.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {output.headline && (
                  <h2 className="text-[20px] font-semibold leading-snug tracking-tight text-foreground mb-3 max-w-[440px]">
                    {output.headline}
                  </h2>
                )}
                {output.body && (
                  <p className="text-[13.5px] leading-relaxed text-muted-foreground mb-5 max-w-[440px]">
                    {output.body}
                  </p>
                )}

                {output.cta && (
                  <span className="self-start inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground mt-auto">
                    {output.cta}
                  </span>
                )}
              </div>

              {/* RIGHT inner — media 4:5 */}
              <div className="shrink-0 w-full lg:w-[240px]">
                <div
                  className={cn(
                    "relative overflow-hidden rounded-xl bg-muted border border-border/40 aspect-[4/5]",
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
                </div>
              </div>
            </section>

            {/* RIGHT col-span-4 — Action lane (vertical stack) */}
            <section className="lg:col-span-4 rounded-2xl border border-border/60 bg-card p-4 flex flex-col gap-3">
              {/* Primary */}
              <button
                type="button"
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-[14px] inline-flex items-center justify-center gap-2 shadow-sm hover:brightness-105 transition"
              >
                <Rocket className="h-4 w-4" />
                Launch ad
              </button>
              <p className="text-center text-[11.5px] text-muted-foreground leading-relaxed">
                Launch is on the Growth plan.{" "}
                <a
                  href="#trial"
                  className="text-primary font-medium hover:underline"
                >
                  Start your 7-day trial →
                </a>
              </p>

              <div className="h-px bg-border/60 my-0.5" />

              {/* Secondary stack */}
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted/40 text-[13px] text-foreground transition"
              >
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Forge 10 variants
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  →
                </span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted/40 text-[13px] text-foreground transition"
              >
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                Edit ad
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  →
                </span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted/40 text-[13px] text-foreground transition"
              >
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                Regenerate
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  →
                </span>
              </button>

              <div className="h-px bg-border/60 my-0.5" />

              {/* Tertiary icon cluster */}
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  aria-label="Save to library"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Download"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="More actions"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>
          </div>

          {/* ROW 2 — AI Verdict strip (col-12) */}
          <section className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                AI verdict
                {output.aiVerdict && (
                  <>
                    {" · "}Quality {output.aiVerdict.quality}
                  </>
                )}
              </h3>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Model v3.2
              </span>
            </div>
            {output.aiVerdict ? (
              <AiVerdictCells verdict={output.aiVerdict} layout="strip" />
            ) : (
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground py-4 text-center">
                Verdict pending — generation has not been scored
              </p>
            )}
          </section>

          {/* ROW 3 — Provenance (col-8) + Compare/Coach (col-4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT col-span-8 — Provenance */}
            <section className="lg:col-span-8 rounded-2xl border border-border/60 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  How this was made
                </h3>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Lineage · 5 steps
                </span>
              </div>

              <ProvenanceLineageTree
                nodes={[
                  {
                    id: "brand",
                    label: output.brand?.name ?? "—",
                    type: "brand",
                  },
                  {
                    id: "concept",
                    label: output.priorConfig?.conceptId ?? "—",
                    type: "concept",
                  },
                  {
                    id: "angle",
                    label: angle?.label ?? "—",
                    type: "angle",
                  },
                  {
                    id: "hook",
                    label: output.priorConfig?.hookId ?? "—",
                    type: "hook",
                  },
                  {
                    id: "current",
                    label: "This ad",
                    type: "current",
                  },
                ]}
              />

              {output.priorConfig?.promptSnippet && (
                <p className="rounded-md bg-muted/40 px-3 py-2 font-mono text-[11.5px] text-muted-foreground italic line-clamp-3 leading-relaxed">
                  &ldquo;{output.priorConfig.promptSnippet}&rdquo;
                </p>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
                <StatCell label="Mode" value={MODE_LABELS[output.mode]} />
                <StatCell
                  label="Created"
                  value={created.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
                {output.priorConfig?.generatedFromTemplate ? (
                  <StatCell
                    label="Template"
                    value={output.priorConfig.generatedFromTemplate}
                  />
                ) : (
                  <StatCell
                    label="Angle"
                    value={angle?.label ?? "—"}
                  />
                )}
              </div>
            </section>

            {/* RIGHT col-span-4 — Compare + Coach */}
            <section className="lg:col-span-4 rounded-2xl border border-border/60 bg-card p-4 space-y-4">
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Peer comparison
                </h3>
                {output.aiVerdict && output.comparison ? (
                  <CompareBars
                    bars={[
                      {
                        label: "This ad",
                        value: output.aiVerdict.quality,
                        isCurrent: true,
                      },
                      {
                        label: "Top in angle",
                        value: output.comparison.topInAngle,
                      },
                      {
                        label: "Your last 10",
                        value: output.comparison.your10Avg,
                      },
                      {
                        label: "Category avg",
                        value: output.comparison.categoryAvg,
                      },
                    ]}
                  />
                ) : (
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/70 py-3">
                    Peer data pending
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  What to do next
                </h3>
                <div className="flex flex-col">
                  {output.recommendations?.map((rec) => (
                    <CoachRow key={rec.id} rec={rec} />
                  ))}
                  {(!output.recommendations ||
                    output.recommendations.length === 0) && (
                    <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/70">
                      No recommendations yet
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* ROW 4 — Siblings + Related */}
          <section className="rounded-2xl border border-border/60 bg-card p-4 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  From the same generation
                  {siblings.length > 0 && (
                    <span className="text-muted-foreground/60">
                      {" "}
                      ({siblings.length + 1})
                    </span>
                  )}
                </h3>
                {siblings.length > 0 && (
                  <a
                    href="#batch"
                    className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition"
                  >
                    View batch →
                  </a>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {/* current */}
                <a
                  href={`?ad=${encodeURIComponent(output.id)}&drawer=c`}
                  className="relative shrink-0 w-20 h-[100px] overflow-hidden rounded-xl bg-muted border border-border/40 ring-2 ring-primary ring-offset-2 ring-offset-card"
                  aria-current="true"
                >
                  {output.thumbnail ? (
                    <img
                      src={output.thumbnail}
                      alt="This ad"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-mono text-[9px] uppercase text-muted-foreground">
                        Now
                      </span>
                    </div>
                  )}
                  <span className="absolute top-1 right-1 rounded bg-primary text-primary-foreground font-mono text-[8px] uppercase tracking-wider px-1 py-0.5 font-semibold">
                    This
                  </span>
                </a>
                {siblings.map((s) => (
                  <a
                    key={s.id}
                    href={`?ad=${encodeURIComponent(s.id)}&drawer=c`}
                    className="relative shrink-0 w-20 h-[100px] overflow-hidden rounded-xl bg-muted border border-border/40 hover:border-primary/60 transition"
                  >
                    {s.thumbnail ? (
                      <img
                        src={s.thumbnail}
                        alt={s.headline ?? "Sibling"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-mono text-[9px] uppercase text-muted-foreground">
                          —
                        </span>
                      </div>
                    )}
                  </a>
                ))}
                {siblings.length === 0 && (
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/70 self-center px-2">
                    Single-shot generation
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  More from {angle?.label ?? "this angle"}
                  {related.length > 0 && (
                    <span className="text-muted-foreground/60">
                      {" "}
                      ({related.length})
                    </span>
                  )}
                </h3>
                {related.length > 0 && (
                  <a
                    href={`?angle=${encodeURIComponent(output.angleId ?? "")}`}
                    className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition"
                  >
                    See all →
                  </a>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {related.map((r) => {
                  const delta =
                    r.qualityScore !== undefined &&
                    output.qualityScore !== undefined
                      ? r.qualityScore - output.qualityScore
                      : null;
                  return (
                    <a
                      key={r.id}
                      href={`?ad=${encodeURIComponent(r.id)}&drawer=c`}
                      className="relative shrink-0 w-[120px] h-[150px] overflow-hidden rounded-xl bg-muted border border-border/40 hover:border-primary/60 transition group"
                    >
                      {r.thumbnail ? (
                        <img
                          src={r.thumbnail}
                          alt={r.headline ?? "Related"}
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-mono text-[9px] uppercase text-muted-foreground">
                            —
                          </span>
                        </div>
                      )}
                      {delta !== null && delta !== 0 && (
                        <span
                          className={cn(
                            "absolute top-1.5 right-1.5 inline-flex items-center rounded bg-background/85 backdrop-blur-sm border border-border/50 px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums",
                            delta > 0 ? "text-emerald-700" : "text-rose-700",
                          )}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta} Q
                        </span>
                      )}
                    </a>
                  );
                })}
                {related.length === 0 && (
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/70 self-center px-2">
                    First in this angle
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AdDetailDrawerVariantC;
