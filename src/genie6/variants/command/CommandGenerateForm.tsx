import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Sparkles, TrendingUp, Coins, Zap } from "lucide-react";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig } from "../../generate/modeConfigs";
import { FieldRenderer } from "../../generate/fields/FieldRenderer";
import type { ModeId } from "../../types/output";

/**
 * Command variant — Generate form.
 *
 * Ops dashboard mental model — generation is a focused task inside a wider
 * operations context. Sidebar left = ops nav (existing FabAds AppSidebar).
 * Center = compact, scannable form with status chips at top + sticky submit
 * footer. Sidebar right = mini-KPI strip showing batch impact (estimated ROAS,
 * cost, time to first variant).
 */
export function CommandGenerateForm() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { draft, dispatch } = useDraft();

  useEffect(() => {
    if (mode) dispatch({ type: "SET_MODE", mode: mode as ModeId });
  }, [mode, dispatch]);

  if (!mode) return null;
  const config = getModeConfig(mode as ModeId);

  const generate = (testFirst = false) => {
    const count = testFirst ? 4 : draft.count;
    navigate(
      `/iq/genie6/generate/${mode}/progress/demo-batch-${Date.now()}?count=${count}&testFirst=${testFirst}`
    );
  };

  return (
    <div className="grid h-full grid-cols-[1fr_280px] gap-4 p-5">
      {/* MAIN — compact form */}
      <main className="overflow-y-auto rounded-g6-base border border-g6-border bg-g6-bg-container">
        {/* Header strip with back + status */}
        <header className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
          <button
            type="button"
            onClick={() => navigate("/iq/genie6")}
            className="inline-flex items-center gap-1 text-g6-sm text-g6-text-secondary hover:text-g6-text"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Dashboard
          </button>
          <div className="flex items-center gap-2 font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-g6-success" />
            {config.label} · ready
          </div>
        </header>

        <div className="p-6">
          <h1 className="text-g6-h3 font-bold text-g6-text mb-2">{config.label}</h1>
          <p className="text-g6-sm text-g6-text-secondary mb-6">{config.description}</p>

          {/* Form rendered as table-like rows */}
          <div className="rounded-g6-base border border-g6-border-secondary divide-y divide-g6-border-secondary">
            {config.formFields.map((f) => (
              <div key={f} className="px-4 py-3">
                <FieldRenderer type={f} />
              </div>
            ))}
          </div>
        </div>

        {/* Sticky submit footer */}
        <footer className="sticky bottom-0 flex items-center justify-between border-t border-g6-border-secondary bg-g6-bg-base px-5 py-3">
          <span className="font-g6-mono text-g6-sm text-g6-text-secondary">
            <span className="font-semibold text-g6-text tabular-nums">{draft.count}</span> credits · ~<span className="tabular-nums">{draft.count * 2}</span>s
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => generate(true)}
              className="rounded-g6-base border border-g6-border bg-g6-bg-container px-4 py-2 text-g6-sm font-medium text-g6-text-secondary hover:text-g6-text"
            >
              Test 4
            </button>
            <button
              type="button"
              onClick={() => generate(false)}
              className="rounded-g6-base bg-g6-primary px-5 py-2 text-g6-sm font-bold text-g6-text-on-accent"
            >
              Submit batch ▸
            </button>
          </div>
        </footer>
      </main>

      {/* RIGHT — KPI strip with batch impact */}
      <aside className="space-y-3">
        <KpiCard
          Icon={Sparkles}
          label="Batch size"
          value={String(draft.count)}
          sub="ads in this generation"
        />
        <KpiCard
          Icon={Coins}
          label="Cost"
          value={`${draft.count} credits`}
          sub={`from your 50,000 quota`}
        />
        <KpiCard
          Icon={Zap}
          label="Est. wait"
          value={`~${draft.count * 2}s`}
          sub="first variant in <10s"
        />
        <KpiCard
          Icon={TrendingUp}
          label="Est. winners"
          value={Math.round(draft.count * 0.18) + ""}
          sub="based on 18% historical"
          highlight
        />

        <div className="mt-6 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-4">
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary mb-2">
            Recent batches
          </p>
          <ul className="space-y-2">
            {[
              { brand: "Mamaearth", count: 12, ago: "2h" },
              { brand: "Noise", count: 8, ago: "5h" },
              { brand: "Boat", count: 16, ago: "1d" },
            ].map((b) => (
              <li key={b.brand} className="flex items-center justify-between text-g6-sm">
                <span className="text-g6-text">{b.brand}</span>
                <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
                  {b.count} · {b.ago} ago
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function KpiCard({
  Icon,
  label,
  value,
  sub,
  highlight,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight
      ? "rounded-g6-base border border-g6-primary-border bg-g6-primary-bg p-3"
      : "rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3"}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={highlight ? "h-3.5 w-3.5 text-g6-primary" : "h-3.5 w-3.5 text-g6-text-tertiary"} />
        <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">{label}</span>
      </div>
      <p className="font-g6-mono text-g6-h4 font-bold tabular-nums text-g6-text">{value}</p>
      <p className="text-g6-xs text-g6-text-tertiary">{sub}</p>
    </div>
  );
}
