import { Link, useParams } from "react-router-dom";
import { getApp } from "./data/appRegistry";
import { AppRunner } from "./AppRunner";
import { ComingSoonScreen } from "./components/ComingSoonScreen";
import type { AppKey } from "./appTypes";

/**
 * AppScreen — route `/iq/genie6/apps/:appKey`.
 *
 * Three outcomes, none of them a crash or a blank:
 *  - a live app renders the shared `AppRunner` anatomy
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

  return <AppRunner app={app} />;
}
