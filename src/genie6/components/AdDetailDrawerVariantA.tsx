import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Beaker,
  Bookmark,
  Download,
  Edit3,
  Layers,
  Lock,
  MoreHorizontal,
  Play,
  RefreshCw,
  Rocket,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { angles } from "@/mocks/shared/angles";
import { sampleOutputs } from "../mocks/sample-outputs";
import type { OutputData } from "../types/output";
import { MODE_LABELS } from "../types/output";
import { cn } from "@/lib/utils";
import { QualityRing } from "./ad-detail/QualityRing";
import { AiVerdictCells } from "./ad-detail/AiVerdictCells";
import { CompareBars } from "./ad-detail/CompareBars";
import { CoachRow } from "./ad-detail/CoachRow";
import { ProvenanceBreadcrumb } from "./ad-detail/ProvenanceBreadcrumb";

interface Props {
  output: OutputData;
  open: boolean;
  onClose: () => void;
  /**
   * Variant switcher. Optional — when omitted, the toggle pill in the
   * header is hidden. Variant B was deleted in A-12.192; variant C lands
   * later and re-introduces the switch.
   */
  onSwitchVariant?: () => void;
}

/* ── Local helpers ────────────────────────────────────────────────────── */

/**
 * formatRelativeTime — terse, recency-aware timestamp for the drawer header.
 *
 * < 1 min        → "Just now"
 * < 60 min       → "Xm ago"
 * < 24 h         → "Xh ago"
 * yesterday      → "Yesterday"
 * same year      → "Mar 12"
 * older          → "Mar 12, 2024"
 */
function formatRelativeTime(input: Date | string): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  // Calendar-day comparison.
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (dayDiff === 1) return "Yesterday";
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/* `hydrateRecIcon` previously sat here to wrap recommendation icons into
   `LucideIcon` refs. CoachRow now does that mapping internally via its own
   `iconFor()` switch, so wrapping here double-hydrated and crashed at runtime
   (string → component → undefined inside the switch). Dropped. */

/**
 * AdDetailDrawerVariantA — refined "creative-first" bento layout.
 *
 * Layout:
 *   shadcn <Sheet side="right" sm:max-w-[1280px]>
 *   2-col grid: 36% creative left | 64% bento right
 *
 * LEFT  — sticky creative card: brand → headline → body → media → CTA →
 *         provenance breadcrumb (Brand › Concept › Angle › Hook › this ad)
 * RIGHT — 5 bento zones:
 *           1. Action lane (Launch / Forge / Edit / Regenerate / icons)
 *           2. AI verdict (QualityRing + verdict cells)
 *           3. How this was made (mode / created / template + prompt)
 *           4. Peer comparison (CompareBars) + Coach (recommendations)
 *           5. Siblings strip + "More from this angle" grid
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

  const siblings = useMemo(() => {
    const ids = output.siblings;
    if (!ids || ids.length === 0) return [];
    const idSet = new Set(ids);
    return sampleOutputs.filter((o) => idSet.has(o.id));
  }, [output.siblings]);

  const related = useMemo(() => {
    if (!output.angleId) return [];
    return sampleOutputs
      .filter((o) => o.id !== output.id && o.angleId === output.angleId)
      .slice(0, 6);
  }, [output.id, output.angleId]);

  const created = output.generatedAt instanceof Date ? output.generatedAt : new Date(output.generatedAt);

  const currentQ = output.aiVerdict?.quality ?? 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-[1024px] overflow-hidden flex flex-col"
      >
        <SheetHeader className="border-b border-border px-4 py-2 flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Ad detail · {output.id}
            </SheetTitle>
            {output.aiVerdict && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                Quality · <span className="tabular-nums">{output.aiVerdict.quality}</span>
              </span>
            )}
            <span className="text-[10.5px] text-muted-foreground">
              Generated {formatRelativeTime(output.generatedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted/40 px-1 py-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              ⌘K
            </kbd>
            {onSwitchVariant && <VariantTogglePill active="a" onSwitch={onSwitchVariant} />}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4 p-4 lg:grid-cols-[36%_1fr]">
            {/* LEFT — Creative */}
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-3 lg:sticky lg:top-0 lg:self-start">
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                  {output.brand?.name?.slice(0, 1) ?? "—"}
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold leading-tight truncate">
                    {output.brand?.name ?? "Unattributed"}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground truncate">
                    {output.product?.name ?? MODE_LABELS[output.mode]}
                  </p>
                </div>
              </div>

              {output.headline && (
                <h2 className="text-[13px] font-semibold leading-snug text-foreground">
                  {output.headline}
                </h2>
              )}
              {output.body && (
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  {output.body}
                </p>
              )}

              {/* Media */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl bg-muted max-h-[420px]",
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
                  <div className="flex h-full w-full items-center justify-center gap-1.5 px-3 text-center">
                    <RefreshCw className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Preview unavailable · regenerate to refresh
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
                <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                  {output.cta}
                </span>
              )}

              {/* Provenance breadcrumb */}
              <div className="mt-2 pt-2 border-t border-dashed border-border/60">
                <ProvenanceBreadcrumb
                  brand={output.brand?.name ?? "—"}
                  concept={output.priorConfig?.conceptId ?? "—"}
                  angle={angle?.label ?? "—"}
                  hook={output.priorConfig?.hookId ?? "Glow up"}
                  current="ad"
                />
              </div>
            </div>

            {/* RIGHT — 5 bento zones */}
            <div className="space-y-5">
              {/* Zone 1 — Action lane */}
              <section className="rounded-2xl border border-border/60 bg-card p-3 space-y-2.5">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-full bg-primary text-foreground font-semibold text-[13px] hover:bg-primary/90 transition-colors"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Launch ad
                </button>
                <p className="text-[11px] text-muted-foreground text-center">
                  <Lock className="inline h-2.5 w-2.5 mr-1 text-muted-foreground/70" />
                  Launch is on the Growth plan.{" "}
                  <Link
                    to="/plans-v2?tier=growth&view=trial"
                    className="text-primary hover:underline"
                  >
                    Start your 7-day trial →
                  </Link>
                </p>

                <div className="inline-flex items-center w-full rounded-full border border-border/60 bg-muted/20 p-0.5">
                  <SegmentedButton icon={Layers} label="Forge 10 variants" />
                  <SegmentedButton icon={Edit3} label="Edit ad" />
                  <SegmentedButton icon={RefreshCw} label="Regenerate" />
                </div>

                <div className="flex items-center justify-end gap-1">
                  <IconButton icon={Bookmark} label="Save to library" />
                  <IconButton icon={Download} label="Download" />
                  <IconButton icon={MoreHorizontal} label="More" />
                </div>
              </section>

              {/* Zone 2 — AI verdict */}
              <section className="rounded-2xl border border-border/60 bg-card p-3 space-y-2.5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  AI verdict
                </h3>
                {output.aiVerdict ? (
                  <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                    <QualityRing score={output.aiVerdict.quality} label="QUALITY" />
                    <AiVerdictCells verdict={output.aiVerdict} layout="grid" />
                  </div>
                ) : (
                  <p className="text-[11.5px] text-muted-foreground italic">
                    Verdict pending — regenerate to score.
                  </p>
                )}
              </section>

              {/* Zone 3 — How this was made */}
              <section className="rounded-2xl border border-border/60 bg-card p-3 space-y-2.5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  How this was made
                </h3>
                <dl className="grid grid-cols-3 gap-2">
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
                  {output.priorConfig?.generatedFromTemplate && (
                    <StatCell
                      label="Template"
                      value={output.priorConfig.generatedFromTemplate}
                    />
                  )}
                </dl>
                {output.priorConfig?.promptSnippet && (
                  <p className="mt-3 rounded-md bg-muted/40 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground italic line-clamp-3 leading-snug">
                    "{output.priorConfig.promptSnippet}"
                  </p>
                )}
              </section>

              {/* Zone 4 — Peer comparison + Coach */}
              <section className="rounded-2xl border border-border/60 bg-card p-3 space-y-3">
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                    Peer comparison · {angle?.label ?? "this angle"}
                  </h3>
                  {output.aiVerdict && output.comparison && (
                    <CompareBars
                      bars={[
                        { label: "This ad", value: output.aiVerdict.quality, isCurrent: true },
                        { label: "Top in angle", value: output.comparison.topInAngle },
                        { label: "Your last 10 avg", value: output.comparison.your10Avg },
                        { label: "Category avg", value: output.comparison.categoryAvg },
                      ]}
                    />
                  )}
                </div>

                {output.recommendations && output.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                      What to do next
                    </h3>
                    <div>
                      {output.recommendations.map((rec) => (
                        <CoachRow key={rec.id} rec={rec} />
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Zone 5 — Siblings + Related */}
              <section className="rounded-2xl border border-border/60 bg-card p-3 space-y-3">
                {siblings.length > 0 && (
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                      From the same generation
                    </h3>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {siblings.map((s) => (
                        <Link
                          key={s.id}
                          to={`?ad=${encodeURIComponent(s.id)}&drawer=a`}
                          className={cn(
                            "shrink-0 aspect-[4/5] w-16 overflow-hidden rounded-md bg-muted",
                            s.id === output.id && "ring-2 ring-primary",
                          )}
                        >
                          {s.thumbnail ? (
                            <img
                              src={s.thumbnail}
                              alt={s.headline ?? "Sibling output"}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                    More from {angle?.label ?? "this angle"}
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {related.map((r) => {
                      const rExt = r as OutputData & { aiVerdict?: { quality: number } };
                      const delta = (rExt.aiVerdict?.quality ?? 0) - currentQ;
                      return (
                        <Link
                          key={r.id}
                          to={`?ad=${encodeURIComponent(r.id)}&drawer=a`}
                          className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted group"
                        >
                          {r.thumbnail ? (
                            <img
                              src={r.thumbnail}
                              alt={r.headline ?? "Related output"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center gap-1 px-2 text-center">
                              <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="font-mono text-[9px] uppercase text-muted-foreground">
                                Preview unavailable
                              </span>
                            </div>
                          )}
                          {rExt.aiVerdict && (
                            <span
                              className={cn(
                                "absolute top-1 right-1 inline-flex items-center rounded-full px-1 py-0 font-mono text-[8.5px] tabular-nums",
                                delta > 0
                                  ? "bg-[hsl(var(--success-text))/0.15] text-[hsl(var(--success-text))]"
                                  : "bg-foreground/10 text-foreground/70",
                              )}
                            >
                              {delta > 0 ? "+" : ""}
                              {delta} Q
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Local action-row primitives ──────────────────────────────────────── */

function SegmentedButton({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex-1 inline-flex items-center justify-center gap-1.5 h-7 rounded-full px-2.5 font-medium text-[11.5px] text-foreground/80 hover:bg-background hover:text-foreground transition-colors"
    >
      <Icon className="h-3 w-3" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function IconButton({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}

/* ── Shared exports — preserved for variant C / wrapper ───────────────── */

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
  active: "a" | "c";
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
        A · Drawer
      </button>
      <button
        type="button"
        onClick={active === "c" ? undefined : onSwitch}
        aria-pressed={active === "c"}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
          active === "c"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        C · Bento
      </button>
    </div>
  );
}
