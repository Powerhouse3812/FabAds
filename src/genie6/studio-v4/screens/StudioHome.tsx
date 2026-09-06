import { useMemo, useState } from "react";
import { Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../components/SectionHeader";
import { MODES, MODE_SCHEME as SCHEME, type AlphaMode } from "../data/modes";

// Re-exported so existing consumers (`ContextRail`, `MobileContextRailSheet`,
// `AlphaStep3Configure` all import `type { AlphaMode } from "../screens/StudioHome"`)
// keep working unchanged — the type's home moved to data/modes.ts (§21.2, so
// AlphaStep1Format can share the same roster), StudioHome just re-exports it.
export type { AlphaMode };

interface StudioHomeProps {
  onStart: (mode: AlphaMode) => void;
}

type HistoryStatus = "draft" | "completed";

interface HistoryItem {
  id: string;
  status: HistoryStatus;
  title: string;
  brand: string;
  mode: string;
  format: "Image" | "Video";
  ago: string;
  /** Drafts only — % of fields filled */
  completion?: number;
  /** Completeds only — number of variants generated */
  outputCount?: number;
}

const HISTORY: HistoryItem[] = [
  {
    id: "h-c1",
    status: "completed",
    title: "Mamaearth · Vit C Serum",
    brand: "Mamaearth",
    mode: "Product Ad",
    format: "Image",
    ago: "2h ago",
    outputCount: 12,
  },
  {
    id: "h-d1",
    status: "draft",
    title: "Noise · ColorFit Pro 5",
    brand: "Noise",
    mode: "Product Ad",
    format: "Video",
    ago: "1h ago",
    completion: 60,
  },
  {
    id: "h-c2",
    status: "completed",
    title: "Boat · Airdopes 161 Pro",
    brand: "Boat",
    mode: "Product Ad",
    format: "Video",
    ago: "Yesterday",
    outputCount: 8,
  },
  {
    id: "h-d2",
    status: "draft",
    title: "Sleepyhead · Original Mattress",
    brand: "Sleepyhead",
    mode: "Performance Ad",
    format: "Image",
    ago: "Yesterday",
    completion: 40,
  },
  {
    id: "h-c3",
    status: "completed",
    title: "Plum · Niacinamide Serum",
    brand: "Plum",
    mode: "Brand Ad",
    format: "Image",
    ago: "2 days ago",
    outputCount: 16,
  },
  {
    id: "h-d3",
    status: "draft",
    title: "WOW · Apple Cider Shampoo",
    brand: "WOW",
    mode: "Product Ad",
    format: "Image",
    ago: "3 days ago",
    completion: 20,
  },
];

/**
 * StudioHome (A-12.9 hero pass) — pre-wizard entry screen for Studio Alpha.
 *
 * The mode picker + format toggle + Start CTA is the page's HERO section
 * — wrapped in an elevated card with the eyebrow/title above. Recent
 * generations + Drafts strips below are visually de-emphasized (smaller
 * headings, more muted) since they're secondary entry points.
 *
 * Drafts don't have generated thumbnails (they haven't been generated
 * yet) — they're rendered as filled-form-data cards showing brand,
 * mode, format, completion progress, and edit timestamp.
 */
type FilterValue = "all" | "draft" | "completed";

export function StudioHome({ onStart }: StudioHomeProps) {
  const [filter, setFilter] = useState<FilterValue>("all");

  const filteredHistory = useMemo(
    () => (filter === "all" ? HISTORY : HISTORY.filter((h) => h.status === filter)),
    [filter],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 pt-14 pb-12">
      {/* ─── HERO ─── mode picker + format + Start CTA, elevated card */}
      <section className="relative">
        {/* Eyebrow + title — sits ABOVE the hero card, centered for the
            home-screen entry-point feel */}
        <div className="mb-4 space-y-2 text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" />
            Studio · Alpha
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            What are you creating today?
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Pick a mode and format. Studio fills in everything else.
          </p>
        </div>

        {/* Hero card — elevated glass chassis containing mode + format + start */}
        <div className="v3-glass rounded-2xl p-8 shadow-md">
          {/* Mode picker — 5-card grid (3+2 on desktop) */}
          <div className="mb-6">
            <SectionHeader title="Mode" />
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {MODES.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={!m.available}
                    onClick={() => m.available && onStart(m.id)}
                    className={cn(
                      "relative flex h-full w-full flex-col items-start gap-1 rounded-xl border bg-background p-3 text-left transition-all",
                      m.available
                        ? "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                        : "border-border cursor-not-allowed opacity-60",
                    )}
                  >
                    {m.tag && (
                      <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary">
                        {m.tag}
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                        SCHEME[m.tone].bg,
                        SCHEME[m.tone].text,
                      )}
                    >
                      <m.Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <p className="text-[13px] font-bold leading-tight text-foreground">
                      {m.title}
                    </p>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">
                      {m.desc}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* ─── HISTORY ─── Config-only cards with status tags + filter pills */}
      <section className="space-y-3">
        <SectionHeader
          title="History"
          icon={Clock}
          trailing={
            <div className="flex items-center gap-2">
              {/* Filter pills */}
              <div className="inline-flex rounded-full border border-border/60 bg-background/40 p-0.5">
                {(["all", "draft", "completed"] as const).map((f) => {
                  const active = filter === f;
                  const label = f === "all" ? "Both" : f === "draft" ? "Draft" : "Completed";
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
                        active
                          ? "bg-foreground/[0.08] text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="text-[10px] font-medium text-muted-foreground hover:text-foreground"
              >
                View all →
              </button>
            </div>
          }
        />
        {filteredHistory.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-muted-foreground">
            No {filter === "all" ? "" : filter} history yet
          </p>
        ) : (
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {filteredHistory.map((item) => (
              <HistoryCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  HistoryCard — unified config-only snapshot.
 *  No thumbnail. Status tag (Draft/Completed) differentiates.
 *  Drafts: completion bar. Completeds: output count.
 * ────────────────────────────────────────────────────────── */
function HistoryCard({ item }: { item: HistoryItem }) {
  const isCompleted = item.status === "completed";
  return (
    <li className="snap-start shrink-0 w-[200px]">
      <button
        type="button"
        className={cn(
          "group flex h-full w-full flex-col gap-2 rounded-xl p-3 text-left transition-all",
          isCompleted
            ? "v3-glass-card hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
            : "v3-glass-card border-dashed opacity-90 hover:border-foreground/20",
        )}
      >
        {/* Status tag + time */}
        <div className="flex items-center gap-1.5">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Draft
            </span>
          )}
          <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
            {item.ago}
          </span>
        </div>

        {/* Title */}
        <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
          {item.title}
        </p>

        {/* Config chips */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground">
            {item.brand}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground">
            {item.mode}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground">
            {item.format}
          </span>
        </div>

        {/* Stats footer — drafts: completion %, completeds: output count */}
        <div className="mt-auto space-y-0.5">
          {isCompleted ? (
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <span>Outputs</span>
              <span className="font-bold text-foreground">{item.outputCount}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>Filled</span>
                <span>{item.completion}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${item.completion}%` }}
                />
              </div>
            </>
          )}
        </div>
      </button>
    </li>
  );
}
