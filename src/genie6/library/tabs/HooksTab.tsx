import { Sparkles } from "lucide-react";
import { hooks } from "../../mocks";
import { EmptyState } from "../../components/EmptyState";
import { getBrand } from "../../mocks/brands";
import { useNewGenerationOverlay } from "../../shell/NewGenerationOverlay";

type Props = { search: string; brandFilter: string };

export function HooksTab({ search, brandFilter }: Props) {
  const { open: openOverlay } = useNewGenerationOverlay();

  const filtered = hooks.filter((h) => {
    if (brandFilter !== "all" && h.brandId !== brandFilter) return false;
    if (search && !h.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No hooks saved yet"
        description="Save winning hooks from output cards. They'll show up here for re-use across modes."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((h) => (
        <li
          key={h.id}
          className="flex flex-col gap-2 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 transition-colors hover:border-g6-border"
        >
          <p className="font-g6-sans text-g6-base font-semibold text-g6-text">{h.text}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-g6-mono text-g6-xs text-g6-text-tertiary">
              {h.brandId && <span>{getBrand(h.brandId)?.name ?? h.brandId}</span>}
              {h.performance && (
                <>
                  <span>·</span>
                  <span>CTR {h.performance.ctr}%</span>
                  <span>·</span>
                  <span>{h.performance.impressions.toLocaleString()} imp</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                openOverlay({ hookId: h.id, brandId: h.brandId, source: "library" })
              }
              className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-2 py-0.5 font-g6-mono text-g6-xs font-semibold text-g6-text-on-accent transition-colors hover:bg-g6-primary-hover"
            >
              <Sparkles className="h-3 w-3" aria-hidden /> Generate
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
