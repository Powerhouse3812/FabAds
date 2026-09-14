import { Link, useParams } from "react-router-dom";
import { getApp } from "./data/appRegistry";
import { AppRunner } from "./AppRunner";
import { ComingSoonScreen } from "./components/ComingSoonScreen";
import { ProductSwapScreen } from "./ProductSwapScreen";
import { FaceSwapScreen } from "./FaceSwapScreen";
import type { AppKey } from "./appTypes";

/**
 * AppScreen — route `/iq/genie6/apps/:appKey`.
 *
 * Four outcomes, none of them a crash or a blank:
 *  - Product Swap / Face Swap intercept to the Generate-Variations-shaped
 *    flow (owner, 2026-09-14: "product swap and faceswap, is also not using
 *    the same generate variation flow and UI. We decided that already") —
 *    same precedent `StudioAlpha.startWizard` uses to route
 *    `generate-variations` away from its default wizard before any state is
 *    touched. `app.sections` stays declared for both (cost/fields source of
 *    truth — see appRegistry.ts's comment on each), just no longer walked by
 *    `FieldRenderer`.
 *  - every OTHER live app renders the shared `AppRunner` anatomy, untouched
 *  - a "Coming soon" app (opened directly by URL) renders a real page
 *  - an unknown/mistyped key renders a plain not-found card with a way back
 */
export function AppScreen() {
  const { appKey } = useParams<{ appKey: string }>();
  const app = appKey ? getApp(appKey as AppKey) : undefined;

  if (!app) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 pb-16 pt-20 text-center">
        <h1 className="text-[20px] font-bold text-foreground">App not found</h1>
        <p className="text-[13px] text-muted-foreground">
          "{appKey}" isn't one of the Other Apps.
        </p>
        <Link
          to="/iq/genie6/apps"
          className="mt-2 inline-flex items-center rounded-full border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-foreground/[0.05]"
        >
          Back to Other Apps
        </Link>
      </div>
    );
  }

  if (app.state === "coming-soon") {
    return <ComingSoonScreen app={app} />;
  }

  if (app.key === "product-placement") {
    return <ProductSwapScreen app={app} />;
  }
  if (app.key === "face-swap") {
    return <FaceSwapScreen app={app} />;
  }

  return <AppRunner app={app} />;
}
