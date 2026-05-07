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

/**
 * StudioHome — pre-wizard entry screen for Studio Alpha (A-12.8).
 *
 * Picks BOTH mode (Product Shoot / Brand Ad / Product Ad / Performance Ad)
 * AND format (Image / Video) before entering the wizard. Single Start
 * button enabled when both are selected. Below: recent generations + drafts
 * strips for quick continue affordance.
 *
 * V1 only ships Product Ad as available; the other 3 modes show as
 * disabled with "Coming soon" pill.
 */
export function StudioHome({
  mode,
  format,
  onPickMode,
  onPickFormat,
  onStart,
}: StudioHomeProps) {
  const recents = useMemo(
    () => sampleOutputs.slice(0, 5),
    [],
  );
  const drafts = useMemo(
    () => sampleOutputs.slice(20, 24),
    [],
  );

  const canStart = mode !== null && format !== null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pt-6 pb-10">
      {/* Eyebrow + title */}
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
          <Sparkles className="h-2.5 w-2.5" />
          Studio · Alpha
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          What are you creating today?
        </h1>
      </header>

      {/* Mode picker — 4-card grid */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Mode
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={!m.available}
                  onClick={() => m.available && onPickMode(m.id)}
                  className={cn(
                    "relative flex h-full w-full flex-col items-start gap-1.5 rounded-xl border bg-card p-3 text-left transition-all",
                    active
                      ? "border-primary ring-2 ring-primary/30"
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
                  <p className="text-sm font-bold text-foreground">{m.title}</p>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                    {m.desc}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Format toggle + Start CTA */}
      <section className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
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
            "ml-auto inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold transition-transform",
            canStart
              ? "bg-primary text-primary-foreground hover:scale-[1.02]"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          Start
          <span aria-hidden>→</span>
        </button>
      </section>

      {/* Recent generations strip */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Recent generations
          </h2>
          <button
            type="button"
            className="ml-auto text-[11px] font-medium text-primary hover:underline"
          >
            View all →
          </button>
        </div>
        <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
          {recents.map((r) => (
            <li key={r.id} className="snap-start shrink-0 w-[160px]">
              <button
                type="button"
                className="group flex w-full flex-col gap-1 overflow-hidden rounded-lg border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
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
                      <Sparkles className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                  {r.brand?.name && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                      {r.brand.name}
                    </span>
                  )}
                </div>
                <div className="px-2 pb-1.5 pt-0.5">
                  <p className="truncate text-[11px] font-semibold text-foreground">
                    {r.headline ?? "Untitled"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Drafts strip */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Drafts
          </h2>
        </div>
        <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
          {drafts.map((r) => (
            <li key={r.id} className="snap-start shrink-0 w-[160px]">
              <button
                type="button"
                className="group flex w-full flex-col gap-1 overflow-hidden rounded-lg border border-dashed border-border bg-card/40 text-left transition-all hover:border-primary/40"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted/40">
                  {r.thumbnail && (
                    <img
                      src={r.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover opacity-70"
                    />
                  )}
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-background/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                    Draft
                  </span>
                </div>
                <div className="px-2 pb-1.5 pt-0.5">
                  <p className="truncate text-[11px] font-semibold text-foreground">
                    {r.headline ?? "Untitled draft"}
                  </p>
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
