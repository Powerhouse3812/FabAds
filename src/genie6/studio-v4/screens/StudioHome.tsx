import { useMemo } from "react";
import { Sparkles, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { sampleOutputs } from "../../mocks/sample-outputs";

export type AlphaMode =
  | "product-shoot"
  | "brand-ad"
  | "product-ad"
  | "social"
  | "performance-ad";

interface StudioHomeProps {
  onStart: (mode: AlphaMode) => void;
}

interface ModeOption {
  id: AlphaMode;
  emoji: string;
  title: string;
  desc: string;
  available: boolean;
  /** Optional badge label shown top-right of the card (e.g. "Affiliate"). */
  tag?: string;
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
    id: "social",
    emoji: "📱",
    title: "Social",
    desc: "Organic content for feed, Stories, Reels, and carousels.",
    available: false,
  },
  {
    id: "performance-ad",
    emoji: "📈",
    title: "Performance Ad",
    desc: "ROAS-driven format. Tested angles, urgency, social proof.",
    available: false,
    tag: "Affiliate",
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
export function StudioHome({ onStart }: StudioHomeProps) {
  const historyItems = useMemo(() => {
    type GenerationItem = {
      type: "generation";
      id: string;
      headline: string;
      thumbnail?: string;
      time: string;
    };
    type DraftHistoryItem = DraftItem & { type: "draft" };

    const gens: GenerationItem[] = sampleOutputs.slice(0, 3).map((o) => ({
      type: "generation" as const,
      id: o.id,
      headline: o.headline ?? "Untitled",
      thumbnail: o.thumbnail,
      time: "2h ago",
    }));
    const drafts: DraftHistoryItem[] = DRAFTS.map((d) => ({
      type: "draft" as const,
      ...d,
    }));
    return [...gens, ...drafts];
  }, []);

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

        {/* Hero card — elevated chassis containing mode + format + start */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-md">
          {/* Mode picker — 5-card grid (3+2 on desktop) */}
          <div className="mb-6">
            <h2 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Mode
            </h2>
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
                    <span className="text-2xl leading-none">{m.emoji}</span>
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

      {/* ─── HISTORY ─── Combined recent generations + drafts */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            History
          </h2>
          <button
            type="button"
            className="ml-auto text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            View all →
          </button>
        </div>
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
          {historyItems.map((item) =>
            item.type === "generation" ? (
              <GenerationCard key={item.id} item={item} />
            ) : (
              <DraftCard key={item.id} item={item} />
            ),
          )}
        </ul>
      </section>
    </div>
  );
}

function GenerationCard({
  item,
}: {
  item: { id: string; headline: string; thumbnail?: string; time: string };
}) {
  return (
    <li className="snap-start shrink-0 w-[110px]">
      <button
        type="button"
        className="group flex w-full flex-col gap-1 overflow-hidden rounded-lg border border-border/60 bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Sparkles className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <div className="px-1.5 pb-1 pt-0.5">
          <p className="truncate text-[10px] font-semibold text-foreground">
            {item.headline}
          </p>
          <p className="font-mono text-[9px] text-muted-foreground">{item.time}</p>
        </div>
      </button>
    </li>
  );
}

function DraftCard({ item }: { item: DraftItem & { type: "draft" } }) {
  return (
    <li className="snap-start shrink-0 w-[180px]">
      <button
        type="button"
        className="group flex h-full w-full flex-col gap-1.5 rounded-lg border border-dashed border-border bg-card/40 p-3 text-left transition-all hover:border-primary/40 hover:bg-card"
      >
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Draft · {item.editedAgo}
          </span>
        </div>
        <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
          {item.title}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground">
            {item.brand}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground">
            {item.mode}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground">
            {item.format}
          </span>
        </div>
        <div className="mt-auto space-y-0.5">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            <span>Filled</span>
            <span>{item.completion}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${item.completion}%` }}
            />
          </div>
        </div>
      </button>
    </li>
  );
}
