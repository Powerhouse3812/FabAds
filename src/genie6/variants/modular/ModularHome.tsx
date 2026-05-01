import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GripVertical, Plus, Sparkles, TrendingUp, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MicroMotif } from "../../components/MicroMotif";
import { HeroPromptInput } from "../../components/HeroPromptInput";
import { modeConfigs } from "../../generate/modeConfigs";
import { analyticsAgency } from "../../mocks/analytics";
import { brands } from "../../mocks/brands";
import { BrandLogo } from "../../components/BrandLogo";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * Modular variant — Home.
 *
 * Composable workbench mental model. Home = stack of self-contained module
 * cards on a dark cosmic canvas. Each module has a code-style header (`> module_name`)
 * and a grip handle suggesting reorderability (drag = future enhancement).
 *
 * Modules:
 *   greeting_module
 *   top_performer_module
 *   credits_module
 *   modes_module (full-width)
 *   brands_module
 *   recent_module (full-width)
 *   trending_module
 */
export function ModularHome() {
  const navigate = useNavigate();
  const a = analyticsAgency;
  const [prompt, setPrompt] = useState("");
  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    navigate("/iq/genie6/generate/product-ad/form");
  };

  return (
    <div className="g6-halo relative min-h-full p-6">
      <header className="relative z-10 mb-6">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          <span className="text-g6-primary">&gt;</span> home.dashboard
        </p>
        <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">
          Welcome back, Rahul
        </h1>
        <p className="text-g6-sm text-g6-text-secondary mt-1">
          {a.activeBrands} brands active · {a.generationsThisMonth.count.toLocaleString("en-IN")} gens this month
        </p>
      </header>

      <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* top_performer — spans 2 cols */}
        <ModuleCard title="Top performer" className="lg:col-span-2">
          <div className="flex gap-4">
            {a.topPerformer.thumbnail && (
              <img
                src={a.topPerformer.thumbnail}
                alt=""
                className="h-28 w-28 shrink-0 rounded-g6-base object-cover ring-1 ring-g6-primary/30"
              />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <span className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-container/60 px-2 py-0.5 font-g6-mono text-g6-xs font-bold uppercase text-g6-text-secondary">
                <Sparkles className="h-2.5 w-2.5 text-g6-text-tertiary" /> top performer
              </span>
              <p className="text-g6-h4 font-bold text-g6-text">
                {a.topPerformer.brand} · {a.topPerformer.product}
              </p>
              <div className="flex items-baseline gap-4">
                <span className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text">{a.topPerformer.ctr}% CTR</span>
                <span className="font-g6-mono text-g6-base font-bold tabular-nums text-g6-text">{a.topPerformer.roas}× ROAS</span>
              </div>
            </div>
          </div>
        </ModuleCard>

        {/* credits_module */}
        <ModuleCard title="Credits">
          <div className="space-y-2">
            <p className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text">
              {a.creditsUsed.used.toLocaleString("en-IN")}
              <span className="text-g6-sm font-normal text-g6-text-tertiary"> / {a.creditsUsed.limit.toLocaleString("en-IN")}</span>
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-g6-pill bg-g6-bg-spotlight">
              <div className="h-full rounded-g6-pill bg-g6-primary" style={{ width: `${(a.creditsUsed.used / a.creditsUsed.limit) * 100}%` }} />
            </div>
            <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">
              {(a.creditsUsed.limit - a.creditsUsed.used).toLocaleString("en-IN")} credits remaining
            </p>
          </div>
        </ModuleCard>

        {/* prompt_module — embed Generate entry point on Dashboard since the
             standalone Generate sidebar item is removed (iter-3 IA). */}
        <ModuleCard title="Generate" className="lg:col-span-3">
          <HeroPromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handlePromptSubmit}
            placeholder="paste a URL or describe the generation"
            size="lg"
          />
        </ModuleCard>

        {/* modes_module — full width */}
        <ModuleCard title="Modes" className="lg:col-span-3">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
            {modeConfigs.map((cfg) => (
              <button
                key={cfg.id}
                type="button"
                onClick={() => navigate(`/iq/genie6/generate/${cfg.id}/form`)}
                className="flex flex-col items-center gap-2 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base/50 px-2 py-3 hover:border-g6-primary-border hover:bg-g6-primary-bg/30 transition-colors"
              >
                <MicroMotif mode={cfg.id} size={22} />
                <span className="font-g6-mono text-g6-xs text-g6-text-secondary text-center leading-tight">{cfg.label}</span>
              </button>
            ))}
          </div>
        </ModuleCard>

        {/* brands_module */}
        <ModuleCard title="Brands">
          <ul className="space-y-1">
            {brands.slice(0, 5).map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/iq/genie6/workspace/brands/${b.id}`)}
                  className="flex w-full items-center gap-2 rounded-g6-base px-2 py-1.5 hover:bg-g6-bg-spotlight transition-colors"
                >
                  <BrandLogo name={b.name} src={b.logo} tint={b.colors?.[0]} size="h-5 w-5" rounded="rounded-sm" />
                  <span className="text-g6-sm text-g6-text truncate flex-1 text-left">{b.name}</span>
                  <ArrowUpRight className="h-3 w-3 text-g6-text-tertiary" />
                </button>
              </li>
            ))}
          </ul>
        </ModuleCard>

        {/* trending_module */}
        <ModuleCard title="Trending" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <FindingTile
              icon={<TrendingUp className="h-3 w-3 text-g6-text-tertiary" />}
              label="Top angle"
              value={`+${a.trendingFinding.deltaPct}%`}
              sub={a.trendingFinding.angleLabel}
              onClick={() => navigate("/iq/genie6/workspace/angles")}
            />
            <FindingTile
              label="UGC usage"
              value="3×"
              sub="vs last month"
              onClick={() => navigate("/iq/genie6/generate/ugc-video/form")}
            />
            <FindingTile
              label="Winners imported"
              value="5"
              sub="from Insights"
              onClick={() => navigate("/iq/genie6/generate/forge/form")}
            />
          </div>
        </ModuleCard>

        {/* recent_module — full width */}
        <ModuleCard title="Recent" className="lg:col-span-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sampleOutputs.filter((o) => o.thumbnail).slice(0, 8).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => navigate("/iq/genie6/library")}
                className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-g6-base border border-g6-border-secondary bg-g6-bg-base hover:border-g6-primary-border transition-colors"
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
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-g6-base border border-dashed border-g6-border text-g6-text-tertiary hover:border-g6-primary-border hover:text-g6-text transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span className="font-g6-mono text-g6-xs mt-1">all</span>
            </button>
          </div>
        </ModuleCard>

        {/* Add module CTA */}
        <button
          type="button"
          className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-g6-card border-2 border-dashed border-g6-border bg-transparent text-g6-text-tertiary hover:border-g6-primary-border hover:bg-g6-primary-bg/20 hover:text-g6-text transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="font-g6-mono text-g6-xs uppercase tracking-wider">add module</span>
        </button>

        {/* tour_module */}
        <ModuleCard title="Tour">
          <button
            type="button"
            onClick={() => navigate("/iq/genie6/wizard")}
            className="flex w-full items-center gap-3 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base/50 px-3 py-2.5 hover:border-g6-primary-border hover:bg-g6-primary-bg/20 transition-colors text-left"
          >
            <Sparkles className="h-3.5 w-3.5 text-g6-primary-active shrink-0" />
            <div className="min-w-0">
              <p className="text-g6-sm font-medium text-g6-text">Guided tour</p>
              <p className="text-g6-xs text-g6-text-tertiary">12-stop Genie walkthrough</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-g6-text-tertiary ml-auto shrink-0" />
          </button>
        </ModuleCard>

        {/* generate module — full width */}
        <div className="lg:col-span-3 rounded-g6-2xl border border-g6-primary-border bg-gradient-to-br from-g6-primary-bg via-g6-bg-container to-g6-bg-container p-6 text-center">
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-primary">
            <span>&gt;</span> generate
          </p>
          <p className="text-g6-base text-g6-text mt-2">
            Compose a new ad — pick a mode and module-stack will pre-load
          </p>
          <button
            type="button"
            onClick={() => navigate("/iq/genie6/generate")}
            className="mt-4 inline-flex items-center gap-2 rounded-g6-pill bg-g6-primary px-6 py-2 text-g6-base font-bold text-g6-text-on-accent shadow-g6-glow"
          >
            <Sparkles className="h-4 w-4" />
            New generation ▶
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("g6-glass rounded-g6-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between">
        <p className="text-g6-xs font-medium text-g6-text-tertiary">{title}</p>
        <GripVertical className="h-3.5 w-3.5 text-g6-text-disabled cursor-grab" aria-hidden />
      </header>
      {children}
    </div>
  );
}

function FindingTile({ icon, label, value, sub, onClick }: { icon?: React.ReactNode; label: string; value: string; sub?: string; onClick?: () => void }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "rounded-g6-base border border-g6-border-secondary bg-g6-bg-base/50 p-3 text-left w-full",
        onClick && "transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg/30 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="text-g6-xs font-medium text-g6-text-tertiary">{label}</p>
      </div>
      <p className="font-g6-mono text-g6-h4 font-bold tabular-nums text-g6-text">{value}</p>
      {sub && <p className="text-g6-xs text-g6-text-tertiary mt-0.5">{sub}</p>}
    </Wrapper>
  );
}
