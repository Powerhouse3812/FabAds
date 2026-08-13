import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { MicroMotif } from "../../components/MicroMotif";
import { OutputCard } from "../../components/OutputCard";
import { HeroPromptInput } from "../../components/HeroPromptInput";
import { modeConfigs } from "../../generate-legacy/modeConfigs";
import { analyticsAgency } from "../../mocks/analytics";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { greeting } from "../../utils/greeting";
import { WALK_COUNT } from "../../tour/tourSteps";

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
  const [prompt, setPrompt] = useState("");
  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    navigate("/iq/genie6/generate/product-ad/form");
  };

  return (
    /* RESPONSIVE (mobile phase — /iq/genie6 is `full` in mobileRoutePolicy):
       Below md this is ONE column and the ROOT owns the scroll. It has to be
       the root: AppLayout's ownsLayout branch is `overflow-hidden` on mobile
       and AppShell's <main> is `overflow-hidden flex-col`, so nothing above
       this component scrolls. `main` + `aside` therefore give up their own
       overflow below md (`md:overflow-y-auto`) so the page reads as a single
       scroll region instead of two nested ones.
       `overflow-x-hidden` is the mobile pair to that scroller: HeroPromptInput's
       focus halo is `absolute -inset-8`, so it bleeds 32px sideways and would
       otherwise let the page pan a few px horizontally.
       At md and up: `md:grid-cols-[1fr_280px]` + `md:overflow-visible` restore
       today's desktop layout exactly (no overflow utility === visible, both
       axes — verified: computed overflow-x/y are `visible` at 1280). */
    <div className="v3-page-mesh grid h-full grid-cols-1 gap-3 overflow-y-auto overflow-x-hidden overscroll-contain p-3 md:grid-cols-[1fr_280px] md:overflow-visible md:overscroll-auto">
      {/* MAIN — workspace (brand portfolio rail removed in iter-6 A-5; brands
          are managed from Catalogue / Workspace > Brands now). */}
      <main className="v3-glass min-w-0 rounded-g6-card p-4 space-y-6 md:min-w-[auto] md:overflow-y-auto md:p-6">
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
        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Two-column composition: image left (full bleed), copy right.
              Replaces the earlier asymmetric fade-to-bg gradient that looked
              unfinished in light mode. Now the image has its own clear column
              and the text sits on its own surface — no awkward overlap. */}
          {/* Mobile: image stacks on top with a fixed 8rem band (the wrapper has
              no intrinsic height, so in flex-col the `h-full` img would collapse
              to 0). md: restores the original side-by-side 2/5 + 3/5 split. */}
          <div className="relative overflow-hidden rounded-g6-base bg-g6-bg-base flex flex-col md:col-span-2 md:flex-row">
            {analytics.topPerformer.thumbnail && (
              <div className="relative h-32 w-full shrink-0 overflow-hidden md:h-auto md:w-2/5">
                <img src={analytics.topPerformer.thumbnail} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1 p-4 space-y-2 md:min-w-[auto] md:p-5">
              <span className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-container px-2 py-0.5 font-g6-mono text-g6-xs font-semibold uppercase text-g6-text-secondary">
                <Sparkles className="h-2.5 w-2.5 text-g6-text-tertiary" /> top performer
              </span>
              <p className="text-g6-h4 font-bold text-g6-text">
                {analytics.topPerformer.brand} · {analytics.topPerformer.product}
              </p>
              <div className="flex items-baseline gap-5 pt-1">
                <span className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text">
                  {analytics.topPerformer.ctr}% <span className="text-g6-xs text-g6-text-tertiary">CTR</span>
                </span>
                <span className="font-g6-mono text-g6-h4 font-bold tabular-nums text-g6-text">
                  {analytics.topPerformer.roas}× <span className="text-g6-xs text-g6-text-tertiary">ROAS</span>
                </span>
              </div>
            </div>
          </div>
          {/* Mobile: the two KPI tiles sit side-by-side (they're short, so a
              second stacked pair would waste a screenful). md:grid-cols-none +
              md:grid-rows-2 === the original implicit single column. */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-none md:grid-rows-2">
            <KpiTile label="Credits" value={analytics.creditsUsed.used.toLocaleString("en-IN")} sub={`/ ${analytics.creditsUsed.limit.toLocaleString("en-IN")}`} progress={(analytics.creditsUsed.used / analytics.creditsUsed.limit) * 100} />
            <KpiTile label="Trending" value={`+${analytics.trendingFinding.deltaPct}%`} sub={analytics.trendingFinding.angleLabel} positive />
          </div>
        </section>

        {/* Generate section — folded in from the dropped /generate sidebar item.
             Was a separate ModePicker page; now embedded in Dashboard. Hero
             prompt input on top + 6 mode tiles below. Submitting the prompt
             routes to /generate/product-ad/form by default; clicking a tile
             routes to that mode's form. */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-g6-h4 font-bold text-g6-text">Generate</h2>
            <span className="text-g6-xs text-g6-text-tertiary">paste a URL or pick a mode</span>
          </div>

          <HeroPromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handlePromptSubmit}
            placeholder="paste a URL or describe the generation"
            size="lg"
          />

          {/* Mobile: one mode per row. At 2 columns (~150px) the description
              truncates to nothing, so a single column keeps the tiles legible
              and each row a comfortable 64px tap target. */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {modeConfigs.map((cfg) => (
              <button
                key={cfg.id}
                type="button"
                onClick={() => navigate(`/iq/genie6/generate/${cfg.id}/form`)}
                className="g6-lift flex items-center gap-3 rounded-g6-base bg-g6-bg-base p-3 text-left transition-all hover:bg-g6-primary-bg/20"
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
              className="inline-flex min-h-[44px] items-center pl-2 text-g6-xs text-g6-text-tertiary hover:text-g6-text md:min-h-0 md:pl-0"
            >
              Library →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
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

      {/* RIGHT — AI insights.
          Below md this STACKS BELOW the main column rather than hiding behind a
          disclosure: the panel is short (3 finding cards + 3 quick prompts +
          the tour CTA ≈ one screenful) and every row is an action, so a
          collapsed accordion would only add a tap and hide the tour entry
          point. Recognition over recall — keep it visible, keep it scrollable. */}
      <aside className="min-w-0 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 space-y-4 md:min-w-[auto] md:overflow-y-auto">
        <div>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary mb-2">
            Trending findings
          </p>
          <div className="space-y-2">
            <FindingCard
              icon={<TrendingUp className="h-3.5 w-3.5 text-g6-text-tertiary" />}
              title="Aspirational angle ↑"
              text={`+${analytics.trendingFinding.deltaPct}% CTR week-over-week`}
              cta="See angles"
              onCta={() => navigate("/iq/genie6/workspace/angles")}
            />
            <FindingCard title="From Insights" text="5 new winners imported. Try Variants?" cta="Open" onCta={() => navigate("/iq/genie6/generate/forge/form")} />
            <FindingCard
              title="Mode usage"
              text="UGC up 3× vs last month"
              cta="Open UGC"
              onCta={() => navigate("/iq/genie6/generate/ugc-video/form")}
            />
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
                className="flex min-h-[44px] w-full items-center rounded-g6-base bg-g6-bg-base p-2 text-left text-g6-sm text-g6-text-secondary hover:bg-g6-primary-bg/20 hover:text-g6-text transition-colors md:block md:min-h-0"
              >
                "{hook}"
              </button>
            ))}
          </div>
        </div>
        {/* Tour CTA */}
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/wizard")}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base px-3 py-2.5 hover:border-g6-border transition-colors text-left md:min-h-0"
        >
          <Sparkles className="h-3.5 w-3.5 text-g6-primary-active shrink-0" />
          <div className="min-w-0">
            <p className="text-g6-sm font-medium text-g6-text">Guided tour</p>
            <p className="text-[11px] text-g6-text-tertiary">{WALK_COUNT}-stop Genie walkthrough</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-g6-text-tertiary ml-auto shrink-0" />
        </button>
      </aside>
    </div>
  );
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
          className="inline-flex min-h-[44px] items-center gap-1 text-g6-xs font-medium text-g6-text-secondary hover:text-g6-text md:min-h-0"
        >
          {cta} <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
