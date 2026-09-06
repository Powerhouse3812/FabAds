import { Link } from "react-router-dom";
import { ArrowUpRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveIcon } from "../lib/icons";
import { APP_PATH } from "../data/appRegistry";
import type { GenieApp } from "../appTypes";

interface AppCardProps {
  app: GenieApp;
  /** "lg" = live apps that "carry weight" on the grid (§8: no 3-equal-cards
   *  row — live apps get the bigger, richer treatment). */
  size: "lg" | "sm";
}

export function AppCard({ app, size }: AppCardProps) {
  const Icon = resolveIcon(app.icon);
  const isLive = app.state === "live";

  return (
    <Link
      to={APP_PATH(app.key)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border transition-all",
        isLive
          ? "border-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          : "border-border/70 bg-muted/30 hover:-translate-y-0.5 hover:border-foreground/15",
        size === "lg" ? "p-5" : "p-4",
      )}
    >
      {app.badge && (
        <span className="absolute right-3 top-3 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
          {app.badge}
        </span>
      )}
      {!isLive && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Lock className="h-2.5 w-2.5" />
          Soon
        </span>
      )}

      <span
        className={cn(
          "flex items-center justify-center rounded-xl",
          isLive ? "bg-primary/10 text-primary" : "bg-foreground/[0.06] text-muted-foreground",
          size === "lg" ? "h-12 w-12" : "h-10 w-10",
        )}
      >
        <Icon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} strokeWidth={1.75} />
      </span>

      <h3
        className={cn(
          "mt-3 font-bold text-foreground",
          size === "lg" ? "text-[16px]" : "text-[13.5px]",
        )}
      >
        {app.name}
      </h3>
      <p
        className={cn(
          "mt-0.5 text-muted-foreground",
          size === "lg" ? "line-clamp-2 text-[12.5px]" : "line-clamp-1 text-[11.5px]",
        )}
      >
        {app.tagline}
      </p>

      <div className="mt-auto flex items-center justify-between pt-3">
        {isLive && app.cost ? (
          <span className="font-mono text-[10.5px] font-semibold text-foreground">
            {app.cost.unitLabel}
          </span>
        ) : (
          <span className="font-mono text-[10.5px] text-muted-foreground">Not built yet</span>
        )}
        {isLive && (
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        )}
      </div>
    </Link>
  );
}
