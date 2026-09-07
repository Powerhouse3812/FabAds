import { Link } from "react-router-dom";
import { Sparkles, LayoutGrid, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../components/SectionHeader";
import { MODES, MODE_SCHEME as SCHEME, type AlphaMode } from "../data/modes";
import { GENIE_APPS, APP_PATH } from "@/genie6/apps/data/appRegistry";
import { resolveIcon } from "@/genie6/apps/lib/icons";

// Re-exported so existing consumers (`ContextRail`, `MobileContextRailSheet`,
// `AlphaStep3Configure` all import `type { AlphaMode } from "../screens/StudioHome"`)
// keep working unchanged — the type's home moved to data/modes.ts (§21.2, so
// AlphaStep1Format can share the same roster), StudioHome just re-exports it.
export type { AlphaMode };

interface StudioHomeProps {
  onStart: (mode: AlphaMode) => void;
}

/** Only the live apps surface here — §5 "Other tools/apps at the bottom of
 *  the page, replacing History" is explicit about findability, not a count. */
const LIVE_APPS = GENIE_APPS.filter((a) => a.state === "live");

/**
 * StudioHome (A-12.9 hero pass, §5 apps-strip pass) — pre-wizard entry
 * screen for Studio Alpha.
 *
 * The mode picker is the page's HERO section — wrapped in an elevated card
 * with the eyebrow/title above.
 *
 * History and recent generations are OUT of Studio entirely (§5 — they live
 * only in Library). In their place: an Other Apps strip reading the real
 * `GENIE_APPS` registry, so the tools that got buried inside Performance Ad
 * in the demo ("create variation") are findable from Home instead.
 */
export function StudioHome({ onStart }: StudioHomeProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 pt-14 pb-12">
      {/* ─── HERO ─── mode picker + format + Start CTA, elevated card */}
      <section className="relative">
        {/* Eyebrow + title — sits ABOVE the hero card, centered for the
            home-screen entry-point feel */}
        <div className="mb-4 space-y-2 text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" />
            Studio · Alpha
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            What are you creating today?
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Pick a mode. Studio fills in everything else.
          </p>
        </div>

        {/* Hero card — elevated glass chassis containing mode + format + start */}
        <div className="v3-glass rounded-2xl p-8 shadow-md">
          {/* Mode picker — 7-card grid (3+3+1 on desktop) */}
          <div className="mb-6">
            <SectionHeader title="Mode" />
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {MODES.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={!m.available}
                    aria-disabled={!m.available}
                    onClick={() => m.available && onStart(m.id)}
                    title={m.available ? undefined : `${m.title} — coming soon`}
                    className={cn(
                      "relative flex h-full w-full flex-col items-start gap-1 rounded-xl border bg-background p-3 text-left transition-all",
                      m.available
                        ? "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                        : "border-border cursor-not-allowed opacity-60",
                    )}
                  >
                    {m.tag && (
                      <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary">
                        {m.tag}
                      </span>
                    )}
                    {!m.available && !m.tag && (
                      <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Soon
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                        SCHEME[m.tone].bg,
                        SCHEME[m.tone].text,
                      )}
                    >
                      <m.Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <p className="text-[13px] font-bold leading-tight text-foreground">
                      {m.title}
                    </p>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">
                      {m.desc}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* ─── OTHER APPS ─── replaces History (§5). Reads the real GENIE_APPS
          registry so tools like "create variation" don't get buried inside
          a mode again — they're findable from Home. */}
      <section className="space-y-3">
        <SectionHeader
          title="Other Apps"
          icon={LayoutGrid}
          trailing={
            <Link
              to="/iq/genie6/apps"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {LIVE_APPS.map((app) => {
            const Icon = resolveIcon(app.icon);
            return (
              <li key={app.key} className="snap-start shrink-0 w-[200px]">
                <Link
                  to={APP_PATH(app.key)}
                  className="v3-glass-card group flex h-full w-full flex-col gap-2 rounded-xl p-3 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary-text">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <p className="line-clamp-1 text-[12px] font-semibold leading-tight text-foreground">
                    {app.name}
                  </p>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                    {app.tagline}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
