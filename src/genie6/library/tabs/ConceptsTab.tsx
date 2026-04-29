import { Sparkles } from "lucide-react";
import { concepts } from "../../mocks";
import { EmptyState } from "../../components/EmptyState";
import { getBrand } from "../../mocks/brands";
import { useNewGenerationOverlay } from "../../shell/NewGenerationOverlay";

type Props = { search: string; brandFilter: string };

export function ConceptsTab({ search, brandFilter }: Props) {
  const { open: openOverlay } = useNewGenerationOverlay();

  const filtered = concepts.filter((c) => {
    if (brandFilter !== "all" && c.brandId !== brandFilter) return false;
    if (
      search &&
      !`${c.name} ${c.angle} ${c.hook} ${c.tone}`.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No concepts saved"
        description="Save a winning ad as a Concept to re-use its full settings bundle (angle + hook + tone + format + visual direction + brand context) on future generations."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((c) => {
        const brand = getBrand(c.brandId);
        return (
          <li
            key={c.id}
            className="flex flex-col gap-2 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 transition-colors hover:border-g6-border"
          >
            <header className="flex items-center justify-between gap-2">
              <h3 className="font-g6-sans text-g6-base font-semibold text-g6-text">{c.name}</h3>
              {brand && (
                <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{brand.name}</span>
              )}
            </header>
            <p className="text-g6-sm text-g6-text-secondary line-clamp-2">{c.hook}</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-g6-mono text-g6-xs text-g6-text-tertiary">
              <dt>Angle</dt>
              <dd className="text-g6-text-secondary">{c.angle}</dd>
              <dt>Tone</dt>
              <dd className="text-g6-text-secondary">{c.tone}</dd>
              <dt>Format</dt>
              <dd className="text-g6-text-secondary">{c.format}</dd>
            </dl>
            <footer className="flex items-center justify-between border-t border-g6-border-secondary pt-2 font-g6-mono text-g6-xs text-g6-text-tertiary">
              <span>{c.generationCount} generations</span>
              <button
                type="button"
                onClick={() =>
                  openOverlay({ conceptId: c.id, brandId: c.brandId, source: "library" })
                }
                className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-2 py-0.5 text-g6-text-on-accent transition-colors hover:bg-g6-primary-hover"
              >
                <Sparkles className="h-3 w-3" aria-hidden /> Generate
              </button>
            </footer>
          </li>
        );
      })}
    </ul>
  );
}
