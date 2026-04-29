import { useNavigate } from "react-router-dom";
import { Sparkles, Play, Plus, ArrowUpRight, Settings, FolderOpen, History, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { MicroMotif } from "../../components/MicroMotif";
import { modeConfigs } from "../../generate/modeConfigs";
import { analyticsAgency } from "../../mocks/analytics";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { greeting } from "../../utils/greeting";

/**
 * Canvas variant — Home.
 *
 * Editor-first home: dominant viewport showing your top performer "open in canvas",
 * vertical tool rails framing it, floating mode chip strip, bottom action bar with
 * recent generations strip. Photoshop / Figma / Krea home.
 */
export function CanvasHome() {
  const navigate = useNavigate();
  const analytics = analyticsAgency;

  return (
    <div className="grid h-full grid-cols-[56px_1fr_56px]">
      {/* LEFT TOOL RAIL — modes */}
      <aside className="flex flex-col items-center gap-1 border-r border-g6-border-secondary py-3 bg-g6-bg-base">
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/generate")}
          title="New generation"
          className="flex h-10 w-10 items-center justify-center rounded-g6-base bg-g6-primary text-g6-text-on-accent shadow-g6-glow mb-2"
        >
          <Plus className="h-5 w-5" />
        </button>
        {modeConfigs.map((cfg) => (
          <button
            key={cfg.id}
            type="button"
            onClick={() => navigate(`/iq/genie6/generate/${cfg.id}/form`)}
            title={cfg.label}
            className="flex h-10 w-10 items-center justify-center rounded-g6-base text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text transition-colors"
          >
            <MicroMotif mode={cfg.id} size={18} />
          </button>
        ))}
      </aside>

      {/* CENTER VIEWPORT */}
      <div className="relative overflow-hidden">
        {/* Grid floor backdrop */}
        <div className="absolute inset-0 g6-canvas-floor opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-g6-bg-base" />

        {/* Top-left meta */}
        <div className="absolute left-4 top-4 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          canvas · home · {analytics.activeBrands} brands · {analytics.generationsThisMonth.count.toLocaleString("en-IN")} gens
        </div>

        {/* Top-right greeting */}
        <div className="absolute right-4 top-4 text-right">
          <p className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary">
            {greeting()} · rahul
          </p>
        </div>

        {/* Featured top performer "open on canvas" */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%]">
          <div className="relative">
            <div className="relative h-[360px] w-[480px] overflow-hidden rounded-g6-2xl shadow-g6-md">
              {analytics.topPerformer.thumbnail && (
                <img src={analytics.topPerformer.thumbnail} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-g6-bg-base/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <span className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-container/80 backdrop-blur-md px-2 py-0.5 font-g6-mono text-g6-xs font-bold uppercase text-g6-text-secondary">
                  <Sparkles className="h-2.5 w-2.5 text-g6-text-tertiary" /> top performer
                </span>
                <p className="text-g6-h4 font-bold text-g6-text">
                  {analytics.topPerformer.brand} · {analytics.topPerformer.product}
                </p>
                <div className="flex items-baseline gap-4">
                  <span className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text">{analytics.topPerformer.ctr}% CTR</span>
                  <span className="font-g6-mono text-g6-base font-bold tabular-nums text-g6-text">{analytics.topPerformer.roas}× ROAS</span>
                </div>
              </div>
            </div>

            {/* Cursor / corner handles to suggest canvas-edit affordance */}
            <div className="absolute -left-1 -top-1 h-2 w-2 border-2 border-g6-primary rounded-sm bg-g6-bg-base" />
            <div className="absolute -right-1 -top-1 h-2 w-2 border-2 border-g6-primary rounded-sm bg-g6-bg-base" />
            <div className="absolute -left-1 -bottom-1 h-2 w-2 border-2 border-g6-primary rounded-sm bg-g6-bg-base" />
            <div className="absolute -right-1 -bottom-1 h-2 w-2 border-2 border-g6-primary rounded-sm bg-g6-bg-base" />
          </div>
        </div>

        {/* Bottom — recent generations strip */}
        <div className="absolute bottom-20 left-4 right-4 space-y-2">
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Recent · drag to canvas
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sampleOutputs.filter((o) => o.thumbnail).slice(0, 8).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => navigate("/iq/genie6/library")}
                className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-g6-base border border-g6-border-secondary bg-g6-bg-container hover:border-g6-primary-border transition-colors"
                title={o.headline}
              >
                {o.thumbnail && (
                  <img src={o.thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/library")}
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-g6-base border border-dashed border-g6-border-secondary text-g6-text-tertiary hover:border-g6-primary-border hover:text-g6-text transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span className="font-g6-mono text-g6-xs mt-1">all</span>
            </button>
          </div>
        </div>

        {/* Bottom action bar — floating */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-g6-pill bg-g6-bg-container/95 px-4 py-2 shadow-g6-lg backdrop-blur-md border border-g6-border-secondary">
            <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
              {analytics.creditsUsed.used.toLocaleString("en-IN")} / {analytics.creditsUsed.limit.toLocaleString("en-IN")} credits
            </span>
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/generate")}
              className="rounded-g6-pill bg-g6-primary px-4 py-1.5 text-g6-sm font-bold text-g6-text-on-accent shadow-g6-glow"
            >
              ✦ New generation
            </button>
            <button
              type="button"
              onClick={() => navigate(`/iq/genie6/library/outputs/${analytics.topPerformer.outputId}`)}
              className="inline-flex items-center gap-1.5 rounded-g6-pill border border-g6-border bg-g6-bg-base px-3 py-1.5 text-g6-xs font-medium text-g6-text-secondary hover:text-g6-text"
            >
              <Play className="h-3 w-3" /> Open winner
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT TOOL RAIL — utilities */}
      <aside className="flex flex-col items-center gap-1 border-l border-g6-border-secondary py-3 bg-g6-bg-base">
        {[
          { Icon: History, label: "History", to: "/iq/genie6/library" },
          { Icon: FolderOpen, label: "Workspace", to: "/iq/genie6/workspace" },
          { Icon: Layers, label: "Library", to: "/iq/genie6/library" },
          { Icon: Settings, label: "Settings", to: "/iq/genie6/settings" },
        ].map(({ Icon, label, to }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(to)}
            title={label}
            className="flex h-10 w-10 items-center justify-center rounded-g6-base text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text transition-colors"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </aside>
    </div>
  );
}

