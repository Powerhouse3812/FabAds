/**
 * OtherAppsModal — the full Other Apps roster, reached via "View more" on
 * Studio home once the home panel itself only surfaces a handful of live
 * apps (Genie 2.0 §8 consolidation, 2026-09-10).
 *
 * Reads `GENIE_APPS` directly — never a hand-copied id list. The roster
 * (22 apps today) has drifted from hardcoded copies before; this modal
 * derives everything (which apps show, live vs coming-soon, counts) from
 * `app.state`, so it tracks the registry automatically as it grows.
 *
 * Live apps are real `<Link>`s to `APP_PATH(app.key)` that close the modal
 * on click. Coming-soon apps render as inert, unstyled-as-clickable rows —
 * no `<Link>`, no href, no tab stop — carrying the same "Soon" pill used on
 * `apps/components/AppCard.tsx` and the Studio home strip.
 */
import { Link } from "react-router-dom";
import { Lock, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { GENIE_APPS, APP_PATH } from "@/genie6/apps/data/appRegistry";
import { resolveIcon } from "@/genie6/apps/lib/icons";
import { SectionHeader } from "./SectionHeader";
import type { GenieApp } from "@/genie6/apps/appTypes";

export interface OtherAppsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OtherAppsModal({ open, onOpenChange }: OtherAppsModalProps) {
  const liveApps = GENIE_APPS.filter((a) => a.state === "live");
  const comingSoonApps = GENIE_APPS.filter((a) => a.state === "coming-soon");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] w-full max-w-[720px] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* ── Header — stays put while the roster below scrolls ─────────── */}
        <div className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle className="text-[15px] font-bold tracking-[-0.01em] text-foreground">
            Other Apps
          </DialogTitle>
          <DialogDescription className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            Every one-shot tool Genie ships, live and coming soon.
          </DialogDescription>
        </div>

        {/* ── Body — the only scrolling region ───────────────────────────── */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {liveApps.length > 0 && (
            <section>
              <SectionHeader title="Live" count={liveApps.length} />
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {liveApps.map((app) => (
                  <LiveAppRow key={app.key} app={app} onNavigate={() => onOpenChange(false)} />
                ))}
              </div>
            </section>
          )}

          {comingSoonApps.length > 0 && (
            <section>
              <SectionHeader title="Coming soon" count={comingSoonApps.length} />
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {comingSoonApps.map((app) => (
                  <ComingSoonAppRow key={app.key} app={app} />
                ))}
              </div>
            </section>
          )}

          {liveApps.length === 0 && comingSoonApps.length === 0 && (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">
              No apps configured yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LiveAppRow({ app, onNavigate }: { app: GenieApp; onNavigate: () => void }) {
  const Icon = resolveIcon(app.icon);
  return (
    <Link
      to={APP_PATH(app.key)}
      onClick={onNavigate}
      className={cn(
        "fab-focus group flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors",
        "hover:border-primary/40 hover:bg-primary/10",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-text">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span title={app.name} className="block truncate text-[13px] font-semibold text-foreground">{app.name}</span>
        <span title={app.tagline} className="block truncate text-[11.5px] text-muted-foreground">{app.tagline}</span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-text" />
    </Link>
  );
}

function ComingSoonAppRow({ app }: { app: GenieApp }) {
  const Icon = resolveIcon(app.icon);
  return (
    <div
      aria-disabled="true"
      className="flex cursor-default items-center gap-3 rounded-lg border border-border/70 bg-muted/30 p-3"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06] text-muted-foreground">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span title={app.name} className="block truncate text-[13px] font-semibold text-foreground/70">{app.name}</span>
        <span title={app.tagline} className="block truncate text-[11.5px] text-muted-foreground">{app.tagline}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Lock className="h-2.5 w-2.5" />
        Soon
      </span>
    </div>
  );
}
