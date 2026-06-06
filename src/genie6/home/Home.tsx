import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DotGridPattern } from "../components/DotGridPattern";
import { HeroPromptInput } from "../components/HeroPromptInput";
import { MicroMotif } from "../components/MicroMotif";
import { modeConfigs } from "../generate-legacy/modeConfigs";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioHome } from "../variants/studio/StudioHome";
import { CanvasHome } from "../variants/canvas/CanvasHome";
import { CommandHome } from "../variants/command/CommandHome";
import { ModularHome } from "../variants/modular/ModularHome";

// NOTE: Persona toggle (Agency / Solo) intentionally removed from UI.
// Personas remain a useful internal lens (for analytics, content prioritization, etc.)
// but are NOT exposed to the user. Both Wizard + Form modes available to everyone.
// See plan: redo-all-this-stuff-tidy-rain.md § Track 4.1.

/**
 * Home — variant-aware router.
 *
 * Each architectural variant (studio / canvas / command / modular) has its
 * own Home implementation in src/genie6/variants/. The zero-data state is
 * variant-agnostic for now (single hero treatment) — variant-specific zero
 * states can be added later if needed.
 */
export function Home() {
  const [searchParams] = useSearchParams();
  const isEmpty = searchParams.get("empty") === "1";
  const { variant } = useGenie6Theme();

  if (isEmpty) return <HomeZeroData />;

  switch (variant) {
    case "canvas":
      return <CanvasHome />;
    case "command":
      return <CommandHome />;
    case "modular":
      return <ModularHome />;
    case "studio":
    default:
      return <StudioHome />;
  }
}

// ─────────────────────────────────────────────────────────
// ZERO-DATA — variant-agnostic hero (works on light + dark)
// ─────────────────────────────────────────────────────────

function HomeZeroData() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const handlePrompt = () => {
    if (!prompt.trim()) return;
    navigate("/iq/genie6/generate/product-ad");
  };

  return (
    <div className="relative flex min-h-full flex-col">
      <DotGridPattern />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-20">
        {/* Hero */}
        <header className="g6-fade-up space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-3 py-1">
            <Sparkles className="h-3 w-3 text-g6-primary" />
            <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-secondary">
              winner-first ai ad generator
            </span>
          </div>
          <h1 className="font-g6-sans text-g6-display font-black tracking-[-0.03em] text-g6-text">
            Welcome to <span className="text-g6-primary">Genie 6</span>
          </h1>
          <p className="text-g6-lg text-g6-text-secondary leading-relaxed max-w-xl">
            Make winning ads in under 60 seconds — for any brand, any format, any audience.
          </p>
        </header>

        <div className="g6-fade-up" style={{ animationDelay: "120ms" }}>
          <HeroPromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handlePrompt}
            placeholder="paste a product URL or describe what you want to generate"
            size="lg"
          />
        </div>

        {/* Setup nudges */}
        <div className="g6-fade-up grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ animationDelay: "240ms" }}>
          <NudgeCard
            title="Add your first brand"
            sub="2 min · URL fetch"
            cta="Start"
            onClick={() => navigate("/iq/genie6/settings/brands")}
            featured
          />
          <NudgeCard
            title="Try with a demo brand"
            sub="Instant · 0 credits"
            cta="Try demo"
            onClick={() => navigate("/iq/genie6/generate/product-ad?demo=1")}
          />
        </div>

        {/* Starter pack */}
        <div className="g6-fade-up rounded-g6-2xl border border-g6-primary-border bg-g6-primary-bg p-6 space-y-3" style={{ animationDelay: "360ms" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-g6-h4 font-bold text-g6-text">
                Starter pack — 5 free generations
              </p>
              <p className="text-g6-base text-g6-text-secondary">
                Pick a mode below, paste a product URL, get 4 variants in under 60 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/generate")}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-g6-base bg-g6-primary px-4 py-2.5 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-transform hover:-translate-y-0.5"
            >
              Start guided <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mode chips */}
        <div className="g6-fade-up space-y-3" style={{ animationDelay: "480ms" }}>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Or pick a mode
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Phase D P1-G5: disabled state for `comingSoon` modes — was missing,
                so a future-flagged mode would silently navigate to a broken form.
                Disabled chips: opacity-50, cursor-not-allowed, "Soon" pill, no
                onClick + tabIndex={-1}. Hover description via title (P2-G4). */}
            {modeConfigs.map((cfg) => {
              const disabled = cfg.comingSoon === true;
              // A-11.9: map legacy mode IDs to New Studio routes. Unknown modes
              // fall back to the GenerateLanding picker.
              const target = (() => {
                switch (cfg.id) {
                  case "brand-ad": return "/iq/genie6/generate/brand-ad";
                  case "product-ad": return "/iq/genie6/generate/product-ad";
                  case "affiliate-ad": return "/iq/genie6/generate/affiliate-ad";
                  case "forge": return "/iq/genie6/generate/variation";
                  case "ugc-video": return "/iq/genie6/generate/product-ad?output=video&preset=ugc-video";
                  case "image-to-ad": return "/iq/genie6/generate/product-ad?output=video";
                  default: return "/iq/genie6/generate";
                }
              })();
              return (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={disabled ? undefined : () => navigate(target)}
                  disabled={disabled}
                  title={cfg.description}
                  aria-disabled={disabled}
                  className={cn(
                    "flex items-center gap-2 rounded-g6-pill border px-3 py-1.5 text-g6-sm font-medium transition-all",
                    disabled
                      ? "border-g6-border-secondary bg-g6-bg-base text-g6-text-tertiary opacity-60 cursor-not-allowed"
                      : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
                  )}
                >
                  <MicroMotif mode={cfg.id} size={14} />
                  {cfg.label}
                  {disabled && (
                    <span className="ml-1 rounded bg-g6-bg-spotlight px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-g6-text-tertiary">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NudgeCard({
  title,
  sub,
  cta,
  onClick,
  featured,
}: {
  title: string;
  sub: string;
  cta: string;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "g6-lift group flex flex-col gap-2 rounded-g6-2xl border bg-g6-bg-container p-5 text-left",
        featured
          ? "border-g6-primary-border shadow-g6-md"
          : "border-g6-border-secondary"
      )}
    >
      <span className="text-g6-h5 font-bold text-g6-text">{title}</span>
      <span className="text-g6-sm text-g6-text-secondary">{sub}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-g6-sm font-medium text-g6-primary">
        {cta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </button>
  );
}
