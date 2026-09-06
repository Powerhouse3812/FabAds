import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { resolveIcon } from "../lib/icons";
import type { GenieApp } from "../appTypes";

/**
 * Real coming-soon page for the 8 apps with no internal screen (§8). A
 * direct URL to one of these must render this, never a crash or a blank —
 * so `AppScreen` routes here whenever `app.state === "coming-soon"`.
 */
export function ComingSoonScreen({ app }: { app: GenieApp }) {
  const Icon = resolveIcon(app.icon);
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-5 px-6 pb-16 pt-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/[0.06] text-muted-foreground">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Lock className="h-2.5 w-2.5" />
          Coming soon
        </span>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">{app.name}</h1>
        <p className="text-[14px] text-muted-foreground">{app.tagline}</p>
      </div>
      <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        This app isn't built yet — it's reserved a spot in Other Apps so the full lineup is visible
        today. No setup screen exists here yet.
      </p>
      <Link
        to="/iq/genie6/apps"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/[0.05]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Other Apps
      </Link>
    </div>
  );
}
