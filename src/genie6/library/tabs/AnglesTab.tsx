import { Sparkles } from "lucide-react";
import { angles } from "../../mocks";
import { EmptyState } from "../../components/EmptyState";
import { useNewGenerationOverlay } from "../../shell/NewGenerationOverlay";

type Props = { search: string };

export function AnglesTab({ search }: Props) {
  const { open: openOverlay } = useNewGenerationOverlay();

  const filtered = angles.filter(
    (a) =>
      !search ||
      a.label.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (filtered.length === 0) {
    return <EmptyState title="No angles match" description={`Nothing matches "${search}".`} />;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((a) => (
        <li
          key={a.id}
          className="flex flex-col gap-1.5 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4"
        >
          <span className="inline-flex w-fit items-center rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-2 py-0.5 font-g6-mono text-g6-xs font-semibold uppercase tracking-wider text-g6-primary-active">
            {a.label}
          </span>
          {a.description && (
            <p className="text-g6-sm text-g6-text-secondary">{a.description}</p>
          )}
          <button
            type="button"
            onClick={() => openOverlay({ angleId: a.id, source: "library" })}
            className="inline-flex w-fit items-center gap-1 rounded-g6-pill bg-g6-primary px-2 py-0.5 font-g6-mono text-g6-xs font-semibold text-g6-text-on-accent transition-colors hover:bg-g6-primary-hover"
          >
            <Sparkles className="h-3 w-3" aria-hidden /> Generate
          </button>
        </li>
      ))}
    </ul>
  );
}
