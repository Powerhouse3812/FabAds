import { audiences } from "../../mocks";
import { EmptyState } from "../../components/EmptyState";
import { getBrand } from "../../mocks/brands";

type Props = { search: string; brandFilter: string };

export function AudiencesTab({ search, brandFilter }: Props) {
  const filtered = audiences.filter((a) => {
    if (brandFilter !== "all" && a.brandId !== brandFilter) return false;
    if (
      search &&
      !`${a.label} ${a.segment}`.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No audience presets"
        description="Audience presets appear here when you save them from a Generate flow. Useful when you run the same audience across multiple brands."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((a) => {
        const brand = a.brandId ? getBrand(a.brandId) : null;
        return (
          <li
            key={a.id}
            className="flex flex-col gap-1.5 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4"
          >
            <h3 className="font-g6-sans text-g6-base font-semibold text-g6-text">{a.label}</h3>
            <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{a.segment}</p>
            {brand && (
              <p className="font-g6-mono text-g6-xs text-g6-text-secondary">→ {brand.name}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
