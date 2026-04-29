import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { DotGridPattern } from "../components/DotGridPattern";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioLibrary } from "../variants/studio/StudioLibrary";
import { CanvasLibrary } from "../variants/canvas/CanvasLibrary";
import { CommandLibrary } from "../variants/command/CommandLibrary";
import { ModularLibrary } from "../variants/modular/ModularLibrary";

/**
 * Library — variant-aware router.
 *
 * Each architectural variant has its own Library implementation in
 * src/genie6/variants/. They all share the underlying tab content components
 * (GeneratedOutputsTab, HooksTab, etc.) — only the surrounding chrome
 * (tab strip, filters, preview pane orientation) differs per variant.
 *
 * Zero-data state is variant-agnostic.
 */
export function Library() {
  const [searchParams] = useSearchParams();
  const { variant } = useGenie6Theme();

  // Zero-data flag (Track 4.9)
  if (searchParams.get("empty") === "1") return <LibraryZeroData />;

  switch (variant) {
    case "canvas":
      return <CanvasLibrary />;
    case "command":
      return <CommandLibrary />;
    case "modular":
      return <ModularLibrary />;
    case "studio":
    default:
      return <StudioLibrary />;
  }
}

/* ─────────────────────────────────────────────────────────
   Zero-data state (Track 4.9) — variant-agnostic
   ───────────────────────────────────────────────────────── */
function LibraryZeroData() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-full flex-col">
      <DotGridPattern />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-g6-2xl bg-g6-primary-bg">
          <Sparkles className="h-7 w-7 text-g6-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
            Your library is empty
          </h1>
          <p className="text-g6-base text-g6-text-secondary max-w-md">
            Generate your first batch and your library will fill with outputs, hooks, angles, concepts, templates, avatars, and audiences.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/generate")}
          className="inline-flex items-center gap-2 rounded-g6-pill bg-g6-primary px-5 py-2.5 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-transform hover:-translate-y-0.5"
        >
          Start a generation
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
