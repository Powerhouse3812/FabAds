import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { MicroMotif } from "../../components/MicroMotif";
import { OutputCard } from "../../components/OutputCard";
import { modeConfigs } from "../../generate/modeConfigs";
import { analyticsAgency } from "../../mocks/analytics";
import { brands } from "../../mocks/brands";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * Studio variant — Home.
 *
 * 3-column workspace dashboard (Vidiofy / Regene.ai vibe):
 *   Left   — Brand portfolio rail (always visible, clickable)
 *   Middle — Greeting + top performer + mode launcher + recent generations
 *   Right  — AI insights panel (trending findings, recommendations)
 *
 * Mental model: agency desk. Everything one click away, brands always in peripheral vision.
 */
export function StudioHome() {
  const navigate = useNavigate();
  const analytics = analyticsAgency;

  return (
    <div className="grid h-full grid-cols-[200px_1fr_280px] gap-3 p-3">
      {/* LEFT — brand portfolio rail */}
      <aside className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Brands · {brands.length}
          </p>
          <button
            type="button"
            onClick={() => navigate("/iq/genie6/settings/brands")}
            className="text-g6-xs text-g6-text-tertiary hover:text-g6-text"
            title="Manage brands"
          >
            +
          </button>
        </div>
        <ul className="space-y-0.5">
          {brands.slice(0, 12).map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => navigate(`/iq/genie6/workspace/brands/${b.id}`)}
                className="flex w-full items-center gap-2 rounded-g6-base px-2 py-1.5 text-left hover:bg-g6-bg-spotlight transition-colors"
              >
                {b.logo ? (
                  <img src={b.logo} alt={b.name} className="h-5 w-5 rounded-sm object-cover bg-g6-bg-spotlight" />
                ) : (
                  <div className="h-5 w-5 rounded-sm bg-g6-primary-bg flex items-center justify-center font-g6-mono text-g6-xs font-bold text-g6-primary">
                    {b.name[0]}
                  </div>
                )}
                <span className="text-g6-sm text-g6-text truncate">{b.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* MIDDLE — main workspace */}
      <main className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-6 space-y-6">
        <header>
          <p className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary">
            {greeting()}
          </p>
          <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">
            Welcome back, Rahul
          </h1>
          <p className="text-g6-sm text-g6-text-secondary mt-1">
            {analytics.activeBrands} brands active · {analytics.generationsThisMonth.count.toLocaleString("en-IN")} gens this month
          </p>
        </header>

        {/* Top performer + KPI row */}
        <section className="grid grid-cols-3 gap-3">
          <div className="col-span-2 relative overflow-hidden rounded-g6-base border border-g6-border-secondary bg-g6-bg-base">
            {analytics.topPerformer.thumbnail && (
              <img src={analytics.topPerformer.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-g6-bg-base via-g6-bg-base/60 to-transparent" />
            <div className="relative p-5 space-y-2">
              <span className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-2 py-0.5 font-g6-mono text-g6-xs font-semibold uppercase text-g6-text-on-accent">
                <Sparkles className="h-2.5 w-2.5" /> top performer
              </span>
              <p className="text-g6-h4 font-bold text-g6-text">
                {analytics.topPerformer.brand} · {analytics.topPerformer.product}
              </p>
              <div className="flex items-baseline gap-5 pt-1">
                <span className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-primary">
                  {analytics.topPerformer.ctr}% <span className="text-g6-xs text-g6-text-tertiary">CTR</span>
                </span>
                <span className="font-g6-mono text-g6-h4 font-bold tabular-nums text-g6-text">
                  {analytics.topPerformer.roas}× <span className="text-g6-xs text-g6-text-tertiary">ROAS</span>
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-rows-2 gap-3">
            <KpiTile label="Credits" value={analytics.creditsUsed.used.toLocaleString("en-IN")} sub={`/ ${analytics.creditsUsed.limit.toLocaleString("en-IN")}`} progress={(analytics.creditsUsed.used / analytics.creditsUsed.limit) * 100} />
            <KpiTile label="Trending" value={`+${analytics.trendingFinding.deltaPct}%`} sub={analytics.trendingFinding.angleLabel} positive />
          </div>
        </section>

        {/* Mode launcher */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-g6-base font-semibold text-g6-text">Pick a mode</h2>
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/generate")}
              className="text-g6-xs text-g6-text-tertiary hover:text-g6-text"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {modeConfigs.map((cfg) => (
              <button
                key={cfg.id}
                type="button"
                onClick={() => navigate(`/iq/genie6/generate/${cfg.id}/form`)}
                className="g6-lift flex items-center gap-3 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base p-3 text-left transition-all hover:border-g6-primary-border hover:bg-g6-primary-bg/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-g6-base bg-g6-bg-spotlight shrink-0">
                  <MicroMotif mode={cfg.id} size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-g6-sm font-semibold text-g6-text">{cfg.label}</p>
                  <p className="text-g6-xs text-g6-text-tertiary truncate">{cfg.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent generations */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-g6-base font-semibold text-g6-text">Recent generations</h2>
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/library")}
              className="text-g6-xs text-g6-text-tertiary hover:text-g6-text"
            >
              Library →
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {sampleOutputs.filter((o) => o.thumbnail).slice(0, 4).map((output) => (
              <OutputCard
                key={output.id}
                {...output}
                variant="compact"
                selectable={false}
                onSave={() => {}}
                onLaunch={() => {}}
                onDownload={() => {}}
              />
            ))}
          </div>
        </section>
      </main>

      {/* RIGHT — AI insights */}
      <aside className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 space-y-4">
        <div>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary mb-2">
            Trending findings
          </p>
          <div className="space-y-2">
            <FindingCard
              icon={<TrendingUp className="h-3.5 w-3.5 text-g6-primary" />}
              title="Aspirational angle ↑"
              text={`+${analytics.trendingFinding.deltaPct}% CTR week-over-week`}
            />
            <FindingCard title="From Insights" text="5 new winners imported. Try Variants?" cta="Open" onCta={() => navigate("/iq/genie6/generate/forge/form")} />
            <FindingCard title="Mode usage" text="UGC up 3× vs last month" />
          </div>
        </div>

        <div>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary mb-2">
            Quick prompts
          </p>
          <div className="space-y-1.5">
            {[
              "Hair fall is real. This is not.",
              "Stop the breakage.",
              "Real ingredients, real results.",
            ].map((hook) => (
              <button
                key={hook}
                type="button"
                onClick={() => navigate("/iq/genie6/generate/product-ad/form")}
                className="block w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-base p-2 text-left text-g6-sm text-g6-text-secondary hover:border-g6-primary-border hover:bg-g6-primary-bg/30 hover:text-g6-text transition-colors"
              >
                "{hook}"
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "good morning";
  if (h < 18) return "good afternoon";
  return "good evening";
}

function KpiTile({ label, value, sub, progress, positive }: { label: string; value: string; sub?: string; progress?: number; positive?: boolean }) {
  return (
    <div className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-base p-3 flex flex-col justify-between">
      <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">{label}</p>
      <div className="space-y-1">
        <p className={cn("font-g6-mono text-g6-h4 font-bold tabular-nums", positive ? "text-g6-success" : "text-g6-text")}>
          {value}
        </p>
        {sub && <p className="text-g6-xs text-g6-text-tertiary">{sub}</p>}
        {progress !== undefined && (
          <div className="h-1 w-full overflow-hidden rounded-g6-pill bg-g6-bg-spotlight">
            <div className="h-full rounded-g6-pill bg-g6-primary" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function FindingCard({ icon, title, text, cta, onCta }: { icon?: React.ReactNode; title: string; text: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-base p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">{title}</p>
      </div>
      <p className="text-g6-sm text-g6-text leading-snug">{text}</p>
      {cta && (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center gap-1 text-g6-xs font-medium text-g6-primary hover:opacity-70"
        >
          {cta} <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
