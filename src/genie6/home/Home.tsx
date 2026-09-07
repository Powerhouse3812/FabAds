import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Mic, Repeat, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DotGridPattern } from "../components/DotGridPattern";
import { HeroPromptInput } from "../components/HeroPromptInput";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioHome } from "../variants/studio/StudioHome";
import { CanvasHome } from "../variants/canvas/CanvasHome";
import { CommandHome } from "../variants/command/CommandHome";
import { ModularHome } from "../variants/modular/ModularHome";
// Type-only, read-only reference — Mode is StudioAlpha's `?approach` vocabulary
// (see studio-v4/state/useUrlSync.ts). Importing the type does not create a
// write dependency on studio-v4; this file still owns nothing but itself.
import type { Mode } from "../studio-v4/state/useWizard";

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
    // §7: every generation goes through the one Studio flow — there is no
    // parallel wizard for redirects. The typed text itself has no honest
    // param to carry (Studio's useUrlSync parses no ?prompt=/free-text key),
    // so land on plain Studio rather than inventing one.
    navigate("/iq/genie6/studio-alpha");
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
            onClick={() => navigate("/iq/genie6/studio-alpha?demo=1")}
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
                Pick an approach below, paste a product URL, get 4 variants in under 60 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/studio-alpha")}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-g6-base bg-g6-primary px-4 py-2.5 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-transform hover:-translate-y-0.5"
            >
              Start guided <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Approach chips — §2/§4: ad type is decided ONLY by the Step-2 tab
            inside Studio (Brand/Product/Category), never here, so this row no
            longer offers ad-type-flavored picks ("Brand Ad" / "Product Ad" /
            "Affiliate Ad") as if they were peers of an approach — Affiliate in
            particular is a Mode (§4), not an ad type, and isn't shown as one.
            Every chip below is a genuine Studio "approach" (Step3Approach's
            ALL_MODES) carried through the one param useUrlSync.ts actually
            parses: ?approach=. No ?mode=/?preset= — Studio never reads those. */}
        <div className="g6-fade-up space-y-3" style={{ animationDelay: "480ms" }}>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Or pick an approach
          </p>
          <div className="flex flex-wrap gap-2">
            {APPROACH_QUICKSTART.map((cfg) => (
              <button
                key={cfg.id}
                type="button"
                onClick={() => navigate(`/iq/genie6/studio-alpha?approach=${cfg.id}`)}
                title={cfg.desc}
                className="flex items-center gap-2 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-3 py-1.5 text-g6-sm font-medium text-g6-text-secondary transition-all hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
              >
                <cfg.Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * APPROACH_QUICKSTART — a small, honest subset of Studio's real "approach"
 * vocabulary (Step3Approach's ALL_MODES, `../studio-v4/screens/Step3Approach.tsx`,
 * read-only reference — not re-exported there, so restated here rather than
 * imported). Every id is a value `Mode` (useWizard.ts) accepts and every id
 * round-trips through `?approach=` per useUrlSync.ts.
 *
 * Deliberately excludes the old "Brand Ad" / "Product Ad" / "Affiliate Ad"
 * chips: those named an ad type (or, for Affiliate, a Mode) that Studio's
 * Format/Home step never reads from the URL (`homeMode` in StudioAlpha.tsx is
 * local React state, not URL-synced) — there is no honest param to carry
 * them, and keeping them here mixed ad-type language with approach language
 * in one undifferentiated row (§2/§4). "Image to Ad" is dropped too: the
 * closest real approach, `image-to-video`, is video-only and format-gated,
 * which would silently narrow a card whose old default output was a static
 * image — not an honest mapping.
 */
const APPROACH_QUICKSTART: Array<{
  id: Mode;
  label: string;
  desc: string;
  Icon: typeof Wand2;
}> = [
  {
    id: "scratch",
    label: "From scratch",
    desc: "Full flow — prompt, references, angle, model, output count.",
    Icon: Wand2,
  },
  {
    id: "ugc-video",
    label: "UGC Video",
    desc: "Avatar-led talking-head, script-first.",
    Icon: Mic,
  },
  {
    id: "create-variations",
    label: "Create Variations",
    desc: "Iterate on existing creatives — keep layout, colors, or copy.",
    Icon: Repeat,
  },
];

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
