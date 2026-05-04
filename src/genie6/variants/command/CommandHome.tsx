import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Coins, Zap, Sparkles, Activity, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MicroMotif } from "../../components/MicroMotif";
import { HeroPromptInput } from "../../components/HeroPromptInput";
import { modeConfigs } from "../../generate/modeConfigs";
import { analyticsAgency } from "../../mocks/analytics";
import { brands } from "../../mocks/brands";
import { BrandLogo } from "../../components/BrandLogo";
import { greeting } from "../../utils/greeting";

/**
 * Command variant — Home.
 *
 * Ops dashboard mental model: agency director's command-center view of the
 * whole portfolio. Big KPI strip up top, brand-by-brand performance table,
 * activity feed sidebar, mode launcher footer. Mercury banking / Linear
 * dashboard density.
 */
export function CommandHome() {
  const navigate = useNavigate();
  const a = analyticsAgency;
  const [prompt, setPrompt] = useState("");
  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    navigate("/iq/genie6/generate/product-ad/form");
  };

  return (
    <div className="grid h-full grid-cols-[1fr_300px] gap-3 p-3">
      {/* MAIN */}
      <main className="overflow-y-auto rounded-g6-base border border-g6-border bg-g6-bg-container">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
          <div>
            <p className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary">
              {greeting()} · operator dashboard
            </p>
            <h1 className="text-g6-h4 font-bold text-g6-text">Welcome back, Rahul</h1>
          </div>
          <div className="flex items-center gap-2 font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-g6-success" />
            all systems · operational
          </div>
        </header>

        {/* KPI strip */}
        <section className="grid grid-cols-4 gap-2 border-b border-g6-border-secondary p-4 bg-g6-bg-base">
          <KpiCell
            Icon={Sparkles}
            label="Generations"
            value={a.generationsThisMonth.count.toLocaleString("en-IN")}
            sub={`+${a.generationsThisMonth.deltaPct}% vs last month`}
            positive
          />
          <KpiCell
            Icon={Coins}
            label="Credits"
            value={a.creditsUsed.used.toLocaleString("en-IN")}
            sub={`of ${a.creditsUsed.limit.toLocaleString("en-IN")}`}
            progress={(a.creditsUsed.used / a.creditsUsed.limit) * 100}
          />
          <KpiCell
            Icon={TrendingUp}
            label="Trending CTR"
            value={`+${a.trendingFinding.deltaPct}%`}
            sub={a.trendingFinding.angleLabel}
            highlight
          />
          <KpiCell
            Icon={Zap}
            label="Active brands"
            value={String(a.activeBrands)}
            sub={`${a.recentActivityCount} actions today`}
          />
        </section>

        {/* Brand performance table */}
        <section className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-g6-base font-semibold text-g6-text">Brand performance · this month</h2>
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/workspace")}
              className="text-g6-xs text-g6-text-tertiary hover:text-g6-text"
            >
              Open workspace →
            </button>
          </div>
          {/* Phase D P1-G3: 6-col table doesn't survive < md (768px) — columns
              truncate or overflow on iPad portrait. Below md the same data
              renders as a stacked card per brand with a 3-cell metric grid. */}
          {(() => {
            const rows = brands.slice(0, 6).map((b, i) => ({
              b,
              gens: [184, 142, 96, 68, 52, 41][i] ?? 30,
              ctr: [4.73, 3.92, 3.41, 2.88, 2.64, 2.31][i] ?? 2.0,
              roas: [3.2, 2.8, 2.4, 2.1, 1.9, 1.7][i] ?? 1.5,
              ago: ["2h", "5h", "1d", "1d", "2d", "3d"][i] ?? "1w",
            }));
            return (
              <>
                {/* Desktop / tablet-landscape table */}
                <div className="hidden md:block rounded-g6-base border border-g6-border-secondary overflow-hidden">
                  <table className="w-full text-g6-sm">
                    <thead className="bg-g6-bg-base">
                      <tr className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                        <th className="px-3 py-2 text-left font-normal">Brand</th>
                        <th className="px-3 py-2 text-right font-normal">Gens</th>
                        <th className="px-3 py-2 text-right font-normal">Avg CTR</th>
                        <th className="px-3 py-2 text-right font-normal">Avg ROAS</th>
                        <th className="px-3 py-2 text-right font-normal">Last gen</th>
                        <th className="w-10 px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-g6-border-secondary">
                      {rows.map(({ b, gens, ctr, roas, ago }) => (
                        <tr
                          key={b.id}
                          className="hover:bg-g6-bg-spotlight cursor-pointer transition-colors"
                          onClick={() => navigate(`/iq/genie6/workspace/brands/${b.id}`)}
                        >
                          <td className="px-3 py-2.5 flex items-center gap-2">
                            <BrandLogo name={b.name} src={b.logo} tint={b.colors?.[0]} size="h-5 w-5" rounded="rounded-sm" />
                            <span className="font-medium text-g6-text">{b.name}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-g6-mono tabular-nums text-g6-text">{gens}</td>
                          <td className="px-3 py-2.5 text-right font-g6-mono tabular-nums text-g6-text">{ctr}%</td>
                          <td className="px-3 py-2.5 text-right font-g6-mono tabular-nums text-g6-text">{roas}×</td>
                          <td className="px-3 py-2.5 text-right font-g6-mono text-g6-xs text-g6-text-tertiary">{ago} ago</td>
                          <td className="px-2 py-2.5"><ArrowUpRight className="h-3.5 w-3.5 text-g6-text-tertiary" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / tablet-portrait card stack */}
                <div className="md:hidden flex flex-col gap-2">
                  {rows.map(({ b, gens, ctr, roas, ago }) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => navigate(`/iq/genie6/workspace/brands/${b.id}`)}
                      className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-base p-3 text-left hover:border-g6-border transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <BrandLogo name={b.name} src={b.logo} tint={b.colors?.[0]} size="h-6 w-6" rounded="rounded-sm" />
                          <span className="font-medium text-g6-sm text-g6-text truncate">{b.name}</span>
                        </div>
                        <span className="font-g6-mono text-g6-xs text-g6-text-tertiary shrink-0">{ago} ago</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="font-g6-mono text-[9px] uppercase tracking-wider text-g6-text-tertiary">Gens</div>
                          <div className="font-g6-mono text-g6-base font-semibold tabular-nums text-g6-text">{gens}</div>
                        </div>
                        <div>
                          <div className="font-g6-mono text-[9px] uppercase tracking-wider text-g6-text-tertiary">Avg CTR</div>
                          <div className="font-g6-mono text-g6-base font-semibold tabular-nums text-g6-text">{ctr}%</div>
                        </div>
                        <div>
                          <div className="font-g6-mono text-[9px] uppercase tracking-wider text-g6-text-tertiary">Avg ROAS</div>
                          <div className="font-g6-mono text-g6-base font-semibold tabular-nums text-g6-text">{roas}×</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
        </section>

        {/* Generate section — embedded prompt input + mode tiles. Iter-3 IA
            removed the standalone /generate sidebar item; users start a generation
            from here on Dashboard. */}
        <section className="p-5 pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-g6-base font-semibold text-g6-text">Generate</h2>
            <span className="text-g6-xs text-g6-text-tertiary">paste a URL or pick a mode</span>
          </div>
          <HeroPromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handlePromptSubmit}
            placeholder="paste a URL or describe the generation"
          />
          <div className="grid grid-cols-6 gap-2">
            {modeConfigs.map((cfg) => (
              <button
                key={cfg.id}
                type="button"
                onClick={() => navigate(`/iq/genie6/generate/${cfg.id}/form`)}
                className="flex flex-col items-center gap-1.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base px-2 py-3 hover:border-g6-primary-border hover:bg-g6-primary-bg/30 transition-colors"
              >
                <MicroMotif mode={cfg.id} size={20} />
                <span className="font-g6-mono text-g6-xs text-g6-text-secondary text-center leading-tight">{cfg.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* RIGHT — activity feed */}
      <aside className="overflow-y-auto rounded-g6-base border border-g6-border bg-g6-bg-container">
        <header className="border-b border-g6-border-secondary bg-g6-bg-base px-4 py-3 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-g6-text-tertiary" />
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Live activity
          </p>
        </header>
        <ul className="divide-y divide-g6-border-secondary">
          {[
            { kind: "gen", brandId: "mamaearth", brand: "Mamaearth", text: "12 Product Ad variants", ago: "2m" },
            { kind: "winner", brandId: "noise", brand: "Noise", text: "3.92% CTR — new top", ago: "18m" },
            { kind: "gen", brandId: "boat", brand: "Boat", text: "8 UGC Video gens", ago: "1h" },
            { kind: "import", brandId: "sleepyhead", brand: "Sleepyhead", text: "5 winners imported", ago: "2h" },
            { kind: "gen", brandId: "mensa-brands", brand: "Mensa", text: "16 Brand Ad gens", ago: "3h" },
            { kind: "winner", brandId: "mamaearth", brand: "Mamaearth", text: "4.73% CTR — top performer", ago: "5h" },
            { kind: "gen", brandId: "plum", brand: "Plum", text: "6 Affiliate Ad copies", ago: "8h" },
          ].map((ev, i) => (
            <li
              key={i}
              onClick={() => navigate(`/iq/genie6/workspace/brands/${ev.brandId}`)}
              className="px-4 py-3 hover:bg-g6-bg-spotlight cursor-pointer transition-colors"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start gap-2">
                <span className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  ev.kind === "winner" ? "bg-g6-success" :
                  ev.kind === "import" ? "bg-g6-primary" : "bg-g6-text-tertiary"
                )} />
                <div className="min-w-0 flex-1">
                  <p className="text-g6-sm text-g6-text">
                    <span className="font-semibold">{ev.brand}</span> · {ev.text}
                  </p>
                  <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{ev.ago} ago</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {/* Tour CTA */}
        <div className="border-t border-g6-border-secondary p-3">
          <button
            type="button"
            onClick={() => navigate("/iq/genie6/wizard")}
            className="flex w-full items-center gap-3 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base px-3 py-2.5 hover:border-g6-border transition-colors text-left"
          >
            <Sparkles className="h-3.5 w-3.5 text-g6-primary-active shrink-0" />
            <div className="min-w-0">
              <p className="text-g6-sm font-medium text-g6-text">Guided tour</p>
              <p className="text-g6-xs text-g6-text-tertiary">12-stop Genie walkthrough</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-g6-text-tertiary ml-auto shrink-0" />
          </button>
        </div>
      </aside>
    </div>
  );
}


function KpiCell({
  Icon,
  label,
  value,
  sub,
  progress,
  positive,
  highlight,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
  positive?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-g6-base border p-3",
      highlight
        ? "border-g6-primary-border bg-g6-primary-bg"
        : "border-g6-border-secondary bg-g6-bg-container"
    )}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn("h-3.5 w-3.5", highlight ? "text-g6-primary" : "text-g6-text-tertiary")} />
        <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">{label}</span>
      </div>
      <p className={cn(
        "font-g6-mono text-g6-h3 font-bold tabular-nums",
        positive ? "text-g6-success" : "text-g6-text"
      )}>
        {value}
      </p>
      {sub && <p className="text-g6-xs text-g6-text-tertiary mt-0.5">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-g6-pill bg-g6-bg-spotlight">
          <div className="h-full rounded-g6-pill bg-g6-primary" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </div>
  );
}
