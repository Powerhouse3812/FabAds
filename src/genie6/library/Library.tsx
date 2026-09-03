import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { DotGridPattern } from "../components/DotGridPattern";
import { EmptyStateOnboarding } from "../components/EmptyStateOnboarding";
import { EMPTY_CONFIGS } from "../components/emptyStateConfigs";
import { SkeletonOutputGrid } from "../components/Skeletons";
import { ErrorState } from "../components/ErrorState";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { useDemoData } from "../hooks/useDemoData";
import { DesktopOnlyPrompt } from "@/components/shell/DesktopOnlyPrompt";
import { StudioLibrary } from "../variants/studio/StudioLibrary";
import { CanvasLibrary } from "../variants/canvas/CanvasLibrary";
import { CommandLibrary } from "../variants/command/CommandLibrary";
import { ModularLibrary } from "../variants/modular/ModularLibrary";
import { AdDetailDrawer } from "../components/AdDetailDrawer";
import { AngleViewMoreDrawer } from "../components/AngleViewMoreDrawer";

/**
 * Library — variant-aware router.
 *
 * Library is now strictly Generated Outputs (no sub-nav). Hooks / Angles /
 * Concepts / Templates / Avatars / Audiences moved to Assets (formerly
 * Workspace).
 *
 * When demo data is OFF or ?empty=1: render the interactive empty state
 * (replaces all variants — Library has no tab structure to preserve).
 *
 * Backward-compat redirect: if a deep link uses /library/<old-tab>, send
 * the user to the equivalent /workspace/<old-tab> (Assets) URL.
 */
const ASSET_TYPES = new Set(["hooks", "angles", "concepts", "templates", "avatars", "audiences"]);

export function Library() {
  const [searchParams] = useSearchParams();
  const { assetType } = useParams<{ assetType?: string }>();
  const { variant } = useGenie6Theme();
  const { on: demoOn } = useDemoData();

  // Redirect old library tabs to their new home in Assets.
  if (assetType && ASSET_TYPES.has(assetType)) {
    return <Navigate to={`/iq/genie6/workspace/${assetType}`} replace />;
  }

  // Backward-compat: the previous click-to-preview path was
  // `/library/outputs/:id`. The redesign opens the AdDetailDrawer via
  // `?ad=<id>` instead, so any deep-link to the legacy path gets rewritten
  // (the `outputs/:id` form was also responsible for the previous bug
  // where clicks didn't open anything — it redirected back to /library
  // before the preview pane could mount).
  if (assetType === "outputs") {
    const id = window.location.pathname.split("/outputs/")[1];
    const redirectTo = id ? `/iq/genie6/library?ad=${encodeURIComponent(id)}` : "/iq/genie6/library";
    return <Navigate to={redirectTo} replace />;
  }

  // Demo flags for stakeholder walkthroughs
  if (searchParams.get("loading") === "1") {
    return (
      <div className="p-6">
        <div className="mb-4">
          <div className="h-8 w-32 rounded bg-g6-bg-spotlight/60 animate-pulse" />
        </div>
        <SkeletonOutputGrid count={8} />
      </div>
    );
  }

  if (searchParams.get("error") === "1") {
    return <ErrorState title="Couldn't load library" message="We couldn't fetch your generated outputs. Network issue, or the index is rebuilding. Retry in a moment." />;
  }

  // Empty state (either ?empty=1 explicit URL flag, or demo-data toggle is OFF)
  if (searchParams.get("empty") === "1" || !demoOn) {
    return <EmptyStateOnboarding {...EMPTY_CONFIGS.library} />;
  }

  /* ── Variant-aware body ──
        All 4 variants share the same URL-driven drawers (AdDetailDrawer +
        AngleViewMoreDrawer) — so they mount at THIS level, above the
        variant switch. A-12.194 hoist: Maalik was on the Modular variant
        and the drawers only mounted inside StudioLibrary, which silently
        broke ?ad= deep-links + card clicks across the other 3 variants. */
  const VariantBody = () => {
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
  };

  return (
    <>
      <VariantBody />
      <AngleViewMoreDrawer />
      <AdDetailDrawer />
    </>
  );
}

/** Legacy zero-data state (kept for direct ?empty=1 callers from outside). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          {/* Two copies, gated by breakpoint — mobile cannot generate at all
              (spec B §1.2 / "no new generation flow"), so the desktop line
              would be asking for something the user has no way to do. */}
          <p className="hidden text-g6-base text-g6-text-secondary max-w-md md:block">
            Generate your first batch and your library will fill with outputs from every mode.
          </p>
          <p className="text-g6-base text-g6-text-secondary max-w-md md:hidden">
            Generations are created on desktop. Once a batch finishes, its outputs
            show up here for you to browse.
          </p>
        </div>
        {/* Zero-data state was the one dead end left on a mobile-allowed surface:
            an enabled CTA navigating to /iq/genie6/generate, which the policy
            blocks, so the empty library handed the user a gate screen. Mobile now
            gets the disabled-and-explained treatment (Maalik's chosen pattern)
            with a link they can open on a laptop; desktop keeps the real button
            byte-for-byte (INV-4). Siblings, not a JS branch. */}
        <DesktopOnlyPrompt
          path="/iq/genie6/studio-alpha"
          label="Studio"
          shape="row"
          className="w-auto justify-center gap-2 rounded-g6-pill px-5 md:hidden"
        >
          Start a generation
          <ArrowUpRight className="h-4 w-4" />
        </DesktopOnlyPrompt>
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/generate")}
          className="hidden items-center gap-2 rounded-g6-pill bg-g6-primary px-5 py-2.5 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-transform hover:-translate-y-0.5 md:inline-flex"
        >
          Start a generation
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
