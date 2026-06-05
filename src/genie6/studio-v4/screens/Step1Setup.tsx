import { TrendingUp, Clock, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardCard } from "../components/WizardCard";
import { HeroHeader } from "../components/HeroHeader";
import { PreviewVideo } from "../components/PreviewVideo";
import { videoForSeed } from "../data/studio-visuals";
import type { Category, Format, UseWizardReturn } from "../state/useWizard";

interface Step1Props {
  wizard: UseWizardReturn;
}

const CATEGORIES: { id: Category; emoji: string; title: string; desc: string }[] = [
  {
    id: "asset",
    emoji: "🎨",
    title: "Asset",
    desc: "Brand-anchored visuals — reusable building blocks for any channel.",
  },
  {
    id: "ad",
    emoji: "📢",
    title: "Ad",
    desc: "Click & conversion-driven formats across all funnels.",
  },
  {
    id: "social",
    emoji: "📱",
    title: "Social",
    desc: "Social-optimized visuals — photos, stories, carousel posts.",
  },
];

const FORMATS: { id: Format; emoji: string; title: string; desc: string }[] = [
  {
    id: "image",
    emoji: "🖼️",
    title: "Image",
    desc: "Static visuals — ads, posts, banners, product shots.",
  },
  {
    id: "video",
    emoji: "🎬",
    title: "Video",
    desc: "Motion content — reels, stories, UGC, product demos.",
  },
];

interface RecentGen {
  id: string;
  thumbnail: string;
  label: string;
  meta: string;
}

const RECENT: RecentGen[] = [
  {
    id: "r1",
    thumbnail:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=240&q=70",
    label: "Studio white shoot",
    meta: "2h ago · Mamaearth",
  },
  {
    id: "r2",
    thumbnail:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=240&q=70",
    label: "Festive launch",
    meta: "Yesterday · Noise",
  },
  {
    id: "r3",
    thumbnail:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=240&q=70",
    label: "Bundle hero",
    meta: "Yesterday · Boat",
  },
  {
    id: "r4",
    thumbnail:
      "https://images.unsplash.com/photo-1622372738946-62e02505feb3?auto=format&fit=crop&w=240&q=70",
    label: "Editorial product",
    meta: "2 days ago · Sleepyhead",
  },
];

const TIPS = [
  { icon: Sparkles, text: "Pick a Type, then a Format. The Studio adapts the rest." },
  { icon: TrendingUp, text: "Video + UGC mode is the fastest-growing pick this week." },
  { icon: Zap, text: "Brand kit auto-applies once you select a product." },
];

export function Step1Setup({ wizard }: Step1Props) {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 pt-4 pb-6">
      {/* Ambient backdrop — gradient mesh + dot grid (subtle, behind everything) */}
      <BackdropMesh />

      {/* Hero header — minimal title only (no eyebrow / subtitle) */}
      <div className="relative">
        <HeroHeader title="What are you generating today?" />
      </div>

      {/* Type selector */}
      <section className="relative flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Type
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {CATEGORIES.map((c) => (
            <WizardCard
              key={c.id}
              emoji={c.emoji}
              title={c.title}
              description={c.desc}
              selected={wizard.state.category === c.id}
              onClick={() => wizard.set("category", c.id)}
            />
          ))}
        </div>
      </section>

      {/* Format selector */}
      <section className="relative flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Output format
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {FORMATS.map((f) => (
            <WizardCard
              key={f.id}
              emoji={f.emoji}
              title={f.title}
              description={f.desc}
              selected={wizard.state.format === f.id}
              onClick={() => wizard.set("format", f.id)}
            />
          ))}
        </div>
      </section>

      {/* Tips strip — subtle info row */}
      <section className="relative flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3">
        {TIPS.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-1 min-w-[200px] items-center gap-2 text-[11px]",
                i > 0 && "border-l border-border/60 pl-3",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-foreground">{tip.text}</span>
            </div>
          );
        })}
      </section>

      {/* Recent generations */}
      <section className="relative space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Pick up where you left off
            </h2>
          </div>
          <button
            type="button"
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            View all generations →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RECENT.map((r) => (
            <button
              key={r.id}
              type="button"
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <PreviewVideo
                  src={videoForSeed(`recent:${r.id}`)}
                  poster={r.thumbnail}
                  className="transition-transform group-hover:scale-[1.04]"
                />
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
                  <Sparkles className="h-2.5 w-2.5" />
                  Reuse
                </span>
              </div>
              <div className="px-2.5 py-1.5">
                <p className="truncate text-xs font-semibold text-foreground">
                  {r.label}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {r.meta}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Ambient gradient mesh + dot grid — fills the empty space
 *  behind the Step 1 hero. Subtle, doesn't compete with cards.
 * ────────────────────────────────────────────────────────── */
function BackdropMesh() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Lime orb top-left */}
      <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-primary/15 blur-[120px]" />
      {/* Amber bottom-right */}
      <div className="absolute -bottom-32 -right-32 h-[380px] w-[380px] rounded-full bg-amber-300/15 blur-[120px]" />
      {/* Sky middle */}
      <div className="absolute top-1/3 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-sky-300/10 blur-[100px]" />
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
    </div>
  );
}
