import { useMemo } from "react";
import { Sparkles, ImageIcon, Video, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type { Format } from "../state/useWizard";

export type AlphaMode =
  | "product-shoot"
  | "brand-ad"
  | "product-ad"
  | "performance-ad";

interface StudioHomeProps {
  mode: AlphaMode | null;
  format: Format | null;
  onPickMode: (mode: AlphaMode) => void;
  onPickFormat: (format: Format) => void;
  onStart: () => void;
}

interface ModeOption {
  id: AlphaMode;
  emoji: string;
  title: string;
  desc: string;
  available: boolean;
}

const MODES: ModeOption[] = [
  {
    id: "product-shoot",
    emoji: "📷",
    title: "Product Shoot",
    desc: "Studio-quality product photography. Hero shots, detail macros, bundles.",
    available: false,
  },
  {
    id: "brand-ad",
    emoji: "🪧",
    title: "Brand Ad",
    desc: "Top-of-funnel awareness. Tone, story, brand positioning.",
    available: false,
  },
  {
    id: "product-ad",
    emoji: "🛍",
    title: "Product Ad",
    desc: "Conversion-driven product creative with offer + CTA.",
    available: true,
  },
  {
    id: "performance-ad",
    emoji: "📈",
    title: "Performance Ad",
    desc: "ROAS-driven format. Tested angles, urgency, social proof.",
    available: false,
  },
];

interface DraftItem {
  id: string;
  title: string;
  brand: string;
  mode: string;
  format: "Image" | "Video";
  editedAgo: string;
  /** Cumulative completion of the draft fields (for the progress chip) */
  completion: number;
}

const DRAFTS: DraftItem[] = [
  {
    id: "d-1",
    title: "Mamaearth · Vit C Serum",
    brand: "Mamaearth",
    mode: "Product Ad",
    format: "Image",
    editedAgo: "1h ago",
    completion: 80,
  },
  {
    id: "d-2",
    title: "Noise · ColorFit Pro 5",
    brand: "Noise",
    mode: "Product Ad",
    format: "Video",
    editedAgo: "Yesterday",
    completion: 60,
  },
  {
    id: "d-3",
    title: "Boat · Airdopes 161",
    brand: "Boat",
    mode: "Brand Ad",
    format: "Image",
    editedAgo: "2 days ago",
    completion: 40,
  },
  {
    id: "d-4",
    title: "Sleepyhead · Original Mattress",
    brand: "Sleepyhead",
    mode: "Performance Ad",
    format: "Image",
    editedAgo: "3 days ago",
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
export function StudioHome({
  mode,
  format,
  onPickMode,
  onPickFormat,
  onStart,
}: StudioHomeProps) {
  const recents = useMemo(
    () => sampleOutputs.slice(0, 6),
    [],
  );

  const canStart = mode !== null && format !== null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 pt-10 pb-12">
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

        {/* Hero card — elevated chassis containing mode + format + start */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
          {/* Mode picker — 4-card grid */}
          <div className="mb-5">
            <h2 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Mode
            </h2>
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {MODES.map((m) => {
                const active = mode === m.id;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      disabled={!m.available}
                      onClick={() => m.available && onPickMode(m.id)}
                      className={cn(
                        "relative flex h-full w-full flex-col items-start gap-1 rounded-xl border bg-background p-3 text-left transition-all",
                        active
                          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                          : m.available
                            ? "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                            : "border-border cursor-not-allowed opacity-60",
                      )}
                    >
                      {!m.available && (
                        <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          Soon
                        </span>
                      )}
                      <span className="text-2xl leading-none">{m.emoji}</span>
                      <p className="text-[13px] font-bold leading-tight text-foreground">
                        {m.title}
                      </p>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">
                        {m.desc}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Format toggle + Start CTA — same row */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Format
            </span>
            <div className="inline-flex rounded-full border border-border bg-background p-0.5">
              <FormatBtn
                active={format === "image"}
                onClick={() => onPickFormat("image")}
                icon={ImageIcon}
                label="Image"
              />
              <FormatBtn
                active={format === "video"}
                onClick={() => onPickFormat("video")}
                icon={Video}
                label="Video"
              />
            </div>
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-bold transition-all",
                canStart
                  ? "bg-primary text-primary-foreground shadow-md hover:scale-[1.03] hover:shadow-lg ring-4 ring-primary/20"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              Start
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── DE-EMPHASIZED ─── Recent generations strip */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Recent generations
          </h2>
          <button
            type="button"
            className="ml-auto text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            View all →
          </button>
        </div>
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
          {recents.map((r) => (
            <li key={r.id} className="snap-start shrink-0 w-[120px]">
              <button
                type="button"
                className="group flex w-full flex-col gap-1 overflow-hidden rounded-lg border border-border/60 bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                  {r.thumbnail ? (
                    <img
                      src={r.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Sparkles className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                  {r.brand?.name && (
                    <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                      {r.brand.name}
                    </span>
                  )}
                </div>
                <div className="px-1.5 pb-1 pt-0.5">
                  <p className="truncate text-[10px] font-semibold text-foreground">
                    {r.headline ?? "Untitled"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── DE-EMPHASIZED ─── Drafts strip — filled-form cards, no thumbs */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Drafts
          </h2>
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
            · saved before generation
          </span>
        </div>
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
          {DRAFTS.map((d) => (
            <li key={d.id} className="snap-start shrink-0 w-[200px]">
              <button
                type="button"
                className="group flex h-full w-full flex-col gap-1.5 rounded-lg border border-dashed border-border bg-card/40 p-3 text-left transition-all hover:border-primary/40 hover:bg-card"
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Draft · {d.editedAgo}
                  </span>
                </div>
                <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
                  {d.title}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground">
                    {d.brand}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground">
                    {d.mode}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground">
                    {d.format}
                  </span>
                </div>
                {/* Completion progress bar */}
                <div className="mt-auto space-y-0.5">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    <span>Filled</span>
                    <span>{d.completion}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${d.completion}%` }}
                    />
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FormatBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
