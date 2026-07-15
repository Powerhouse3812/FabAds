import {
  ArrowLeft,
  Search,
  GripVertical,
  Users,
  ShieldCheck,
  Shuffle,
  Webhook,
  GitBranch,
} from "lucide-react";

import heroLogo from "@/assets/auth/hero-logo.svg";

/** Client reference ("Workay"): a soft panel with a big cropped headline
 *  top-left + a large product-UI screenshot peeking in from the
 *  bottom-right, deliberately cut off by the panel edges mid-drag
 *  interaction. FabAds adaptation keeps the Dark Stage near-black scene
 *  (not the reference's cream) and rebuilds the "screenshot" as real DOM —
 *  a fake Launch-flow block canvas — rather than a static image, so it
 *  reads crisp at any density and stays on-brand (tokens + lucide only). */

/** Static connector rows for the fake "Blocks" list — icon + label per
 *  row, in display order. The 5th entry ("A/B condition") is rendered
 *  separately as the mid-drag floating card, tilted over a dashed empty
 *  slot, mirroring the reference's drag moment exactly. */
const BLOCK_ROWS = [
  { Icon: Users, label: "Audience branch" },
  { Icon: ShieldCheck, label: "Budget guard" },
  { Icon: Shuffle, label: "Creative rotation" },
  { Icon: Webhook, label: "Callable webhook" },
] as const;

const TABS = ["Core", "Targeting", "Creative", "Budget"] as const;

export default function HeroProductPeek(): JSX.Element {
  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <style>{`
        @keyframes ds-hero-peek-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-peek-fade-in {
          animation: ds-hero-peek-fade-in 0.5s ease-out both;
        }

        @keyframes ds-hero-peek-rise {
          from { opacity: 0; transform: translateY(40px) rotate(0deg); }
          to { opacity: 1; transform: translateY(0) rotate(0deg); }
        }
        .ds-hero-peek-rise {
          animation: ds-hero-peek-rise 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-hero-peek-bob {
            0%, 100% { transform: translateY(0) rotate(-3deg); }
            50% { transform: translateY(-3px) rotate(-3deg); }
          }
          .ds-hero-peek-bob {
            animation: ds-hero-peek-bob 4.5s ease-in-out infinite;
          }

          @keyframes ds-hero-peek-dot-pulse {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 0.4; }
          }
          .ds-hero-peek-dot-pulse {
            animation: ds-hero-peek-dot-pulse 3.2s ease-in-out infinite;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-peek-fade-in,
          .ds-hero-peek-rise {
            animation-duration: 0.01ms;
          }
          .ds-hero-peek-bob {
            animation: none;
            transform: rotate(-3deg);
          }
          .ds-hero-peek-dot-pulse {
            animation: none;
          }
        }
      `}</style>

      {/* base scene + subtle lime radial in a corner, keeping the Dark
          Stage near-black identity rather than the reference's cream */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_100%,hsl(var(--primary)/0.12)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,hsl(var(--card))_0%,hsl(var(--background))_60%)]" />
      </div>

      {/* logo — small, top-left, low opacity */}
      <img
        src={heroLogo}
        alt=""
        aria-hidden="true"
        className="ds-hero-peek-fade-in absolute left-6 top-6 z-20 h-5 w-auto opacity-40"
      />

      {/* headline block — top-left, deliberately run close to the edge */}
      <div className="ds-hero-peek-fade-in absolute left-6 right-8 top-16 z-20 max-w-[420px]" style={{ animationDelay: "100ms" }}>
        <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-foreground lg:text-4xl">
          Launch faster with AutoPilot
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Set the strategy once — FabAds drafts, launches and optimizes every
          campaign for you.
        </p>

        {/* carousel dots */}
        <div className="mt-5 flex items-center gap-1.5">
          <span className="ds-hero-peek-dot-pulse h-1.5 w-5 rounded-full bg-primary" aria-hidden="true" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" aria-hidden="true" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" aria-hidden="true" />
        </div>
      </div>

      {/* peeking product card — absolutely positioned, overflowing the
          panel's bottom + right edges so only its top-left corner reads
          cleanly, exactly like the reference's cropped screenshot */}
      <div
        className="ds-hero-peek-rise absolute bottom-[-22%] right-[-18%] z-10 w-[85%] max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-card shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        style={{ animationDelay: "260ms" }}
      >
        {/* header row */}
        <div className="flex items-center gap-2.5 border-b border-white/8 px-5 pt-5 pb-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Launch flows
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              Q3_scale_campaigns
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            Blocks
          </p>

          {/* search row */}
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate text-xs text-muted-foreground">Search blocks…</span>
          </div>

          {/* tabs */}
          <div className="mb-4 flex items-center gap-4 border-b border-white/8">
            {TABS.map((tab, i) => (
              <span
                key={tab}
                className={`relative pb-2 text-xs font-medium ${
                  i === 0 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {tab}
                {i === 0 && (
                  <span
                    className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </span>
            ))}
          </div>

          {/* connector rows */}
          <div className="flex flex-col gap-2">
            {BLOCK_ROWS.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2.5"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </div>
                <span className="flex-1 truncate text-xs font-medium text-foreground">
                  {label}
                </span>
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
              </div>
            ))}

            {/* empty dashed drop-slot, sitting under the mid-drag card */}
            <div className="h-11 rounded-lg border-2 border-dashed border-white/15" aria-hidden="true" />
          </div>
        </div>

        {/* mid-drag floating card — tilted, lifted above the drop-slot */}
        <div
          className="ds-hero-peek-bob absolute bottom-[74px] left-[38px] right-[38px] flex items-center gap-2.5 rounded-lg border border-white/12 bg-card px-3 py-2.5 shadow-[0_16px_36px_rgba(0,0,0,0.5)]"
          style={{ transform: "rotate(-3deg)" }}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15">
            <GitBranch className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </div>
          <span className="flex-1 truncate text-xs font-medium text-foreground">
            A/B condition
          </span>
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
